import { bigIntToHex } from '@metamask/utils';
import { useCallback, useEffect, useState } from 'react';
import { parseUnits } from 'viem';

import type { NativeTokenSwapPermissionRequest } from './types';

type NativeTokenSwapFormProps = {
  onChange: (request: NativeTokenSwapPermissionRequest) => void;
};

/**
 * Demo form for requesting a native-token-swap permission (test site).
 * @param options0 - Form props.
 * @param options0.onChange - Callback to invoke when form values change.
 * @returns A React component that renders the native-token-swap form.
 */
export const NativeTokenSwapForm = ({ onChange }: NativeTokenSwapFormProps) => {
  const [allowance, setAllowance] = useState(
    BigInt(bigIntToHex(parseUnits('0.1', 18))),
  );
  const [whitelistedTokensOnly, setWhitelistedTokensOnly] = useState(true);
  const [expiry, setExpiry] = useState<number | null>(
    Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  );
  const [justification, setJustification] = useState(
    'This site needs a capped native token swap allowance for testing.',
  );
  const [isAdjustmentAllowed, setIsAdjustmentAllowed] = useState(true);

  const handleAllowanceChange = useCallback(
    ({
      target: { value: inputValue },
    }: React.ChangeEvent<HTMLInputElement>) => {
      setAllowance(BigInt(inputValue));
    },
    [],
  );

  const handleWhitelistedOnlyChange = useCallback(
    ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
      setWhitelistedTokensOnly(checked);
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
    ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
      if (value.trim() === '') {
        setExpiry(null);
      } else {
        setExpiry(Number(value));
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
      type: 'native-token-swap',
      allowance: bigIntToHex(allowance),
      whitelistedTokensOnly,
      expiry,
      justification,
      isAdjustmentAllowed,
      startTime: null,
    });
  }, [
    onChange,
    allowance,
    whitelistedTokensOnly,
    expiry,
    justification,
    isAdjustmentAllowed,
  ]);

  return (
    <>
      <div>
        <label htmlFor="allowance">Allowance:</label>
        <input
          type="text"
          id="allowance"
          name="allowance"
          value={allowance.toString()}
          onChange={handleAllowanceChange}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label htmlFor="whitelistedTokensOnly">Whitelisted tokens only:</label>
        <input
          type="checkbox"
          id="whitelistedTokensOnly"
          name="whitelistedTokensOnly"
          checked={whitelistedTokensOnly}
          onChange={handleWhitelistedOnlyChange}
          style={{ width: 'auto', marginLeft: '1rem' }}
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
        />
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
