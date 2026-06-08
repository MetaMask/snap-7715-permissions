import { Address, Box, Text } from '@metamask/snaps-sdk/jsx';
import type { Hex } from '@metamask/utils';

import { Field } from './Field';

export type RedeemerFieldParams = {
  label: string;
  addresses: string[];
  value?: string | undefined;
  tooltip?: string | undefined;
};

export const RedeemerField = ({
  label,
  addresses,
  value,
  tooltip,
}: RedeemerFieldParams): JSX.Element | null => {
  if (addresses.length === 0) {
    return null;
  }

  return (
    <Field label={label} tooltip={tooltip} variant="display">
      {value ? (
        <Text alignment="end">{value}</Text>
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
