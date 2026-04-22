import { bigIntToHex } from '@metamask/utils';
import { useCallback, useEffect, useState } from 'react';
import { parseUnits } from 'viem';

import type { NativeTokenAllowancePermissionRequest } from './types';

type NativeTokenAllowanceFormProps = {
  onChange: (request: NativeTokenAllowancePermissionRequest) => void;
};

export const NativeTokenAllowanceForm = ({
  onChange,
}: NativeTokenAllowanceFormProps) => {
  const [allowanceAmount, setAllowanceAmount] = useState(
    BigInt(bigIntToHex(parseUnits('1', 18))),
  );
  const [startTime, setStartTime] = useState<number | null>(
    Math.floor(Date.now() / 1000),
  );
  const [expiry, setExpiry] = useState<number | null>(
    Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days from now
  );
  const [justification, setJustification] = useState(
    'This is a request for a single native token allowance',
  );
  const [isAdjustmentAllowed, setIsAdjustmentAllowed] = useState(true);

  const handleAllowanceAmountChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      setAllowanceAmount(BigInt(inputValue));
    },
    [],
  );

  const handleStartTimeChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      if (inputValue.trim() === '') {
        setStartTime(null);
      } else {
        setStartTime(Number(inputValue));
      }
    },
    [],
  );

  const handleJustificationChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLTextAreaElement>) => {
      setJustification(inputValue);
    },
    [],
  );

  const handleExpiryChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      if (inputValue.trim() === '') {
        setExpiry(null);
      } else {
        setExpiry(Number(inputValue));
      }
    },
    [],
  );

  const handleIsAdjustmentAllowedChange = useCallback(
    ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
      setIsAdjustmentAllowed(checked);
    },
    [],
  );

  useEffect(() => {
    onChange({
      type: 'native-token-allowance',
      allowanceAmount: bigIntToHex(allowanceAmount),
      startTime,
      expiry,
      justification,
      isAdjustmentAllowed,
    });
  }, [
    onChange,
    allowanceAmount,
    startTime,
    expiry,
    justification,
    isAdjustmentAllowed,
  ]);

  return (
    <>
      <div>
        <label htmlFor="allowanceAmount">Allowance amount:</label>
        <input
          type="text"
          id="allowanceAmount"
          name="allowanceAmount"
          value={allowanceAmount.toString()}
          onChange={handleAllowanceAmountChange}
        />
      </div>
      <div>
        <label htmlFor="startTime">Start time:</label>
        <input
          type="number"
          id="startTime"
          name="startTime"
          value={startTime ?? ''}
          onChange={handleStartTimeChange}
        />
      </div>
      <div>
        <label htmlFor="justification">Justification:</label>
        <textarea
          id="justification"
          name="justification"
          rows={3}
          value={justification}
          onChange={handleJustificationChange}
        ></textarea>
      </div>
      <div>
        <label htmlFor="expiry">Expiry:</label>
        <input
          type="number"
          id="expiry"
          name="expiry"
          value={expiry ?? ''}
          onChange={handleExpiryChange}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label htmlFor="isAdjustmentAllowed">Allow adjustments:</label>
        <input
          type="checkbox"
          id="isAdjustmentAllowed"
          name="isAdjustmentAllowed"
          checked={isAdjustmentAllowed}
          onChange={handleIsAdjustmentAllowedChange}
          style={{ width: 'auto', marginLeft: '1rem' }}
        />
      </div>
    </>
  );
};
