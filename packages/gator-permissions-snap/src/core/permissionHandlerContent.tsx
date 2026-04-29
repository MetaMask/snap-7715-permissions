import { NO_ASSET_ADDRESS } from '@metamask/7715-permissions-shared/types';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Heading,
  Section,
  Text,
  Skeleton,
  AccountSelector,
  Banner,
  Button,
  Container,
  Footer,
} from '@metamask/snaps-sdk/jsx';
import { parseCaipAssetType } from '@metamask/utils';

import { ConfirmationDialog } from './confirmation';
import { JUSTIFICATION_SHOW_MORE_BUTTON_NAME } from './permissionHandler';
import type { BaseContext, IconData } from './types';
import {
  AddressScanResultType,
  RecommendedAction,
} from '../clients/trustSignalsClient';
import type {
  FetchAddressScanResult,
  ScanDappUrlResult,
} from '../clients/trustSignalsClient';
import {
  AddressField,
  RedeemerField,
  ShowMoreText,
  SkeletonField,
  TextField,
  TooltipIcon,
  TokenBalanceField,
  TokenField,
} from '../ui/components';
import type { MessageKey } from '../utils/i18n';
import { t } from '../utils/i18n';
import { ExistingPermissionsState } from './existingpermissions/existingPermissionsState';

export const ACCOUNT_SELECTOR_NAME = 'account-selector';
export const SHOW_EXISTING_PERMISSIONS_BUTTON_NAME =
  'show-existing-permissions-button';

export type PermissionHandlerContentProps = {
  children: SnapElement;
  permissionTitle: MessageKey;
  permissionSubtitle: MessageKey;
  justification: string;
  networkName: string;
  tokenSymbol: string;
  tokenIconData?: IconData | undefined;
  isJustificationCollapsed: boolean;
  origin: string;
  /** Dapp URL scan result; when set with a warning/block, a warning icon with tooltip is shown beside the origin. */
  scanDappUrlResult: ScanDappUrlResult | null;
  /** Address scan result from the security alerts API. */
  scanAddressResult: FetchAddressScanResult | null;
  delegateAddress: string;
  context: BaseContext;
  tokenBalance: string | null;
  tokenBalanceFiat: string | null;
  chainId: number;
  explorerUrl: string | undefined;
  isAccountUpgraded: boolean;
  existingPermissionsStatus: ExistingPermissionsState;
  /** When true, the primary grant button is not clickable. */
  isGrantDisabled: boolean;
};

/**
 * Content wrapping a permission confirmation, including the title and add-more-rules button.
 * @param options - The params for the content.
 * @param options.children - The children of the content.
 * @param options.permissionTitle - The title of the permission.
 * @param options.permissionSubtitle - The subtitle of the permission.
 * @param options.origin - The origin of the permission request.
 * @param options.scanDappUrlResult - Optional dapp URL scan result; when set, a warning icon with tooltip is shown beside the origin.
 * @param options.scanAddressResult - Optional address scan result from the security alerts API.
 * @param options.delegateAddress - The address that will receive the delegated permission.
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
 * @param options.isAccountUpgraded - Whether the account is upgraded to a smart account.
 * @param options.existingPermissionsStatus - Status of existing permissions for banner UI.
 * @param options.isGrantDisabled - Whether the grant button should render disabled.
 * @returns The confirmation content.
 */
export const PermissionHandlerContent = ({
  children,
  permissionTitle,
  permissionSubtitle,
  origin,
  scanDappUrlResult,
  scanAddressResult,
  delegateAddress,
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
  isAccountUpgraded,
  existingPermissionsStatus,
  isGrantDisabled,
}: PermissionHandlerContentProps): SnapElement => {
  const tokenBalanceComponent = TokenBalanceField({
    tokenBalance,
  });

  const fiatBalanceComponent = tokenBalanceFiat ? (
    <Text>{tokenBalanceFiat}</Text>
  ) : (
    <Skeleton />
  );

  const hasAsset = context.tokenAddressCaip19 !== NO_ASSET_ADDRESS;

  let tokenExplorerUrl, tokenAddress;
  if (hasAsset) {
    const { assetReference, assetNamespace } = parseCaipAssetType(
      context.tokenAddressCaip19,
    );
    if (assetNamespace === 'erc20') {
      if (explorerUrl) {
        tokenExplorerUrl = `${explorerUrl}/address/${assetReference}`;
      }

      tokenAddress = assetReference;
    }
  }

  const urlWarningByRecommendedAction = {
    [RecommendedAction.BLOCK]: t('maliciousWebsiteLabel'),
    [RecommendedAction.WARN]: t('potentiallyMaliciousWebsiteLabel'),
  };

  const recommendedAction = scanDappUrlResult?.isComplete
    ? scanDappUrlResult.recommendedAction
    : undefined;

  const dappUrlWarningLabel =
    recommendedAction === RecommendedAction.BLOCK ||
    recommendedAction === RecommendedAction.WARN
      ? urlWarningByRecommendedAction[recommendedAction]
      : undefined;

  const fromField = (
    <TextField
      label={t('requestFromLabel')}
      value={origin}
      tooltip={t('requestFromTooltip')}
      warningLabel={dappUrlWarningLabel}
      warningSeverity={
        recommendedAction === RecommendedAction.WARN ? 'warning' : 'error'
      }
    />
  );

  const addressWarningByResultType = {
    [AddressScanResultType.Warning]: t('potentiallyMaliciousAddressLabel'),
    [AddressScanResultType.Malicious]: t('maliciousAddressLabel'),
  };

  const resultType = scanAddressResult?.resultType;
  // scanAddressResult.label is empty string when no label is specified
  const label =
    scanAddressResult?.label === '' ? null : scanAddressResult?.label;
  const addressWarningLabel =
    resultType === AddressScanResultType.Warning ||
    resultType === AddressScanResultType.Malicious
      ? (label ?? addressWarningByResultType[resultType])
      : undefined;

  const addressField = (
    <AddressField
      label={t('recipientLabel')}
      address={delegateAddress}
      tooltip={t('recipientTooltip')}
      warningLabel={addressWarningLabel}
      warningSeverity={
        resultType === AddressScanResultType.Warning ? 'warning' : 'error'
      }
    />
  );

  const redeemerField = context.redeemerAddresses?.length ? (
    <RedeemerField
      label={t('redeemerLabel')}
      addresses={context.redeemerAddresses}
      tooltip={t('redeemerTooltip')}
    />
  ) : null;
  return (
    <Container>
      <Box>
        <Box direction="vertical">
          <Box center={true}>
            <Heading size="lg">{t(permissionTitle)}</Heading>
            <Text>{t(permissionSubtitle)}</Text>
          </Box>
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
              {!isAccountUpgraded && (
                <Text size="sm" color="warning">
                  {t('accountUpgradeWarning')}
                </Text>
              )}
              {hasAsset && (
                <Box direction="horizontal" alignment="end">
                  {fiatBalanceComponent}
                  {tokenBalanceComponent}
                </Box>
              )}
            </Box>
          </Section>
          {existingPermissionsStatus ===
            ExistingPermissionsState.SimilarPermissions && (
            <Banner title={t('existingPermissionsTitle')} severity="warning">
              <Text>{t('existingPermissionsSimilarMessage')}</Text>
              <Button name={SHOW_EXISTING_PERMISSIONS_BUTTON_NAME}>
                {t('existingPermissionsLink')}
              </Button>
            </Banner>
          )}
          {existingPermissionsStatus ===
            ExistingPermissionsState.DissimilarPermissions && (
            <Banner title={t('existingPermissionsTitle')} severity="info">
              <Text>{t('existingPermissionsExistingMessage')}</Text>
              <Button name={SHOW_EXISTING_PERMISSIONS_BUTTON_NAME}>
                {t('existingPermissionsLink')}
              </Button>
            </Banner>
          )}
          <Section>
            <Box direction="vertical" alignment="space-between">
              <Box direction="horizontal">
                <Text>{t('justificationLabel')}</Text>
                <TooltipIcon tooltip={t('justificationTooltip')} />
              </Box>
              <ShowMoreText
                text={justification}
                buttonName={JUSTIFICATION_SHOW_MORE_BUTTON_NAME}
                isCollapsed={isJustificationCollapsed}
              />
            </Box>
          </Section>
          <Section>
            {fromField}
            {addressField}
            <TextField
              label={t('networkLabel')}
              value={networkName}
              tooltip={t('networkTooltip')}
            />
            {hasAsset && (
              <TokenField
                label={t('tokenLabel')}
                tokenSymbol={tokenSymbol}
                tokenAddress={tokenAddress}
                explorerUrl={tokenExplorerUrl}
                tooltip={t('tokenTooltip')}
                iconData={tokenIconData}
              />
            )}
            {redeemerField}
          </Section>
          {children}
        </Box>
      </Box>
      <Footer>
        <Button name={ConfirmationDialog.cancelButton} variant="destructive">
          {t('cancelButton')}
        </Button>
        <Button
          name={ConfirmationDialog.grantButton}
          variant="primary"
          disabled={isGrantDisabled}
        >
          {t('grantButton')}
        </Button>
      </Footer>
    </Container>
  );
};

export const SkeletonPermissionHandlerContent = ({
  permissionTitle,
  permissionSubtitle,
}: {
  permissionTitle: MessageKey;
  permissionSubtitle: MessageKey;
}): JSX.Element => {
  return (
    <Container>
      <Box>
        <Box direction="vertical">
          <Box center={true}>
            <Heading size="lg">{t(permissionTitle)}</Heading>
            <Text>{t(permissionSubtitle)}</Text>
          </Box>
          <Section>
            <Box direction="vertical">
              <Box direction="horizontal" alignment="space-between">
                <Box direction="horizontal">
                  <Text>{t('accountLabel')}</Text>
                  <TooltipIcon tooltip={t('accountTooltip')} />
                </Box>
              </Box>
              <Skeleton />
            </Box>
          </Section>
          <Section>
            <SkeletonField
              label={t('justificationLabel')}
              tooltip={t('justificationTooltip')}
            />
          </Section>
          <Section>
            <SkeletonField
              label={t('requestFromLabel')}
              tooltip={t('requestFromTooltip')}
            />
            <SkeletonField
              label={t('recipientLabel')}
              tooltip={t('recipientTooltip')}
            />
            <SkeletonField
              label={t('networkLabel')}
              tooltip={t('networkTooltip')}
            />
            <SkeletonField
              label={t('tokenLabel')}
              tooltip={t('tokenTooltip')}
            />
          </Section>
          <Section>
            <Skeleton />
            <Skeleton />
          </Section>
        </Box>
      </Box>
      <Footer>
        <Button name={ConfirmationDialog.cancelButton} variant="destructive">
          {t('cancelButton')}
        </Button>
        <Button
          name={ConfirmationDialog.grantButton}
          variant="primary"
          disabled={true}
        >
          {t('grantButton')}
        </Button>
      </Footer>
    </Container>
  );
};
