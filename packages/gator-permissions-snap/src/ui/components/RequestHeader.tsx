import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Heading } from '@metamask/snaps-sdk/jsx';

type HeaderProps = {
  title: string;
};

export const RequestHeader: SnapComponent<HeaderProps> = ({ title }) => {
  return (
    <Box center={true}>
      <Heading size="lg">{title}</Heading>
    </Box>
  );
};
