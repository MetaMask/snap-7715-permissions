import { Box, Text, Button } from '@metamask/snaps-sdk/jsx';

import { t } from '../../utils/i18n';

export type ShowMoreTextProps = {
  text: string;
  buttonName: string;
  isCollapsed: boolean;
};

const MAX_TEXT_LENGTH = 20;
const ELLIPSIS_TEXT_LENGTH = MAX_TEXT_LENGTH - 3; // 3 is the length of the ellipsis

export const ShowMoreText = ({
  text,
  buttonName,
  isCollapsed,
}: ShowMoreTextProps) => {
  const displayText =
    text.length > MAX_TEXT_LENGTH && isCollapsed
      ? `${text.slice(0, ELLIPSIS_TEXT_LENGTH)}...`
      : text;
  const buttonText = isCollapsed ? t('showMoreButton') : t('hideButton');

  return (
    <Box direction={isCollapsed ? 'horizontal' : 'vertical'}>
      <Text color="muted">{displayText}</Text>
      <Box direction="horizontal" alignment="end">
        <Button name={buttonName}>{buttonText}</Button>
      </Box>
    </Box>
  );
};
