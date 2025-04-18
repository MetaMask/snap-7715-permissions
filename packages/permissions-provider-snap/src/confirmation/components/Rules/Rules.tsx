import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Text,
  Box,
  Tooltip,
  Icon,
  Input,
  Button,
} from '@metamask/snaps-sdk/jsx';
import type { Hex } from 'viem';

export type TextRuleProps = {
  textValue: string;
  text: string;
  tooltip: string;
  inputName: string;
  removeRuleButtonName: string;
  isAdjustmentAllowed: boolean;
};

/**
 * The type of validation for a rule.
 */
export type RuleValidationTypes =
  | 'value-less-than-or-equal-to'
  | 'timestamp-greater-than-or-equal-to';

type RuleValidationInputCheckMapping = {
  ['value-less-than-or-equal-to']: Hex;
  ['timestamp-greater-than-or-equal-to']: number;
};

/**
 * The type of the unlimited allowance drop down selector.
 */
export type UnlimitedAllowanceDropDownSelector = {
  dropdownKey: string;
  dropdownValue: string;
};

/**
 * The options for the unlimited allowance drop down selector.
 */
export const UNLIMITED_ALLOWANCE_DROP_DOWN_OPTIONS = ['Specify', 'Unlimited'];

/**
 * The validator for a rule to allow the component to validate the input and display the correct error message.
 */
export type RuleValidator<TValidationType extends RuleValidationTypes> = {
  validationType: TValidationType;
  emptyInputValidationError: string;
  inputConstraintValidationError: string;
  compareValue: RuleValidationInputCheckMapping[TValidationType];
  unlimitedAllowanceDropDown?: UnlimitedAllowanceDropDownSelector;
};

/**
 * The metadata for a rule.
 */
export type RuleMeta<TValidationType extends RuleValidationTypes> = {
  stateKey: string;
  name: string;
  placeholder: string;
  ruleValidator: RuleValidator<TValidationType>;
};

/**
 * Filters the rule meta to only include the rules that are not in the active rule state keys.
 *
 * @param ruleMeta - The rule meta to filter.
 * @param activeRuleStateKeys - The keys of the rules in the state.
 * @returns The filtered rule meta.
 */
export const filterNotActiveRuleMeta = (
  ruleMeta: RuleMeta<RuleValidationTypes>[],
  activeRuleStateKeys: string[],
) => {
  return ruleMeta.filter(
    (rule) => !activeRuleStateKeys.includes(rule.stateKey),
  );
};

/**
 * Renders a tooltip with text and an close icon.
 *
 * @param text - The text to display.
 * @param tooltip - The tooltip text to display.
 * @param removeRuleButtonName - The name of the remove button.
 * @param isAdjustmentAllowed - Whether the permission can be adjusted.
 * @returns The JSX element to render.
 */
const renderRuleItemDetails = (
  text: string,
  tooltip: string,
  removeRuleButtonName: string,
  isAdjustmentAllowed: boolean,
) => (
  <Box direction="horizontal" alignment="space-between">
    <Box direction="horizontal">
      <Text>{text}</Text>
      <Tooltip content={<Text>{tooltip}</Text>}>
        <Icon name="question" size="inherit" color="muted" />
      </Tooltip>
    </Box>
    {isAdjustmentAllowed ? (
      <Button name={removeRuleButtonName}>Remove</Button>
    ) : null}
  </Box>
);

/**
 * Renders a rule item with a timestamp input field.
 *
 * @param props - The rule item props.
 * @param props.text - The text to display.
 * @param props.tooltip - The tooltip text to display.
 * @param props.inputName - The name of the input field.
 * @param props.removeRuleButtonName - The name of the remove button.
 * @param props.textValue - The text value to display.
 * @param props.isAdjustmentAllowed - Whether the permission can be adjusted.
 * @returns The JSX element to render.
 */
export const TextRule: SnapComponent<TextRuleProps> = ({
  text,
  tooltip,
  inputName,
  removeRuleButtonName,
  textValue,
  isAdjustmentAllowed,
}) => (
  <Box direction="vertical">
    {renderRuleItemDetails(
      text,
      tooltip,
      removeRuleButtonName,
      isAdjustmentAllowed,
    )}
    <Input
      name={inputName}
      type="text"
      placeholder={textValue}
      value={textValue}
      disabled={true}
    />
  </Box>
);
