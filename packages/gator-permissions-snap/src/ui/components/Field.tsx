import {
  Box,
  Text,
  Button,
  Field as SnapField,
  Icon,
  Image,
} from '@metamask/snaps-sdk/jsx';
import type {
  AccountSelectorElement,
  AddressInputElement,
  AssetSelectorElement,
  CheckboxElement,
  DropdownElement,
  FileInputElement,
  GenericSnapElement,
  InputElement,
  RadioGroupElement,
  SelectorElement,
  SnapElement,
  SnapsChildren,
} from '@metamask/snaps-sdk/jsx';

import { TokenIcon } from './TokenIcon';
import { TooltipIcon } from './TooltipIcon';
import toggleDisabledImage from '../../../images/toggle_disabled.svg';
import toggleEnabledImage from '../../../images/toggle_enabled.svg';

export type BaseFieldProps = {
  label: string;
  tooltip?: string | undefined;
  errorMessage?: string | undefined;
  disabled?: boolean | undefined;
  isFieldEnabled?: boolean;
  addFieldButtonName?: string | undefined;
  removeFieldButtonName?: string | undefined;
};

export type ViewFieldProps = BaseFieldProps & {
  variant: 'display';
  children: SnapsChildren<GenericSnapElement>;
  iconData?:
    | {
        iconDataBase64: string;
        iconAltText: string;
      }
    | undefined;
};

export type InputFieldProps = BaseFieldProps & {
  variant: 'form';
  children: InputElement;
  iconData?:
    | {
        iconDataBase64: string;
        iconAltText: string;
      }
    | undefined;
  removeButtonName?: string | undefined;
};

export type ComplexFieldProps = BaseFieldProps & {
  variant: 'form';
  children:
    | DropdownElement
    | RadioGroupElement
    | FileInputElement
    | CheckboxElement
    | SelectorElement
    | AssetSelectorElement
    | AddressInputElement
    | AccountSelectorElement;
};

export type FieldProps = InputFieldProps | ComplexFieldProps | ViewFieldProps;

const isInputFieldProps = (props: FieldProps): props is InputFieldProps => {
  return props.variant === 'form' && props.children.type === 'Input';
};

const isDisplayFieldProps = (props: FieldProps): props is ViewFieldProps => {
  return props.variant === 'display';
};

export const Field = (props: FieldProps) => {
  const {
    label,
    tooltip,
    errorMessage,
    disabled,
    isFieldEnabled = true,
    addFieldButtonName,
    removeFieldButtonName,
  } = props;

  const tooltipElement = tooltip ? <TooltipIcon tooltip={tooltip} /> : null;

  let toggleFieldButton: SnapElement | null = null;
  const hasToggleButtons = Boolean(addFieldButtonName ?? removeFieldButtonName);

  if (hasToggleButtons && !disabled) {
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
  }

  const labelSection = (
    <Box direction="horizontal" alignment="space-between">
      <Box direction="horizontal">
        <Text>{label}</Text>
        {tooltipElement}
      </Box>
      {toggleFieldButton && <Box>{toggleFieldButton}</Box>}
    </Box>
  );

  if (hasToggleButtons && !isFieldEnabled) {
    return <Box direction="vertical">{labelSection}</Box>;
  }

  if (isInputFieldProps(props) || isDisplayFieldProps(props)) {
    const { iconData } = props;
    const iconElement = iconData ? (
      <TokenIcon
        imageDataBase64={iconData.iconDataBase64}
        altText={iconData.iconAltText}
      />
    ) : null;

    if (isDisplayFieldProps(props)) {
      const { children } = props;
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

    if (isInputFieldProps(props)) {
      const { removeButtonName, children } = props;

      const removeButtonElement =
        removeButtonName && !disabled ? (
          <Button name={removeButtonName} type="button">
            <Icon name="close" color="primary" size="md" />
          </Button>
        ) : null;

      return (
        <Box direction="vertical">
          {labelSection}
          <SnapField error={errorMessage}>
            <Box>{iconElement}</Box>
            {children}
            <Box>{removeButtonElement}</Box>
          </SnapField>
        </Box>
      );
    }
  }

  const { children } = props;

  return (
    <Box direction="vertical">
      {labelSection}
      <SnapField error={errorMessage}>{children}</SnapField>
    </Box>
  );
};
