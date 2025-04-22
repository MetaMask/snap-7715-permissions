import { Form } from '@metamask/snaps-sdk/jsx';
import { AccountDetails } from '../../ui/components/AccountDetails';
import { NativeTokenStreamContext, NativeTokenStreamMetadata } from './types';
import { InputField } from '../../ui/components/InputField';

export const INITIAL_AMOUNT_ELEMENT = 'initial-amount';
export const MAX_AMOUNT_ELEMENT = 'max-amount';
export const START_TIME_ELEMENT = 'start-time';
export const EXPIRY_ELEMENT = 'expiry';
export const AMOUNT_PER_SECOND_ELEMENT = 'amount-per-second';

export const createConfirmationContent = ({
  context: { accountDetails, permissionDetails, expiry, isAdjustmentAllowed },
  metadata: { validationErrors },
}: {
  context: NativeTokenStreamContext;
  metadata: NativeTokenStreamMetadata;
}) => {
  const areValuesFixed = !isAdjustmentAllowed;

  return (
    <Form name="native-token-stream-confirmation">
      <AccountDetails {...accountDetails} />
      <InputField
        label="Initial Amount"
        name={INITIAL_AMOUNT_ELEMENT}
        tooltip="The initial amount of tokens to stream."
        type="number"
        value={permissionDetails.initialAmount}
        disabled={areValuesFixed}
        errorMessage={validationErrors.initialAmountError}
      />
      <InputField
        label="Amount per second"
        name={AMOUNT_PER_SECOND_ELEMENT}
        tooltip="The amount of tokens to stream per second."
        type="number"
        value={permissionDetails.amountPerSecond}
        disabled={areValuesFixed}
        errorMessage={validationErrors.amountPerSecondError}
      />
      <InputField
        label="Max Amount"
        name={MAX_AMOUNT_ELEMENT}
        tooltip="The maximum amount of tokens that can be streamed."
        type="number"
        value={permissionDetails.maxAmount}
        disabled={areValuesFixed}
        errorMessage={validationErrors.maxAmountError}
      />
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
    </Form>
  );
};
