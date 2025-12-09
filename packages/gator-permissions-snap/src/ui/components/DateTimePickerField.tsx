import { DateTimePicker } from '@metamask/snaps-sdk/jsx';

import type { BaseFieldProps } from './Field';
import { Field } from './Field';
import { TextField } from './TextField';

export type DateTimePickerFieldParams = Pick<
  BaseFieldProps,
  'label' | 'tooltip' | 'disabled' | 'errorMessage'
> & {
  name: string;
  /** ISO 8601 formatted date string with timezone */
  value: string | undefined;
  /** Whether to disable selection of past dates */
  disablePast?: boolean | undefined;
};

export const DateTimePickerField = ({
  label,
  name,
  tooltip,
  value,
  disabled,
  errorMessage,
  disablePast,
}: DateTimePickerFieldParams) => {
  if (disabled) {
    // Format the ISO date to a readable format for display
    let displayValue = value ?? '';
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          displayValue = date.toLocaleString();
        }
      } catch {
        // Keep the original value if parsing fails
      }
    }

    return <TextField label={label} value={displayValue} tooltip={tooltip} />;
  }

  return (
    <Field
      label={label}
      tooltip={tooltip}
      errorMessage={errorMessage}
      disabled={disabled}
      variant="form"
    >
      <DateTimePicker
        name={name}
        value={value}
        type="datetime"
        disablePast={disablePast}
      />
    </Field>
  );
};
