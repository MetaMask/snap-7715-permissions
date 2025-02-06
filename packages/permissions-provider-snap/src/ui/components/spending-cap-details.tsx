import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Text, Section, Box, Icon, Tooltip } from '@metamask/snaps-sdk/jsx';

import type { Permission } from '../../../../shared/src/types';

type SpendingCapDetails = {
  permission: Permission;
};

export const SpendingCapDetails: SnapComponent<SpendingCapDetails> = ({
  _,
}) => {
  return (
    <Section>
      <Box direction="horizontal" alignment="space-between">
        <Box direction="horizontal">
          <Text>Spending cap</Text>
          <Tooltip content={<Text>Tooltip text</Text>}>
            <Icon name="question" size="inherit" color="muted" />
          </Tooltip>
        </Box>

        <Box direction="horizontal">
          <Text>USDC 10</Text>
          <Icon name="edit" size="inherit" color="primary" />
        </Box>
      </Box>

      <Box direction="horizontal" center={true} alignment="center">
        <Icon name="add" size="inherit" color="primary" />
        <Text alignment="center">Add more rules</Text>
      </Box>
    </Section>
  );
};
