import type { JsonObject, SnapComponent } from '@metamask/snaps-sdk/jsx';
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
  Input,
} from '@metamask/snaps-sdk/jsx';

import type { State } from '../../types';

export type RulesSelectorProps = JsonObject & {
  closeRuleSelectorButtonEventName: string;
  selectedRuleDropdownEventName: string;
  selectedRuleInputEventName: string;
  addMoreRulesFormSubmitEventName: string;
  ruleStateKeys: string[];
  state: State<'native-token-stream'>;
  ruleMeta: RuleMeta[];
};

export type RuleMeta = {
  stateKey: string;
  name: string;
  inputType: 'number' | 'text';
  placeholder: string;
  validation: {
    validationError: string;
  };
};

/**
 * Validates the value against the rule meta.
 * @param value - The value to validate.
 * @param ruleMeta - The rule meta to validate against.
 * @returns The validation error if the value is invalid, otherwise undefined.
 */
const valueValidator = (value: string, ruleMeta: RuleMeta) => {
  if (value === '') {
    return ruleMeta.validation.validationError;
  }
  return undefined;
};

/**
 * Renders the rules selector component to add more rules.
 *
 * @param props - The rules selector props.
 * @param props.closeRuleSelectorButtonEventName - The event name for the close button.
 * @param props.selectedRuleDropdownEventName - The event name for the selected rule dropdown.
 * @param props.selectedRuleInputEventName - The event name for the selected rule input.
 * @param props.addMoreRulesFormSubmitEventName - The event name for the add more rules form submit.
 * @param props.ruleStateKeys - The keys of the rules in the state.
 * @param props.state - The state of the native token stream.
 * @param props.ruleMeta - The metadata for the rules.
 * @returns The JSX element to render.
 */
export const RulesSelector: SnapComponent<RulesSelectorProps> = ({
  closeRuleSelectorButtonEventName,
  selectedRuleDropdownEventName,
  selectedRuleInputEventName,
  addMoreRulesFormSubmitEventName,
  ruleStateKeys,
  ruleMeta,
  state,
}) => {
  // Only allow adding rule for item that have not been added to the state
  const filterState: Record<string, any> = {};
  Object.entries(state).forEach(([key, value]) => {
    if (ruleStateKeys.includes(key)) {
      filterState[key] = value;
    }
  });
  const filteredRuleMeta = ruleMeta.filter(
    (rule) => filterState[rule.stateKey] === null,
  );

  const dropdownOptions = filteredRuleMeta.map((rule) => (
    <Option value={rule.stateKey}>{rule.name}</Option>
  ));

  // Get the value of the dropdown and input field
  let dropDownValue = '';
  if (state[selectedRuleDropdownEventName]) {
    dropDownValue = state[selectedRuleDropdownEventName] as string;
  } else {
    dropDownValue = filteredRuleMeta[0]?.stateKey as string;
  }
  const inputValue = state[selectedRuleInputEventName] as string;
  const isSaveButtonDisabled = dropDownValue === '' || inputValue === '';
  const isInputDisabled = dropDownValue === '';

  // Show any error for the input field
  let inputErrorMessage: string | undefined;
  const foundRuleMeta = filteredRuleMeta.find(
    (rule) => rule.stateKey === dropDownValue,
  );
  if (foundRuleMeta) {
    inputErrorMessage = valueValidator(inputValue, foundRuleMeta);
  }

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

        <Form name={addMoreRulesFormSubmitEventName}>
          <Field>
            <Dropdown name={selectedRuleDropdownEventName}>
              {dropdownOptions}
            </Dropdown>
          </Field>
          <Field error={inputErrorMessage}>
            <Input
              name={selectedRuleInputEventName}
              value={inputValue}
              disabled={isInputDisabled}
              type={foundRuleMeta?.inputType ?? 'text'}
              placeholder={foundRuleMeta?.placeholder}
            />
          </Field>
          <Button
            disabled={isSaveButtonDisabled}
            name={closeRuleSelectorButtonEventName}
            type="submit"
          >
            Save
          </Button>
        </Form>
      </Section>
    </Box>
  );
};
