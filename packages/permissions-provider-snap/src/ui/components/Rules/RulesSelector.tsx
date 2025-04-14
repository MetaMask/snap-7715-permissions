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
  convertReadableDateToTimestamp,
  convertValueToHex,
  isHumanReadableInCorrectFormat,
} from '../../../utils';
import type { RuleValidationTypes } from './Rules';
import {
  filterNotActiveRuleMeta,
  UNLIMITED_ALLOWANCE_DROP_DOWN_OPTIONS,
  type RuleMeta,
} from './Rules';

export enum RulesSelectorElementNames {
  AddMoreRulesPageToggle = 'add-more-rules-page-toggle',
}

export type RulesSelectorProps = JsonObject & {
  selectedRuleDropdownElementName: string;
  selectedRuleInputElementName: string;
  addMoreRulesFormSubmitElementName: string;
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
export const validator = (
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
          BigInt(convertReadableDateToTimestamp(inputValue)) >=
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
 * Renders the extra dropdown for the unlimited allowance.
 * @param ruleMeta - The rule meta to render the extra dropdown for.
 * @param activeRuleDropDownValue - The value of the active rule drop down.
 * @returns The JSX element to render the extra dropdown if it exists or null if it does not exist.
 */
export const renderUnlimitedAllowanceDropDown = (
  ruleMeta: RuleMeta<RuleValidationTypes>,
  activeRuleDropDownValue: string,
) => {
  if (!ruleMeta.ruleValidator.unlimitedAllowanceDropDown) {
    return null;
  }

  if (activeRuleDropDownValue !== ruleMeta.stateKey) {
    return null;
  }

  const { ruleValidator } = ruleMeta;
  const { unlimitedAllowanceDropDown } = ruleValidator;
  if (!unlimitedAllowanceDropDown) {
    return null;
  }

  const { dropdownKey, dropdownValue } = unlimitedAllowanceDropDown;
  const determinedDropDownValue =
    dropdownValue === ''
      ? (UNLIMITED_ALLOWANCE_DROP_DOWN_OPTIONS[0] as string)
      : dropdownValue;

  // ensure the determinedDropDownValue is the first item in drop down
  // if a determinedDropDownValue was selected and form closed
  // the determinedDropDownValue needs to be the first item in the drop down
  const orderedOptions = [
    determinedDropDownValue,
    ...UNLIMITED_ALLOWANCE_DROP_DOWN_OPTIONS.filter(
      (option) => option !== determinedDropDownValue,
    ),
  ];

  return (
    <Field>
      <Dropdown name={dropdownKey}>
        {orderedOptions.map((option) => (
          <Option value={option}>{option}</Option>
        ))}
      </Dropdown>
    </Field>
  );
};

/**
 * Checks if the input field should be hidden based on the rule meta.
 * @param ruleMeta - The rule meta to check.
 * @returns True if the input field should be hidden, false otherwise.
 */
export const isInputHidden = (ruleMeta: RuleMeta<RuleValidationTypes>) => {
  const { ruleValidator } = ruleMeta;
  if (ruleValidator.unlimitedAllowanceDropDown) {
    const { dropdownValue } = ruleValidator.unlimitedAllowanceDropDown;
    if (dropdownValue === 'Unlimited') {
      return true;
    }
  }
  return false;
};

/**
 * Gets the ordered options for the dropdown to ensure the dropdownValue is the first item in the drop down.
 * @param dropDownValue - The value of the dropdown.
 * @param ruleMeta - The rule meta to get the ordered options for.
 * @returns The ordered options for the dropdown.
 */
export const getOrderedOptions = (
  dropDownValue: string,
  ruleMeta: RuleMeta<RuleValidationTypes>[],
) => {
  const foundRuleMeta = ruleMeta.find(
    (rule) => rule.stateKey === dropDownValue,
  );
  if (!foundRuleMeta) {
    throw new Error('Found rule meta is undefined');
  }

  return [
    foundRuleMeta,
    ...ruleMeta.filter((rule) => rule.stateKey !== dropDownValue),
  ];
};

/**
 * Renders the rules selector component to add more rules.
 *
 * @param props - The rules selector props.
 * @param props.selectedRuleDropdownElementName - The event name for the selected rule dropdown.
 * @param props.selectedRuleInputElementName - The event name for the selected rule input.
 * @param props.addMoreRulesFormSubmitElementName - The event name for the add more rules form submit.
 * @param props.activeRuleStateKeys - The keys of the rules in the state.
 * @param props.selectedDropDownValue - The value of the selected dropdown.
 * @param props.selectedInputValue - The value of the selected input.
 * @param props.ruleMeta - The metadata for the rules.
 * @returns The JSX element to render.
 */
export const RulesSelector: SnapComponent<RulesSelectorProps> = ({
  selectedRuleDropdownElementName,
  selectedRuleInputElementName,
  addMoreRulesFormSubmitElementName,
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
  const dropDownValue =
    selectedDropDownValue === ''
      ? (filteredRuleMeta[0]?.stateKey as string)
      : selectedDropDownValue;

  const foundRuleMeta = filteredRuleMeta.find(
    (rule) => rule.stateKey === dropDownValue,
  );
  if (!foundRuleMeta) {
    throw new Error('Found rule meta is undefined');
  }

  // Show any error for the input field if it exists
  const inputErrorMessage: string | undefined = validator(
    selectedInputValue,
    foundRuleMeta,
  );

  // Set the disabled state for the input field and save button
  const isSaveButtonDisabled = isInputHidden(foundRuleMeta)
    ? false
    : dropDownValue === '' ||
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

        <Form name={addMoreRulesFormSubmitElementName}>
          <Field>
            <Dropdown name={selectedRuleDropdownElementName}>
              {getOrderedOptions(dropDownValue, filteredRuleMeta).map(
                (rule) => (
                  <Option value={rule.stateKey}>{rule.name}</Option>
                ),
              )}
            </Dropdown>
          </Field>
          {renderUnlimitedAllowanceDropDown(foundRuleMeta, dropDownValue)}
          {!isInputHidden(foundRuleMeta) && (
            <Field error={inputErrorMessage}>
              <Input
                name={selectedRuleInputElementName}
                value={selectedInputValue}
                type={'text'}
                placeholder={foundRuleMeta.placeholder}
              />
            </Field>
          )}
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
