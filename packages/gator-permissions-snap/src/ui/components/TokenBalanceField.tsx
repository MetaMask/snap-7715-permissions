import { Skeleton, Text, Tooltip } from '@metamask/snaps-sdk/jsx';

import { t } from '../../utils/i18n';
import { truncateDecimalPlaces } from '../../utils/string';

type TokenBalanceFieldProps = {
  tokenBalance: string | null;
};

/**
 * A component that displays the token balance.
 * @param props - The component props.
 * @param props.tokenBalance - The token balance to display.
 * @returns A JSX element containing the token balance or a skeleton if not available.
 */
export const TokenBalanceField = ({
  tokenBalance,
}: TokenBalanceFieldProps): JSX.Element => {
  if (!tokenBalance) {
    return <Skeleton />;
  }
  const truncatedTokenBalance = truncateDecimalPlaces(tokenBalance);
  if (truncatedTokenBalance === tokenBalance) {
    return (
      <Text>
        {truncatedTokenBalance} {t('availableLabel')}
      </Text>
    );
  }
  return (
    <Tooltip content={<Text>{tokenBalance}</Text>}>
      <Text>
        {truncatedTokenBalance} {t('availableLabel')}
      </Text>
    </Tooltip>
  );
};
