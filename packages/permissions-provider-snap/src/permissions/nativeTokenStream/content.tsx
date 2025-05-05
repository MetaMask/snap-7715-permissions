import { Box, Button, Section } from '@metamask/snaps-sdk/jsx';
import { AccountDetails } from '../../ui/components/AccountDetails';
import { NativeTokenStreamContext, NativeTokenStreamMetadata } from './types';
import { InputField } from '../../ui/components/InputField';
import { DropdownField } from '../../ui/components/DropdownField';
import { TextField } from '../../ui/components/TextField';
import { TimePeriod } from '../../core/types';

export const INITIAL_AMOUNT_ELEMENT = 'initial-amount';
export const REMOVE_INITIAL_AMOUNT_BUTTON = 'remove-initial-amount';
export const MAX_AMOUNT_ELEMENT = 'max-amount';
export const REMOVE_MAX_AMOUNT_BUTTON = 'remove-max-amount';
export const START_TIME_ELEMENT = 'start-time';
export const EXPIRY_ELEMENT = 'expiry';
export const AMOUNT_PER_PERIOD_ELEMENT = 'amount-per-period';
export const TIME_PERIOD_ELEMENT = 'time-period';
export const ADD_MORE_RULES_BUTTON = 'add-more-rules';

export const createConfirmationContent = ({
  context: { accountDetails, permissionDetails, expiry, isAdjustmentAllowed },
  metadata: { validationErrors, amountPerSecond, rulesToAdd },
}: {
  context: NativeTokenStreamContext;
  metadata: NativeTokenStreamMetadata;
}) => {
  const areValuesFixed = !isAdjustmentAllowed;

  const rulesToAddButton =
    rulesToAdd.length > 0 ? (
      <Button name={ADD_MORE_RULES_BUTTON}>Add more rules</Button>
    ) : null;

  return (
    <Box direction="vertical">
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
        <TextField
          label="Stream rate"
          tooltip="The amount of tokens to stream per second."
          value={`${amountPerSecond} per second`}
        />
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
  );
};
