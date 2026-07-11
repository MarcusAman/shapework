/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeApiNationDotloopPayload } from '../../../src/integrations/apinationDotloop/apinationDotloopMappings';
import { ApiNationDotloopEvent } from '../../../src/integrations/apinationDotloop/apinationDotloopTypes';

export function normalizeDotloopPayload(payload: any): ApiNationDotloopEvent {
  return normalizeApiNationDotloopPayload(payload);
}
