import { Skeleton } from '@metamask/snaps-sdk/jsx';

import { Field } from './Field';

export type SkeletonFieldParams = {
  label: string;
  tooltip?: string | undefined;
};

export const SkeletonField = ({ label, tooltip }: SkeletonFieldParams) => {
  return (
    <Field label={label} tooltip={tooltip} variant="display">
      <Skeleton />
    </Field>
  );
};
