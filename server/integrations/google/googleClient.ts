/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { google } from 'googleapis';
import { getOAuthClient } from './googleOAuth.js';

export function getAuthorizedOAuthClient(accessToken: string) {
  const client = getOAuthClient();
  client.setCredentials({
    access_token: accessToken
  });
  return client;
}
