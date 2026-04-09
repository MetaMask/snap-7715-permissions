import { Box, Icon, Text, Tooltip } from '@metamask/snaps-sdk/jsx';

import type { ViewFieldProps } from './Field';
import { Field } from './Field';
import { shortenAddress } from '../../utils/string';

export type AddressFieldParams = Pick<
  ViewFieldProps,
  'label' | 'tooltip' | 'iconData'
> & {
  address: string;
  /** When set, shows a danger icon and this label below the address. */
  warningLabel?: string | undefined;
  /** Severity level for the warning: 'warning' (orange) for potential issues, 'error' (red) for definite issues. Defaults to 'error'. */
  warningSeverity?: 'warning' | 'error';
};

/**
 * A reusable component that displays an address field with a shortened address
 * and a tooltip showing the full address on hover.
 * When warningLabel is set, shows the address with a warning icon and label below.
 *
 * @param props - The component props.
 * @param props.label - The label for the field.
 * @param props.address - The full address to display.
 * @param props.tooltip - The tooltip text for the field label.
 * @param props.iconData - Optional icon data.
 * @param props.warningLabel - When set, shows a danger icon and this label below the address.
 * @param props.warningSeverity - Severity level: 'warning' (orange) or 'error' (red). Defaults to 'error'.
 * @returns A JSX element containing an address field with optional warning.
 */
export const AddressField = ({
  label,
  address,
  tooltip,
  iconData,
  warningLabel,
  warningSeverity = 'error',
}: AddressFieldParams): JSX.Element => {
  const addressContent = (
    <Tooltip content={address}>
      <Text>{shortenAddress(address)}</Text>
    </Tooltip>
  );

  return (
    <Field
      label={label}
      tooltip={tooltip}
      iconData={iconData}
      variant="display"
    >
      {warningLabel ? (
        <Box direction="vertical" alignment="end">
          <Box direction="horizontal" alignment="end">
            {addressContent}
          </Box>
          <Box direction="horizontal" alignment="end">
            <Icon name="danger" size="md" color={warningSeverity} />
            <Text alignment="end" color={warningSeverity}>
              {warningLabel}
            </Text>
          </Box>
        </Box>
      ) : (
        addressContent
      )}
    </Field>
  );
};
