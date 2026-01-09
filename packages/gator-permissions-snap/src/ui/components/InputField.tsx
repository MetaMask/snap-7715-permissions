import { Input } from '@metamask/snaps-sdk/jsx';

import type { InputFieldProps } from './Field';
import { Field } from './Field';
import { TextField } from './TextField';

export type InputFieldParams = Pick<
  InputFieldProps,
  | 'label'
  | 'tooltip'
  | 'addFieldButtonName'
  | 'removeFieldButtonName'
  | 'disabled'
  | 'iconData'
  | 'errorMessage'
> & {
  name: string;
  value: string | undefined;
  type: 'text' | 'number';
};

export const InputField = ({
  label,
  name,
  addFieldButtonName,
  removeFieldButtonName,
  tooltip,
  type,
  value,
  disabled,
  errorMessage,
  iconData,
}: InputFieldParams): JSX.Element => {
  if (disabled) {
    return (
      <TextField
        label={label}
        value={value ?? ''}
        tooltip={tooltip}
        iconData={iconData}
      />
    );
  }

  const isFieldEnabled = value !== null && value !== undefined;

  return (
    <Field
      label={label}
      tooltip={tooltip}
      errorMessage={errorMessage}
      disabled={disabled}
      addFieldButtonName={addFieldButtonName}
      removeFieldButtonName={removeFieldButtonName}
      isFieldEnabled={isFieldEnabled}
      iconData={iconData}
      variant="form"
    >
      <Input name={name} type={type} value={value} />
    </Field>
  );
};
