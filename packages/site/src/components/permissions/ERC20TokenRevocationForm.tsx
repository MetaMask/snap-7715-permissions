import { useCallback, useEffect, useState } from 'react';
import type { ERC20TokenRevocationPermissionRequest } from './types';

type ERC20TokenRevocationFormProps = {
  onChange: (request: ERC20TokenRevocationPermissionRequest) => void;
};

export const ERC20TokenRevocationForm = ({
  onChange,
}: ERC20TokenRevocationFormProps) => {
  const [expiry, setExpiry] = useState<number | null>(
    Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  );
  const [justification, setJustification] = useState(
    'This site needs to revoke your token approvals for safety.',
  );
  const [isAdjustmentAllowed, setIsAdjustmentAllowed] = useState(true);

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
      type: 'erc20-token-revocation',
      expiry,
      justification,
      isAdjustmentAllowed,
      startTime: null,
    });
  }, [onChange, expiry, justification, isAdjustmentAllowed]);

  return (
    <>
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
