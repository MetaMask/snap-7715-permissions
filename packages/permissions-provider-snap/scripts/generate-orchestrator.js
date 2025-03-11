/* eslint-disable prettier/prettier */
const fs = require('fs');
const path = require('path');

const capitalizeFirstLetter = (name) => {
  return (name.charAt(0).toUpperCase() + name.slice(1)).replace(' ', '');

};

const createPermissionTypeName = (name) => {
  return name.toLowerCase().replace(' ', '');
};


const createOrchestratorTemplate = (filename) => {
  const permissionType = createPermissionTypeName(filename);
  return `// ${filename}.tsx

import type { Permission } from '@metamask/7715-permissions-shared/types';
import type { Hex } from 'viem';

import type { PermissionConfirmationContext } from '../../ui';
import type { OrchestratorArgs, OrchestratorFactoryFunction } from '../types';
import type { PermissionTypeMapping } from './types';

export const ${capitalizeFirstLetter(filename)}PermissionOrchestrator: OrchestratorFactoryFunction<
  '${permissionType}'
> = (_args: OrchestratorArgs) => {
  return {
    parseAndValidate: async (_basePermission: Permission) => {
      throw new Error('Not implemented');
    },
    buildPermissionConfirmationPage: (
      _context: PermissionConfirmationContext<'${permissionType}'>,
    ) => {
      throw new Error('Not implemented');
    },
    buildPermissionContext: async (
      _account: Hex,
      _sessionAccount: Hex,
      _chainId: number,
      _attenuatedPermission: PermissionTypeMapping['${permissionType}'],
    ) => {
      throw new Error('Not implemented');
    },
  };
};
`;
};

const main = async () => {
  const filename = process.argv[2];
  if (!filename) {
    throw new Error('Please provide a filename as an argument.');
  }
  const filePath = path.join(
    process.cwd(),
    `src/orchestrators/orchestrator/${filename}.tsx`,
  );

  // create the file
  await fs.promises.writeFile(
    filePath,
    createOrchestratorTemplate(filename),
    (writeFileErr) => {
      if (writeFileErr) {
        console.error('Error creating the file:', writeFileErr);
      } else {
        console.log(`${filename}.ts file created successfully!`);
      }
    },
  );

  console.log('New orchestrator created at:', filePath);
};

main().catch((mainError) => {
  console.error('Error:', mainError.message);
});
