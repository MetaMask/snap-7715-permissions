import { Box, Button, Input, Section, Text } from '@metamask/snaps-sdk/jsx';
import { AccountDetails } from '../../ui/components/AccountDetails';
import { RequestHeader } from '../../ui/components/RequestHeader';
import { NativeTokenStreamContext, NativeTokenStreamMetadata } from './types';
import { IconUrls } from '../../ui/iconConstant';
import {
  ItemDetails,
  RequestDetails,
} from '../../ui/components/RequestDetails';
import { getChainName } from '../../../../shared/src/utils/common';
import { TooltipIcon } from '../../ui/components/TooltipIcon';
import { renderRules } from '../rules';
import {
  initialAmountRule,
  maxAmountRule,
  startTimeRule,
  expiryRule,
  streamAmountPerPeriodRule,
  streamPeriodRule,
} from './rules';

import { TOGGLE_ADD_MORE_RULES_BUTTON } from '../ruleModalManager';

export const JUSTIFICATION_SHOW_MORE_BUTTON_NAME = 'justification-show-more';
export const SELECT_NEW_RULE_DROPDOWN = 'select-new-rule';
export const NEW_RULE_VALUE_ELEMENT = 'new-rule-value';
export const SAVE_NEW_RULE_BUTTON = 'save-new-rule';
export const ADD_MORE_RULES_FORM = 'add-more-rules-form';

export const createConfirmationContent = ({
  context,
  metadata,
  isJustificationCollapsed,
  origin,
  chainId,
  showAddMoreRulesButton,
}: {
  context: NativeTokenStreamContext;
  metadata: NativeTokenStreamMetadata;
  isJustificationCollapsed: boolean;
  origin: string;
  chainId: number;
  showAddMoreRulesButton: boolean;
}) => {
  const { amountPerSecond } = metadata;

  const rulesToAddButton = showAddMoreRulesButton ? (
    <Button name={TOGGLE_ADD_MORE_RULES_BUTTON}>Add more rules</Button>
  ) : null;

  const networkName = getChainName(chainId);

  const itemDetails: ItemDetails[] = [
    {
      label: 'Recipient',
      text: origin,
      tooltipText: 'The site requesting the permission',
    },
    {
      label: 'Network',
      text: networkName,
      tooltipText: 'The network on which the permission is being requested',
    },
    {
      label: 'Token',
      text: 'ETH',
      iconUrl: IconUrls.ethereum.token,
    },
  ];

  return (
    <Box>
      <Box direction="vertical">
        <RequestHeader title="Native token stream" />
        <RequestDetails
          itemDetails={itemDetails}
          justification="Permission to stream native tokens"
          isJustificationShowMoreCollapsed={isJustificationCollapsed}
          justificationShowMoreElementName={JUSTIFICATION_SHOW_MORE_BUTTON_NAME}
        />
        <AccountDetails
          account={context.accountDetails}
          title="Stream from"
          tooltip="The account that the token stream comes from."
        />
        <Section>
          {renderRules(
            [streamAmountPerPeriodRule, streamPeriodRule],
            context,
            metadata,
          )}

          <Box direction="vertical">
            <Box direction="horizontal" alignment="space-between">
              <Box direction="horizontal">
                <Text>Stream rate</Text>
                <TooltipIcon tooltip="The amount of tokens to stream per second." />
              </Box>
            </Box>
            <Input
              name="stream-rate"
              type="text"
              value={`${amountPerSecond} ETH/sec`}
              disabled={true}
            />
          </Box>
        </Section>

        <Section>
          {renderRules(
            [initialAmountRule, maxAmountRule, startTimeRule, expiryRule],
            context,
            metadata,
          )}
        </Section>
        {rulesToAddButton}
      </Box>
    </Box>
  );
};
