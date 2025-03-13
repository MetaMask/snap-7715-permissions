import type { SupportedPermissionTypes } from '../src/orchestrators';
import { createPermissionOrchestrator } from '../src/orchestrators';

describe('PermissionOrchestrator Factory', () => {
  it('should return a PermissionOrchestrator when given native-token-stream permission type', () => {
    const orchestrator = createPermissionOrchestrator('native-token-stream');

    expect(orchestrator).toBeDefined();
    expect(orchestrator.parseAndValidate).toBeInstanceOf(Function);
    expect(orchestrator.buildPermissionConfirmationPage).toBeInstanceOf(
      Function,
    );
    expect(orchestrator.buildPermissionContext).toBeInstanceOf(Function);
  });
  it('should throw error when given a permission type that is not supported', async () => {
    expect(() =>
      createPermissionOrchestrator(
        'non-supported-permission' as SupportedPermissionTypes,
      ),
    ).toThrow('Permission type is not supported');
  });
});
