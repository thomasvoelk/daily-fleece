import type { SheriffConfig } from '@softarc/sheriff-core';

export const sheriffConfig: SheriffConfig = {
  version: 1,
  excludeRoot: true,
  modules: {
    'src/app/entry': 'domain:entry',
    'src/app/host-setup': 'domain:host-setup',
    'src/app/lobby': 'domain:lobby',
    'src/app/quiz': 'domain:quiz',
    'src/app/shared': 'domain:shared',
  },
  depRules: {
    root: ['domain:*'],
    'domain:shared': [],
    'domain:entry': ['domain:shared', 'root'],
    'domain:*': ['domain:shared', 'domain:entry', 'root'],
  },
};
