import { useCallback, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Hex } from 'viem';

import { parseRedeemerAddressesInput } from '../../utils/parseRedeemerAddressesInput';

type RedeemerAddressesFieldProps = {
  onChange: (addresses: Hex[]) => void;
};

export const RedeemerAddressesField = ({
  onChange,
}: RedeemerAddressesFieldProps) => {
  const [raw, setRaw] = useState('');

  const handleChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLTextAreaElement>) => {
      setRaw(value);
      onChange(parseRedeemerAddressesInput(value));
    },
    [onChange],
  );

  return (
    <div>
      <label htmlFor="redeemerAddresses">Redeemer addresses (optional):</label>
      <textarea
        id="redeemerAddresses"
        name="redeemerAddresses"
        rows={3}
        value={raw}
        onChange={handleChange}
        placeholder="0x…, 0x… (comma-separated checksum addresses)"
      ></textarea>
    </div>
  );
};
