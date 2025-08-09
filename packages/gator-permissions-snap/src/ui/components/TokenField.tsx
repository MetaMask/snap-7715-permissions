import { Tooltip, Link, Text } from '@metamask/snaps-sdk/jsx';

import { Field } from './Field';
import { shortenAddress } from '../../utils/string';

export type TokenFieldParams = {
  label: string;
  tokenSymbol: string;
  tokenAddress?: string | undefined;
  explorerUrl?: string | undefined;
  tooltip?: string | undefined;
  iconData?:
    | {
        iconDataBase64: string;
        iconAltText: string;
      }
    | undefined;
};

/**
 * A reusable component that displays a token field with an icon and a tooltip.
 * @param props - The component props.
 * @param props.label - The label for the token field.
 * @param props.tokenSymbol - The name of the token.
 * @param props.tokenAddress - The address of the token.
 * @param props.tooltip - The tooltip text to display.
 * @param props.iconData - Optional icon data for the token.
 * @param props.explorerUrl - Optional URL to a block explorer for the token.
 * @returns A JSX element containing a token field with an icon and a tooltip.
 */
export const TokenField = ({
  label,
  tokenSymbol,
  tokenAddress,
  explorerUrl,
  tooltip,
  iconData,
}: TokenFieldParams) => {
  return (
    <Field
      label={label}
      tooltip={tooltip}
      iconData={iconData}
      variant="display"
    >
      <Tooltip content={shortenAddress(tokenAddress)}>
        {explorerUrl ? (
          <Link href={explorerUrl}>{tokenSymbol}</Link>
        ) : (
          <Text>{tokenSymbol}</Text>
        )}
      </Tooltip>
    </Field>
  );
};
