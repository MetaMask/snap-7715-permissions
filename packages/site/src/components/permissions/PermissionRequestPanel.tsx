import type { ChangeEvent } from 'react';
import type { Chain } from 'viem';

import { ERC20TokenAllowanceForm } from './ERC20TokenAllowanceForm';
import { ERC20TokenPeriodicForm } from './ERC20TokenPeriodicForm';
import { ERC20TokenStreamForm } from './ERC20TokenStreamForm';
import { NativeTokenAllowanceForm } from './NativeTokenAllowanceForm';
import { NativeTokenPeriodicForm } from './NativeTokenPeriodicForm';
import { NativeTokenStreamForm } from './NativeTokenStreamForm';
import { TokenApprovalRevocationForm } from './TokenApprovalRevocationForm';
import type { PermissionRequest } from './types';
import { Box, StyledForm } from '../../styles';
import { CustomMessageButton } from '../Buttons';

type PermissionRequestPanelProps = {
  onChainChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onFormChange: (request: PermissionRequest) => void;
  onGrantPermissions: () => void;
  onPermissionTypeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  permissionType: PermissionRequest['type'];
  selectedChain: Chain;
  supportedChains: Chain[];
};

const selectStyle = {
  padding: '0.8rem',
  border: '1px solid',
  borderRadius: '0.3rem',
  flexGrow: 1,
};

const renderPermissionForm = (
  permissionType: PermissionRequest['type'],
  onFormChange: (request: PermissionRequest) => void,
) => {
  switch (permissionType) {
    case 'native-token-stream':
      return <NativeTokenStreamForm onChange={onFormChange} />;
    case 'erc20-token-stream':
      return <ERC20TokenStreamForm onChange={onFormChange} />;
    case 'native-token-periodic':
      return <NativeTokenPeriodicForm onChange={onFormChange} />;
    case 'erc20-token-periodic':
      return <ERC20TokenPeriodicForm onChange={onFormChange} />;
    case 'native-token-allowance':
      return <NativeTokenAllowanceForm onChange={onFormChange} />;
    case 'erc20-token-allowance':
      return <ERC20TokenAllowanceForm onChange={onFormChange} />;
    case 'token-approval-revocation':
      return <TokenApprovalRevocationForm onChange={onFormChange} />;
    default:
      return null;
  }
};

export const PermissionRequestPanel = ({
  onChainChange,
  onFormChange,
  onGrantPermissions,
  onPermissionTypeChange,
  permissionType,
  selectedChain,
  supportedChains,
}: PermissionRequestPanelProps) => (
  <Box>
    <StyledForm>
      <div>
        <label htmlFor="chainSelector">Chain:</label>
        <select
          id="chainSelector"
          name="chainSelector"
          value={selectedChain.id}
          onChange={onChainChange}
          style={selectStyle}
        >
          {supportedChains.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="permissionType">Permission Type:</label>
        <select
          id="permissionType"
          name="permissionType"
          value={permissionType}
          onChange={onPermissionTypeChange}
          style={selectStyle}
        >
          <option value="native-token-stream">Native Token Stream</option>
          <option value="erc20-token-stream">ERC20 Token Stream</option>
          <option value="native-token-periodic">Native Token Periodic</option>
          <option value="native-token-allowance">Native Token Allowance</option>
          <option value="erc20-token-periodic">ERC20 Token Periodic</option>
          <option value="erc20-token-allowance">ERC20 Token Allowance</option>
          <option value="token-approval-revocation">
            Token Approval Revocation
          </option>
        </select>
      </div>

      {renderPermissionForm(permissionType, onFormChange)}
    </StyledForm>
    <CustomMessageButton
      $text="Grant Permission"
      onClick={onGrantPermissions}
    />
  </Box>
);
