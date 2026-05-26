import { stringifyWithBigInt } from './stringify';

const FALLBACK_ERROR_MESSAGE = 'Unknown error';
const SUMMARY_KEYS = ['shortMessage', 'reason', 'message'] as const;
const NESTED_ERROR_KEYS = ['cause', 'error', 'data', 'originalError'] as const;

type ErrorRecord = Record<string, unknown>;

export type ErrorDisplay = {
  summary: string;
  details: string;
};

const isRecord = (value: unknown): value is ErrorRecord =>
  typeof value === 'object' && value !== null;

const getTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const getStringField = (value: unknown, key: string): string | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return getTrimmedString(value[key]);
};

const getNestedStringField = (
  value: unknown,
  key: string,
  depth = 0,
): string | undefined => {
  if (!isRecord(value) || depth > 2) {
    return undefined;
  }

  const directValue = getStringField(value, key);
  if (directValue) {
    return directValue;
  }

  for (const nestedKey of NESTED_ERROR_KEYS) {
    const nestedValue = getNestedStringField(value[nestedKey], key, depth + 1);
    if (nestedValue) {
      return nestedValue;
    }
  }

  return undefined;
};

const stringifyErrorValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return getTrimmedString(value);
  }

  if (value instanceof Error) {
    return getTrimmedString(value.message) ?? String(value);
  }

  try {
    return getTrimmedString(stringifyWithBigInt(value));
  } catch {
    return getTrimmedString(String(value));
  }
};

const getFirstMeaningfulLine = (message: string): string =>
  message
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean) ?? message;

const getSummaryMessage = (error: unknown): string => {
  for (const key of SUMMARY_KEYS) {
    const message = getNestedStringField(error, key);
    if (message) {
      return getFirstMeaningfulLine(message);
    }
  }

  return getFirstMeaningfulLine(
    stringifyErrorValue(error) ?? FALLBACK_ERROR_MESSAGE,
  );
};

const getSerializedProperties = (error: unknown): string | undefined => {
  if (!isRecord(error)) {
    return undefined;
  }

  try {
    const serializedError = stringifyWithBigInt(error);
    return serializedError === '{}' ? undefined : serializedError;
  } catch {
    return undefined;
  }
};

const getDetailMessage = (error: unknown): string => {
  const detailParts = [
    stringifyErrorValue(error),
    getSerializedProperties(error),
  ].filter((part): part is string => Boolean(part));

  return detailParts.length > 0
    ? Array.from(new Set(detailParts)).join('\n\n')
    : FALLBACK_ERROR_MESSAGE;
};

export const getErrorDisplay = (error: unknown): ErrorDisplay => ({
  summary: getSummaryMessage(error),
  details: getDetailMessage(error),
});
