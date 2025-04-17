import type { CoreCaveatBuilder } from '@metamask/delegation-toolkit';
import type { ValidatedNativeTokenStreamPermissionRequest } from './types';

/**
 * Appends permission-specific caveats to the caveat builder.
 */
export function appendCaveats({
  permissionRequest,
  caveatBuilder,
}: {
  permissionRequest: ValidatedNativeTokenStreamPermissionRequest;
  caveatBuilder: CoreCaveatBuilder;
}): CoreCaveatBuilder {
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permissionRequest.permission.data;

  caveatBuilder
    .addCaveat(
      'nativeTokenStreaming',
      BigInt(initialAmount),
      BigInt(maxAmount),
      BigInt(amountPerSecond),
      startTime,
    )
    // don't allow any calldata as this could be used to extract additional authority
    // not included in a native token stream permission
    .addCaveat('exactCalldata', '0x');

  return caveatBuilder;
}
