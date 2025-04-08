import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Button,
  Field,
  Form,
  Text,
  Section,
  Icon,
  Option,
  Bold,
  Dropdown,
} from '@metamask/snaps-sdk/jsx';

import type { State } from '../../types';

export type RulesSelectorProps = {
  closeRuleSelectorButtonEventName: string;
  saveRuleButtonEventName: string;
  selectedRuleDropdownEventName: string;
  state: State<'native-token-stream'>;
  ruleMeta: RuleMeta[];
};

export type RuleMeta = {
  stateKey: string;
  name: string;
};

/**
 * Renders the rules selector component to add more rules.
 *
 * @param props - The rules selector props.
 * @param props.closeRuleSelectorButtonEventName - The event name for the close button.
 * @param props.saveRuleButtonEventName - The event name for the save button.
 * @param props.selectedRuleDropdownEventName - The event name for the selected rule dropdown.
 * @param props.state - The state of the native token stream.
 * @param props.ruleMeta - The metadata for the rules.
 * @returns The JSX element to render.
 */
export const RulesSelector: SnapComponent<RulesSelectorProps> = ({
  closeRuleSelectorButtonEventName,
  saveRuleButtonEventName,
  selectedRuleDropdownEventName,
  ruleMeta,
  state,
}) => {
  const dropDownValue = state[selectedRuleDropdownEventName] as string;
  const dropdownOptions = ruleMeta.map((rule) => (
    <Option value={rule.stateKey}>{rule.name}</Option>
  ));

  const isSaveButtonDisabled = dropDownValue === '';

  return (
    <Box>
      <Section>
        <Box direction="horizontal" alignment="space-between">
          <Text>{''}</Text>
          <Box direction="horizontal" alignment="center">
            <Text>
              <Bold>Add more rules</Bold>
            </Text>
          </Box>
          <Box direction="horizontal" alignment="end">
            <Button name={closeRuleSelectorButtonEventName}>
              <Icon name="close" size="inherit" color="primary" />
            </Button>
          </Box>
        </Box>
        <Text>Create additional rules that this token stream must follow.</Text>

        <Form name="form-to-fill">
          <Field>
            <Dropdown
              name={selectedRuleDropdownEventName}
              value={dropDownValue}
            >
              {dropdownOptions}
            </Dropdown>
          </Field>
          <Button
            name={saveRuleButtonEventName}
            disabled={isSaveButtonDisabled}
            type="submit"
          >
            Save
          </Button>
        </Form>
      </Section>
    </Box>
  );
};
