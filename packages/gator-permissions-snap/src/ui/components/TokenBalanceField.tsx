import { Skeleton, Text, Tooltip } from '@metamask/snaps-sdk/jsx';

import { truncateDecimalPlaces } from '../../utils/string';

type TokenBalanceFieldProps = {
  tokenBalance: string | undefined;
};

/**
 * A component that displays the token balance.
 * @param props - The component props.
 * @param props.tokenBalance - The token balance to display.
 * @returns A JSX element containing the token balance or a skeleton if not available.
 */
export const TokenBalanceField = ({ tokenBalance }: TokenBalanceFieldProps) => {
  if (!tokenBalance) {
    return <Skeleton />;
  }
  const truncatedTokenBalance = truncateDecimalPlaces(tokenBalance ?? '');
  if (truncatedTokenBalance === tokenBalance) {
    return <Text>{truncatedTokenBalance} available</Text>;
  }
  return (
    <Tooltip content={<Text>{tokenBalance}</Text>}>
      <Text>{truncatedTokenBalance} available</Text>
    </Tooltip>
  );
};
