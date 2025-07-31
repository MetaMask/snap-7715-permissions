import { useCallback, useEffect, useState } from 'react';
import { parseUnits, toHex, type Hex } from 'viem';
import type { ERC20TokenPeriodicPermissionRequest } from './types';

type ERC20TokenPeriodicFormProps = {
  onChange: (request: ERC20TokenPeriodicPermissionRequest) => void;
};

export const ERC20TokenPeriodicForm = ({
  onChange,
}: ERC20TokenPeriodicFormProps) => {
  const decimals = 6; // USDC decimals

  const [periodAmount, setPeriodAmount] = useState(
    BigInt(toHex(parseUnits('1', decimals))),
  );
  const [periodDuration, setPeriodDuration] = useState(2592000); // 30 days in seconds
  const [startTime, setStartTime] = useState(Math.floor(Date.now() / 1000));
  const [expiry, setExpiry] = useState(
    Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days from now
  );
  const [justification, setJustification] = useState(
    'This is a very important request for periodic ERC20 token allowance for some very important thing',
  );
  const [isAdjustmentAllowed, setIsAdjustmentAllowed] = useState(true);
  const [tokenAddress, setTokenAddress] = useState<Hex>(
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // Consensys USDC
  );

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

  const handleTokenAddressChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      setTokenAddress(inputValue as Hex);
    },
    [],
  );

  useEffect(() => {
    onChange({
      type: 'erc20-token-periodic',
      periodAmount: toHex(periodAmount),
      periodDuration,
      startTime,
      expiry,
      justification,
      isAdjustmentAllowed,
      tokenAddress,
    });
  }, [
    onChange,
    periodAmount,
    periodDuration,
    startTime,
    expiry,
    justification,
    isAdjustmentAllowed,
    tokenAddress,
  ]);

  return (
    <>
      <div>
        <label htmlFor="tokenAddress">Token Address:</label>
        <input
          type="text"
          id="tokenAddress"
          name="tokenAddress"
          value={tokenAddress}
          onChange={handleTokenAddressChange}
          placeholder="0x..."
        />
      </div>
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
        <label htmlFor="periodDuration">Period Duration (seconds):</label>
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
