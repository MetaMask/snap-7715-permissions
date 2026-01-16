import { Text, Tooltip } from '@metamask/snaps-sdk/jsx';

import type { ViewFieldProps } from './Field';
import { Field } from './Field';
import { shortenAddress } from '../../utils/string';

export type AddressFieldParams = Pick<
  ViewFieldProps,
  'label' | 'tooltip' | 'iconData'
> & {
  address: string;
};

/**
 * A reusable component that displays an address field with a shortened address
 * and a tooltip showing the full address on hover.
 * @param props - The component props.
 * @param props.label - The label for the field.
 * @param props.address - The full address to display.
 * @param props.tooltip - The tooltip text for the field label.
 * @param props.iconData - Optional icon data.
 * @returns A JSX element containing an address field with tooltip.
 */
export const AddressField = ({
  label,
  address,
  tooltip,
  iconData,
}: AddressFieldParams): JSX.Element => {
  return (
    <Field
      label={label}
      tooltip={tooltip}
      iconData={iconData}
      variant="display"
    >
      <Tooltip content={address}>
        <Text>{shortenAddress(address)}</Text>
      </Tooltip>
    </Field>
  );
};
