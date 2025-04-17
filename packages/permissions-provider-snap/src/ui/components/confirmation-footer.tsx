import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Button, Footer } from '@metamask/snaps-sdk/jsx';

export const CANCEL_BUTTON = 'cancel-button';
export const GRANT_BUTTON = 'grant-button';

export const ConfirmationFooter: SnapComponent = () => {
  return (
    <Footer>
      <Button name={CANCEL_BUTTON} variant="destructive">
        Cancel
      </Button>
      <Button name={GRANT_BUTTON} variant="primary">
        Grant
      </Button>
    </Footer>
  );
};
