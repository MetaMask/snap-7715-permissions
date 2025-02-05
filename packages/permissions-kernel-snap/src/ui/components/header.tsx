import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Heading, Text } from '@metamask/snaps-sdk/jsx';

type HeaderProps = {
  title: string;
  subtitle: string;
};

export const Header: SnapComponent<HeaderProps> = ({ title, subtitle }) => {
  return (
    <Box>
      <Heading>{title}</Heading>
      <Text>{subtitle}</Text>
    </Box>
  );
};
