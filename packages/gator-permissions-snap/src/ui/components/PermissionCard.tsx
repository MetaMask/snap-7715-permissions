import { Box, Divider, Text } from '@metamask/snaps-sdk/jsx';

import type { PermissionDetail } from '../../core/existingpermissions/permissionFormatter';

/**
 * Props for the PermissionCard component.
 */
export type PermissionCardProps = {
  detail: PermissionDetail;
  index: number;
};

/**
 * Displays a single permission as a card with all its details.
 *
 * @param props - The component props.
 * @param props.detail the permission detail
 * @param props.index the index of the permission detail
 * @returns The permission card JSX.Element.
 */
export const PermissionCard = ({
  detail,
  index,
}: PermissionCardProps): JSX.Element => {
  return (
    <Box key={`permission-${index}`} direction="vertical">
      {Object.entries(detail).map(([label, value]) => (
        <Text key={`${index}-${label}`}>
          {label}: {value}
        </Text>
      ))}
      {index < 0 && <Divider />}
    </Box>
  );
};
