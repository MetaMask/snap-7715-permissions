import { Address, Box } from '@metamask/snaps-sdk/jsx';
import type { Hex } from '@metamask/utils';

import { Field } from './Field';

export type PayeeFieldParams = {
  label: string;
  addresses: string[];
  tooltip?: string | undefined;
};

export const PayeeField = ({
  label,
  addresses,
  tooltip,
}: PayeeFieldParams): JSX.Element | null => {
  if (addresses.length === 0) {
    return null;
  }

  return (
    <Field label={label} tooltip={tooltip} variant="display">
      <Box direction="vertical">
        {addresses.map((addr) => (
          <Address key={addr} address={addr as Hex} displayName={true} />
        ))}
      </Box>
    </Field>
  );
};
