import { useCallback, useEffect, useState } from 'react';
import { parseUnits, toHex, type Hex } from 'viem';
import { StyledForm } from './styles';
import type { ERC20TokenStreamPermissionRequest } from './types';

type ERC20TokenStreamFormProps = {
  onChange: (request: ERC20TokenStreamPermissionRequest) => void;
};

export const ERC20TokenStreamForm = ({
  onChange,
}: ERC20TokenStreamFormProps) => {
  const decimals = 6;

  const [initialAmount, setInitialAmount] = useState<bigint | null>(
    BigInt(toHex(parseUnits('.5', decimals))),
  );
  const [amountPerSecond, setAmountPerSecond] = useState(
    BigInt(toHex(parseUnits('.5', decimals))),
  );
  const [maxAmount, setMaxAmount] = useState<bigint | null>(
    BigInt(toHex(parseUnits('2.5', decimals))),
  );
  const [startTime, setStartTime] = useState(Math.floor(Date.now() / 1000));
  const [expiry, setExpiry] = useState(
    Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days from now
  );
  const [justification, setJustification] = useState(
    'This is a very important request for streaming allowance for some very important thing',
  );
  const [isAdjustmentAllowed, setIsAdjustmentAllowed] = useState(true);
  const [tokenAddress, setTokenAddress] = useState<Hex>(
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // Consensys USDC
  );

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
      type: 'erc20-token-stream',
      initialAmount: initialAmount ? toHex(initialAmount) : null,
      amountPerSecond: toHex(amountPerSecond),
      maxAmount: maxAmount ? toHex(maxAmount) : null,
      startTime,
      expiry,
      justification,
      isAdjustmentAllowed,
      tokenAddress,
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
    tokenAddress,
  ]);

  return (
    <StyledForm>
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
