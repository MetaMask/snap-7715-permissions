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
};

/**
 * The type of validation for a rule.
 */
export type RuleValidationTypes = 'value' | 'timestamp';

type RuleValidationInputCheckMapping = {
  ['value']: Hex;
  ['timestamp']: number;
};

/**
 * The validator for a rule to allow the component to validate the input and display the correct error message.
 */
export type RuleValidator<TValidationType extends RuleValidationTypes> = {
  validationType: TValidationType;
  emptyInputValidationError: string;
  inputConstraintValidationError: string;
  compareValue: RuleValidationInputCheckMapping[TValidationType];
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
 * @returns The JSX element to render.
 */
const renderRuleItemDetails = (
  text: string,
  tooltip: string,
  removeRuleButtonName: string,
) => (
  <Box direction="horizontal" alignment="space-between">
    <Box direction="horizontal">
      <Text>{text}</Text>
      <Tooltip content={<Text>{tooltip}</Text>}>
        <Icon name="question" size="inherit" color="muted" />
      </Tooltip>
    </Box>
    <Button name={removeRuleButtonName}>Remove</Button>
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
 * @returns The JSX element to render.
 */
export const TextRule: SnapComponent<TextRuleProps> = ({
  text,
  tooltip,
  inputName,
  removeRuleButtonName,
  textValue,
}) => (
  <Box direction="vertical">
    {renderRuleItemDetails(text, tooltip, removeRuleButtonName)}
    <Input
      name={inputName}
      type="text"
      placeholder={textValue}
      value={textValue}
      disabled={true}
    />
  </Box>
);
