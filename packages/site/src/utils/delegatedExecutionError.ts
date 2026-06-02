import { decodeRevertReason } from '@metamask/smart-accounts-kit/utils';

import { stringifyWithBigInt } from './stringify';

const getOriginalErrorOutput = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message || String(error);
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    const stringifiedError = stringifyWithBigInt(error);
    return stringifiedError || String(error);
  } catch {
    return String(error);
  }
};

export const formatDelegatedExecutionError = (error: unknown): Error => {
  const originalErrorOutput = getOriginalErrorOutput(error);
  let decodedRevertReason: ReturnType<typeof decodeRevertReason> | undefined;

  try {
    decodedRevertReason = decodeRevertReason(error);
  } catch {
    decodedRevertReason = undefined;
  }

  if (!decodedRevertReason) {
    return error instanceof Error ? error : new Error(originalErrorOutput);
  }

  return new Error(
    [
      `Decoded revert reason: ${decodedRevertReason.message}`,
      `Decoded error name: ${decodedRevertReason.errorName}`,
      `Raw revert data: ${decodedRevertReason.rawData}`,
      '',
      'Original error output:',
      originalErrorOutput,
    ].join('\n'),
  );
};
