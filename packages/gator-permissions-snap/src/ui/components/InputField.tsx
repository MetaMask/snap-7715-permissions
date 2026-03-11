import { Text, Input } from '@metamask/snaps-sdk/jsx';

import type { InputFieldProps } from './Field';
import { Field } from './Field';
import { TextField } from './TextField';

export type InputFieldParams = Pick<
  InputFieldProps,
  | 'label'
  | 'tooltip'
  | 'addFieldButtonName'
  | 'removeFieldButtonName'
  | 'isEditable'
  | 'iconData'
  | 'errorMessage'
  | 'contentWhenDisabled'
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
  isEditable = true,
  errorMessage,
  iconData,
  contentWhenDisabled,
}: InputFieldParams): JSX.Element => {
  const isFieldEnabled = value !== null && value !== undefined;

  if (!isEditable) {
    if (!isFieldEnabled) {
      // we can't just return null here, so we return an empty Text element
      return <Text> </Text>;
    }
    return (
      <TextField
        label={label}
        value={value ?? ''}
        tooltip={tooltip}
        iconData={iconData}
        direction="vertical"
      />
    );
  }

  return (
    <Field
      label={label}
      tooltip={tooltip}
      errorMessage={errorMessage}
      isEditable={isEditable}
      addFieldButtonName={addFieldButtonName}
      removeFieldButtonName={removeFieldButtonName}
      isFieldEnabled={isFieldEnabled}
      iconData={iconData}
      contentWhenDisabled={contentWhenDisabled}
      variant="form"
    >
      <Input name={name} type={type} value={value} />
    </Field>
  );
};
