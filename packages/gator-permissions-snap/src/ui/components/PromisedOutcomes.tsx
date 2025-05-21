import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Section,
  Input,
  Text,
  Field,
  Form,
  Radio,
  RadioGroup,
} from '@metamask/snaps-sdk/jsx';

export type PromisedOutcomesProps = {
  value: string;
  origin: string;
  tokenSymbol: string;
  allowance: string;
};

const extractDomainFromOrigin = (origin: string) => {
  const url = new URL(origin);
  return url.hostname;
};

export const PromisedOutcomes: SnapComponent<PromisedOutcomesProps> = ({
  value,
  origin,
  allowance,
  tokenSymbol,
}) => {
  return (
    <Section>
      <Box>
        <Box direction="horizontal" alignment="space-between">
          <Text>Add guarantee</Text>
          <Form name="add-guarantee-form">
            <Field>
              <RadioGroup name="add-guarantee-radio-group" disabled={true}>
                <Radio value="option-1" children={''}></Radio>
              </RadioGroup>
            </Field>
          </Form>
        </Box>

        <Text>
          This ensures that {extractDomainFromOrigin(origin)} will withdraw{' '}
          {allowance} from your account only if you receive their {tokenSymbol}{' '}
          token in return.
        </Text>

        <Input
          name="PromisedOutcomes"
          type="text"
          value={value}
          disabled={true}
        />
      </Box>
    </Section>
  );
};
