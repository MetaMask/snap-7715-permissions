import type { CaipAssetType } from '@metamask/snaps-sdk';

import type { TokenMetadataCoordinator } from '../coordinators/TokenMetadataCoordinator';
import type {
  BaseContext,
  ContextWithPrimaryToken,
  RuleDefinition,
  TokenCaip19Selector,
} from '../types';

/**
 * Returns the primary token CAIP-19 from a context that declares one.
 * @param context - Permission context with a primary token reference.
 * @returns The primary token CAIP-19 asset identifier.
 */
export const primaryTokenCaip19Selector = <
  TContext extends BaseContext & ContextWithPrimaryToken,
>(
  context: TContext,
): CaipAssetType => context.primaryTokenCaip19;

/**
 * Collects unique CAIP-19 asset identifiers returned by the given selectors.
 * @param context - Permission context passed to each selector.
 * @param selectors - Token CAIP-19 selectors to evaluate.
 * @returns Deduplicated CAIP-19 asset identifiers.
 */
export function collectTokenCaip19s<TContext extends BaseContext>(
  context: TContext,
  selectors: TokenCaip19Selector<TContext>[],
): CaipAssetType[] {
  const caip19s = selectors
    .map((selector) => selector(context))
    .filter((caip19): caip19 is CaipAssetType => caip19 !== undefined);

  return [...new Set(caip19s)];
}

/**
 * Resolves the CAIP-19 asset for a rule's amount field.
 * @param rule - Rule definition with optional token selector.
 * @param context - Current permission context.
 * @param defaultSelector - Module default token selector.
 * @returns CAIP-19 asset identifier or undefined.
 */
export function resolveRuleTokenCaip19<
  TContext extends BaseContext,
  TMetadata extends object,
>(
  rule: RuleDefinition<TContext, TMetadata>,
  context: TContext,
  defaultSelector?: TokenCaip19Selector<TContext>,
): CaipAssetType | undefined {
  if (rule.tokenCaip19) {
    return rule.tokenCaip19(context);
  }

  return defaultSelector?.(context);
}

/**
 * Returns token decimals from the coordinator for the given CAIP-19 asset.
 * @param coordinator - Token metadata coordinator for the request.
 * @param caip19 - CAIP-19 asset identifier.
 * @returns Token decimals or undefined when metadata is unavailable.
 */
export function getTokenDecimals(
  coordinator: TokenMetadataCoordinator,
  caip19: CaipAssetType | undefined,
): number | undefined {
  if (!caip19) {
    return undefined;
  }

  return coordinator.getMetadata(caip19)?.decimals;
}
