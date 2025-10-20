import { mockSnapGlobal } from '../../jest.setup';
import { t, getCurrentLocale, setupI18n } from '../../src/utils/i18n';

describe('i18n utility', () => {
  describe('setupI18n()', () => {
    it('should initialize with English locale by default', async () => {
      await setupI18n();
      expect(getCurrentLocale()).toBe('en');
    });

    it('should fallback to English when unsupported locale is requested', async () => {
      mockSnapGlobal('fr');
      await setupI18n();
      expect(getCurrentLocale()).toBe('en');
    });

    it('should handle language code from full locale (e.g., en-US)', async () => {
      mockSnapGlobal('en-US');
      await setupI18n();
      expect(getCurrentLocale()).toBe('en');
    });
  });

  describe('t()', () => {
    it('should translate a simple key', () => {
      expect(t('recipientLabel')).toBe('Recipient');
    });

    it('should translate with variable substitution', () => {
      expect(t('streamRateValue', ['10', 'ETH'])).toBe('10 ETH/sec');
    });

    it('should handle missing translation key by returning the key', () => {
      const result = t('nonExistentKey' as any);
      expect(result).toBe('nonExistentKey');
    });

    it('should handle multiple substitutions', () => {
      // Assuming we add a message with multiple placeholders
      const result = t('streamRateValue', ['100', 'USDC']);
      expect(result).toBe('100 USDC/sec');
    });

    it('should handle empty substitutions array', () => {
      const result = t('recipientLabel', []);
      expect(result).toBe('Recipient');
    });

    it('should handle undefined substitutions', () => {
      const result = t('recipientLabel', undefined);
      expect(result).toBe('Recipient');
    });
  });

  describe('getCurrentLocale()', () => {
    it('should return current locale code', async () => {
      expect(getCurrentLocale()).toBe('en');
    });
  });
});
