import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Icon, Button } from '@metamask/snaps-sdk/jsx';

import type {
  PermissionSpecificRulesMapping,
  SupportedPermissionTypes,
} from '../../../orchestrators';

export enum RulesSelectorsEventNames {
  AddMoreRules = 'rules-selector:add-more-rules',
}

type RulesSelectorProps<TPermissionType extends SupportedPermissionTypes> = {
  permissionSpecificRules: PermissionSpecificRulesMapping[TPermissionType];
};

/**
 * Renders the rules selector component to add more rules.
 *
 * @param props - The rules selector props.
 * @param props.permissionSpecificRules - The permission rules.
 * @returns The JSX element to render.
 */
export const RulesSelector: SnapComponent<
  RulesSelectorProps<SupportedPermissionTypes>
> = ({ permissionSpecificRules }) => {
  console.log('permissionSpecificRules', permissionSpecificRules);

  return (
    <Box direction="horizontal" center={true} alignment="center">
      <Icon name="add" size="inherit" color="primary" />
      <Button name={RulesSelectorsEventNames.AddMoreRules}>
        Add more rules
      </Button>
    </Box>
  );
};
