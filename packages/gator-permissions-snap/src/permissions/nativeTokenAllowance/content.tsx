import type { CaipAssetType } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Divider, Section } from '@metamask/snaps-sdk/jsx';

import { allowanceAmountRule, startTimeRule, expiryRule } from './rules';
import type {
  NativeTokenAllowanceContext,
  NativeTokenAllowanceMetadata,
} from './types';
import type { TokenMetadataCoordinator } from '../../core/coordinators/TokenMetadataCoordinator';
import { renderRules } from '../../core/rules';

/**
 * Creates UI content for a native token allowance permission confirmation.
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
  context: NativeTokenAllowanceContext;
  metadata: NativeTokenAllowanceMetadata;
  tokenMetadata: TokenMetadataCoordinator;
}): Promise<SnapElement> {
  const ruleOptions = {
    context,
    metadata,
    tokenMetadataCoordinator: tokenMetadata,
    defaultTokenCaip19: (ctx: NativeTokenAllowanceContext): CaipAssetType =>
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
