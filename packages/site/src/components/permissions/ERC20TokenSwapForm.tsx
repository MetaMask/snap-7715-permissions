import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseUnits, toHex } from 'viem';
import type { Hex } from 'viem';

import { RedeemerAddressesField } from './RedeemerAddressesField';
import type { ERC20TokenSwapPermissionRequest } from './types';

type ERC20TokenSwapFormProps = {
  onChange: (request: ERC20TokenSwapPermissionRequest) => void;
};

// Splits on commas outside parentheses, so function signatures stay intact.
const splitList = (value: string): string[] => {
  const entries: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of value) {
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth = Math.max(0, depth - 1);
    }

    if (char === ',' && depth === 0) {
      entries.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  entries.push(current);

  return entries
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

export const ERC20TokenSwapForm = ({ onChange }: ERC20TokenSwapFormProps) => {
  // Aave v3 on Ethereum mainnet: withdraw aEthUSDC to USDC.
  const spendDecimals = 6;
  const receiveDecimals = 6;

  const [spendTokenAddress, setSpendTokenAddress] = useState<Hex>(
    '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
  );
  const [maxSpendAmount, setMaxSpendAmount] = useState(
    BigInt(toHex(parseUnits('40000', spendDecimals))),
  );
  const [receiveTokenAddress, setReceiveTokenAddress] = useState<Hex>(
    '0xA0b86991c6218b36c1d19D4a2e9eB0cE3606eB48',
  );
  const [minReceiveAmount, setMinReceiveAmount] = useState(
    BigInt(toHex(parseUnits('39600', receiveDecimals))),
  );
  const [targets, setTargets] = useState(
    '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  );
  const [selectors, setSelectors] = useState(
    'withdraw(address,uint256,address)',
  );
  const [expiry, setExpiry] = useState<number | null>(
    Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days from now
  );
  const [justification, setJustification] = useState(
    'Withdraw your Aave v3 USDC position to your wallet if an exploit is detected on Aave.',
  );
  const [isAdjustmentAllowed, setIsAdjustmentAllowed] = useState(true);
  const [redeemerAddresses, setRedeemerAddresses] = useState<Hex[]>([]);

  const handleSpendTokenAddressChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      setSpendTokenAddress(inputValue as Hex);
    },
    [],
  );

  const handleMaxSpendAmountChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      setMaxSpendAmount(BigInt(inputValue));
    },
    [],
  );

  const handleReceiveTokenAddressChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      setReceiveTokenAddress(inputValue as Hex);
    },
    [],
  );

  const handleMinReceiveAmountChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      setMinReceiveAmount(BigInt(inputValue));
    },
    [],
  );

  const handleTargetsChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      setTargets(inputValue);
    },
    [],
  );

  const handleSelectorsChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      setSelectors(inputValue);
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

  const targetList = useMemo(() => splitList(targets) as Hex[], [targets]);
  const selectorList = useMemo(() => splitList(selectors), [selectors]);

  useEffect(() => {
    onChange({
      type: 'erc20-token-swap',
      spend: {
        tokenAddress: spendTokenAddress,
        maxAmount: toHex(maxSpendAmount),
      },
      receive: {
        tokenAddress: receiveTokenAddress,
        minAmount: toHex(minReceiveAmount),
      },
      via: {
        targets: targetList,
        selectors: selectorList,
      },
      startTime: null,
      expiry,
      justification,
      redeemerAddresses,
      payeeAddresses: null,
      isAdjustmentAllowed,
    });
  }, [
    onChange,
    spendTokenAddress,
    maxSpendAmount,
    receiveTokenAddress,
    minReceiveAmount,
    targetList,
    selectorList,
    expiry,
    justification,
    redeemerAddresses,
    isAdjustmentAllowed,
  ]);

  return (
    <>
      <div>
        <label htmlFor="spendTokenAddress">Spend token address:</label>
        <input
          type="text"
          id="spendTokenAddress"
          name="spendTokenAddress"
          value={spendTokenAddress}
          onChange={handleSpendTokenAddressChange}
          placeholder="0x..."
        />
      </div>
      <div>
        <label htmlFor="maxSpendAmount">Max spend amount (raw units):</label>
        <input
          type="text"
          id="maxSpendAmount"
          name="maxSpendAmount"
          value={maxSpendAmount.toString()}
          onChange={handleMaxSpendAmountChange}
        />
      </div>
      <div>
        <label htmlFor="receiveTokenAddress">Receive token address:</label>
        <input
          type="text"
          id="receiveTokenAddress"
          name="receiveTokenAddress"
          value={receiveTokenAddress}
          onChange={handleReceiveTokenAddressChange}
          placeholder="0x..."
        />
      </div>
      <div>
        <label htmlFor="minReceiveAmount">
          Min receive amount (raw units):
        </label>
        <input
          type="text"
          id="minReceiveAmount"
          name="minReceiveAmount"
          value={minReceiveAmount.toString()}
          onChange={handleMinReceiveAmountChange}
        />
      </div>
      <div>
        <label htmlFor="targets">Allowed contracts (comma-separated):</label>
        <input
          type="text"
          id="targets"
          name="targets"
          value={targets}
          onChange={handleTargetsChange}
          placeholder="0x..., 0x..."
        />
      </div>
      <div>
        <label htmlFor="selectors">
          Allowed functions (comma-separated selectors or signatures):
        </label>
        <input
          type="text"
          id="selectors"
          name="selectors"
          value={selectors}
          onChange={handleSelectorsChange}
          placeholder="transfer(address,uint256), 0xa9059cbb"
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
      <RedeemerAddressesField onChange={setRedeemerAddresses} />
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
