# Adding new permission types

Follow the following steps to add new permission types to the `permissions-provider-snap`:

1. Create new permission type definition with `permission.data` to `./packages/shared/src/types/7715-permissions-types.ts` file.
2. Create a new orchestrator file in `./packages/permissions-provider-snap/src/orchestrators/orchestrator/<NewPermissionTypeOrchestrator.tsx>` directory.
3. Create a new TS declaration in your orchestrator file to extend `PermissionTypeMapping` with your new permission type. This will allow TS to automatically revolve the new orchestrator everywhere:

```ts
declare module './types' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface PermissionTypeMapping {
    'new-permission-type': JsonObject & NewPermissionTypeDefinition; // JsonObject & NewPermissionTypeDefinition to be compatible with the Snap JSON object type
  }
}
```

4. Add your orchestrator to `orchestratorModules` value in `./packages/permissions-provider-snap/src/orchestrators/orchestrator/lookup-table.ts` file.

You are now all set to implement your orchestrators' interface.
