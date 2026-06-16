import { Box, CopyButton, ResponseContainer } from '../../styles';
import { stringifyWithBigInt } from '../../utils';
import { Title } from '../Card';

type PermissionResponsePanelProps = {
  decodedIsCopied: boolean;
  decodedPermissionContext: unknown;
  isCopied: boolean;
  onCopyDecodedPermissionContext: () => void;
  onCopyPermissionResponse: () => void;
  permissionResponse: unknown;
};

export const PermissionResponsePanel = ({
  decodedIsCopied,
  decodedPermissionContext,
  isCopied,
  onCopyDecodedPermissionContext,
  onCopyPermissionResponse,
  permissionResponse,
}: PermissionResponsePanelProps) => {
  const hasDecodedPermissionContext = Boolean(decodedPermissionContext);

  return (
    <Box style={{ position: 'relative' }}>
      <ResponseContainer>
        <Title>Permission Response</Title>
        <CopyButton
          onClick={onCopyPermissionResponse}
          title={'Copy to clipboard'}
        >
          {isCopied ? '✅' : '📝'}
        </CopyButton>
        <pre>{stringifyWithBigInt(permissionResponse)}</pre>
        {hasDecodedPermissionContext && (
          <details style={{ marginTop: '1rem' }}>
            <summary>Decoded Permission Context</summary>
            <CopyButton
              onClick={onCopyDecodedPermissionContext}
              title={'Copy to clipboard'}
              style={{ position: 'relative', float: 'right' }}
            >
              {decodedIsCopied ? '✅' : '📝'}
            </CopyButton>
            <pre>{stringifyWithBigInt(decodedPermissionContext)}</pre>
          </details>
        )}
      </ResponseContainer>
    </Box>
  );
};
