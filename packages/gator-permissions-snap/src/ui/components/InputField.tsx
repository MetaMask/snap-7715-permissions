import { Input } from '@metamask/snaps-sdk/jsx';

import { Field } from './Field';
import { TextField } from './TextField';

export type InputFieldParams = {
  label: string;
  name: string;
  removeButtonName?: string | undefined;
  tooltip?: string | undefined;
  value: string;
  type: 'text' | 'number';
  disabled?: boolean;
  errorMessage?: string | undefined;
  iconData?:
    | {
        iconDataBase64: string;
        iconAltText: string;
      }
    | undefined;
};

export const InputField = ({
  label,
  name,
  removeButtonName,
  tooltip,
  type,
  value,
  disabled,
  errorMessage,
  iconData,
}: InputFieldParams) => {
  if (disabled) {
    return (
      <TextField
        label={label}
        value={value}
        tooltip={tooltip}
        iconData={iconData}
      />
    );
  }

  return (
    <Field
      label={label}
      tooltip={tooltip}
      errorMessage={errorMessage}
      disabled={disabled}
      iconData={iconData}
      removeButtonName={removeButtonName}
    >
      <Input name={name} type={type} value={value} />
    </Field>
  );
};
