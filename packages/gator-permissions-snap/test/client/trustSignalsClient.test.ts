import {
  TrustSignalsClient,
  RecommendedAction,
  AddressScanResultType,
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
    expect(extractOriginSchemeAndHost('https://example.com/path/to/page')).toBe(
      'https://example.com',
    );
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
      securityAlertsBaseUrl: 'https://security-alerts.example.com',
      fetch: mockFetch,
      timeoutMs: 5000,
      maxResponseSizeBytes: 1024 * 1024,
    });
  });

  describe('scanDappUrl', () => {
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

      await client.scanDappUrl('https://google.com/search?q=test');

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

      const result = await client.scanDappUrl('https://google.com');

      expect(result).toStrictEqual({
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

        const result = await client.scanDappUrl('https://example.com');

        expect(result).toStrictEqual({
          isComplete: true,
          recommendedAction: RecommendedAction[action],
        });
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

      const result = await client.scanDappUrl('https://example.com');

      expect(result).toStrictEqual({
        isComplete: false,
      });
    });

    it('returns recommendedAction NONE when field is missing', async () => {
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

      const result = await client.scanDappUrl('https://example.com');

      expect(result).toStrictEqual({
        isComplete: true,
        recommendedAction: RecommendedAction.NONE,
      });
    });

    it('returns recommendedAction NONE when value is not BLOCK | WARN | NONE', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          domainName: 'example.com',
          recommendedAction: 'UNKNOWN',
          status: 'COMPLETE',
        }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      const result = await client.scanDappUrl('https://example.com');

      expect(result).toStrictEqual({
        isComplete: true,
        recommendedAction: RecommendedAction.NONE,
      });
    });

    it('returns recommendedAction NONE when value is lowercase', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          domainName: 'example.com',
          recommendedAction: 'none',
          status: 'COMPLETE',
        }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      const result = await client.scanDappUrl('https://example.com');

      expect(result).toStrictEqual({
        isComplete: true,
        recommendedAction: RecommendedAction.NONE,
      });
    });

    it('strips trailing slashes from baseUrl', async () => {
      const clientWithTrailingSlash = new TrustSignalsClient({
        baseUrl: 'https://trust.example.com/',
        securityAlertsBaseUrl: 'https://security-alerts.example.com',
        fetch: mockFetch,
        timeoutMs: 5000,
        maxResponseSizeBytes: 1024 * 1024,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'COMPLETE' }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await clientWithTrailingSlash.scanDappUrl('https://example.com');

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

      await expect(client.scanDappUrl('https://example.com')).rejects.toThrow(
        'Resource not found: 404',
      );
    });

    it('throws when response JSON is invalid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await expect(client.scanDappUrl('https://example.com')).rejects.toThrow(
        'Failed to parse JSON response',
      );
    });

    it('throws when response is missing status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await expect(client.scanDappUrl('https://example.com')).rejects.toThrow(
        'Invalid response structure',
      );
    });
  });

  describe('fetchAddressScan', () => {
    it('returns ErrorResult with empty label when chain is not in DEFAULT_CHAIN_ID_TO_NAME', async () => {
      const result = await client.fetchAddressScan('0x999999', '0xabc');

      expect(result).toStrictEqual({
        resultType: AddressScanResultType.ErrorResult,
        label: '',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns ErrorResult with empty label for empty string chainId without calling fetch', async () => {
      const result = await client.fetchAddressScan('', '0xabc');

      expect(result).toStrictEqual({
        resultType: AddressScanResultType.ErrorResult,
        label: '',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('pOSTs to security alerts URL with chain and address for known chain', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result_type: 'Benign',
          label: '',
        }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await client.fetchAddressScan(
        '0x1',
        '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://security-alerts.example.com/address/evm/scan',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
          body: JSON.stringify({
            chain: 'ethereum',
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          }),
        }),
      );
    });

    it('returns Benign, Warning, Malicious from API response', async () => {
      for (const resultType of [
        AddressScanResultType.Benign,
        AddressScanResultType.Warning,
        AddressScanResultType.Malicious,
      ] as const) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result_type: resultType,
            label:
              resultType === AddressScanResultType.Warning ? 'Suspicious' : '',
          }),
          headers: { get: jest.fn().mockReturnValue(null) },
        } as any);

        const result = await client.fetchAddressScan('0x1', '0xabc');

        expect(result.resultType).toBe(resultType);
        expect(result.label).toBe(
          resultType === AddressScanResultType.Warning ? 'Suspicious' : '',
        );
      }
    });

    it('returns ErrorResult when API returns unknown result_type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result_type: 'UnknownType',
          label: 'something',
        }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      const result = await client.fetchAddressScan('0x1', '0xabc');

      expect(result).toStrictEqual({
        resultType: AddressScanResultType.ErrorResult,
        label: 'something',
      });
    });

    it('strips trailing slash from securityAlertsBaseUrl', async () => {
      const clientWithTrailingSlash = new TrustSignalsClient({
        baseUrl: 'https://trust.example.com',
        securityAlertsBaseUrl: 'https://security-alerts.example.com/',
        fetch: mockFetch,
        timeoutMs: 5000,
        maxResponseSizeBytes: 1024 * 1024,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result_type: 'Benign', label: '' }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await clientWithTrailingSlash.fetchAddressScan('0x89', '0xdef');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://security-alerts.example.com/address/evm/scan',
        expect.any(Object),
      );
    });

    it('returns ErrorResult from API when API returns result_type ErrorResult', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result_type: 'ErrorResult',
          label: 'Chain not supported',
        }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      const result = await client.fetchAddressScan('0x1', '0xabc');

      expect(result).toStrictEqual({
        resultType: AddressScanResultType.ErrorResult,
        label: 'Chain not supported',
      });
    });

    it('resolves chain name from DEFAULT_CHAIN_ID_TO_NAME for multiple chains', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result_type: 'Benign', label: '' }),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await client.fetchAddressScan('0x89', '0xpolygon');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            chain: 'polygon',
            address: '0xpolygon',
          }),
        }),
      );
    });

    it('throws when security alerts response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await expect(client.fetchAddressScan('0x1', '0xabc')).rejects.toThrow(
        'Resource not found: 404',
      );
    });

    it('throws when security alerts response JSON is invalid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await expect(client.fetchAddressScan('0x1', '0xabc')).rejects.toThrow(
        'Failed to parse JSON response',
      );
    });

    it('throws when security alerts response is missing result_type or label', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        headers: { get: jest.fn().mockReturnValue(null) },
      } as any);

      await expect(client.fetchAddressScan('0x1', '0xabc')).rejects.toThrow(
        'Invalid response structure',
      );
    });
  });
});
