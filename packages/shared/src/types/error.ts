import type { ZodIssue } from 'zod';

export const extractZodError = (
  method: string,
  zodIssue: ZodIssue[],
): string => {
  const errorsWithPaths = zodIssue.map((zodErr) => {
    return `${zodErr.path.join('.')}: ${zodErr.message}`;
  });
  return `${method} parmas failed validation: ${errorsWithPaths.join(', ')}`;
};
