import { Text } from '@metamask/snaps-sdk/jsx';

import type { ViewFieldProps } from './Field';
import { Field } from './Field';

export type TextFieldParams = Pick<
  ViewFieldProps,
  'label' | 'tooltip' | 'iconData'
> & {
  value: string;
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
