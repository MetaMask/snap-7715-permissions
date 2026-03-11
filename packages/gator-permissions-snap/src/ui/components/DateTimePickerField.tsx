import { DateTimePicker, Text } from '@metamask/snaps-sdk/jsx';

import type { BaseFieldProps } from './Field';
import { Field } from './Field';
import { TextField } from './TextField';
import { forceToLocalZone } from '../../utils/time';

export type DateTimePickerFieldParams = Pick<
  BaseFieldProps,
  | 'label'
  | 'tooltip'
  | 'errorMessage'
  | 'isEditable'
  | 'removeFieldButtonName'
  | 'addFieldButtonName'
  | 'contentWhenDisabled'
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
  isEditable = true,
  errorMessage,
  allowPastDate,
  addFieldButtonName,
  removeFieldButtonName,
  contentWhenDisabled,
}: DateTimePickerFieldParams): JSX.Element => {
  const isFieldEnabled = value !== null && value !== undefined;

  if (!isEditable) {
    if (!isFieldEnabled) {
      // we can't just return null here, so we return an empty Text element
      return <Text> </Text>;
    }
    // Format the ISO date to a readable format for display.
    // We convert to local timezone for display purposes so users see the time
    // they're familiar with, even though the internal timestamp representation is in UTC.
    let displayValue = value ?? '';
    if (value) {
      try {
        const date = new Date(forceToLocalZone(value));
        if (!isNaN(date.getTime())) {
          displayValue = date.toLocaleString();
        }
      } catch {
        // Keep the original value if parsing fails
      }
    }

    return (
      <TextField
        label={label}
        value={displayValue}
        tooltip={tooltip}
        direction="vertical"
      />
    );
  }

  // Convert allowPastDate to disablePast for the Snaps SDK component
  const disablePast = allowPastDate === undefined ? undefined : !allowPastDate;

  return (
    <Field
      label={label}
      tooltip={tooltip}
      errorMessage={errorMessage}
      isEditable={isEditable}
      isFieldEnabled={isFieldEnabled}
      contentWhenDisabled={contentWhenDisabled}
      variant="form"
      addFieldButtonName={addFieldButtonName}
      removeFieldButtonName={removeFieldButtonName}
    >
      {/*
        The DateTimePicker component from Snaps SDK shows times in the user's local timezone.
        We convert the UTC timestamp to local timezone representation for display.
        The user sees and edits times in their local timezone, but internally these are
        converted back to UTC (via iso8601ToTimestampIgnoreTimezone) for consistent blockchain
        execution regardless of the user's timezone.
      */}
      <DateTimePicker
        name={name}
        value={forceToLocalZone(value)}
        type="datetime"
        disablePast={disablePast}
      />
    </Field>
  );
};
