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
      {explorerUrl && tokenAddress ? (
        // Not using the Address component because the Tooltip component
        // does not allow the Address component as its content.
        // See: https://github.com/MetaMask/snaps/blob/7d8c1e6fe66a5d949ba54c9ae30ffe8f1faaf5ab/packages/snaps-sdk/src/jsx/components/Tooltip.ts#L25
        //
        // Using shortenAddress from the MetaMask repo because the SDK does not provide an API for this.
        // Copied the implementation from MetaMask's codebase.
        // Will switch to the SDK's official function if one becomes available in the future.
        <Tooltip content={shortenAddress(tokenAddress)}>
          <Link href={explorerUrl}>{tokenSymbol}</Link>
        </Tooltip>
      ) : (
        <Text>{tokenSymbol}</Text>
      )}
    </Field>
  );
};
