import { useCallback, useEffect, useState } from 'react';
import { parseUnits, toHex } from 'viem';
import type { Hex } from 'viem';

import type { ERC20TokenAllowancePermissionRequest } from './types';

type ERC20TokenAllowanceFormProps = {
  onChange: (request: ERC20TokenAllowancePermissionRequest) => void;
};

export const ERC20TokenAllowanceForm = ({
  onChange,
}: ERC20TokenAllowanceFormProps) => {
  const decimals = 6; // e.g. USDC

  const [allowanceAmount, setAllowanceAmount] = useState(
    BigInt(toHex(parseUnits('1', decimals))),
  );
  const [startTime, setStartTime] = useState<number | null>(
    Math.floor(Date.now() / 1000),
  );
  const [expiry, setExpiry] = useState<number | null>(
    Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days from now
  );
  const [justification, setJustification] = useState(
    'This is a request for a single ERC-20 token allowance',
  );
  const [isAdjustmentAllowed, setIsAdjustmentAllowed] = useState(true);
  const [tokenAddress, setTokenAddress] = useState<Hex>(
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // Sepolia / mainnet USDC
  );

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
      type: 'erc20-token-allowance',
      allowanceAmount: toHex(allowanceAmount),
      startTime,
      expiry,
      justification,
      isAdjustmentAllowed,
      tokenAddress,
    });
  }, [
    onChange,
    allowanceAmount,
    startTime,
    expiry,
    justification,
    isAdjustmentAllowed,
    tokenAddress,
  ]);

  return (
    <>
      <div>
        <label htmlFor="tokenAddress">Token address:</label>
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
