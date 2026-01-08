import type { IconName } from '@metamask/snaps-sdk/jsx';

import type { MessageKey } from '../../utils/i18n';

/**
 * A bullet point item displayed in the permission introduction dialog.
 */
export type PermissionIntroductionBulletPoint = {
  /** The icon to display next to the bullet point */
  icon?: `${IconName}`;
  /** The translation key for the bold title text */
  title?: MessageKey;
  /** The translation key for the description text */
  description: MessageKey;
};

/**
 * Configuration for a page with bullet points and icons.
 */
export type PermissionIntroductionPageConfig = {
  /** Base64 encoded SVG for the header illustration */
  headerImageSvg: string;
  /** The translation key for the main title of the page */
  title: MessageKey;
  /** Array of bullet points to display */
  bulletPoints: PermissionIntroductionBulletPoint[];
};

/**
 * Configuration for a permission introduction dialog with 2 pages.
 */
export type PermissionIntroductionConfig = {
  /** Page 1 - Custom content per permission type (plain text) */
  page1: PermissionIntroductionPageConfig;
  /** Page 2 - Fixed content for all permissions (bullet points) */
  page2: PermissionIntroductionPageConfig;
};
