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
  DateTimePickerElement,
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
    | AccountSelectorElement
    | DateTimePickerElement;
};

export type FieldProps = InputFieldProps | ComplexFieldProps | ViewFieldProps;

const isInputFieldProps = (props: FieldProps): props is InputFieldProps => {
  return props.variant === 'form' && props.children.type === 'Input';
};

const isDisplayFieldProps = (props: FieldProps): props is ViewFieldProps => {
  return props.variant === 'display';
};

/**
 * Renders a form field component with optional label, tooltip, error message, icon, and toggle/add/remove buttons.
 *
 * The `Field` component supports three main field types:
 * - Display fields (with children and optional icon)
 * - Input fields (with children, optional icon, and remove button)
 * - Generic fields (with children only)
 *
 * Toggle functionality is enabled by providing both `addFieldButtonName` and `removeFieldButtonName`.
 * When toggling is enabled and the field is disabled, only the label section is shown.
 *
 * @param props - The properties for the Field component.
 * @param props.label - The label text for the field.
 * @param props.tooltip - Optional tooltip text for the label.
 * @param props.errorMessage - Optional error message to display.
 * @param props.disabled - Whether the field is disabled.
 * @param props.isFieldEnabled - Whether the field is currently enabled (default: true).
 * @param props.addFieldButtonName - Name for the add field button (enables toggle).
 * @param props.removeFieldButtonName - Name for the remove field button (enables toggle).
 * @param props.iconData - Optional icon data for display or input fields.
 * @param props.removeButtonName - Optional name for the remove button (input fields).
 * @param props.children - The content to render inside the field.
 *
 * @returns The rendered Field component.
 */
export const Field = (props: FieldProps): JSX.Element => {
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

  /**
   * The way to enable the toggle feature is to provide both
   * addFieldButtonName and removeFieldButtonName.
   */
  const hasToggleButtons = Boolean(addFieldButtonName ?? removeFieldButtonName);

  let toggleFieldButton: SnapElement | null = null;

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

  /**
   * Once the toggle feature is enabled, and the field is disabled,
   * we only show the label section.
   */
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
