import { Box, Text, Input, Button, Icon } from '@metamask/snaps-sdk/jsx';

import { TextField } from './TextField';
import { TooltipIcon } from './TooltipIcon';
import { t } from '../../utils/i18n';
import {
  convertTimestampToReadableDate,
  convertTimestampToReadableTime,
} from '../../utils/time';

export type DateTimeValue = {
  timestamp: string;
  date: string;
  time: string;
};

export type DateTimeFieldParams = {
  label: string;
  name: string;
  removeButtonName?: string | undefined;
  tooltip?: string | undefined;
  value: DateTimeValue;
  disabled?: boolean;
  errorMessage?: string | undefined;
  iconData?:
    | {
        iconDataBase64: string;
        iconAltText: string;
      }
    | undefined;
};

export const DateTimeField = ({
  label,
  name,
  removeButtonName,
  tooltip,
  value,
  disabled,
  errorMessage,
  iconData,
}: DateTimeFieldParams) => {
  if (value.timestamp && !value.date && !value.time) {
    try {
      const timestamp = parseInt(value.timestamp, 10);
      if (!isNaN(timestamp)) {
        value.date = convertTimestampToReadableDate(timestamp);
        value.time = convertTimestampToReadableTime(timestamp);
      }
    } catch (error) {
      value.date = '';
      value.time = '';
    }
  }

  const date = new Date();
  const formatterShort = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
  });
  const shortTimeZoneName =
    formatterShort
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value ?? '';

  if (disabled) {
    return (
      <TextField
        label={label}
        value={`${value.date} ${value.time} ${shortTimeZoneName}`}
        tooltip={tooltip}
        iconData={iconData}
      />
    );
  }

  const tooltipElement = tooltip ? <TooltipIcon tooltip={tooltip} /> : null;
  const removeButtonElement = removeButtonName ? (
    <Button name={removeButtonName} type="button">
      <Icon name="close" color="primary" size="md" />
    </Button>
  ) : null;

  const errorElement = errorMessage ? (
    <Text size="sm" color="error">
      {errorMessage}
    </Text>
  ) : null;

  return (
    <Box direction="vertical">
      <Box direction="horizontal" alignment="space-between">
        <Box direction="horizontal">
          <Text>{label}</Text>
          {tooltipElement}
        </Box>
        <Box direction="horizontal" alignment="end">
          <Text color="muted" size="sm">
            {t('dateTimeFormat')}
          </Text>
        </Box>
      </Box>
      <Box direction="horizontal" alignment="space-between">
        <Box direction="horizontal">
          <Input
            name={`${name}_date`}
            type="text"
            value={value.date}
            placeholder={t('datePlaceholder')}
          />
          <Input
            name={`${name}_time`}
            type="text"
            value={value.time}
            placeholder={t('timePlaceholder')}
          />
          <Box direction="vertical" alignment="center">
            <Text alignment="center">{shortTimeZoneName}</Text>
          </Box>
        </Box>
      </Box>
      <Box>
        {removeButtonElement}
        {errorElement}
      </Box>
    </Box>
  );
};
