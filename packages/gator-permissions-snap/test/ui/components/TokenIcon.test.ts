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

  it('should use custom width and height when provided', () => {
    const result = TokenIcon({
      imageDataBase64: validBase64Image,
      altText: 'Custom Size',
      width: 48,
      height: 48,
    });

    const expectedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <image href="${validBase64Image}" width="48" height="48" />
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
      altText: 'Invalid',
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should return empty Text for non-PNG image types', () => {
    const jpegImage =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';

    const result = TokenIcon({
      imageDataBase64: jpegImage,
      altText: 'JPEG',
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });

  it('should return empty Text when dimensions exceed maximum', () => {
    const result = TokenIcon({
      imageDataBase64: validBase64Image,
      altText: 'Too Large',
      width: 1000,
      height: 1000,
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        type: 'Text',
        props: { children: ' ' },
      }),
    );
  });
});
