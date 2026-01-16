import {
  Bold,
  Box,
  Button,
  Container,
  Footer,
  Heading,
  Icon,
  Image,
  Text,
} from '@metamask/snaps-sdk/jsx';

import type {
  PermissionIntroductionBulletPoint,
  PermissionIntroductionConfig,
  PermissionIntroductionPageConfig,
} from './types';
import indicatorSelected from '../../../images/indicator-selected.svg';
import indicatorUnselected from '../../../images/indicator-unselected.svg';
import permissionRequestImage from '../../../images/permission-request.svg';
import { t } from '../../utils/i18n';

// Button name constants for event handling
export const PERMISSION_INTRODUCTION_CONFIRM_BUTTON =
  'permission-introduction-confirm';
export const PERMISSION_INTRODUCTION_PREV_ARROW = 'intro-prev-arrow';
export const PERMISSION_INTRODUCTION_NEXT_ARROW = 'intro-next-arrow';

/**
 * Fixed page 2 content shared by all permission types.
 * This contains general information about advanced permissions.
 */
const fixedPage2Content: PermissionIntroductionPageConfig = {
  headerImageSvg: permissionRequestImage,
  title: 'introAdvancedPermissionsTitle',
  bulletPoints: [
    {
      icon: 'security-key',
      title: 'introSecureLimitedAccessTitle',
      description: 'introSecureLimitedAccessDescription',
    },
    {
      icon: 'customize',
      title: 'introFullyCustomizableControlTitle',
      description: 'introFullyCustomizableControlDescription',
    },
    {
      icon: 'sparkle',
      title: 'introTransparentConvenientTitle',
      description: 'introTransparentConvenientDescription',
    },
  ],
};

const subscriptionPage1Content: PermissionIntroductionPageConfig = {
  headerImageSvg: permissionRequestImage,
  title: 'introSubscriptionTitle',
  bulletPoints: [
    {
      description: 'introRecurringPaymentsDescription',
    },
    {
      description: 'introPermissionInControlDescription',
    },
  ],
};

const streamPage1Content: PermissionIntroductionPageConfig = {
  headerImageSvg: permissionRequestImage,
  title: 'introStreamTitle',
  bulletPoints: [
    {
      description: 'introContinuousTokenFlowDescription',
    },
    {
      description: 'introPermissionInControlDescription',
    },
  ],
};

const revocationPage1Content: PermissionIntroductionPageConfig = {
  headerImageSvg: permissionRequestImage,
  title: 'introRevocationTitle',
  bulletPoints: [
    {
      description: 'introManageTokenApprovalsDescription',
    },
    {
      description: 'introPermissionInControlDescription',
    },
  ],
};

/**
 * Map of permission types to their introduction configurations.
 * Note: Keys must match the permission type descriptor names (kebab-case).
 */
export const permissionIntroductionConfigs: Record<
  string,
  PermissionIntroductionConfig
> = {
  'erc20-token-periodic': {
    page1: subscriptionPage1Content,
    page2: fixedPage2Content,
  },
  'erc20-token-revocation': {
    page1: revocationPage1Content,
    page2: fixedPage2Content,
  },
  'erc20-token-stream': {
    page1: streamPage1Content,
    page2: fixedPage2Content,
  },
  'native-token-periodic': {
    page1: subscriptionPage1Content,
    page2: fixedPage2Content,
  },
  'native-token-stream': {
    page1: streamPage1Content,
    page2: fixedPage2Content,
  },
};

/**
 * Gets the permission introduction configuration for a given permission type.
 * @param permissionType - The permission type to get the config for.
 * @returns The permission introduction configuration, or undefined if not found.
 */
export function getPermissionIntroductionConfig(
  permissionType: string,
): PermissionIntroductionConfig | undefined {
  return permissionIntroductionConfigs[permissionType];
}

/**
 * Builds the introduction content UI for display in the dialog.
 * @param config - The configuration for the introduction content.
 * @param currentPage - The current page to display (1 or 2). Defaults to 1.
 * @returns The introduction UI as a JSX.Element.
 */
export function buildIntroductionContent(
  config: PermissionIntroductionConfig,
  currentPage: 1 | 2 = 1,
): JSX.Element {
  const pageConfig = currentPage === 1 ? config.page1 : config.page2;

  const getIconContent = (point: PermissionIntroductionBulletPoint) => {
    if (point.icon) {
      return (
        <Box>
          <Icon name={point.icon} color="primary" size="inherit" />
        </Box>
      );
    }
    return null;
  };

  const getTitleContent = (point: PermissionIntroductionBulletPoint) => {
    if (point.title) {
      return (
        <Text size="md">
          <Bold>{t(point.title)}</Bold>
        </Text>
      );
    }
    return null;
  };

  return (
    <Container backgroundColor="alternative">
      <Box direction="vertical">
        <Box center={true}>
          <Heading size="md">{t(pageConfig.title)}</Heading>
        </Box>
        <Image
          src={pageConfig.headerImageSvg}
          alt="Introduction illustration"
        />
        {pageConfig.bulletPoints.map((point, index) => (
          <Box key={`bullet-${index}`} direction="horizontal" alignment="start">
            {getIconContent(point)}

            <Box direction="vertical">
              {getTitleContent(point)}
              <Text>{t(point.description)}</Text>
            </Box>
          </Box>
        ))}
        <Box direction="horizontal" alignment="space-between">
          <Button
            name={PERMISSION_INTRODUCTION_PREV_ARROW}
            disabled={currentPage === 1}
          >
            <Icon name="arrow-left" size="md" />
          </Button>
          <Box direction="horizontal" alignment="center">
            <Image
              src={currentPage === 1 ? indicatorSelected : indicatorUnselected}
              alt="Page 1"
            />
            <Image
              src={currentPage === 2 ? indicatorSelected : indicatorUnselected}
              alt="Page 2"
            />
          </Box>
          <Button
            name={PERMISSION_INTRODUCTION_NEXT_ARROW}
            disabled={currentPage === 2}
          >
            <Icon name="arrow-right" size="md" />
          </Button>
        </Box>
      </Box>
      <Footer>
        <Button name={PERMISSION_INTRODUCTION_CONFIRM_BUTTON}>
          {t('introGotItButton')}
        </Button>
      </Footer>
    </Container>
  );
}
