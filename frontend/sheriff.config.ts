import type { SheriffConfig } from '@softarc/sheriff-core';

export const sheriffConfig: SheriffConfig = {
  version: 1,
  modules: {
    'src/app/backend-client': 'root:backend-client',
    'src/app/entry': 'domain:entry',
    'src/app/host-setup': 'domain:host-setup',
    'src/app/lobby': 'domain:lobby',
    'src/app/quiz': 'domain:quiz',
    'src/app/results': 'domain:results',
    'src/app/shared': 'domain:shared',
    'src/app/shared/testing': 'domain:shared',
  },
  depRules: {
    root: ['domain:*'],
    'root:backend-client': [],
    'domain:shared': [],
    'domain:entry': ['domain:shared', 'root', 'root:backend-client'],
    'domain:*': ['domain:shared', 'domain:entry', 'root', 'root:backend-client'],
  },
};
