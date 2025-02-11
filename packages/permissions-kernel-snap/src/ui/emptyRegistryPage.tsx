import { Box, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';

import { Header } from './components';

export const EmptyRegistryPage = () => {
  return (
    <Box>
      <Header
        title="Permission Request"
        subtitle="Permissions offer registry is empty."
      />
      <Section>
        <Heading>Missing snap install</Heading>
        <Text>
          Please install a permission provider snap to register offers.
        </Text>
      </Section>
    </Box>
  );
};
