import { Dropdown, Option } from '@metamask/snaps-sdk/jsx';

import { Field } from './Field';
import { TextField } from './TextField';

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

  return (
    <Field
      label={label}
      tooltip={tooltip}
      errorMessage={errorMessage}
      disabled={disabled}
    >
      <Dropdown name={name} value={value}>
        {options.map((option) => (
          <Option key={option} value={option}>
            {option}
          </Option>
        ))}
      </Dropdown>
    </Field>
  );
};
