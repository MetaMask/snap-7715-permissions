import {
  Box,
  Text,
  Button,
  Field as SnapField,
  Icon,
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
  SnapsChildren,
} from '@metamask/snaps-sdk/jsx';

import { TokenIcon } from './TokenIcon';
import { TooltipIcon } from './TooltipIcon';

export type BaseFieldProps = {
  label: string;
  tooltip?: string | undefined;
  errorMessage?: string | undefined;
  disabled?: boolean | undefined;
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
  const { label, tooltip, errorMessage, disabled } = props;

  const tooltipElement = tooltip ? <TooltipIcon tooltip={tooltip} /> : null;

  const labelSection = (
    <Box direction="horizontal">
      <Text>{label}</Text>
      {tooltipElement}
    </Box>
  );

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
          <Box direction="horizontal" alignment="space-between">
            {labelSection}
          </Box>

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
      <Box direction="horizontal" alignment="space-between">
        {labelSection}
      </Box>
      <SnapField error={errorMessage}>{children}</SnapField>
    </Box>
  );
};
