import {
  Box,
  Text,
  Input,
  Button,
  Form,
  Field,
  Image,
} from '@metamask/snaps-sdk/jsx';

import { TextField } from './TextField';
import { TooltipIcon } from './TooltipIcon';

export type InputFieldParams = {
  label: string;
  name: string;
  removeButtonName?: string | undefined;
  tooltip?: string | undefined;
  value: string;
  type: 'text' | 'number';
  disabled?: boolean;
  errorMessage?: string | undefined;
  iconUrl?: string | undefined;
};

export const InputField = ({
  label,
  name,
  removeButtonName,
  tooltip,
  type,
  value,
  disabled,
  errorMessage,
  iconUrl,
}: InputFieldParams) => {
  if (disabled) {
    return <TextField label={label} value={value} tooltip={tooltip} />;
  }

  const tooltipElement = tooltip ? <TooltipIcon tooltip={tooltip} /> : null;
  const removeButtonElement = removeButtonName ? (
    <Button name={removeButtonName} type="button">
      Remove
    </Button>
  ) : null;

  const inputFieldElement = iconUrl ? (
    <Field error={errorMessage}>
      <Box>
        <Image src={iconUrl} alt={`${name} icon`} />
      </Box>
      <Input name={name} type={type} value={value} />
    </Field>
  ) : (
    <Field error={errorMessage}>
      <Input name={name} type={type} value={value} />
    </Field>
  );

  return (
    <Box direction="vertical">
      <Box direction="horizontal" alignment="space-between">
        <Box direction="horizontal">
          <Text>{label}</Text>
          {tooltipElement}
        </Box>
        {removeButtonElement}
      </Box>
      <Form name={`${name}-form`}>{inputFieldElement}</Form>
    </Box>
  );
};
