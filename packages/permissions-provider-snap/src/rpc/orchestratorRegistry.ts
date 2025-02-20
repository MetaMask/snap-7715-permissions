// todo: import the actual params and response types
export type BaseOrchestratorParams = {
  permissionType: string;
};
export type PermissionResponse = {};

export type Orchestrator<TOrchestratorParams extends BaseOrchestratorParams> = {
  permissionType: string;
  validateParams: (
    params: BaseOrchestratorParams,
  ) => params is TOrchestratorParams;
  execute: (params: TOrchestratorParams) => Promise<PermissionResponse>;
};

export class OrchestratorRegistry {
  registeredOrchestrators: {
    [permissionType: string]: Orchestrator<BaseOrchestratorParams>;
  } = {};

  registerOrchestrator<TOrchestratorParams extends BaseOrchestratorParams>(
    orchestrator: Orchestrator<TOrchestratorParams>,
  ) {
    const { permissionType } = orchestrator;

    if (this.registeredOrchestrators[permissionType]) {
      throw new Error(
        `Orchestrator for permission type ${permissionType} already registered`,
      );
    }

    this.registeredOrchestrators[permissionType] =
      orchestrator as Orchestrator<any> as Orchestrator<BaseOrchestratorParams>;
  }

  async orchestrate(orchestratorParams: BaseOrchestratorParams) {
    const { permissionType } = orchestratorParams;

    const orchestrator = this.registeredOrchestrators[permissionType];
    if (!orchestrator) {
      throw new Error(
        `Orchestrator for permission type ${permissionType} not found`,
      );
    }

    if (!orchestrator.validateParams(orchestratorParams)) {
      throw new Error(
        `Invalid orchestrator params: ${JSON.stringify(orchestratorParams)}`,
      );
    }

    const response = await orchestrator.execute(orchestratorParams);

    return response;
  }
}
