import { Text } from '@metamask/snaps-sdk/jsx';

import { Field } from './Field';

export type TextFieldParams = {
  label: string;
  value: string;
  tooltip?: string | undefined;
  iconData?:
    | {
        iconDataBase64: string;
        iconAltText: string;
      }
    | undefined;
};

export const TextField = ({
  label,
  value,
  tooltip,
  iconData,
}: TextFieldParams) => {
  return (
    <Field
      label={label}
      tooltip={tooltip}
      iconData={iconData}
      variant="display"
    >
      <Text>{value}</Text>
    </Field>
  );
};
