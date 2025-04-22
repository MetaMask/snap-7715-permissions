import { Icon, Box, Text, Tooltip, Input } from '@metamask/snaps-sdk/jsx';

export type InputFieldParams = {
  label: string;
  name: string;
  tooltip?: string;
  value: string;
  type: 'text' | 'number';
  disabled?: boolean;
  errorMessage?: string | undefined;
};

export const InputField = ({
  label,
  name,
  tooltip,
  type,
  value,
  disabled,
  errorMessage,
}: InputFieldParams) => {
  const tooltipElement = tooltip ? (
    <Tooltip content={<Text>{tooltip}</Text>}>
      <Icon name="question" size="inherit" color="muted" />
    </Tooltip>
  ) : null;

  const errorElement = errorMessage ? (
    <Text color="error">{errorMessage}</Text>
  ) : null;

  return (
    <Box direction="horizontal" alignment="space-between">
      <Box direction="horizontal">
        <Text>{label}</Text>
        {tooltipElement}
      </Box>
      <Input
        name={name}
        type={type}
        value={value}
        disabled={disabled || false}
      />
      {errorElement}
    </Box>
  );
};
