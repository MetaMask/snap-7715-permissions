import { useCallback, useEffect, useState } from 'react';
import { parseUnits } from 'viem';
import type { NativeTokenPeriodicPermissionRequest } from './types';
import { bigIntToHex } from '@metamask/utils';

type NativeTokenPeriodicFormProps = {
  onChange: (request: NativeTokenPeriodicPermissionRequest) => void;
};

export const NativeTokenPeriodicForm = ({
  onChange,
}: NativeTokenPeriodicFormProps) => {
  const [periodAmount, setPeriodAmount] = useState(
    BigInt(bigIntToHex(parseUnits('1', 18))),
  );
  const [periodDuration, setPeriodDuration] = useState(2592000); // 30 days in seconds
  const [startTime, setStartTime] = useState(Math.floor(Date.now() / 1000));
  const [expiry, setExpiry] = useState(
    Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days from now
  );
  const [justification, setJustification] = useState(
    'This is a very important request for periodic allowance for some very important thing',
  );
  const [isAdjustmentAllowed, setIsAdjustmentAllowed] = useState(true);

  const handlePeriodAmountChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      setPeriodAmount(BigInt(inputValue));
    },
    [],
  );

  const handlePeriodDurationChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      setPeriodDuration(Number(inputValue));
    },
    [],
  );

  const handleStartTimeChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      setStartTime(Number(inputValue));
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
      setExpiry(Number(inputValue));
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
      type: 'native-token-periodic',
      periodAmount: bigIntToHex(periodAmount),
      periodDuration,
      startTime,
      expiry,
      justification,
      isAdjustmentAllowed,
    });
  }, [
    onChange,
    periodAmount,
    periodDuration,
    startTime,
    expiry,
    justification,
    isAdjustmentAllowed,
  ]);

  return (
    <>
      <div>
        <label htmlFor="periodAmount">Period Amount:</label>
        <input
          type="text"
          id="periodAmount"
          name="periodAmount"
          value={periodAmount.toString()}
          onChange={handlePeriodAmountChange}
        />
      </div>
      <div>
        <label htmlFor="periodDuration">Period Duration:</label>
        <input
          type="number"
          id="periodDuration"
          name="periodDuration"
          value={periodDuration}
          onChange={handlePeriodDurationChange}
        />
      </div>
      <div>
        <label htmlFor="startTime">Start Time:</label>
        <input
          type="number"
          id="startTime"
          name="startTime"
          value={startTime}
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
          value={expiry}
          onChange={handleExpiryChange}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label htmlFor="isAdjustmentAllowed">Allow Adjustments:</label>
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
