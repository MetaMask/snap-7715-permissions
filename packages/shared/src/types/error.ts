import type { ZodIssue } from 'zod';

export const extractZodError = (
  zodIssue: ZodIssue[],
): string => {
  const errorsWithPaths = zodIssue.map((zodErr) => {
    return `${zodErr.path.join('.')}: ${zodErr.message}`;
  });
  return `Failed type validation: ${errorsWithPaths.join(', ')}`;
};
