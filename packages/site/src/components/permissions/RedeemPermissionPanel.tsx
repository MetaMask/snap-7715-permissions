import type { ComponentProps } from 'react';
import type { Hex } from 'viem';
import type { UserOperationReceipt } from 'viem/account-abstraction';

import { Box, ResponseContainer, StyledForm } from '../../styles';
import { stringifyWithBigInt } from '../../utils';
import { CustomMessageButton } from '../Buttons';
import { Title } from '../Card';
import { RedemptionForm } from './RedemptionForm';

type RedemptionFormProps = ComponentProps<typeof RedemptionForm>;

type RedeemPermissionPanelProps = {
  delegateAddress: Hex | undefined;
  isPending: boolean;
  onRedeemPermission: () => void;
  onRedemptionCallChange: RedemptionFormProps['onChange'];
  permissionResponse: RedemptionFormProps['permissionResponse'];
  receipt: UserOperationReceipt | null;
  to: Hex;
  value: bigint;
};

export const RedeemPermissionPanel = ({
  delegateAddress,
  isPending,
  onRedeemPermission,
  onRedemptionCallChange,
  permissionResponse,
  receipt,
  to,
  value,
}: RedeemPermissionPanelProps) => (
  <Box>
    {receipt && (
      <div style={{ marginTop: '1rem' }}>
        <ResponseContainer>
          <Title>User operation receipt</Title>
          <pre>{stringifyWithBigInt(receipt)}</pre>
        </ResponseContainer>
      </div>
    )}
    <StyledForm>
      <Title>Redeem Permission</Title>
      <RedemptionForm
        delegateAddress={delegateAddress}
        permissionResponse={permissionResponse}
        onChange={onRedemptionCallChange}
      />
      <div>
        <label>From:</label>
        <div>{delegateAddress}</div>
      </div>
      <div>
        <label>To:</label>
        <div>{to}</div>
      </div>
      <div>
        <label>Value:</label>
        <div>{value.toString()}</div>
      </div>
    </StyledForm>
    <CustomMessageButton
      $text="Redeem Permission"
      onClick={onRedeemPermission}
      disabled={isPending}
    />
  </Box>
);
