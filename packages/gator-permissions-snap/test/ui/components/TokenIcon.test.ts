import { describe, expect, it, jest } from '@jest/globals';

import { TokenIcon } from '../../../src/ui/components/TokenIcon';

// Mock the logger and extractZodError utilities
jest.mock('@metamask/7715-permissions-shared/utils', () => ({
  logger: {
    warn: jest.fn(),
  },
  extractZodError: jest.fn((errors) => errors),
}));

describe('TokenIcon', () => {
  const validBase64Image =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

  it('should return empty Text when imageDataBase64 is null', () => {
    const result = TokenIcon({
      imageDataBase64: null,
      altText: 'Test Alt Text',
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should return empty Text when imageDataBase64 is empty string', () => {
    const result = TokenIcon({
      imageDataBase64: '',
      altText: 'Test Alt Text',
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should render Image with valid base64 PNG data URI', () => {
    const result = TokenIcon({
      imageDataBase64: validBase64Image,
      altText: 'Test PNG',
    });

    const expectedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="${validBase64Image}" width="24" height="24" />
  </svg>`;

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Image',
        props: { src: expectedSvg, alt: 'Test PNG' },
      }),
    );
  });

  it('should render Image with valid base64 JPEG data URI', () => {
    const jpegImage =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';

    const result = TokenIcon({
      imageDataBase64: jpegImage,
      altText: 'Test JPEG',
    });

    const expectedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="${jpegImage}" width="24" height="24" />
  </svg>`;

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Image',
        props: { src: expectedSvg, alt: 'Test JPEG' },
      }),
    );
  });

  it('should render Image with valid base64 SVG data URI', () => {
    const svgImage =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDA3M0U2Ii8+Cjwvc3ZnPgo=';

    const result = TokenIcon({
      imageDataBase64: svgImage,
      altText: 'Test SVG',
    });

    const expectedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="${svgImage}" width="24" height="24" />
  </svg>`;

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Image',
        props: { src: expectedSvg, alt: 'Test SVG' },
      }),
    );
  });

  it('should use custom width and height when provided', () => {
    const result = TokenIcon({
      imageDataBase64: validBase64Image,
      altText: 'Custom Size',
      width: 48,
      height: 32,
    });

    const expectedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32" viewBox="0 0 48 32">
    <image href="${validBase64Image}" width="48" height="32" />
  </svg>`;

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Image',
        props: { src: expectedSvg, alt: 'Custom Size' },
      }),
    );
  });

  it('should return empty Text for invalid data URI format', () => {
    const result = TokenIcon({
      imageDataBase64: 'invalid-data-uri',
      altText: 'Invalid URI',
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should return empty Text for non-base64 data URI', () => {
    const result = TokenIcon({
      imageDataBase64: 'data:image/png;base64,not-valid-base64!@#',
      altText: 'Invalid Base64',
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should return empty Text for unsupported image type', () => {
    const result = TokenIcon({
      imageDataBase64:
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      altText: 'Unsupported GIF',
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should return empty Text when width exceeds maximum', () => {
    const result = TokenIcon({
      imageDataBase64: validBase64Image,
      altText: 'Too Wide',
      width: 600,
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should return empty Text when height exceeds maximum', () => {
    const result = TokenIcon({
      imageDataBase64: validBase64Image,
      altText: 'Too Tall',
      height: 600,
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should return empty Text for zero or negative width', () => {
    const result = TokenIcon({
      imageDataBase64: validBase64Image,
      altText: 'Zero Width',
      width: 0,
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should return empty Text for zero or negative height', () => {
    const result = TokenIcon({
      imageDataBase64: validBase64Image,
      altText: 'Zero Height',
      height: -1,
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should return empty Text for non-integer width', () => {
    const result = TokenIcon({
      imageDataBase64: validBase64Image,
      altText: 'Float Width',
      width: 24.5,
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should use default altText when empty string provided', () => {
    const result = TokenIcon({
      imageDataBase64: validBase64Image,
      altText: '',
    });

    const expectedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="${validBase64Image}" width="24" height="24" />
  </svg>`;

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Image',
        props: { src: expectedSvg, alt: '' },
      }),
    );
  });

  it('should reject malicious SVG content with XSS protection', () => {
    const maliciousSvgContent =
      '<svg onload="alert(\'XSS\')" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
    const maliciousInput = `data:image/svg+xml;base64,${btoa(
      maliciousSvgContent,
    )}`;

    const result = TokenIcon({
      imageDataBase64: maliciousInput,
      altText: 'XSS Test',
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should return empty Text for non-data URI schemes', () => {
    const maliciousInput = 'http://example.com/malicious.svg';

    const result = TokenIcon({
      imageDataBase64: maliciousInput,
      altText: 'Non-data URI Test',
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should return empty Text for data URI with script content', () => {
    const maliciousInput = 'data:text/html,<script>alert("XSS")</script>';

    const result = TokenIcon({
      imageDataBase64: maliciousInput,
      altText: 'Script Content Test',
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should reject SVG with script element', () => {
    const maliciousSvgContent =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script><rect width="10" height="10"/></svg>';
    const maliciousInput = `data:image/svg+xml;base64,${btoa(
      maliciousSvgContent,
    )}`;

    const result = TokenIcon({
      imageDataBase64: maliciousInput,
      altText: 'Script Element Test',
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should reject SVG with foreignObject element', () => {
    const maliciousSvgContent =
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><script>alert("XSS")</script></foreignObject><rect width="10" height="10"/></svg>';
    const maliciousInput = `data:image/svg+xml;base64,${btoa(
      maliciousSvgContent,
    )}`;

    const result = TokenIcon({
      imageDataBase64: maliciousInput,
      altText: 'ForeignObject Test',
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should reject SVG with onclick attribute', () => {
    const maliciousSvgContent =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect onclick="alert(\'XSS\')" width="10" height="10"/></svg>';
    const maliciousInput = `data:image/svg+xml;base64,${btoa(
      maliciousSvgContent,
    )}`;

    const result = TokenIcon({
      imageDataBase64: maliciousInput,
      altText: 'OnClick Test',
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should accept safe SVG content', () => {
    const safeSvgContent =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect x="0" y="0" width="10" height="10" fill="blue"/></svg>';
    const safeInput = `data:image/svg+xml;base64,${btoa(safeSvgContent)}`;

    const result = TokenIcon({
      imageDataBase64: safeInput,
      altText: 'Safe SVG',
    });

    const expectedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="${safeInput}" width="24" height="24" />
  </svg>`;

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Image',
        props: { src: expectedSvg, alt: 'Safe SVG' },
      }),
    );
  });
});
