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

import {
  convertReadableDateToTimestampToday,
  convertValueToHex,
  isHumanReadableInCorrectFormat,
} from '../../../utils';
import type { RuleValidationTypes } from './Rules';
import { filterNotActiveRuleMeta, type RuleMeta } from './Rules';

export enum RulesSelectorElementNames {
  AddMoreRulesPageToggle = 'add-more-rules-page-toggle',
}

export type RulesSelectorProps = JsonObject & {
  selectedRuleDropdownEventName: string;
  selectedRuleInputEventName: string;
  addMoreRulesFormSubmitEventName: string;
  activeRuleStateKeys: string[];
  selectedDropDownValue: string;
  selectedInputValue: string;
  ruleMeta: RuleMeta<RuleValidationTypes>[];
};

/**
 * Validates the input value against the rule meta.
 * @param inputValue - The input value to validate.
 * @param ruleMeta - The rule meta to validate against.
 * @returns The validation error if the value is invalid, otherwise undefined.
 */
const validator = (
  inputValue: string,
  ruleMeta: RuleMeta<RuleValidationTypes>,
): string | undefined => {
  const { ruleValidator } = ruleMeta;
  const { validationType } = ruleValidator;
  if (inputValue === '') {
    return ruleValidator.emptyInputValidationError;
  }

  switch (validationType) {
    case 'value':
      if (
        BigInt(convertValueToHex(inputValue)) >
        BigInt(ruleValidator.compareValue)
      ) {
        return ruleValidator.inputConstraintValidationError;
      }
      break;
    case 'timestamp':
      if (!isHumanReadableInCorrectFormat(inputValue)) {
        return ruleValidator.emptyInputValidationError;
      }

      if (
        !(
          BigInt(convertReadableDateToTimestampToday(inputValue)) >=
          BigInt(ruleValidator.compareValue)
        )
      ) {
        return ruleValidator.inputConstraintValidationError;
      }
      break;
    default:
      throw new Error('Invalid validation type');
  }

  return undefined;
};

/**
 * Renders the rules selector component to add more rules.
 *
 * @param props - The rules selector props.
 * @param props.selectedRuleDropdownEventName - The event name for the selected rule dropdown.
 * @param props.selectedRuleInputEventName - The event name for the selected rule input.
 * @param props.addMoreRulesFormSubmitEventName - The event name for the add more rules form submit.
 * @param props.activeRuleStateKeys - The keys of the rules in the state.
 * @param props.selectedDropDownValue - The value of the selected dropdown.
 * @param props.selectedInputValue - The value of the selected input.
 * @param props.ruleMeta - The metadata for the rules.
 * @returns The JSX element to render.
 */
export const RulesSelector: SnapComponent<RulesSelectorProps> = ({
  selectedRuleDropdownEventName,
  selectedRuleInputEventName,
  addMoreRulesFormSubmitEventName,
  selectedDropDownValue,
  selectedInputValue,
  activeRuleStateKeys,
  ruleMeta,
}) => {
  const filteredRuleMeta = filterNotActiveRuleMeta(
    ruleMeta,
    activeRuleStateKeys,
  );

  // Get the value of the dropdown and input field
  let dropDownValue = selectedDropDownValue;
  if (!selectedDropDownValue) {
    dropDownValue = filteredRuleMeta[0]?.stateKey as string;
  }

  // Show any error for the input field
  let inputErrorMessage: string | undefined;
  const foundRuleMeta = filteredRuleMeta.find(
    (rule) => rule.stateKey === dropDownValue,
  );
  if (foundRuleMeta) {
    inputErrorMessage = validator(selectedInputValue, foundRuleMeta);
  }

  // Set the disabled state for the input field and save button
  const isInputDisabled = dropDownValue === '';
  const isSaveButtonDisabled =
    dropDownValue === '' ||
    selectedInputValue === '' ||
    inputErrorMessage !== undefined;

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
            <Button name={RulesSelectorElementNames.AddMoreRulesPageToggle}>
              <Icon name="close" size="inherit" color="primary" />
            </Button>
          </Box>
        </Box>
        <Text>Create additional rules that this token stream must follow.</Text>

        <Form name={addMoreRulesFormSubmitEventName}>
          <Field>
            <Dropdown name={selectedRuleDropdownEventName}>
              {filteredRuleMeta.map((rule) => (
                <Option value={rule.stateKey}>{rule.name}</Option>
              ))}
            </Dropdown>
          </Field>
          <Field error={inputErrorMessage}>
            <Input
              name={selectedRuleInputEventName}
              value={selectedInputValue}
              disabled={isInputDisabled}
              type={'text'}
              placeholder={foundRuleMeta?.placeholder}
            />
          </Field>
          <Button
            disabled={isSaveButtonDisabled}
            name={RulesSelectorElementNames.AddMoreRulesPageToggle}
            type="submit"
          >
            Save
          </Button>
        </Form>
      </Section>
    </Box>
  );
};
