import { Icon, Box, Text, Tooltip } from '@metamask/snaps-sdk/jsx';

export type TextFieldParams = {
  label: string;
  value: string;
  tooltip?: string | undefined;
};

export const TextField = ({ label, value, tooltip }: TextFieldParams) => {
  const tooltipElement = tooltip ? (
    <Tooltip content={<Text>{tooltip}</Text>}>
      <Icon name="question" size="inherit" color="muted" />
    </Tooltip>
  ) : null;

  return (
    <Box direction="vertical">
      <Box direction="horizontal" alignment="space-between">
        <Box direction="horizontal">
          <Text>{label}</Text>
          {tooltipElement}
        </Box>
      </Box>
      <Text>{value}</Text>
    </Box>
  );
};
