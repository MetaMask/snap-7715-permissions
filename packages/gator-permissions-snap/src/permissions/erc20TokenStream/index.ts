import { createErc20TokenStreamCaveats as createPermissionCaveats } from '@metamask/7715-permission-types';

import { renderBody } from './content';
import {
  applyContext,
  buildContext,
  deriveMetadata,
  populatePermission,
} from './context';
import { allRules } from './rules';
import type {
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata,
  Erc20TokenStreamPermission,
  Erc20TokenStreamPermissionRequest,
  PopulatedErc20TokenStreamPermission,
} from './types';
import { parseAndValidate } from './validation';
import type { PermissionModule } from '../../core/permission/PermissionModule';
import { primaryTokenCaip19Selector } from '../../core/token/tokenSelectors';

export const erc20TokenStreamPermissionModule: PermissionModule<
  Erc20TokenStreamPermissionRequest,
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata,
  Erc20TokenStreamPermission,
  PopulatedErc20TokenStreamPermission
> = {
  type: 'erc20-token-stream',
  name: 'ERC20 Token Stream',
  rules: allRules,
  tokenCaip19s: [primaryTokenCaip19Selector],
  balanceTokenCaip19: primaryTokenCaip19Selector,
  shellTokenCaip19s: [primaryTokenCaip19Selector],
  title: 'permissionRequestTitle',
  subtitle: 'permissionRequestSubtitle',
  parseAndValidate,
  buildContext,
  deriveMetadata,
  renderBody,
  applyContext,
  populatePermission,
  createPermissionCaveats,
};
