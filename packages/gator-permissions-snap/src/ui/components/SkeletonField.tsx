import { Skeleton } from '@metamask/snaps-sdk/jsx';

import type { BaseFieldProps } from './Field';
import { Field } from './Field';

export type SkeletonFieldParams = Pick<BaseFieldProps, 'label' | 'tooltip'>;

export const SkeletonField = ({
  label,
  tooltip,
}: SkeletonFieldParams): JSX.Element => {
  return (
    <Field label={label} tooltip={tooltip} variant="display">
      <Skeleton />
    </Field>
  );
};
