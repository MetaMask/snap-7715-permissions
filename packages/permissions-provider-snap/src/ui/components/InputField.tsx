import { Icon, Box, Text, Tooltip, Input } from '@metamask/snaps-sdk/jsx';

export type InputFieldParams = {
  label: string;
  name: string;
  tooltip?: string;
  value: string;
  type: 'text' | 'number';
  disabled?: boolean;
};

export const InputField = ({
  label,
  name,
  tooltip,
  type,
  value,
  disabled,
}: InputFieldParams) => {
  const tooltipElement = tooltip ? (
    <Tooltip content={<Text>{tooltip}</Text>}>
      <Icon name="question" size="inherit" color="muted" />
    </Tooltip>
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
    </Box>
  );
};
