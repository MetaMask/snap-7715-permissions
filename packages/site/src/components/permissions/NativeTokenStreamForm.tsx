import { useCallback, useEffect, useState } from 'react';
import { parseUnits, toHex } from 'viem';
import { StyledForm } from './styles';
import type { NativeTokenStreamPermissionRequest } from './types';

type NativeTokenStreamFormProps = {
  onChange: (request: NativeTokenStreamPermissionRequest) => void;
};

export const NativeTokenStreamForm = ({
  onChange,
}: NativeTokenStreamFormProps) => {
  const [initialAmount, setInitialAmount] = useState<bigint | null>(
    BigInt(toHex(parseUnits('.5', 18))),
  );
  const [amountPerSecond, setAmountPerSecond] = useState(
    BigInt(toHex(parseUnits('.5', 18))),
  );
  const [maxAmount, setMaxAmount] = useState<bigint | null>(
    BigInt(toHex(parseUnits('2.5', 18))),
  );
  const [startTime, setStartTime] = useState(Math.floor(Date.now() / 1000));
  const [expiry, setExpiry] = useState(
    Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days from now
  );
  const [justification, setJustification] = useState(
    'This is a very important request for streaming allowance for some very important thing',
  );
  const [isAdjustmentAllowed, setIsAdjustmentAllowed] = useState(true);

  const handleInitialAmountChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      if (inputValue.trim() === '') {
        setInitialAmount(null);
      } else {
        setInitialAmount(BigInt(inputValue));
      }
    },
    [],
  );

  const handleAmountPerSecondChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      setAmountPerSecond(BigInt(inputValue));
    },
    [],
  );

  const handleMaxAmountChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      if (inputValue.trim() === '') {
        setMaxAmount(null);
      } else {
        setMaxAmount(BigInt(inputValue));
      }
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
      type: 'native-token-stream',
      initialAmount,
      amountPerSecond,
      maxAmount,
      startTime,
      expiry,
      justification,
      isAdjustmentAllowed,
    });
  }, [
    onChange,
    initialAmount,
    amountPerSecond,
    maxAmount,
    startTime,
    expiry,
    justification,
    isAdjustmentAllowed,
  ]);

  return (
    <StyledForm>
      <div>
        <label htmlFor="initialAmount">Initial Amount:</label>
        <input
          type="text"
          id="initialAmount"
          name="initialAmount"
          value={initialAmount?.toString()}
          onChange={handleInitialAmountChange}
        />
      </div>
      <div>
        <label htmlFor="amountPerSecond">Amount Per Second:</label>
        <input
          type="text"
          id="amountPerSecond"
          name="amountPerSecond"
          value={amountPerSecond.toString()}
          onChange={handleAmountPerSecondChange}
        />
      </div>
      <div>
        <label htmlFor="maxAmount">Max Amount:</label>
        <input
          type="text"
          id="maxAmount"
          name="maxAmount"
          value={maxAmount?.toString()}
          onChange={handleMaxAmountChange}
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
    </StyledForm>
  );
};
