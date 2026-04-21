import { Address, Box } from '@metamask/snaps-sdk/jsx';
import type { Hex } from '@metamask/utils';

import { Field } from './Field';

export type RedeemerFieldParams = {
  label: string;
  addresses: string[];
  tooltip?: string | undefined;
};

export const RedeemerField = ({
  label,
  addresses,
  tooltip,
}: RedeemerFieldParams): JSX.Element | null => {
  if (addresses.length === 0) {
    return null;
  }

  console.log('yyyyyyy', addresses);

  return (
    <Field label={label} tooltip={tooltip} variant="display">
      <Box direction="vertical">
        {addresses.map((addr) => (
          <Address address={addr as Hex} displayName={true} />
        ))}
      </Box>
    </Field>
  );
};
