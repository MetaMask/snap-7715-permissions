import { Dropdown, Option } from '@metamask/snaps-sdk/jsx';

import type { BaseFieldProps } from './Field';
import { Field } from './Field';
import { TextField } from './TextField';
import type { MessageKey } from '../../utils/i18n';
import { t } from '../../utils/i18n';

export type DropdownFieldParams = BaseFieldProps & {
  name: string;
  value: MessageKey;
  options: MessageKey[];
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
    return <TextField label={label} value={t(value)} tooltip={tooltip} />;
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
            {t(option)}
          </Option>
        ))}
      </Dropdown>
    </Field>
  );
};
