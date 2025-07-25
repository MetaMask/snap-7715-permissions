import { Box, Text, Input, Button, Icon } from '@metamask/snaps-sdk/jsx';

import { TextField } from './TextField';
import { TokenIcon } from './TokenIcon';
import { TooltipIcon } from './TooltipIcon';
import { 
  convertTimestampToReadableDate, 
  convertTimestampToReadableTime,
} from '../../utils/time';

export type DateTimeValue = {
  timestamp: string;
  date: string;
  time: string;
}

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
  iconData
}: DateTimeFieldParams) => {

  const iconElement = iconData ? (
    <TokenIcon
      imageDataBase64={iconData.iconDataBase64}
      altText={iconData.iconAltText}
    />
  ) : null;

  if (disabled) {
    return (
      <TextField
        label={label}
        value={value}
        tooltip={tooltip}
        iconData={iconData}
      />
    );
  }

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

  const tooltipElement = tooltip ? <TooltipIcon tooltip={tooltip} /> : null;
  const removeButtonElement = removeButtonName ? (
    <Button name={removeButtonName} type="button">
      <Icon name="close" color="primary" size="md" />
    </Button>
  ) : null;

  const errorElement = errorMessage ? (<Text color="error">{errorMessage}</Text>) : null;

  return (
    <Box direction="vertical">
      <Box direction="horizontal" alignment="space-between">
        <Box direction="horizontal">
          <Text>{label}</Text>
          {tooltipElement}
        </Box>
      </Box>
      <Box direction="horizontal" alignment="space-between">
        <Box direction="horizontal">
          {iconElement}
          <Input 
            name={name+ '_date'} 
            type="text" 
            value={value.date}
            placeholder="Date"
          />
        </Box>
        <Box direction="horizontal">
          <Input name={name + '_time'} type="text" value={value.time} placeholder="HH:MM:SS"  />
        </Box>
      </Box>
      <Box>
        {removeButtonElement}
        {errorElement}
      </Box>
    </Box>
  );
  
};
