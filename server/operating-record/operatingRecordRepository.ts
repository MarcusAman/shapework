/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MemoryRepository } from '../persistence/repositories';
import { 
  OperatingRecord, 
  BrokerageResponsibilityDetail, 
  OperatingOpportunity, 
  QuickWin, 
  BuildSprint 
} from '../../src/types/operatingRecord';

export class OperatingRecordRepository extends MemoryRepository<OperatingRecord> {}
export class OpportunityRepository extends MemoryRepository<OperatingOpportunity> {}
export class ResponsibilityRepository extends MemoryRepository<BrokerageResponsibilityDetail> {}
export class QuickWinRepository extends MemoryRepository<QuickWin> {}
export class BuildSprintRepository extends MemoryRepository<BuildSprint> {}

export function getOperatingRecordRepositories(dbState: any) {
  if (!dbState.operatingRecords) dbState.operatingRecords = [];
  if (!dbState.responsibilities) dbState.responsibilities = [];
  if (!dbState.opportunities) dbState.opportunities = [];
  if (!dbState.quickWins) dbState.quickWins = [];
  if (!dbState.buildSprints) dbState.buildSprints = [];

  const onStateChange = () => {
    if (dbState.saveStateToStorage) {
      dbState.saveStateToStorage();
    }
  };

  return {
    operatingRecords: new OperatingRecordRepository(() => dbState.operatingRecords, onStateChange),
    responsibilities: new ResponsibilityRepository(() => dbState.responsibilities, onStateChange),
    opportunities: new OpportunityRepository(() => dbState.opportunities, onStateChange),
    quickWins: new QuickWinRepository(() => dbState.quickWins, onStateChange),
    buildSprints: new BuildSprintRepository(() => dbState.buildSprints, onStateChange)
  };
}
