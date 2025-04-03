import type { ComponentOrElement } from '@metamask/snaps-sdk';
import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { Container } from '@metamask/snaps-sdk/jsx';

import { ConfirmationFooter } from '../components';

/**
 * Builds an interactive confirmation dialog for the user to confirm or cancel a permission request.
 *
 * @param dialogContent - The permission confirmation dialog to render.
 * @returns The interactive confirmation page.
 */
export const buildConfirmationDialog = (
  dialogContent: ComponentOrElement,
): JSX.Element => (
  <Container>
    {dialogContent as GenericSnapElement}
    <ConfirmationFooter />
  </Container>
);
