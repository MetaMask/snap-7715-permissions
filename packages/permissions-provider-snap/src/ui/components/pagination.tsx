import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Button } from '@metamask/snaps-sdk/jsx';

import { NEXT_BUTTON, PREVIOUS_BUTTON } from '../userInputConstant';

type PaginationProps = {
  isFirst: boolean;
  isLast: boolean;
};

export const Pagination: SnapComponent<PaginationProps> = ({
  isFirst,
  isLast,
}) => {
  return (
    <Box alignment="start" direction="horizontal">
      <Button name={PREVIOUS_BUTTON} disabled={isFirst}>
        Previous
      </Button>
      <Button name={NEXT_BUTTON} disabled={isLast}>
        Next
      </Button>
    </Box>
  );
};
