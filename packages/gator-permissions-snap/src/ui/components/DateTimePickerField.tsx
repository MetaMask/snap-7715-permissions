import { DateTimePicker } from '@metamask/snaps-sdk/jsx';

import type { BaseFieldProps } from './Field';
import { Field } from './Field';
import { TextField } from './TextField';

export type DateTimePickerFieldParams = Pick<
  BaseFieldProps,
  | 'label'
  | 'tooltip'
  | 'disabled'
  | 'errorMessage'
  | 'removeFieldButtonName'
  | 'addFieldButtonName'
> & {
  name: string;
  /** ISO 8601 formatted date string with timezone */
  value: string | undefined;
  /** Whether to allow selection of past dates */
  allowPastDate?: boolean | undefined;
};

export const DateTimePickerField = ({
  label,
  name,
  tooltip,
  value,
  disabled,
  errorMessage,
  allowPastDate,
  addFieldButtonName,
  removeFieldButtonName,
}: DateTimePickerFieldParams) => {
  const isFieldEnabled = value !== null && value !== undefined;

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

  // Convert allowPastDate to disablePast for the Snaps SDK component
  const disablePast = allowPastDate === undefined ? undefined : !allowPastDate;

  return (
    <Field
      label={label}
      tooltip={tooltip}
      errorMessage={errorMessage}
      disabled={disabled}
      isFieldEnabled={isFieldEnabled}
      variant="form"
      addFieldButtonName={addFieldButtonName}
      removeFieldButtonName={removeFieldButtonName}
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
