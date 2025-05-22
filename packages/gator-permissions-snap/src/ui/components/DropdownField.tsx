import { Box, Text, Dropdown, Option } from '@metamask/snaps-sdk/jsx';

import { TextField } from './TextField';
import { TooltipIcon } from './TooltipIcon';

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
  if (disabled) {
    return <TextField label={label} value={value} tooltip={tooltip} />;
  }

  const tooltipElement = tooltip ? <TooltipIcon tooltip={tooltip} /> : null;

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
      <Dropdown name={name} value={value}>
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
