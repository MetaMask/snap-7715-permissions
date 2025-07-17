import { Icon, Text, Tooltip } from '@metamask/snaps-sdk/jsx';

type TooltipIconProps = {
  tooltip: string;
};

/**
 * A reusable component that displays a question mark icon with a tooltip.
 * @param props - The component props.
 * @param props.tooltip - The tooltip text to display.
 * @returns A JSX element containing a tooltip with a question mark icon.
 */
export const TooltipIcon = ({ tooltip }: TooltipIconProps): JSX.Element => (
  <Tooltip content={<Text>{tooltip}</Text>}>
    <Icon name="question" size="inherit" color="muted" />
  </Tooltip>
);
