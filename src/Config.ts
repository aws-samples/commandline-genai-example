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
import { AuthConfig } from "./SignIn";

export const authConfig: AuthConfig = {
  hostname: "localhost",
  port: 33333,
  region: "ap-southeast-2",
  authHost: "https://xxxxxxxx.auth.ap-southeast-2.amazoncognito.com/",
  authPath: "oauth2/authorize",
  tokenHost: "https://xxxxxxxx.auth.ap-southeast-2.amazoncognito.com/",
  tokenPath: "oauth2/token",
  uPoolClientId: "xxxxxxxxxxxxxxxxxxxxxxxxxx",
  idPoolId: "ap-southeast-2:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  uPoolId: "ap-southeast-2_xxxxxxxxx",
  uPoolEndpoint: `cognito-idp.ap-southeast-2.amazonaws.com`,
};
