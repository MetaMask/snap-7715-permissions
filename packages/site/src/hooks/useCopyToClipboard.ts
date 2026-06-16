import { useCallback, useState } from 'react';

export const useCopyToClipboard = (resetDelayMs = 2000) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(
    (value: string) => {
      navigator.clipboard
        .writeText(value)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), resetDelayMs);
        })
        .catch((clipboardError) => {
          console.error('Failed to copy: ', clipboardError);
        });
    },
    [resetDelayMs],
  );

  return { copyToClipboard, isCopied };
};
