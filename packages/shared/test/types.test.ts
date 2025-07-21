import { zSanitizedJustification } from '../src/types/7715-permissions-types';

describe('zSanitizedJustification', () => {
  describe('Basic validation', () => {
    it('rejects empty strings', () => {
      expect(() => zSanitizedJustification.parse('')).toThrow(
        'Justification cannot be empty',
      );
      expect(() => zSanitizedJustification.parse('   ')).toThrow(
        'Justification cannot be empty',
      );
    });

    it('rejects strings longer than 120 characters', () => {
      const longString = 'a'.repeat(121);
      expect(() => zSanitizedJustification.parse(longString)).toThrow(
        'Justification cannot exceed 120 characters',
      );
    });

    it('accepts strings exactly 120 characters', () => {
      const exactString = 'a'.repeat(120);
      expect(() => zSanitizedJustification.parse(exactString)).not.toThrow();
    });
  });

  describe('Whitespace normalization', () => {
    it('trims leading and trailing whitespace', () => {
      const result = zSanitizedJustification.parse('  Hello World  ');
      expect(result).toBe('Hello World');
    });

    it('normalizes multiple spaces to single spaces', () => {
      const result = zSanitizedJustification.parse('Hello    World');
      expect(result).toBe('Hello World');
    });

    it('normalizes tabs and newlines to spaces', () => {
      const result = zSanitizedJustification.parse('Hello\tWorld\nTest');
      expect(result).toBe('Hello World Test');
    });
  });

  describe('HTML/XML injection prevention', () => {
    it.each([
      '<script>alert("xss")</script>',
      '<div>content</div>',
      '<iframe src="evil.com">',
      '<img src="x" onerror="alert(1)">',
      '<a href="javascript:alert(1)">click</a>',
      '<style>body{display:none}</style>',
      '<link rel="stylesheet" href="evil.css">',
      '<meta http-equiv="refresh" content="0;url=evil.com">',
    ])('rejects HTML tag: %s', (pattern) => {
      expect(() => zSanitizedJustification.parse(pattern)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });

    it.each([
      '<?xml version="1.0"?>',
      '<!DOCTYPE html>',
      '<![CDATA[<script>alert(1)</script>]]>',
      '&lt;script&gt;alert(1)&lt;/script&gt;',
      '&amp;lt;script&amp;gt;',
    ])('rejects XML pattern: %s', (pattern) => {
      expect(() => zSanitizedJustification.parse(pattern)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });
  });

  describe('JSON injection prevention', () => {
    it.each([
      '{"key": "value"}',
      '{"justification": "malicious"}',
      '["item1", "item2"]',
      '{"type": "object", "data": {}}',
      '"key": "value"',
      'key: "value"',
      '{"nested": {"object": "value"}}',
    ])('rejects JSON pattern: %s', (pattern) => {
      expect(() => zSanitizedJustification.parse(pattern)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });
  });

  describe('CSS injection prevention', () => {
    it.each([
      '@import url("evil.css")',
      '@media screen { body { display: none } }',
      '@keyframes slide { from { left: 0 } }',
      '@font-face { font-family: Arial }',
      'url("data:text/css,body{display:none}")',
      'behavior: url("evil.htc")',
      'expression(alert("xss"))',
    ])('rejects dangerous CSS pattern: %s', (pattern) => {
      expect(() => zSanitizedJustification.parse(pattern)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });

    it.each([
      'position: absolute; z-index: 9999',
      'overflow: hidden',
      '-webkit-transform: translateX(100px)',
      '-moz-box-shadow: 0 0 10px black',
      '-ms-transform: rotate(45deg)',
      '-o-transition: all 0.3s',
      'filter: blur(5px)',
    ])('allows benign CSS pattern: %s', (pattern) => {
      expect(() => zSanitizedJustification.parse(pattern)).not.toThrow();
    });
  });

  describe('Event handler prevention', () => {
    it.each([
      'onclick="alert(1)"',
      'onload="document.location=\'evil.com\'"',
      'onmouseover="alert(\'xss\')"',
      'onerror="alert(1)"',
      'onfocus="alert(1)"',
      'onblur="alert(1)"',
      'onchange="alert(1)"',
      'onsubmit="alert(1)"',
    ])('rejects event handler: %s', (handler) => {
      expect(() => zSanitizedJustification.parse(handler)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });
  });

  describe('Dangerous protocol prevention', () => {
    /* eslint-disable no-script-url */
    it.each([
      'javascript:alert("xss")',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox("xss")',
      'javascript:void(0)',
      'data:image/svg+xml,<svg onload="alert(1)">',
    ])('rejects dangerous protocol: %s', (protocol) => {
      expect(() => zSanitizedJustification.parse(protocol)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });
    /* eslint-enable no-script-url */
  });

  describe('Quote prevention', () => {
    it.each([
      'Text with "double quotes"',
      'Text with `backticks`',
      'Mixed "quotes" and `backticks`',
      'Just a " quote',
      'Just a ` quote',
    ])('rejects dangerous quotes: %s', (quoted) => {
      expect(() => zSanitizedJustification.parse(quoted)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });

    it.each([
      "Text with 'single quotes'",
      "It's a test case",
      "Don't worry about it",
      "We'll handle this",
      "Can't proceed without it",
      "Just a ' quote",
    ])('allows apostrophes: %s', (quoted) => {
      expect(() => zSanitizedJustification.parse(quoted)).not.toThrow();
    });
  });

  describe('Control character prevention', () => {
    it.each([
      'Text with \x00 null byte',
      'Text with \x01 start of heading',
      'Text with \x02 start of text',
      'Text with \x03 end of text',
      'Text with \x04 end of transmission',
      'Text with \x05 enquiry',
      'Text with \x06 acknowledge',
      'Text with \x07 bell',
      'Text with \x08 backspace',
      'Text with \x0B vertical tab',
      'Text with \x0C form feed',
      'Text with \x0E shift out',
      'Text with \x0F shift in',
      'Text with \x1F unit separator',
      'Text with \x7F delete',
    ])('rejects control character: %s', (text) => {
      expect(() => zSanitizedJustification.parse(text)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });

    it('allows newlines and tabs (they get normalized to spaces)', () => {
      const result = zSanitizedJustification.parse('Line 1\nLine 2\tLine 3');
      expect(result).toBe('Line 1 Line 2 Line 3');
    });
  });

  describe('UI redressing prevention', () => {
    it.each([
      'Pay to \u202Eevil.com\u202C', // RTL override
      'Text with \u202D left-to-right override',
      'Text with \u200E left-to-right mark',
      'Text with \u200F right-to-left mark',
    ])('rejects RTL/LTR override character: %s', (pattern) => {
      expect(() => zSanitizedJustification.parse(pattern)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });

    it.each([
      'Text with \u200B zero-width space',
      'Text with \u200C zero-width non-joiner',
      'Text with \u200D zero-width joiner',
      'Text with \uFEFF byte order mark',
    ])('rejects zero-width character: %s', (pattern) => {
      expect(() => zSanitizedJustification.parse(pattern)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });

    it.each([
      'Text with \u0300 combining grave accent',
      'Text with \u0301 combining acute accent',
      'Text with \u0302 combining circumflex accent',
      'Text with \u0303 combining tilde',
      'Text with \u0304 combining macron',
      'Text with \u0305 combining overline',
      'Text with \u0306 combining breve',
      'Text with \u0307 combining dot above',
      'Text with \u0308 combining diaeresis',
      'Text with \u0309 combining hook above',
      'Text with \u030A combining ring above',
      'Text with \u030B combining double acute accent',
      'Text with \u030C combining caron',
      'Text with \u030D combining vertical line above',
      'Text with \u030E combining double vertical line above',
      'Text with \u030F combining double grave accent',
      'Text with \u0310 combining candrabindu',
      'Text with \u0311 combining inverted breve',
      'Text with \u0312 combining turned comma above',
      'Text with \u0313 combining comma above',
      'Text with \u0314 combining reversed comma above',
      'Text with \u0315 combining comma above right',
      'Text with \u0316 combining grave accent below',
      'Text with \u0317 combining acute accent below',
      'Text with \u0318 combining left tack below',
      'Text with \u0319 combining right tack below',
      'Text with \u031A combining left angle above',
      'Text with \u031B combining horn',
      'Text with \u031C combining left half ring below',
      'Text with \u031D combining up tack below',
      'Text with \u031E combining down tack below',
      'Text with \u031F combining plus sign below',
      'Text with \u0320 combining minus sign below',
      'Text with \u0321 combining palatalized hook below',
      'Text with \u0322 combining retroflex hook below',
      'Text with \u0323 combining dot below',
      'Text with \u0324 combining diaeresis below',
      'Text with \u0325 combining ring below',
      'Text with \u0326 combining comma below',
      'Text with \u0327 combining cedilla',
      'Text with \u0328 combining ogonek',
      'Text with \u0329 combining vertical line below',
      'Text with \u032A combining bridge below',
      'Text with \u032B combining inverted double arch below',
      'Text with \u032C combining caron below',
      'Text with \u032D combining circumflex accent below',
      'Text with \u032E combining breve below',
      'Text with \u032F combining inverted breve below',
      'Text with \u0330 combining tilde below',
      'Text with \u0331 combining macron below',
      'Text with \u0332 combining low line',
      'Text with \u0333 combining double low line',
      'Text with \u0334 combining tilde overlay',
      'Text with \u0335 combining short stroke overlay',
      'Text with \u0336 combining long stroke overlay',
      'Text with \u0337 combining short solidus overlay',
      'Text with \u0338 combining long solidus overlay',
      'Text with \u0339 combining right half ring below',
      'Text with \u033A combining inverted bridge below',
      'Text with \u033B combining square below',
      'Text with \u033C combining seagull below',
      'Text with \u033D combining x above',
      'Text with \u033E combining vertical tilde',
      'Text with \u033F combining double overline',
      'Text with \u0340 combining grave tone mark',
      'Text with \u0341 combining acute tone mark',
      'Text with \u0342 combining perispomeni',
      'Text with \u0343 combining koronis',
      'Text with \u0344 combining dialytika tonos',
      'Text with \u0345 combining ypogegrammeni',
      'Text with \u0346 combining bridge above',
      'Text with \u0347 combining equals sign below',
      'Text with \u0348 combining double vertical line below',
      'Text with \u0349 combining left angle below',
      'Text with \u034A combining not tilde above',
      'Text with \u034B combining homothetic above',
      'Text with \u034C combining almost equal to above',
      'Text with \u034D combining left right arrow below',
      'Text with \u034E combining upwards arrow below',
      'Text with \u034F combining grapheme joiner',
      'Text with \u0350 combining right arrowhead above',
      'Text with \u0351 combining left half ring above',
      'Text with \u0352 combining fermata',
      'Text with \u0353 combining x below',
      'Text with \u0354 combining left arrowhead below',
      'Text with \u0355 combining right arrowhead below',
      'Text with \u0356 combining right arrowhead and up arrowhead below',
      'Text with \u0357 combining right half ring above',
      'Text with \u0358 combining ring above',
      'Text with \u0359 combining equal sign above',
      'Text with \u035A combining double reverse solidus below',
      'Text with \u035B combining double vertical line above',
      'Text with \u035C combining double low line',
      'Text with \u035D combining crossed double low line',
      'Text with \u035E combining almost equal to below',
      'Text with \u035F combining left arrowhead above',
      'Text with \u0360 combining right arrowhead above',
      'Text with \u0361 combining double breve below',
      'Text with \u0362 combining double breve',
      'Text with \u0363 combining double breve above',
      'Text with \u0364 combining double breve below',
      'Text with \u0365 combining double breve above',
      'Text with \u0366 combining double breve below',
      'Text with \u0367 combining double breve above',
      'Text with \u0368 combining double breve below',
      'Text with \u0369 combining double breve above',
      'Text with \u036A combining double breve below',
      'Text with \u036B combining double breve above',
      'Text with \u036C combining double breve below',
      'Text with \u036D combining double breve above',
      'Text with \u036E combining double breve below',
      'Text with \u036F combining double breve above',
    ])('rejects combining diacritical mark: %s', (pattern) => {
      expect(() => zSanitizedJustification.parse(pattern)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });

    it.each([
      'Pay to \uFF41\uFF56\uFF49\uFF4C.com', // Full-width 'evil'
      'Text with \uFF21 full-width A',
      'Text with \uFF22 full-width B',
      'Text with \uFF23 full-width C',
      'Text with \uFF24 full-width D',
      'Text with \uFF25 full-width E',
      'Text with \uFF26 full-width F',
      'Text with \uFF27 full-width G',
      'Text with \uFF28 full-width H',
      'Text with \uFF29 full-width I',
      'Text with \uFF2A full-width J',
      'Text with \uFF2B full-width K',
      'Text with \uFF2C full-width L',
      'Text with \uFF2D full-width M',
      'Text with \uFF2E full-width N',
      'Text with \uFF2F full-width O',
      'Text with \uFF30 full-width P',
      'Text with \uFF31 full-width Q',
      'Text with \uFF32 full-width R',
      'Text with \uFF33 full-width S',
      'Text with \uFF34 full-width T',
      'Text with \uFF35 full-width U',
      'Text with \uFF36 full-width V',
      'Text with \uFF37 full-width W',
      'Text with \uFF38 full-width X',
      'Text with \uFF39 full-width Y',
      'Text with \uFF3A full-width Z',
    ])('rejects full-width character (homograph attack): %s', (pattern) => {
      expect(() => zSanitizedJustification.parse(pattern)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });
  });

  describe('Edge cases and complex attacks', () => {
    it.each([
      'Pay to \u202E<script>alert(1)</script>\u202C',
      'Text with \u200Bjavascript:alert(1)',
      '{"key": "\u202Eevil.com\u202C"}',
      '<div>\u200B@import url("evil.css")</div>',
      'onclick="\u202Ealert(1)\u202C"',
    ])('rejects mixed attack vector: %s', (attack) => {
      expect(() => zSanitizedJustification.parse(attack)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });

    it('handles boundary conditions', () => {
      // Test with maximum allowed length
      const maxLength = 'a'.repeat(120);
      expect(() => zSanitizedJustification.parse(maxLength)).not.toThrow();

      // Test with minimum allowed length
      expect(() => zSanitizedJustification.parse('a')).not.toThrow();

      // Test with exactly 120 characters containing spaces
      const maxLengthWithSpaces = 'a '.repeat(60).trim();
      expect(() =>
        zSanitizedJustification.parse(maxLengthWithSpaces),
      ).not.toThrow();
    });

    it.each([
      '&#60;script&#62;alert(1)&#60;/script&#62;',
      '&lt;script&gt;alert(1)&lt;/script&gt;',
      '&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;',
      '\\u003Cscript\\u003Ealert(1)\\u003C/script\\u003E',
    ])('rejects encoded attack: %s', (attack) => {
      expect(() => zSanitizedJustification.parse(attack)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });
  });

  describe('Real-world scenarios', () => {
    it.each([
      'Gas fee payment',
      'Monthly subscription',
      'Payment for services rendered',
      'Transfer to family member',
      'Donation to charity',
      'Payment for goods',
      'Service fee',
      'Transaction fee',
      'Network fee',
      'Processing fee',
      'Transfer to savings account',
      'Payment for utilities',
      'Rent payment',
      'Insurance premium',
      'Tax payment',
      'Investment contribution',
      'Emergency fund transfer',
      'Business expense',
      'Personal expense',
      'Loan repayment',
    ])('accepts legitimate justification: %s', (justification) => {
      expect(() => zSanitizedJustification.parse(justification)).not.toThrow();
    });

    /* eslint-disable no-script-url */
    it.each([
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      'onclick="alert(\'XSS\')"',
      '{"type": "malicious"}',
      '@import url("evil.css")',
      'Pay to \u202Eevil.com\u202C',
      'Text with \u200B hidden content',
      '&lt;script&gt;alert(1)&lt;/script&gt;',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox("XSS")',
    ])('rejects attack pattern: %s', (pattern) => {
      expect(() => zSanitizedJustification.parse(pattern)).toThrow(
        'Justification contains invalid characters or patterns',
      );
    });
    /* eslint-enable no-script-url */
  });
});
