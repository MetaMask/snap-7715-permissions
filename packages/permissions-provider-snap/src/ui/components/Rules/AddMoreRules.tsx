import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Icon, Button } from '@metamask/snaps-sdk/jsx';

import type { RuleValidationTypes } from './Rules';
import { filterNotActiveRuleMeta, type RuleMeta } from './Rules';
import { RulesSelectorElementNames } from './RulesSelector';

type RulesSelectorProps = {
  activeRuleStateKeys: string[];
  ruleMeta: RuleMeta<RuleValidationTypes>[];
  isAdjustmentAllowed: boolean;
};

/**
 * Renders the rules selector component to add more rules.
 *
 * @param props - The rules selector props.
 * @param props.activeRuleStateKeys - The keys of the rules in the state.
 * @param props.ruleMeta - The metadata for the rules.
 * @param props.isAdjustmentAllowed - Whether the permission can be adjusted.
 * @returns The JSX element to render.
 */
export const AddMoreRule: SnapComponent<RulesSelectorProps> = ({
  activeRuleStateKeys,
  ruleMeta,
  isAdjustmentAllowed,
}) => {
  const isShowAddMorRuleButtonDisabled =
    filterNotActiveRuleMeta(ruleMeta, activeRuleStateKeys).length === 0 ||
    !isAdjustmentAllowed;

  return (
    <Box>
      {!isShowAddMorRuleButtonDisabled && (
        <Box direction="horizontal" center={true} alignment="center">
          <Icon name="add" size="inherit" color="primary" />
          <Button name={RulesSelectorElementNames.AddMoreRulesPageToggle}>
            Add more rules
          </Button>
        </Box>
      )}
    </Box>
  );
};
