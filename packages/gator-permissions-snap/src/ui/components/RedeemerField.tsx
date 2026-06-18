import { Address, Box, Text } from '@metamask/snaps-sdk/jsx';
import type { Hex } from '@metamask/utils';

import { Field } from './Field';
import { t } from '../../utils/i18n';

export type RedeemerFieldParams = {
  label: string;
  addresses: string[];
  tooltip?: string | undefined;
  shouldRenderRedeemersAsFacilitators?: boolean;
};

export const RedeemerField = ({
  label,
  addresses,
  tooltip,
  shouldRenderRedeemersAsFacilitators = false,
}: RedeemerFieldParams): JSX.Element | null => {
  if (addresses.length === 0) {
    return null;
  }

  return (
    <Field label={label} tooltip={tooltip} variant="display">
      {shouldRenderRedeemersAsFacilitators ? (
        <Text alignment="end">{t('facilitatorValue')}</Text>
      ) : (
        <Box direction="vertical">
          {addresses.map((addr) => (
            <Address key={addr} address={addr as Hex} displayName={true} />
          ))}
        </Box>
      )}
    </Field>
  );
};
