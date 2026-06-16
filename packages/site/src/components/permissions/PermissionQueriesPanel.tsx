import { Box, CopyButton, ResponseContainer } from '../../styles';
import { stringifyWithBigInt } from '../../utils';
import { CustomMessageButton } from '../Buttons';
import { Title } from '../Card';

type PermissionQueriesPanelProps = {
  grantedIsCopied: boolean;
  grantedPermissionsResponse: unknown;
  onCopyGrantedPermissions: () => void;
  onCopySupportedPermissions: () => void;
  onGetGrantedPermissions: () => void;
  onGetSupportedPermissions: () => void;
  supportedIsCopied: boolean;
  supportedPermissionsResponse: unknown;
};

const permissionQueryActionsStyle = {
  display: 'flex',
  gap: '1rem',
  marginTop: '1rem',
  marginBottom: '1rem',
};

export const PermissionQueriesPanel = ({
  grantedIsCopied,
  grantedPermissionsResponse,
  onCopyGrantedPermissions,
  onCopySupportedPermissions,
  onGetGrantedPermissions,
  onGetSupportedPermissions,
  supportedIsCopied,
  supportedPermissionsResponse,
}: PermissionQueriesPanelProps) => {
  const hasSupportedPermissionsResponse = Boolean(supportedPermissionsResponse);
  const hasGrantedPermissionsResponse = Boolean(grantedPermissionsResponse);

  return (
    <Box>
      <Title>Permission Queries</Title>
      <div style={permissionQueryActionsStyle}>
        <CustomMessageButton
          $text="Get Supported Permissions"
          onClick={onGetSupportedPermissions}
        />
        <CustomMessageButton
          $text="Get Granted Permissions"
          onClick={onGetGrantedPermissions}
        />
      </div>
      {hasSupportedPermissionsResponse && (
        <ResponseContainer>
          <Title>Supported Permissions</Title>
          <CopyButton
            onClick={onCopySupportedPermissions}
            title={'Copy to clipboard'}
          >
            {supportedIsCopied ? '✅' : '📝'}
          </CopyButton>
          <pre>{stringifyWithBigInt(supportedPermissionsResponse)}</pre>
        </ResponseContainer>
      )}
      {hasGrantedPermissionsResponse && (
        <ResponseContainer style={{ marginTop: '1rem' }}>
          <Title>Granted Permissions</Title>
          <CopyButton
            onClick={onCopyGrantedPermissions}
            title={'Copy to clipboard'}
          >
            {grantedIsCopied ? '✅' : '📝'}
          </CopyButton>
          <pre>{stringifyWithBigInt(grantedPermissionsResponse)}</pre>
        </ResponseContainer>
      )}
    </Box>
  );
};
