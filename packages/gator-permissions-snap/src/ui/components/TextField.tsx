import { Box, Icon, Text } from '@metamask/snaps-sdk/jsx';

import type { ViewFieldProps } from './Field';
import { Field } from './Field';

export type TextFieldParams = Pick<
  ViewFieldProps,
  'label' | 'tooltip' | 'iconData'
> & {
  value: string;
  /** When set, shows a danger icon and this label below the value. */
  warningLabel?: string | undefined;
};

/**
 * A reusable component that displays a text field.
 * When warningLabel is set, shows the value with a warning icon and label below.
 *
 * @param props - The component props.
 * @param props.label - The label for the field.
 * @param props.value - The text value to display.
 * @param props.tooltip - The tooltip text for the field label.
 * @param props.iconData - Optional icon data.
 * @param props.warningLabel - When set, shows a danger icon and this label below the value.
 * @returns A JSX element containing a text field with optional warning.
 */
export const TextField = ({
  label,
  value,
  tooltip,
  iconData,
  warningLabel,
}: TextFieldParams): JSX.Element => {
  const textContent = <Text alignment="end">{value}</Text>;

  return (
    <Field
      label={label}
      tooltip={tooltip}
      iconData={iconData}
      variant="display"
    >
      {warningLabel ? (
        <Box direction="vertical">
          {textContent}
          <Box direction="horizontal" alignment="end">
            <Icon name="danger" size="md" color="primary" />
            <Text color="error">{warningLabel}</Text>
          </Box>
        </Box>
      ) : (
        textContent
      )}
    </Field>
  );
};
