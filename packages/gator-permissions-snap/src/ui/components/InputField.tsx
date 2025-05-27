import {
  Box,
  Text,
  Input,
  Button,
  Field,
  Image,
  Icon,
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
      <Icon name="close" color="primary" size="md" />
    </Button>
  ) : null;
  const iconElement = iconUrl ? (
    <Image src={iconUrl} alt={`${name} icon`} />
  ) : null;

  return (
    <Box direction="vertical">
      <Box direction="horizontal" alignment="space-between">
        <Box direction="horizontal">
          <Text>{label}</Text>
          {tooltipElement}
        </Box>
      </Box>
      <Field error={errorMessage}>
        <Box>{iconElement}</Box>
        <Input name={name} type={type} value={value} />
        <Box>{removeButtonElement}</Box>
      </Field>
    </Box>
  );
};
