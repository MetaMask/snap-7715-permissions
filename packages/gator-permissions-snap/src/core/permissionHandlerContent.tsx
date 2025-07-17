import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Button, Heading } from '@metamask/snaps-sdk/jsx';

export const TOGGLE_ADD_MORE_RULES_BUTTON = 'add-more-rules';

export type PermissionHandlerContentProps = {
  showAddMoreRulesButton: boolean;
  children: GenericSnapElement;
  permissionTitle: string;
};

/**
 * Content wrapping a permission confirmation, including the title and add-more-rules button.
 * @param options - The params for the content.
 * @param options.showAddMoreRulesButton - Whether to show the "Add more rules" button.
 * @param options.children - The children of the content.
 * @param options.permissionTitle - The title of the permission.
 * @returns The confirmation content.
 */
export const PermissionHandlerContent = ({
  showAddMoreRulesButton,
  children,
  permissionTitle,
}: PermissionHandlerContentProps): GenericSnapElement => {
  const addRulesButton = showAddMoreRulesButton ? (
    <Button name={TOGGLE_ADD_MORE_RULES_BUTTON}>Add more rules</Button>
  ) : null;

  return (
    <Box>
      <Box direction="vertical">
        <Box center={true}>
          <Heading size="lg">{permissionTitle}</Heading>
        </Box>
        {children}
        {addRulesButton}
      </Box>
    </Box>
  );
};
