import {
  Icon,
  Box,
  Text,
  Tooltip,
  Dropdown,
  Option,
} from '@metamask/snaps-sdk/jsx';

export type DropdownFieldParams = {
  label: string;
  name: string;
  tooltip?: string | undefined;
  value: string;
  options: string[];
  disabled?: boolean;
  errorMessage?: string | undefined;
};

export const DropdownField = ({
  label,
  name,
  tooltip,
  value,
  options,
  disabled,
  errorMessage,
}: DropdownFieldParams) => {
  const tooltipElement = tooltip ? (
    <Tooltip content={<Text>{tooltip}</Text>}>
      <Icon name="question" size="inherit" color="muted" />
    </Tooltip>
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
      </Box>
      <Dropdown name={name} value={value} disabled={disabled || false}>
        {options.map((option) => (
          <Option key={option} value={option}>
            {option}
          </Option>
        ))}
      </Dropdown>
      {errorElement}
    </Box>
  );
};
