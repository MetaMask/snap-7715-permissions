import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import type { Hex } from 'viem';

import { RedeemerAddressesField } from './RedeemerAddressesField';
import type { TokenApprovalRevocationPermissionRequest } from './types';

type TokenApprovalRevocationMechanism = Pick<
  TokenApprovalRevocationPermissionRequest,
  | 'erc20Approve'
  | 'erc721Approve'
  | 'erc721SetApprovalForAll'
  | 'permit2Approve'
  | 'permit2Lockdown'
  | 'permit2InvalidateNonces'
>;

const TOKEN_APPROVAL_REVOCATION_MECHANISMS = [
  { key: 'erc20Approve', label: 'ERC-20 approve(spender, 0)' },
  { key: 'erc721Approve', label: 'ERC-721 approve(address(0), tokenId)' },
  {
    key: 'erc721SetApprovalForAll',
    label: 'ERC-721/ERC-1155 setApprovalForAll(false)',
  },
  { key: 'permit2Approve', label: 'Permit2 approve(token, spender, 0, 0)' },
  { key: 'permit2Lockdown', label: 'Permit2 lockdown' },
  { key: 'permit2InvalidateNonces', label: 'Permit2 invalidate nonces' },
] as const satisfies readonly {
  key: keyof TokenApprovalRevocationMechanism;
  label: string;
}[];

const DEFAULT_TOKEN_APPROVAL_REVOCATION_MECHANISMS: TokenApprovalRevocationMechanism =
  {
    erc20Approve: true,
    erc721Approve: true,
    erc721SetApprovalForAll: true,
    permit2Approve: true,
    permit2Lockdown: true,
    permit2InvalidateNonces: true,
  };

const RevocationMethodsFieldset = styled.fieldset`
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  border-radius: 0.3rem;
  margin: 0 0 1rem;
  min-width: 0;
  padding: 1rem 1.2rem 1.2rem;

  legend {
    font-weight: 500;
    padding: 0 0.4rem;
  }
`;

const RevocationMethodList = styled.div`
  && {
    align-items: stretch;
    display: grid;
    gap: 0.8rem;
    grid-template-columns: 1fr;
    margin: 0;
  }
`;

const RevocationMethodOption = styled.label`
  && {
    align-items: flex-start;
    border: 1px solid ${({ theme }) => theme.colors.border?.default};
    border-radius: 0.3rem;
    cursor: pointer;
    display: flex;
    flex-shrink: 1;
    gap: 0.8rem;
    line-height: 1.35;
    margin: 0;
    min-width: 0;
    padding: 0.8rem;
    width: auto;
  }

  && input {
    flex: 0 0 auto;
    height: 1.4rem;
    margin: 0.15rem 0 0;
    min-width: 0;
    padding: 0;
    width: 1.4rem;
  }

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

type TokenApprovalRevocationFormProps = {
  onChange: (request: TokenApprovalRevocationPermissionRequest) => void;
};

export const TokenApprovalRevocationForm = ({
  onChange,
}: TokenApprovalRevocationFormProps) => {
  const [expiry, setExpiry] = useState<number | null>(
    Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  );
  const [justification, setJustification] = useState(
    'This site needs to revoke your token approvals for safety.',
  );
  const [isAdjustmentAllowed, setIsAdjustmentAllowed] = useState(true);
  const [redeemerAddresses, setRedeemerAddresses] = useState<Hex[]>([]);
  const [revocationMechanisms, setRevocationMechanisms] =
    useState<TokenApprovalRevocationMechanism>(
      DEFAULT_TOKEN_APPROVAL_REVOCATION_MECHANISMS,
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

  const handleRevocationMechanismChange = useCallback(
    (key: keyof TokenApprovalRevocationMechanism) =>
      ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
        setRevocationMechanisms((current) => ({
          ...current,
          [key]: checked,
        }));
      },
    [],
  );

  useEffect(() => {
    onChange({
      type: 'token-approval-revocation',
      expiry,
      justification,
      redeemerAddresses,
      payeeAddresses: null,
      isAdjustmentAllowed,
      startTime: null,
      ...revocationMechanisms,
    });
  }, [
    onChange,
    expiry,
    justification,
    redeemerAddresses,
    isAdjustmentAllowed,
    revocationMechanisms,
  ]);

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
      <RevocationMethodsFieldset>
        <legend>Revocation methods:</legend>
        <RevocationMethodList>
          {TOKEN_APPROVAL_REVOCATION_MECHANISMS.map(({ key, label }) => (
            <RevocationMethodOption key={key}>
              <input
                type="checkbox"
                id={key}
                name={key}
                checked={revocationMechanisms[key]}
                onChange={handleRevocationMechanismChange(key)}
              />
              <span>{label}</span>
            </RevocationMethodOption>
          ))}
        </RevocationMethodList>
      </RevocationMethodsFieldset>
      <RedeemerAddressesField onChange={setRedeemerAddresses} />
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
