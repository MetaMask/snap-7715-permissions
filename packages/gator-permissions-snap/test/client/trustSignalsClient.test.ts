import {
  TrustSignalsClient,
  RecommendedAction,
  extractOriginSchemeAndHost,
} from '../../src/clients/trustSignalsClient';

describe('extractOriginSchemeAndHost', () => {
  it('returns origin unchanged when it has no path or query', () => {
    expect(extractOriginSchemeAndHost('https://google.com')).toBe(
      'https://google.com',
    );
    expect(extractOriginSchemeAndHost('https://googl.ecom')).toBe(
      'https://googl.ecom',
    );
  });

  it('strips path and query from full URL', () => {
    expect(
      extractOriginSchemeAndHost('https://example.com/path/to/page'),
    ).toBe('https://example.com');
    expect(
      extractOriginSchemeAndHost('https://example.com/path?foo=bar&baz=1'),
    ).toBe('https://example.com');
    expect(extractOriginSchemeAndHost('https://googl.ecom/')).toBe(
      'https://googl.ecom',
    );
  });

  it('preserves non-default port', () => {
    expect(extractOriginSchemeAndHost('https://localhost:3000/foo')).toBe(
      'https://localhost:3000',
    );
  });
});

describe('TrustSignalsClient', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let client: TrustSignalsClient;

  beforeEach(() => {
    mockFetch = jest.fn();
    client = new TrustSignalsClient({
      baseUrl: 'https://trust.example.com',
      fetch: mockFetch,
      timeoutMs: 5000,
      maxResponseSizeBytes: 1024 * 1024,
    });
  });

  describe('fetchTrustSignal', () => {
    it('calls GET with scheme and host only in url param', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          domainName: 'google.com',
          recommendedAction: 'NONE',
          riskFactors: null,
          verified: true,
          status: 'COMPLETE',
        }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await client.fetchTrustSignal('https://google.com/search?q=test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://trust.example.com/scan?url=https%3A%2F%2Fgoogle.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/json',
            'User-Agent': 'MetaMask-Snap/1.0',
          }),
        }),
      );
    });

    it('returns isComplete true and recommendedAction when status is COMPLETE and action is valid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          domainName: 'google.com',
          recommendedAction: 'NONE',
          riskFactors: null,
          verified: true,
          status: 'COMPLETE',
        }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      const result = await client.fetchTrustSignal('https://google.com');

      expect(result).toEqual({
        isComplete: true,
        recommendedAction: RecommendedAction.NONE,
      });
    });

    it('returns BLOCK and WARN for valid recommendedAction', async () => {
      for (const action of ['BLOCK', 'WARN'] as const) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            domainName: 'example.com',
            recommendedAction: action,
            status: 'COMPLETE',
          }),
          headers: { get: jest.fn().mockReturnValue(null) },
        } as any);

        const result = await client.fetchTrustSignal('https://example.com');

        expect(result.recommendedAction).toBe(RecommendedAction[action]);
        expect(result.isComplete).toBe(true);
      }
    });

    it('returns isComplete false when status is not COMPLETE', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          domainName: 'example.com',
          recommendedAction: 'NONE',
          status: 'PENDING',
        }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      const result = await client.fetchTrustSignal('https://example.com');

      expect(result).toEqual({
        isComplete: false,
        recommendedAction: RecommendedAction.NONE,
      });
    });

    it('returns recommendedAction null when field is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          domainName: 'example.com',
          riskFactors: null,
          verified: true,
          status: 'COMPLETE',
        }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      const result = await client.fetchTrustSignal('https://example.com');

      expect(result).toEqual({
        isComplete: true,
        recommendedAction: null,
      });
    });

    it('returns recommendedAction null when value is not BLOCK | WARN | NONE', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          domainName: 'example.com',
          recommendedAction: 'UNKNOWN',
          status: 'COMPLETE',
        }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      const result = await client.fetchTrustSignal('https://example.com');

      expect(result).toEqual({
        isComplete: true,
        recommendedAction: null,
      });
    });

    it('returns recommendedAction null when value is lowercase', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          domainName: 'example.com',
          recommendedAction: 'none',
          status: 'COMPLETE',
        }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      const result = await client.fetchTrustSignal('https://example.com');

      expect(result.recommendedAction).toBeNull();
    });

    it('strips trailing slashes from baseUrl', async () => {
      const clientWithTrailingSlash = new TrustSignalsClient({
        baseUrl: 'https://trust.example.com/',
        fetch: mockFetch,
        timeoutMs: 5000,
        maxResponseSizeBytes: 1024 * 1024,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'COMPLETE' }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await clientWithTrailingSlash.fetchTrustSignal('https://example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://trust.example.com/scan?url=https%3A%2F%2Fexample.com',
        expect.any(Object),
      );
    });

    it('throws when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await expect(
        client.fetchTrustSignal('https://example.com'),
      ).rejects.toThrow('Resource not found: 404');
    });

    it('throws when response JSON is invalid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await expect(
        client.fetchTrustSignal('https://example.com'),
      ).rejects.toThrow('Failed to parse JSON response');
    });

    it('throws when response is missing status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await expect(
        client.fetchTrustSignal('https://example.com'),
      ).rejects.toThrow();
    });
  });
});
