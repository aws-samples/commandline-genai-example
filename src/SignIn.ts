/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {
  CognitoIdentityClient,
  Credentials,
  GetCredentialsForIdentityCommand,
  GetIdCommand,
} from "@aws-sdk/client-cognito-identity";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { exec } from "child_process";
import { readFile, writeFile } from "fs/promises";
import http from "http";
import { AuthorizationCode } from "simple-oauth2";
import { URL } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);
const home = process.env.HOME!;

const openCmds: Record<string, string> = {
  darwin: "open",
  linux: "start",
  win32: "explorer",
};

export const openBrowser = async (url: string) => {
  const openCmd = openCmds[process.platform];
  return execAsync(`${openCmd} "${url}"`);
};

export type AwsCreds = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};

const mapCognitoCreds = (cognitoCreds: Credentials): AwsCreds => {
  return {
    accessKeyId: cognitoCreds.AccessKeyId!,
    secretAccessKey: cognitoCreds.SecretKey!,
    sessionToken: cognitoCreds.SessionToken!,
  };
};

export type AuthConfig = {
  region: string;
  hostname: string;
  port: number;
  uPoolClientId: string;
  authHost: string;
  authPath: string;
  tokenHost: string;
  tokenPath: string;
  idPoolId: string;
  uPoolId: string;
  uPoolEndpoint: string;
};

export const signIn = (config: AuthConfig): Promise<AwsCreds> => {
  const redirectUri = `http://${config.hostname}:${config.port}`;
  const authUrl =
    `${config.authHost}/${config.authPath}?` +
    `client_id=${config.uPoolClientId}&` +
    "response_type=code&" +
    `redirect_uri=${redirectUri}`;

  const prom = new Promise<AwsCreds>(async (resolve, reject) => {
    // Check if our current credentials are still valid
    try {
      const oldCreds = JSON.parse(
        (await readFile(`${home}/.bedrockcmdline`)).toString()
      ) as Credentials;

      const stsClient = new STSClient({
        region: config.region,
        credentials: mapCognitoCreds(oldCreds),
      });
      await stsClient.send(new GetCallerIdentityCommand());
      console.log("Credentials valid.");
      resolve(mapCognitoCreds(oldCreds));
    } catch (error) {
      console.log("Credentials invalid.  Triggering re-authentication...");
      try {
        // Create a server to engage in the redirect from the authorise part of the OAuth flow
        const server = http.createServer(async (req, res) => {
          const successHtml = await readFile("./success.html");
          if (req.headers.host && req.url) {
            const url = new URL("http://" + req.headers.host + req.url);
            const code = url.searchParams.get("code");
            if (code) {
              res.statusCode = 200;
              res.setHeader("Content-Type", "text/html; charset=UTF-8");
              res.end(successHtml);
              server.close();

              // Create an OAuthClient for the AuthorizationCode->AccessToken exchange with Cognito
              const client = new AuthorizationCode({
                client: {
                  id: config.uPoolClientId,
                  secret: "",
                },
                auth: {
                  tokenHost: config.tokenHost,
                  tokenPath: config.tokenPath,
                },
                options: {
                  authorizationMethod: "body",
                },
              });

              // Get the Access Token
              const accessToken = await client.getToken({
                code,
                redirect_uri: redirectUri,
              });

              // Now swap it for temporary AWS credentials
              const cognitoClient = new CognitoIdentityClient({
                region: config.region,
              });
              const login: Record<string, string> = {};
              login[`${config.uPoolEndpoint}/${config.uPoolId}`] = accessToken
                .token.id_token as string;
              const id = await cognitoClient.send(
                new GetIdCommand({
                  IdentityPoolId: config.idPoolId,
                  Logins: login,
                })
              );
              const identityId = id.IdentityId;
              if (identityId) {
                const creds = await cognitoClient.send(
                  new GetCredentialsForIdentityCommand({
                    IdentityId: identityId,
                    Logins: login,
                  })
                );
                await writeFile(
                  `${home}/.bedrockcmdline`,
                  JSON.stringify(creds.Credentials)
                );
                resolve(mapCognitoCreds(creds.Credentials!));
              }
            }
          }
        });

        server.listen(config.port, config.hostname);

        // kick off the OAuth flow by directing the user to the Cognito Hosted UI
        console.log("Authenticating user.  Opening browser...");
        await openBrowser(authUrl);
      } catch (error) {
        reject();
      }
    }
  });

  return prom;
};
