import {
  Box,
  Text,
  Button,
  Field as SnapField,
  Icon,
} from '@metamask/snaps-sdk/jsx';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';

import { TokenIcon } from './TokenIcon';
import { TooltipIcon } from './TooltipIcon';

export type BaseFieldProps = {
  label: string;
  tooltip?: string | undefined;
  errorMessage?: string | undefined;
  disabled?: boolean | undefined;
  iconData?:
    | {
        iconDataBase64: string;
        iconAltText: string;
      }
    | undefined;
  removeButtonName?: string | undefined;
  children: SnapElement;
  variant?: 'form' | 'display' | undefined;
};

export const Field = ({
  label,
  tooltip,
  errorMessage,
  disabled,
  iconData,
  removeButtonName,
  children,
  variant = 'form',
}: BaseFieldProps) => {
  const iconElement = iconData ? (
    <TokenIcon
      imageDataBase64={iconData.iconDataBase64}
      altText={iconData.iconAltText}
    />
  ) : null;

  const tooltipElement = tooltip ? <TooltipIcon tooltip={tooltip} /> : null;

  const removeButtonElement =
    removeButtonName && !disabled ? (
      <Button name={removeButtonName} type="button">
        <Icon name="close" color="primary" size="md" />
      </Button>
    ) : null;

  const labelSection = (
    <Box direction="horizontal">
      <Text>{label}</Text>
      {tooltipElement}
    </Box>
  );

  if (variant === 'display') {
    return (
      <Box direction="horizontal" alignment="space-between">
        {labelSection}
        <Box direction="horizontal">
          {iconElement}
          {children}
        </Box>
      </Box>
    );
  }

  return (
    <Box direction="vertical">
      <Box direction="horizontal" alignment="space-between">
        {labelSection}
      </Box>
      {/* TODO: The original Dropdown field don't use Box like other fields
          and the Snap UI doesn't support JSX fragments, so we had to work around it.
          Recommend making all fields self-contained without relying on Box. */}
      {children.type === 'Dropdown' ? (
        <SnapField error={errorMessage}>{children as JSX.Element}</SnapField>
      ) : (
        <SnapField error={errorMessage}>
          <Box>{iconElement}</Box>
          {children as JSX.Element}
          <Box>{removeButtonElement}</Box>
        </SnapField>
      )}
    </Box>
  );
};
