import { Box, Icon, Section, Text } from '@metamask/snaps-sdk/jsx';

import type { ViewFieldProps } from './Field';
import { Field } from './Field';
import { TokenIcon } from './TokenIcon';

export type TextFieldParams = Pick<
  ViewFieldProps,
  'label' | 'tooltip' | 'iconData'
> & {
  /** The direction to stack the label and value elements. */
  direction?: 'vertical' | 'horizontal';
  /** The text value to display. */
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
 * @param props.direction - The direction to stack the label and value elements. Default is 'horizontal'.
 * @returns A JSX element containing a text field with optional warning.
 */
export const TextField = ({
  label,
  value,
  tooltip,
  iconData,
  warningLabel,
  direction = 'horizontal',
}: TextFieldParams): JSX.Element => {
  const content = warningLabel ? (
    <Box direction="vertical">
      <Text alignment="end">{value}</Text>
      <Box direction="horizontal" alignment="end">
        <Icon name="danger" size="md" color="error" />
        <Text color="error">{warningLabel}</Text>
      </Box>
    </Box>
  ) : (
    <Text alignment="end">{value}</Text>
  );

  if (direction === 'vertical') {
    return (
      <Field
        label={label}
        tooltip={tooltip}
        variant="display"
        direction="vertical"
      >
        <Section>
          <Box direction="horizontal">
            <Box>
              <TokenIcon
                imageDataBase64={iconData?.iconDataBase64 ?? null}
                altText={iconData?.iconAltText ?? ''}
              />
            </Box>
            {content}
          </Box>
        </Section>
      </Field>
    );
  }

  return (
    <Field
      label={label}
      tooltip={tooltip}
      iconData={iconData}
      variant="display"
    >
      {content}
    </Field>
  );
};
