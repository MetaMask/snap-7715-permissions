import { describe, expect, beforeEach, it } from '@jest/globals';
import {
  type BaseOrchestratorParams,
  type Orchestrator,
  OrchestratorRegistry,
} from '../../src/rpc/orchestratorRegistry';

describe('OrchestratorRegistry', () => {
  type TestOrchestratorParams = BaseOrchestratorParams & {
    validationShouldSucceed: boolean;
  };

  const testOrchestrator: Orchestrator<TestOrchestratorParams> = {
    permissionType: 'test',
    validateParams: jest.fn((params) => params.validationShouldSucceed) as any,
    execute: jest.fn((_) => ({ success: true })) as any,
  };

  let registry: OrchestratorRegistry;

  beforeEach(() => {
    registry = new OrchestratorRegistry();
  });

  it('should be defined', () => {
    expect(registry).toBeDefined();
  });

  describe('registerOrchestrator()', () => {
    it('should register an orchestrator', () => {
      registry.registerOrchestrator(testOrchestrator);

      expect(
        registry.registeredOrchestrators[testOrchestrator.permissionType],
      ).toBe(testOrchestrator);
    });

    it('should throw an error if an orchestrator is registered twice', () => {
      registry.registerOrchestrator(testOrchestrator);

      expect(() => registry.registerOrchestrator(testOrchestrator)).toThrow(
        `Orchestrator for permission type ${testOrchestrator.permissionType} already registered`,
      );
    });
  });

  describe('orchestrate()', () => {
    beforeEach(() => {
      registry.registerOrchestrator(testOrchestrator);
    });

    it('should reject with an error if the orchestrator is not registered', async () => {
      await expect(
        registry.orchestrate({
          permissionType: 'unknown',
        } as BaseOrchestratorParams),
      ).rejects.toThrow('Orchestrator for permission type unknown not found');
    });

    it('should orchestrate an orchestrator', async () => {
      const params = {
        permissionType: testOrchestrator.permissionType,
        validationShouldSucceed: true,
      } as BaseOrchestratorParams;

      const result = await registry.orchestrate(params);

      expect(testOrchestrator.validateParams).toHaveBeenCalledWith(params);

      expect(testOrchestrator.execute).toHaveBeenCalledWith(params);

      expect(result).toEqual({ success: true });
    });
  });
});
