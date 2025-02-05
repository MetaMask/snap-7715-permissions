import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Heading, Text } from '@metamask/snaps-sdk/jsx';

type HeaderProps = {
  title: string;
  subtitle: string;
};

export const Header: SnapComponent<HeaderProps> = ({ title, subtitle }) => {
  return (
    <Box center={true}>
      <Heading size="lg">{title}</Heading>
      <Text alignment="center">{subtitle}</Text>
    </Box>
  );
};
