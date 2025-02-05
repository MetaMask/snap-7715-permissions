import { ZodIssue } from "zod";

export const extractZodError = (
    method: string,
    zodIssue: ZodIssue[],
  ): string => {
    const errorsWithPaths = zodIssue.map((err) => {
      return `${err.path.join('.')}: ${err.message}`;
    });
    return `${method} parmas failed validation: ${errorsWithPaths.join(', ')}`;
  };