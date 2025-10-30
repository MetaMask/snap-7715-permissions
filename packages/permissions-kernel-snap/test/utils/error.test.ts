import {
  MethodNotFoundError,
  MethodNotSupportedError,
  ParseError,
  UnauthorizedError,
  InternalError,
  InvalidParamsError,
  InvalidRequestError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';

import { deserializeSnapError } from '../../src/utils/error';

describe('deserializeSnapError', () => {
  it('should deserialize UserRejectedRequestError (code 4001)', () => {
    const serializedError = {
      code: 4001,
      message: 'User rejected the request',
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(UserRejectedRequestError);
    expect(result?.message).toBe('User rejected the request');
  });

  it('should deserialize ParseError (code -32700)', () => {
    const serializedError = {
      code: -32700,
      message: 'Parse error occurred',
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(ParseError);
    expect(result?.message).toBe('Parse error occurred');
  });

  it('should deserialize InvalidRequestError (code -32600)', () => {
    const serializedError = {
      code: -32600,
      message: 'Invalid request',
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(InvalidRequestError);
    expect(result?.message).toBe('Invalid request');
  });

  it('should deserialize MethodNotFoundError (code -32601)', () => {
    const serializedError = {
      code: -32601,
      message: 'Method not found',
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(MethodNotFoundError);
    expect(result?.message).toBe('Method not found');
  });

  it('should deserialize InvalidParamsError (code -32602)', () => {
    const serializedError = {
      code: -32602,
      message: 'Invalid params',
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(InvalidParamsError);
    expect(result?.message).toBe('Invalid params');
  });

  it('should deserialize InternalError (code -32603)', () => {
    const serializedError = {
      code: -32603,
      message: 'Internal error',
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(InternalError);
    expect(result?.message).toBe('Internal error');
  });

  it('should deserialize MethodNotSupportedError (code -32004)', () => {
    const serializedError = {
      code: -32004,
      message: 'Method not supported',
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(MethodNotSupportedError);
    expect(result?.message).toBe('Method not supported');
  });

  it('should deserialize UnauthorizedError (code 4100)', () => {
    const serializedError = {
      code: 4100,
      message: 'Unauthorized',
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(UnauthorizedError);
    expect(result?.message).toBe('Unauthorized');
  });

  it('should return null for unknown error code', () => {
    const serializedError = {
      code: 9999,
      message: 'Unknown error',
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeNull();
  });

  it('should return null for non-object error', () => {
    const result1 = deserializeSnapError('string error');
    const result2 = deserializeSnapError(123);
    const result3 = deserializeSnapError(null);

    expect(result1).toBeNull();
    expect(result2).toBeNull();
    expect(result3).toBeNull();
  });

  it('should return null for object without code property', () => {
    const serializedError = {
      message: 'Error without code',
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeNull();
  });

  it('should use default message when message is missing', () => {
    const serializedError = {
      code: 4001,
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(UserRejectedRequestError);
    expect(result?.message).toBe('Unknown error');
  });

  it('should use default message when message is not a string', () => {
    const serializedError = {
      code: 4001,
      message: 123,
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(UserRejectedRequestError);
    expect(result?.message).toBe('Unknown error');
  });

  it('should preserve stack trace when available', () => {
    const serializedError = {
      code: 4001,
      message: 'User rejected',
      stack: 'Error: User rejected\n    at Object.<anonymous> (test.ts:10:15)',
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(UserRejectedRequestError);
    expect(result?.stack).toBe(
      'Error: User rejected\n    at Object.<anonymous> (test.ts:10:15)',
    );
  });

  it('should preserve additional data when available', () => {
    const serializedError = {
      code: 4001,
      message: 'User rejected',
      data: {
        foo: 'bar',
        nested: { key: 'value' },
      },
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(UserRejectedRequestError);
    expect((result as any).data).toStrictEqual({
      foo: 'bar',
      nested: { key: 'value' },
    });
  });

  it('should handle errors with both stack and data', () => {
    const serializedError = {
      code: -32603,
      message: 'Internal error occurred',
      stack: 'Error: Internal error\n    at handler.ts:100:20',
      data: {
        details: 'Connection timeout',
        retryable: true,
      },
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(InternalError);
    expect(result?.message).toBe('Internal error occurred');
    expect(result?.stack).toBe(
      'Error: Internal error\n    at handler.ts:100:20',
    );
    expect((result as any).data).toStrictEqual({
      details: 'Connection timeout',
      retryable: true,
    });
  });

  it('should not fail when stack is not a string', () => {
    const serializedError = {
      code: 4001,
      message: 'User rejected',
      stack: 123,
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(UserRejectedRequestError);
    // Stack should not be set since it wasn't a string
    expect(typeof result?.stack).toBe('string'); // Should have default Error stack
  });

  it('should not fail when data is not an object', () => {
    const serializedError = {
      code: 4001,
      message: 'User rejected',
      data: 'not an object',
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(UserRejectedRequestError);
    expect((result as any).data).toBeUndefined();
  });

  it('should not fail when data is null', () => {
    const serializedError = {
      code: 4001,
      message: 'User rejected',
      data: null,
    };

    const result = deserializeSnapError(serializedError);

    expect(result).toBeInstanceOf(UserRejectedRequestError);
    expect((result as any).data).toBeUndefined();
  });
});
