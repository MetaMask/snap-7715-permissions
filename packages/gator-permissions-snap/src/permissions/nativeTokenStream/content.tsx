import {
  Bold,
  Box,
  Button,
  Input,
  Section,
  Text,
  Dropdown,
  Option,
  Icon,
  Form,
  Field,
} from '@metamask/snaps-sdk/jsx';

import { getChainName } from '../../../../shared/src/utils/common';
import { TimePeriod } from '../../core/types';
import { AccountDetails } from '../../ui/components/AccountDetails';
import { DropdownField } from '../../ui/components/DropdownField';
import { InputField } from '../../ui/components/InputField';
import type { ItemDetails } from '../../ui/components/RequestDetails';
import { RequestDetails } from '../../ui/components/RequestDetails';
import { RequestHeader } from '../../ui/components/RequestHeader';
import { TooltipIcon } from '../../ui/components/TooltipIcon';
import { IconUrls } from '../../ui/iconConstant';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
} from './types';

export const INITIAL_AMOUNT_ELEMENT = 'initial-amount';
export const REMOVE_INITIAL_AMOUNT_BUTTON = 'remove-initial-amount';
export const MAX_AMOUNT_ELEMENT = 'max-amount';
export const REMOVE_MAX_AMOUNT_BUTTON = 'remove-max-amount';
export const START_TIME_ELEMENT = 'start-time';
export const EXPIRY_ELEMENT = 'expiry';
export const AMOUNT_PER_PERIOD_ELEMENT = 'amount-per-period';
export const TIME_PERIOD_ELEMENT = 'time-period';
export const TOGGLE_ADD_MORE_RULES_BUTTON = 'add-more-rules';
export const JUSTIFICATION_SHOW_MORE_BUTTON_NAME = 'justification-show-more';
export const SELECT_NEW_RULE_DROPDOWN = 'select-new-rule';
export const NEW_RULE_VALUE_ELEMENT = 'new-rule-value';
export const SAVE_NEW_RULE_BUTTON = 'save-new-rule';
export const ADD_MORE_RULES_FORM = 'add-more-rules-form';

export const createConfirmationContent = ({
  context: { accountDetails, permissionDetails, expiry, isAdjustmentAllowed },
  metadata: { validationErrors, amountPerSecond, rulesToAdd },
  isJustificationCollapsed,
  isAddRuleShown,
  origin,
  chainId,
  addRuleValidationMessage,
}: {
  context: NativeTokenStreamContext;
  metadata: NativeTokenStreamMetadata;
  isJustificationCollapsed: boolean;
  isAddRuleShown: boolean;
  origin: string;
  chainId: number;
  addRuleValidationMessage: string | undefined;
}) => {
  if (isAddRuleShown) {
    return (
      <Section>
        <Box direction="horizontal" alignment="space-between">
          <Text>{''}</Text>
          <Box direction="horizontal" alignment="center">
            <Text>
              <Bold>Add more rules</Bold>
            </Text>
          </Box>
          <Box direction="horizontal" alignment="end">
            <Button name={TOGGLE_ADD_MORE_RULES_BUTTON}>
              <Icon name="close" size="inherit" color="primary" />
            </Button>
          </Box>
        </Box>
        <Text>Create additional rules that this token stream must follow.</Text>
        <Form name={ADD_MORE_RULES_FORM}>
          <Dropdown name={SELECT_NEW_RULE_DROPDOWN}>
            {rulesToAdd.map((rule, index) => (
              <Option value={index.toString()}>{rule}</Option>
            ))}
          </Dropdown>
          <Field error={addRuleValidationMessage}>
            <Input name={NEW_RULE_VALUE_ELEMENT} type="number" />
          </Field>
          <Button
            type="submit"
            name={SAVE_NEW_RULE_BUTTON}
            disabled={addRuleValidationMessage !== undefined}
          >
            Save
          </Button>
        </Form>
      </Section>
    );
  }

  const areValuesFixed = !isAdjustmentAllowed;

  const rulesToAddButton =
    rulesToAdd.length > 0 ? (
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
          account={accountDetails}
          title="Stream from"
          tooltip="The account that the token stream comes from."
        />
        <Section>
          <InputField
            label="Stream Amount"
            name={AMOUNT_PER_PERIOD_ELEMENT}
            tooltip="The amount of tokens to stream per period."
            type="number"
            value={permissionDetails.amountPerPeriod}
            disabled={areValuesFixed}
            errorMessage={validationErrors.amountPerPeriodError}
          />
          <DropdownField
            label="Period"
            name={TIME_PERIOD_ELEMENT}
            options={Object.values(TimePeriod)}
            tooltip="The period of the stream."
            disabled={areValuesFixed}
            value={permissionDetails.timePeriod}
          />

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
          {permissionDetails.initialAmount !== undefined ? (
            <InputField
              label="Initial Amount"
              name={INITIAL_AMOUNT_ELEMENT}
              removeButtonName={REMOVE_INITIAL_AMOUNT_BUTTON}
              tooltip="The initial amount of tokens to stream."
              type="number"
              value={permissionDetails.initialAmount}
              disabled={areValuesFixed}
              errorMessage={validationErrors.initialAmountError}
            />
          ) : null}
          {permissionDetails.maxAmount !== undefined ? (
            <InputField
              label="Max Amount"
              name={MAX_AMOUNT_ELEMENT}
              removeButtonName={REMOVE_MAX_AMOUNT_BUTTON}
              tooltip="The maximum amount of tokens that can be streamed."
              type="number"
              value={permissionDetails.maxAmount}
              disabled={areValuesFixed}
              errorMessage={validationErrors.maxAmountError}
            />
          ) : null}
          <InputField
            label="Start Time"
            name={START_TIME_ELEMENT}
            tooltip="The start time of the stream."
            type="text"
            value={permissionDetails.startTime}
            disabled={areValuesFixed}
            errorMessage={validationErrors.startTimeError}
          />
          <InputField
            label="Expiry"
            name={EXPIRY_ELEMENT}
            tooltip="The expiry time of the stream."
            type="text"
            value={expiry}
            disabled={areValuesFixed}
            errorMessage={validationErrors.expiryError}
          />
        </Section>
        {rulesToAddButton}
      </Box>
    </Box>
  );
};
