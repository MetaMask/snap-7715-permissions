import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Icon, Button } from '@metamask/snaps-sdk/jsx';

import type { State } from '../../types';

type RulesSelectorProps = {
  addMoreButtonEventName: string;
  ruleStateKeys: string[];
  state: State<'native-token-stream'>;
};

/**
 * Renders the rules selector component to add more rules.
 *
 * @param props - The rules selector props.
 * @param props.addMoreButtonEventName - The event name for the add more button.
 * @param props.ruleStateKeys - The keys of the rules in the state.
 * @param props.state - The state of the native token stream.
 * @returns The JSX element to render.
 */
export const AddMoreRule: SnapComponent<RulesSelectorProps> = ({
  addMoreButtonEventName,
  ruleStateKeys,
  state,
}) => {
  // If all of the rule felids are set then do not show the add more button
  const filterState: Record<string, any> = {};
  Object.entries(state).forEach(([key, value]) => {
    if (ruleStateKeys.includes(key)) {
      filterState[key] = value;
    }
  });

  const isShowAddMorRuleButtonDisabled = Object.values(filterState).every(
    (value) => value !== null,
  );

  return (
    <Box>
      {!isShowAddMorRuleButtonDisabled && (
        <Box direction="horizontal" center={true} alignment="center">
          <Icon name="add" size="inherit" color="primary" />
          <Button name={addMoreButtonEventName}>Add more rules</Button>
        </Box>
      )}
    </Box>
  );
};
