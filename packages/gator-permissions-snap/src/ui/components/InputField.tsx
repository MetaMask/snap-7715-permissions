import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Text,
  Input,
  Field,
  Button,
  Image,
} from '@metamask/snaps-sdk/jsx';

import { TextField } from './TextField';
import { TokenIcon } from './TokenIcon';
import { TooltipIcon } from './TooltipIcon';
import toggleDisabledImage from '../../../images/toggle_disabled.svg';
import toggleEnabledImage from '../../../images/toggle_enabled.svg';

export type InputFieldParams = {
  label: string;
  name: string;
  addFieldButtonName?: string | undefined;
  removeFieldButtonName?: string | undefined;
  tooltip?: string | undefined;
  value: string | undefined;
  type: 'text' | 'number';
  disabled?: boolean;
  errorMessage?: string | undefined;
  iconData?:
    | {
        iconDataBase64: string;
        iconAltText: string;
      }
    | undefined;
};

export const InputField = ({
  label,
  name,
  addFieldButtonName,
  removeFieldButtonName,
  tooltip,
  type,
  value,
  disabled,
  errorMessage,
  iconData,
}: InputFieldParams) => {
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
        value={value ?? ''}
        tooltip={tooltip}
        iconData={iconData}
      />
    );
  }

  const tooltipElement = tooltip ? <TooltipIcon tooltip={tooltip} /> : null;
  const isFieldEnabled = value !== null && value !== undefined;

  let toggleFieldButton: SnapElement | null = null;

  const toggleFieldButtonName = isFieldEnabled
    ? removeFieldButtonName
    : addFieldButtonName;

  if (toggleFieldButtonName) {
    toggleFieldButton = (
      <Button name={toggleFieldButtonName}>
        <Image
          src={isFieldEnabled ? toggleEnabledImage : toggleDisabledImage}
          alt={isFieldEnabled ? `Remove ${label}` : `Add ${label}`}
        />
      </Button>
    );
  }

  return (
    <Box direction="vertical">
      <Box direction="horizontal" alignment="space-between">
        <Box direction="horizontal">
          <Text>{label}</Text>
          {tooltipElement}
        </Box>
        {toggleFieldButton && <Box>{toggleFieldButton}</Box>}
      </Box>
      {isFieldEnabled && (
        <Field error={errorMessage}>
          <Box>{iconElement}</Box>
          <Input name={name} type={type} value={value} />
        </Field>
      )}
    </Box>
  );
};
