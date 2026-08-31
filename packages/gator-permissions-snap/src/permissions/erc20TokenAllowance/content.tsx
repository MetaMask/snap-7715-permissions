import type { CaipAssetType } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Divider, Section } from '@metamask/snaps-sdk/jsx';

import { allowanceAmountRule, startTimeRule, expiryRule } from './rules';
import type {
  Erc20TokenAllowanceContext,
  Erc20TokenAllowanceMetadata,
} from './types';
import type { TokenMetadataCoordinator } from '../../core/coordinators/TokenMetadataCoordinator';
import { renderRules } from '../../core/rules';

/**
 * Creates UI content for an ERC-20 token allowance permission confirmation.
 * @param args - The configuration for the confirmation content.
 * @param args.context - Context with allowance and schedule fields.
 * @param args.metadata - Validation state for rules.
 * @param args.tokenMetadata - Token metadata coordinator for the request.
 * @returns Confirmation section content.
 */
export async function renderBody({
  context,
  metadata,
  tokenMetadata,
}: {
  context: Erc20TokenAllowanceContext;
  metadata: Erc20TokenAllowanceMetadata;
  tokenMetadata: TokenMetadataCoordinator;
}): Promise<SnapElement> {
  const ruleOptions = {
    context,
    metadata,
    tokenMetadataCoordinator: tokenMetadata,
    defaultTokenCaip19: (ctx: Erc20TokenAllowanceContext): CaipAssetType =>
      ctx.primaryTokenCaip19,
  };

  return (
    <Box>
      <Section>
        {renderRules({
          rules: [allowanceAmountRule],
          ...ruleOptions,
        })}
        <Divider />
        {renderRules({
          rules: [startTimeRule, expiryRule],
          ...ruleOptions,
        })}
      </Section>
    </Box>
  );
}
