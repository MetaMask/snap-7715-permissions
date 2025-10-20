import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Heading,
  Section,
  Text,
  Skeleton,
  AccountSelector,
} from '@metamask/snaps-sdk/jsx';
import { parseCaipAssetType } from '@metamask/utils';

import { JUSTIFICATION_SHOW_MORE_BUTTON_NAME } from './permissionHandler';
import type { BaseContext, IconData } from './types';
import {
  ShowMoreText,
  SkeletonField,
  TextField,
  TooltipIcon,
  TokenField,
  TokenBalanceField,
} from '../ui/components';
import type { MessageKey } from '../utils/i18n';
import { t } from '../utils/i18n';

export const ACCOUNT_SELECTOR_NAME = 'account-selector';

export type PermissionHandlerContentProps = {
  children: SnapElement;
  permissionTitle: MessageKey;
  justification: string;
  networkName: string;
  tokenSymbol: string;
  tokenIconData?: IconData | undefined;
  isJustificationCollapsed: boolean;
  origin: string;
  context: BaseContext;
  tokenBalance: string | null;
  tokenBalanceFiat: string | null;
  chainId: number;
  explorerUrl: string | undefined;
};

/**
 * Content wrapping a permission confirmation, including the title and add-more-rules button.
 * @param options - The params for the content.
 * @param options.children - The children of the content.
 * @param options.permissionTitle - The title of the permission.
 * @param options.origin - The origin of the permission request.
 * @param options.justification - The justification for the permission request.
 * @param options.networkName - The name of the network.
 * @param options.tokenSymbol - The symbol of the token.
 * @param options.tokenIconData - The icon data of the token.
 * @param options.isJustificationCollapsed - Whether the justification is collapsed.
 * @param options.context - The context of the permission.
 * @param options.tokenBalance - The formatted balance of the token.
 * @param options.tokenBalanceFiat - The formatted fiat balance of the token.
 * @param options.chainId - The chain ID of the network.
 * @param options.explorerUrl - The URL of the block explorer for the token.
 * @returns The confirmation content.
 */
export const PermissionHandlerContent = ({
  children,
  permissionTitle,
  origin,
  justification,
  networkName,
  tokenSymbol,
  tokenIconData,
  isJustificationCollapsed,
  context,
  tokenBalance,
  tokenBalanceFiat,
  chainId,
  explorerUrl,
}: PermissionHandlerContentProps): SnapElement => {
  const tokenBalanceComponent = TokenBalanceField({ tokenBalance });

  const fiatBalanceComponent = tokenBalanceFiat ? (
    <Text>{tokenBalanceFiat}</Text>
  ) : (
    <Skeleton />
  );

  let tokenExplorerUrl, tokenAddress;
  const { assetReference, assetNamespace } = parseCaipAssetType(
    context.tokenAddressCaip19,
  );
  if (assetNamespace === 'erc20') {
    if (explorerUrl) {
      tokenExplorerUrl = `${explorerUrl}/address/${assetReference}`;
    }

    tokenAddress = assetReference;
  }

  return (
    <Box>
      <Box direction="vertical">
        <Box center={true}>
          <Heading size="lg">{t(permissionTitle)}</Heading>
        </Box>
        <Section>
          <TextField
            label={t('recipientLabel')}
            value={origin}
            tooltip={t('recipientTooltip')}
          />
          <TextField
            label={t('networkLabel')}
            value={networkName}
            tooltip={t('networkTooltip')}
          />
          <TokenField
            label={t('tokenLabel')}
            tokenSymbol={tokenSymbol}
            tokenAddress={tokenAddress}
            explorerUrl={tokenExplorerUrl}
            tooltip={t('tokenTooltip')}
            iconData={tokenIconData}
          />
          <Box direction="horizontal" alignment="space-between">
            <Box direction="horizontal">
              <Text>{t('reasonLabel')}</Text>
              <TooltipIcon tooltip={t('reasonTooltip')} />
            </Box>
            <Box direction="horizontal">
              <ShowMoreText
                text={justification}
                buttonName={JUSTIFICATION_SHOW_MORE_BUTTON_NAME}
                isCollapsed={isJustificationCollapsed}
              />
            </Box>
          </Box>
        </Section>
        <Section>
          <Box direction="vertical">
            <Box direction="horizontal" alignment="space-between">
              <Box direction="horizontal">
                <Text>{t('accountLabel')}</Text>
                <TooltipIcon tooltip={t('accountTooltip')} />
              </Box>
            </Box>
            <AccountSelector
              name={ACCOUNT_SELECTOR_NAME}
              chainIds={[`eip155:${chainId}`]}
              switchGlobalAccount={false}
              value={context.accountAddressCaip10}
            />
            <Box direction="horizontal" alignment="end">
              {fiatBalanceComponent}
              {tokenBalanceComponent}
            </Box>
          </Box>
        </Section>
        {children}
      </Box>
    </Box>
  );
};

export const SkeletonPermissionHandlerContent = ({
  permissionTitle,
}: {
  permissionTitle: MessageKey;
}) => {
  return (
    <Box>
      <Box direction="vertical">
        <Box center={true}>
          <Heading size="lg">{t(permissionTitle)}</Heading>
        </Box>
        <Section>
          <SkeletonField
            label={t('recipientLabel')}
            tooltip={t('recipientTooltip')}
          />
          <SkeletonField
            label={t('networkLabel')}
            tooltip={t('networkTooltip')}
          />
          <SkeletonField label={t('tokenLabel')} tooltip={t('tokenTooltip')} />
          <SkeletonField
            label={t('reasonLabel')}
            tooltip={t('reasonTooltip')}
          />
        </Section>
        <Section>
          <Skeleton />
          <Skeleton />
        </Section>
      </Box>
    </Box>
  );
};
