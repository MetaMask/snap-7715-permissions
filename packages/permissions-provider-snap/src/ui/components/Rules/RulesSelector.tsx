import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Button,
  Field,
  Form,
  Input,
  Text,
  Section,
  Icon,
  Bold,
} from '@metamask/snaps-sdk/jsx';

import type { State } from '../../types';

type RulesSelectorProps = {
  closeRuleSelectorButtonEventName: string;
  saveRuleButtonEventName: string;
  nativeTokenStreamRuleKeys: string[];
  state: State<'native-token-stream'>;
};

/**
 * Renders the rules selector component to add more rules.
 *
 * @param props - The rules selector props.
 * @param props.nativeTokenStreamRuleKeys - The keys of the native token stream rules.
 * @param props.closeRuleSelectorButtonEventName - The event name for the close button.
 * @param props.saveRuleButtonEventName - The event name for the save button.
 * @param props.state - The state of the native token stream.
 * @returns The JSX element to render.
 */
export const RulesSelector: SnapComponent<RulesSelectorProps> = ({
  closeRuleSelectorButtonEventName,
  saveRuleButtonEventName,
  nativeTokenStreamRuleKeys,
  state,
}) => {
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
            <Input name="firstName" placeholder="Enter your first name" />
          </Field>
          <Button name={saveRuleButtonEventName} type="submit">
            Save
          </Button>
        </Form>
      </Section>
    </Box>
  );
};
