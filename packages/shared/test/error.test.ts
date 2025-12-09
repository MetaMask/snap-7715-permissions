import { describe, expect, it } from '@jest/globals';
import type { ZodIssue } from 'zod';

import { extractZodError } from '../src/utils/error';

describe('extractZodError', () => {
  it('should include field path for standard validation errors', () => {
    const issues: ZodIssue[] = [
      {
        code: 'invalid_string',
        path: ['permission', 'data', 'tokenAddress'],
        message: 'Invalid hex value',
        validation: 'regex',
      },
    ];

    const result = extractZodError(issues);
    expect(result).toBe(
      'Failed type validation: permission.data.tokenAddress: Invalid hex value',
    );
  });

  it('should prioritize custom message for rules refinement errors', () => {
    const issues: ZodIssue[] = [
      {
        code: 'custom',
        path: [0, 'rules'],
        message: 'Expiry rule is required',
      },
    ];

    const result = extractZodError(issues);
    expect(result).toBe('Failed type validation: Expiry rule is required');
  });

  it('should handle multiple errors correctly', () => {
    const issues: ZodIssue[] = [
      {
        code: 'invalid_string',
        path: ['chainId'],
        message: 'Invalid hex value',
        validation: 'regex',
      },
      {
        code: 'custom',
        path: [0, 'rules'],
        message: 'Expiry rule is required',
      },
    ];

    const result = extractZodError(issues);
    expect(result).toContain('chainId: Invalid hex value');
    expect(result).toContain('Expiry rule is required');
  });

  it('should NOT simplify non-custom errors with array indices', () => {
    const issues: ZodIssue[] = [
      {
        code: 'invalid_type',
        path: [0, 'rules'],
        message: 'Expected array, received string',
        expected: 'array',
        received: 'string',
      },
    ];

    const result = extractZodError(issues);
    expect(result).toBe(
      'Failed type validation: 0.rules: Expected array, received string',
    );
  });

  it('should NOT simplify custom errors with deeply nested paths', () => {
    const issues: ZodIssue[] = [
      {
        code: 'custom',
        path: [0, 'rules', 1, 'data', 'timestamp'],
        message: 'Invalid timestamp format',
      },
    ];

    const result = extractZodError(issues);
    expect(result).toBe(
      'Failed type validation: 0.rules.1.data.timestamp: Invalid timestamp format',
    );
  });

  it('should NOT simplify paths with field names containing "rules" that do not match the pattern', () => {
    const issues: ZodIssue[] = [
      {
        code: 'custom',
        path: ['accountRules', 'validation'],
        message: 'Account rules validation failed',
      },
    ];

    const result = extractZodError(issues);
    expect(result).toBe(
      'Failed type validation: accountRules.validation: Account rules validation failed',
    );
  });
});
