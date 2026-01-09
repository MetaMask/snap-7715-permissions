import { Dropdown, Option } from '@metamask/snaps-sdk/jsx';

import type { BaseFieldProps } from './Field';
import { Field } from './Field';
import { TextField } from './TextField';

export type DropdownFieldParams = BaseFieldProps & {
  name: string;
  value: string;
  options: string[];
};

export const DropdownField = ({
  label,
  name,
  tooltip,
  value,
  options,
  disabled,
  errorMessage,
}: DropdownFieldParams): JSX.Element => {
  if (disabled) {
    return <TextField label={label} value={value} tooltip={tooltip} />;
  }

  return (
    <Field
      label={label}
      tooltip={tooltip}
      errorMessage={errorMessage}
      disabled={disabled}
      variant="form"
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
