import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Text, Section } from '@metamask/snaps-sdk/jsx';

import type { PermissionRulesProps } from '../..';

/**
 * Renders the native-token-stream permission rules.
 *
 * @param props - The permission rules props.
 * @param props.permissionRules - The permission rules.
 * @param props.expiry - The unix timestamp in seconds when the granted permission is set to expire.
 * @returns The JSX element to render.
 */
export const NativeTokenStreamPermissionRules: SnapComponent<
  PermissionRulesProps<'native-token-stream'>
> = ({ permissionRules, expiry }) => {
  return (
    <Section>
      <Text>{expiry.toString()}</Text>
      <Text>{JSON.stringify(permissionRules)}</Text>
    </Section>
  );
};
