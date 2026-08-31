import type { CaipAssetType } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Divider, Section } from '@metamask/snaps-sdk/jsx';

import {
  periodAmountRule,
  periodDurationRule,
  startTimeRule,
  expiryRule,
} from './rules';
import type {
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata,
} from './types';
import type { TokenMetadataCoordinator } from '../../core/coordinators/TokenMetadataCoordinator';
import { renderRules } from '../../core/rules';

/**
 * Creates UI content for a native token periodic permission confirmation.
 * @param args - The configuration for the confirmation content.
 * @param args.context - The context containing permission details.
 * @param args.metadata - Metadata including derived values and validation errors.
 * @param args.tokenMetadata - Token metadata coordinator for the request.
 * @returns A Promise that resolves to the UI element for the confirmation dialog.
 */
export async function renderBody({
  context,
  metadata,
  tokenMetadata,
}: {
  context: NativeTokenPeriodicContext;
  metadata: NativeTokenPeriodicMetadata;
  tokenMetadata: TokenMetadataCoordinator;
}): Promise<SnapElement> {
  const ruleOptions = {
    context,
    metadata,
    tokenMetadataCoordinator: tokenMetadata,
    defaultTokenCaip19: (ctx: NativeTokenPeriodicContext): CaipAssetType =>
      ctx.primaryTokenCaip19,
  };

  return (
    <Box>
      <Section>
        {renderRules({
          rules: [periodAmountRule, periodDurationRule],
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
