import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Button, Container, Footer } from '@metamask/snaps-sdk/jsx';

import { CANCEL_BUTTON, GRANT_BUTTON } from '../user-input.contant';

export const ConfirmationFooter: SnapComponent = () => {
  return (
    <Container>
      <Footer>
        <Button name={CANCEL_BUTTON} variant="destructive">
          Cancel
        </Button>
        <Button name={GRANT_BUTTON} variant="primary">
          Grant
        </Button>
      </Footer>
    </Container>
  );
};
