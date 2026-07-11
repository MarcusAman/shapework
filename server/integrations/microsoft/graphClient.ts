/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@microsoft/microsoft-graph-client';

export function getMicrosoftGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
}
