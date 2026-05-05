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

  useEffect(() => {
    setRecipientAddress(payeeAddresses[0] ?? EMPTY_HEX);
    setSpenderAddress(delegateAddress ?? EMPTY_HEX);
    setTokenAddress(permission.data?.tokenAddress ?? EMPTY_HEX);
    setAmount(getDefaultAmount(permission));
  }, [delegateAddress, payeeAddresses, permission]);

  const value = parseBigIntInput(amount);
  const isErc20Transfer =
    permission.type === 'erc20-token-stream' ||
    permission.type === 'erc20-token-periodic';
  const isNativeTransfer =
    permission.type === 'native-token-stream' ||
    permission.type === 'native-token-periodic';
  const isErc20Revocation = permission.type === 'erc20-token-revocation';

  let generatedCalldata: Hex = EMPTY_HEX;
  if (isErc20Transfer) {
    generatedCalldata = encodeTransferCalldata(recipientAddress, value);
  } else if (isErc20Revocation) {
    generatedCalldata = encodeApproveCalldata(spenderAddress);
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
      to: tokenAddress,
      data: generatedCalldata,
      value: 0n,
    });
  }, [
    generatedCalldata,
    isNativeTransfer,
    onChange,
    recipientAddress,
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

  if (isErc20Revocation) {
    return (
      <>
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
        <div>
          <label htmlFor="redeemSpenderAddress">Spender:</label>
          <input
            type="text"
            id="redeemSpenderAddress"
            name="redeemSpenderAddress"
            value={spenderAddress}
            onChange={handleSpenderChange}
            placeholder="0x..."
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
