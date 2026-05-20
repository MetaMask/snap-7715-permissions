import { useEffect, useMemo, useState } from 'react';
import { encodeFunctionData, isAddress } from 'viem';
import type { Hex } from 'viem';

import type { PermissionRequest } from './types';

const ERC20_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

const ERC721_APPROVAL_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
] as const;

const PERMIT2_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'lockdown',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'approvals',
        type: 'tuple[]',
        components: [
          { name: 'token', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'invalidateNonces',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'newNonce', type: 'uint48' },
    ],
    outputs: [],
  },
] as const;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

const TOKEN_APPROVAL_REVOCATION_METHODS = [
  { key: 'erc20Approve', label: 'ERC-20 approve(spender, 0)' },
  { key: 'erc721Approve', label: 'ERC-721 approve(address(0), tokenId)' },
  {
    key: 'erc721SetApprovalForAll',
    label: 'ERC-721/ERC-1155 setApprovalForAll(false)',
  },
  { key: 'permit2Approve', label: 'Permit2 approve(token, spender, 0, 0)' },
  { key: 'permit2Lockdown', label: 'Permit2 lockdown' },
  { key: 'permit2InvalidateNonces', label: 'Permit2 invalidate nonces' },
] as const;

type TokenApprovalRevocationMethod =
  (typeof TOKEN_APPROVAL_REVOCATION_METHODS)[number]['key'];

type Rule = {
  type: string;
  data?: {
    addresses?: Hex[];
  };
};

type PermissionResponse = {
  permission: {
    type: PermissionRequest['type'];
    data?: {
      tokenAddress?: Hex;
      initialAmount?: string | null;
      amountPerSecond?: string;
      periodAmount?: string;
      erc20Approve?: boolean;
      erc721Approve?: boolean;
      erc721SetApprovalForAll?: boolean;
      permit2Approve?: boolean;
      permit2Lockdown?: boolean;
      permit2InvalidateNonces?: boolean;
    };
  };
  rules?: Rule[];
};

export type RedemptionCall = {
  to: Hex;
  data: Hex;
  value: bigint;
};

type RedemptionFormProps = {
  delegateAddress: Hex | undefined;
  onChange: (call: RedemptionCall) => void;
  permissionResponse: PermissionResponse;
};

const EMPTY_HEX = '0x' as const;

/**
 * Reads rule addresses from a permission response.
 *
 * @param rules - Permission response rules.
 * @param type - Rule type to read.
 * @returns Addresses from the matching rule, if present.
 */
function getRuleAddresses(rules: Rule[] | undefined, type: string): Hex[] {
  const rule = rules?.find((entry) => entry.type === type);
  const addresses = rule?.data?.addresses;
  return Array.isArray(addresses) ? addresses : [];
}

/**
 * Parses a raw integer input without throwing during form edits.
 *
 * @param value - Raw form input.
 * @returns Parsed bigint, or zero for empty/invalid input.
 */
function parseBigIntInput(value: string): bigint {
  try {
    return value.trim() === '' ? 0n : BigInt(value);
  } catch {
    return 0n;
  }
}

/**
 * Gets a sensible redemption amount from the granted permission data.
 *
 * @param permission - Granted permission response.
 * @returns Default raw unit amount for redemption.
 */
function getDefaultAmount(
  permission: PermissionResponse['permission'],
): string {
  const { data, type } = permission;
  if (type === 'native-token-periodic' || type === 'erc20-token-periodic') {
    return data?.periodAmount ?? '0';
  }

  if (type === 'native-token-stream' || type === 'erc20-token-stream') {
    const initialAmount = parseBigIntInput(data?.initialAmount ?? '0');
    return initialAmount > 0n
      ? (data?.initialAmount ?? '0')
      : (data?.amountPerSecond ?? '0');
  }

  return '0';
}

/**
 * Encodes ERC-20 transfer calldata when the recipient is valid.
 *
 * @param recipient - Transfer recipient.
 * @param amount - Raw token amount.
 * @returns Encoded calldata, or `0x` while the form is incomplete.
 */
function encodeTransferCalldata(recipient: Hex, amount: bigint): Hex {
  if (!isAddress(recipient)) {
    return EMPTY_HEX;
  }

  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [recipient, amount],
  });
}

/**
 * Encodes ERC-20 approval revocation calldata when the spender is valid.
 *
 * @param spender - Allowance spender to revoke.
 * @returns Encoded calldata, or `0x` while the form is incomplete.
 */
function encodeApproveCalldata(spender: Hex): Hex {
  if (!isAddress(spender)) {
    return EMPTY_HEX;
  }

  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender, 0n],
  });
}

/**
 * Encodes ERC-721 per-token approval revocation calldata.
 *
 * @param tokenId - Token ID whose current approval should be cleared.
 * @returns Encoded calldata.
 */
function encodeErc721ApproveCalldata(tokenId: string): Hex {
  return encodeFunctionData({
    abi: ERC721_APPROVAL_ABI,
    functionName: 'approve',
    args: [ZERO_ADDRESS, parseBigIntInput(tokenId)],
  });
}

/**
 * Encodes ERC-721/ERC-1155 operator approval revocation calldata.
 *
 * @param operator - Operator address whose approval should be cleared.
 * @returns Encoded calldata, or `0x` while the form is incomplete.
 */
function encodeSetApprovalForAllCalldata(operator: Hex): Hex {
  if (!isAddress(operator)) {
    return EMPTY_HEX;
  }

  return encodeFunctionData({
    abi: ERC721_APPROVAL_ABI,
    functionName: 'setApprovalForAll',
    args: [operator, false],
  });
}

/**
 * Encodes Permit2 single-pair approval revocation calldata.
 *
 * @param token - Token address whose Permit2 allowance should be cleared.
 * @param spender - Spender address whose Permit2 allowance should be cleared.
 * @returns Encoded calldata, or `0x` while the form is incomplete.
 */
function encodePermit2ApproveCalldata(token: Hex, spender: Hex): Hex {
  if (!isAddress(token) || !isAddress(spender)) {
    return EMPTY_HEX;
  }

  return encodeFunctionData({
    abi: PERMIT2_ABI,
    functionName: 'approve',
    args: [token, spender, 0n, 0],
  });
}

/**
 * Encodes Permit2 lockdown calldata for one token/spender pair.
 *
 * @param token - Token address whose Permit2 allowance should be cleared.
 * @param spender - Spender address whose Permit2 allowance should be cleared.
 * @returns Encoded calldata, or `0x` while the form is incomplete.
 */
function encodePermit2LockdownCalldata(token: Hex, spender: Hex): Hex {
  if (!isAddress(token) || !isAddress(spender)) {
    return EMPTY_HEX;
  }

  return encodeFunctionData({
    abi: PERMIT2_ABI,
    functionName: 'lockdown',
    args: [[{ token, spender }]],
  });
}

/**
 * Encodes Permit2 nonce invalidation calldata.
 *
 * @param token - Token address whose signed Permit2 permits should be invalidated.
 * @param spender - Spender address whose signed Permit2 permits should be invalidated.
 * @param newNonce - New Permit2 nonce.
 * @returns Encoded calldata, or `0x` while the form is incomplete.
 */
function encodePermit2InvalidateNoncesCalldata(
  token: Hex,
  spender: Hex,
  newNonce: string,
): Hex {
  if (!isAddress(token) || !isAddress(spender)) {
    return EMPTY_HEX;
  }

  return encodeFunctionData({
    abi: PERMIT2_ABI,
    functionName: 'invalidateNonces',
    args: [token, spender, parseBigIntInput(newNonce)],
  });
}

export const RedemptionForm = ({
  delegateAddress,
  onChange,
  permissionResponse,
}: RedemptionFormProps) => {
  const { permission, rules } = permissionResponse;
  const payeeAddresses = useMemo(
    () => getRuleAddresses(rules, 'payee'),
    [rules],
  );
  const [recipientAddress, setRecipientAddress] = useState<Hex>(
    payeeAddresses[0] ?? EMPTY_HEX,
  );
  const [spenderAddress, setSpenderAddress] = useState<Hex>(
    delegateAddress ?? EMPTY_HEX,
  );
  const [tokenAddress, setTokenAddress] = useState<Hex>(
    permission.data?.tokenAddress ?? EMPTY_HEX,
  );
  const [amount, setAmount] = useState(getDefaultAmount(permission));
  const [revocationMethod, setRevocationMethod] =
    useState<TokenApprovalRevocationMethod>('erc20Approve');
  const [tokenId, setTokenId] = useState('0');
  const [newNonce, setNewNonce] = useState('1');

  const enabledRevocationMethods = useMemo(() => {
    const methods = TOKEN_APPROVAL_REVOCATION_METHODS.filter(
      ({ key }) => permission.data?.[key] === true,
    );

    return methods.length > 0 ? methods : TOKEN_APPROVAL_REVOCATION_METHODS;
  }, [permission.data]);

  useEffect(() => {
    setRecipientAddress(payeeAddresses[0] ?? EMPTY_HEX);
    setSpenderAddress(delegateAddress ?? EMPTY_HEX);
    setTokenAddress(permission.data?.tokenAddress ?? EMPTY_HEX);
    setAmount(getDefaultAmount(permission));
  }, [delegateAddress, payeeAddresses, permission]);

  useEffect(() => {
    if (!enabledRevocationMethods.some(({ key }) => key === revocationMethod)) {
      setRevocationMethod(enabledRevocationMethods[0]?.key ?? 'erc20Approve');
    }
  }, [enabledRevocationMethods, revocationMethod]);

  const value = parseBigIntInput(amount);
  const isErc20Transfer =
    permission.type === 'erc20-token-stream' ||
    permission.type === 'erc20-token-periodic';
  const isNativeTransfer =
    permission.type === 'native-token-stream' ||
    permission.type === 'native-token-periodic';
  const isTokenApprovalRevocation =
    permission.type === 'token-approval-revocation';

  let generatedCalldata: Hex = EMPTY_HEX;
  let targetAddress = tokenAddress;
  if (isErc20Transfer) {
    generatedCalldata = encodeTransferCalldata(recipientAddress, value);
  } else if (isTokenApprovalRevocation) {
    if (revocationMethod === 'erc20Approve') {
      generatedCalldata = encodeApproveCalldata(spenderAddress);
    } else if (revocationMethod === 'erc721Approve') {
      generatedCalldata = encodeErc721ApproveCalldata(tokenId);
    } else if (revocationMethod === 'erc721SetApprovalForAll') {
      generatedCalldata = encodeSetApprovalForAllCalldata(spenderAddress);
    } else if (revocationMethod === 'permit2Approve') {
      targetAddress = PERMIT2_ADDRESS;
      generatedCalldata = encodePermit2ApproveCalldata(
        tokenAddress,
        spenderAddress,
      );
    } else if (revocationMethod === 'permit2Lockdown') {
      targetAddress = PERMIT2_ADDRESS;
      generatedCalldata = encodePermit2LockdownCalldata(
        tokenAddress,
        spenderAddress,
      );
    } else if (revocationMethod === 'permit2InvalidateNonces') {
      targetAddress = PERMIT2_ADDRESS;
      generatedCalldata = encodePermit2InvalidateNoncesCalldata(
        tokenAddress,
        spenderAddress,
        newNonce,
      );
    }
  }

  useEffect(() => {
    if (isNativeTransfer) {
      onChange({
        to: recipientAddress,
        data: EMPTY_HEX,
        value,
      });
      return;
    }

    onChange({
      to: targetAddress,
      data: generatedCalldata,
      value: 0n,
    });
  }, [
    generatedCalldata,
    isNativeTransfer,
    onChange,
    recipientAddress,
    targetAddress,
    tokenAddress,
    value,
  ]);

  const handleRecipientChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setRecipientAddress(inputValue as Hex);
  };

  const handleSpenderChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setSpenderAddress(inputValue as Hex);
  };

  const handleTokenAddressChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setTokenAddress(inputValue as Hex);
  };

  const handleAmountChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(inputValue);
  };

  const handleRevocationMethodChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLSelectElement>) => {
    setRevocationMethod(inputValue as TokenApprovalRevocationMethod);
  };

  const handleTokenIdChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setTokenId(inputValue);
  };

  const handleNewNonceChange = ({
    target: { value: inputValue },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setNewNonce(inputValue);
  };

  if (isTokenApprovalRevocation) {
    return (
      <>
        <div>
          <label htmlFor="redeemRevocationMethod">Revocation method:</label>
          <select
            id="redeemRevocationMethod"
            name="redeemRevocationMethod"
            value={revocationMethod}
            onChange={handleRevocationMethodChange}
          >
            {enabledRevocationMethods.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="redeemTokenAddress">Token:</label>
          <input
            type="text"
            id="redeemTokenAddress"
            name="redeemTokenAddress"
            value={tokenAddress}
            onChange={handleTokenAddressChange}
            placeholder="0x..."
          />
        </div>
        {revocationMethod !== 'erc721Approve' && (
          <div>
            <label htmlFor="redeemSpenderAddress">Spender/operator:</label>
            <input
              type="text"
              id="redeemSpenderAddress"
              name="redeemSpenderAddress"
              value={spenderAddress}
              onChange={handleSpenderChange}
              placeholder="0x..."
            />
          </div>
        )}
        {revocationMethod === 'erc721Approve' && (
          <div>
            <label htmlFor="redeemTokenId">Token ID:</label>
            <input
              type="text"
              id="redeemTokenId"
              name="redeemTokenId"
              value={tokenId}
              onChange={handleTokenIdChange}
            />
          </div>
        )}
        {revocationMethod === 'permit2InvalidateNonces' && (
          <div>
            <label htmlFor="redeemNewNonce">New nonce:</label>
            <input
              type="text"
              id="redeemNewNonce"
              name="redeemNewNonce"
              value={newNonce}
              onChange={handleNewNonceChange}
            />
          </div>
        )}
        <div>
          <label htmlFor="redeemTarget">Target:</label>
          <input
            type="text"
            id="redeemTarget"
            name="redeemTarget"
            value={targetAddress}
            readOnly
          />
        </div>
        <div>
          <label htmlFor="redeemData">Calldata:</label>
          <textarea
            id="redeemData"
            name="redeemData"
            rows={3}
            value={generatedCalldata}
            readOnly
          />
        </div>
      </>
    );
  }

  return (
    <>
      {isErc20Transfer && (
        <div>
          <label htmlFor="redeemTokenAddress">Token:</label>
          <input
            type="text"
            id="redeemTokenAddress"
            name="redeemTokenAddress"
            value={tokenAddress}
            onChange={handleTokenAddressChange}
            placeholder="0x..."
          />
        </div>
      )}
      <div>
        <label htmlFor="redeemRecipientAddress">
          {isErc20Transfer ? 'Payee:' : 'Recipient:'}
        </label>
        <input
          type="text"
          id="redeemRecipientAddress"
          name="redeemRecipientAddress"
          value={recipientAddress}
          onChange={handleRecipientChange}
          placeholder="0x..."
        />
      </div>
      <div>
        <label htmlFor="redeemAmount">
          {isNativeTransfer ? 'Value:' : 'Amount:'}
        </label>
        <input
          type="text"
          id="redeemAmount"
          name="redeemAmount"
          value={amount}
          onChange={handleAmountChange}
        />
      </div>
      <div>
        <label htmlFor="redeemData">Calldata:</label>
        <textarea
          id="redeemData"
          name="redeemData"
          rows={3}
          value={generatedCalldata}
          readOnly
        />
      </div>
    </>
  );
};
