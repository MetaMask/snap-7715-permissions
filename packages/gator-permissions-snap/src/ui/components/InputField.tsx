import { Box, Text, Input, Button } from '@metamask/snaps-sdk/jsx';

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

  const errorElement = errorMessage ? (
    <Text color="error">{errorMessage}</Text>
  ) : null;

  return (
    <Box direction="vertical">
      <Box direction="horizontal" alignment="space-between">
        <Box direction="horizontal">
          <Text>{label}</Text>
          {tooltipElement}
        </Box>
        {removeButtonElement}
      </Box>
      <Input name={name} type={type} value={value} />
      {errorElement}
    </Box>
  );
};
