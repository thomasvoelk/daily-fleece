import type { SheriffConfig } from '@softarc/sheriff-core';

export const sheriffConfig: SheriffConfig = {
  version: 1,
  tagging: {
    'src/app': 'root',
    'src/app/<domain>': 'domain:<domain>',
    'src/app/<domain>/<type>': ['domain:<domain>', 'type:<type>'],
  },
  depRules: {
    root: ['domain:*'],
    'domain:*': [{ from: 'domain:*', to: 'domain:*' }],
    'type:api': [],
  },
};
