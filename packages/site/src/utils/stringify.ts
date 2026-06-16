export const stringifyWithBigInt = (value: unknown): string =>
  JSON.stringify(
    value,
    (_, v) => (typeof v === 'bigint' ? v.toString() : v),
    2,
  );
