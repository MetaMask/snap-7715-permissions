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
import advancedPermissionsImage from '../../../images/advanced-permissions.svg';
import newPermissionTypeImage from '../../../images/new-permission-type.svg';

// Button name constants for event handling
export const PERMISSION_INTRODUCTION_CONFIRM_BUTTON =
  'permission-introduction-confirm';
export const PERMISSION_INTRODUCTION_PAGE_1_DOT = 'intro-page-1-dot';
export const PERMISSION_INTRODUCTION_PAGE_2_DOT = 'intro-page-2-dot';

/**
 * Fixed page 2 content shared by all permission types.
 * This contains general information about advanced permissions.
 */
const fixedPage2Content: PermissionIntroductionPageConfig = {
  headerImageSvg: advancedPermissionsImage,
  title: 'Advanced permissions keep you in control',
  bulletPoints: [
    {
      icon: 'security-key',
      title: 'Secure, limited access',
      description: 'Restrict sites and revoke access on your terms.',
    },
    {
      icon: 'customize',
      title: 'Fully customizable control',
      description: 'Review, edit, or add rules so permissions meet your needs.',
    },
    {
      icon: 'sparkle',
      title: 'Transparent and convenient',
      description: 'Easily manage permissions all from one place.',
    },
  ],
};

const subscriptionPage1Content: PermissionIntroductionPageConfig = {
  headerImageSvg: newPermissionTypeImage,
  title: 'This site wants to create a token subscription',
  bulletPoints: [
    {
      description:
        'Token subscriptions give sites permission to pull tokens from your wallet on the schedule you set.',
    },
    {
      description:
        'You can edit or revoke this permission at any time in advanced permissions.',
    },
  ],
};

const streamPage1Content: PermissionIntroductionPageConfig = {
  headerImageSvg: newPermissionTypeImage,
  title: 'This site wants to create a token stream',
  bulletPoints: [
    {
      description:
        'Token streams give sites permission to pull increments of tokens from your wallet over a period of time you set.',
    },
    {
      description:
        'You can edit or revoke this permission at any time in advanced permissions.',
    },
  ],
};

const revocationPage1Content: PermissionIntroductionPageConfig = {
  headerImageSvg: newPermissionTypeImage,
  title: 'This site is asking for token revocation permissions',
  bulletPoints: [
    {
      description:
        'Token revocation allows sites to revoke token approvals on your behalf.',
    },
    {
      description:
        'You can edit or revoke this permission at any time in advanced permissions.',
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
          <Bold>{point.title}</Bold>
        </Text>
      );
    }
    return null;
  };

  return (
    <Container>
      <Box direction="vertical">
        <Image
          src={pageConfig.headerImageSvg}
          alt="Introduction illustration"
        />
        <Heading size="md">{pageConfig.title}</Heading>
        {pageConfig.bulletPoints.map((point, index) => (
          <Box key={`bullet-${index}`} direction="horizontal" alignment="start">
            {getIconContent(point)}

            <Box direction="vertical">
              {getTitleContent(point)}
              <Text>{point.description}</Text>
            </Box>
          </Box>
        ))}
        <Box direction="horizontal" alignment="center">
          <Button name={PERMISSION_INTRODUCTION_PAGE_1_DOT} variant="primary">
            {currentPage === 1 ? '●' : '○'}
          </Button>
          <Button name={PERMISSION_INTRODUCTION_PAGE_2_DOT} variant="primary">
            {currentPage === 2 ? '●' : '○'}
          </Button>
        </Box>
      </Box>
      <Footer>
        <Button name={PERMISSION_INTRODUCTION_CONFIRM_BUTTON}>Got it</Button>
      </Footer>
    </Container>
  );
}
