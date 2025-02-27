import type { Permission } from '@metamask/7715-permissions-shared/types';
import type { JSXElement } from '@metamask/snaps-sdk/jsx';
import { Text, Section, Box, Icon, Tooltip } from '@metamask/snaps-sdk/jsx';

type SpendingCapDetails = {
  permission: Permission;
};

export const SpendingCapDetails: (params: SpendingCapDetails) => JSXElement = ({
  permission: _,
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
