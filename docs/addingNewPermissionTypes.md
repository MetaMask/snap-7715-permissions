# Adding New Permission Types

This guide explains how to add a new permission type to the MetaMask Permissions system. The process involves several key steps and file additions.

## Overview

A permission type consists of several components:
1. Permission definition and registration
2. Type definitions
3. Validation logic
4. Context management
5. UI components
6. Caveat handling

## Step-by-Step Guide

### 1. Create Permission Directory

Create a new directory under `packages/gator-permissions-snap/src/permissions/` for your permission type. For example:
```
packages/gator-permissions-snap/src/permissions/yourPermissionType/
```

### 2. Define Types

Create a `types.ts` file in your permission directory with the following structure:

```typescript
import { z } from 'zod';
import { zHexStr, zPermission, zMetaMaskPermissionData } from '@metamask/7715-permissions-shared/types';

// Define your permission metadata type
export type YourPermissionMetadata = {
  // Add metadata fields
  validationErrors: {
    // Add validation error fields
  };
  rulesToAdd: string[];
};

// Define your permission context type
export type YourPermissionContext = BaseContext & {
  // Add context fields
};

// Define your permission schema
export const zYourPermission = zPermission.extend({
  type: z.literal('your-permission-type'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      // Add your permission data fields
    }),
  ),
});

// Export types
export type YourPermission = z.infer<typeof zYourPermission>;
export type YourPermissionRequest = TypedPermissionRequest<YourPermission>;
export type PopulatedYourPermission = DeepRequired<YourPermission>;
```

### 3. Implement Validation

Create a `validation.ts` file to handle permission validation:

```typescript
import { extractZodError } from '@metamask/7715-permissions-shared/utils';

export function parseAndValidatePermission(
  permissionRequest: PermissionRequest,
): YourPermissionRequest {
  // Implement validation logic
  // Return validated permission request
}
```

### 4. Create Context Management

Create a `context.ts` file to handle permission context:

```typescript
export async function buildContext({
  permissionRequest,
  // Add required services
}: {
  permissionRequest: YourPermissionRequest;
  // Add service types
}): Promise<YourPermissionContext> {
  // Implement context building logic
}

export async function deriveMetadata({
  context,
}: {
  context: YourPermissionContext;
}): Promise<YourPermissionMetadata> {
  // Implement metadata derivation
}

export async function applyContext({
  context,
  originalRequest,
}: {
  context: YourPermissionContext;
  originalRequest: YourPermissionRequest;
}): Promise<YourPermissionRequest> {
  // Implement context application
}
```

### 5. Implement UI Components

Create a `content.tsx` file for the permission UI:

```typescript
export async function createConfirmationContent({
  context,
  metadata,
  isJustificationCollapsed,
  origin,
  chainId,
}: {
  context: YourPermissionContext;
  metadata: YourPermissionMetadata;
  isJustificationCollapsed: boolean;
  origin: string;
  chainId: number;
}): Promise<GenericSnapElement> {
  // Implement UI components
}
```

### 6. Add Caveat Handling

Create a `caveats.ts` file to handle permission caveats:

```typescript
export async function appendCaveats({
  permission,
  caveatBuilder,
}: {
  permission: PopulatedYourPermission;
  caveatBuilder: CoreCaveatBuilder;
}): Promise<CoreCaveatBuilder> {
  // Implement caveat handling
}
```

### 7. Create Permission Definition

Create an `index.ts` file to export your permission definition:

```typescript
export const yourPermissionDefinition: PermissionDefinition<
  YourPermissionRequest,
  YourPermissionContext,
  YourPermissionMetadata,
  YourPermission,
  PopulatedYourPermission
> = {
  rules: allRules,
  title: 'Your Permission Title',
  dependencies: {
    parseAndValidatePermission,
    buildContext,
    deriveMetadata,
    createConfirmationContent,
    applyContext,
    populatePermission,
    appendCaveats,
  },
};
```

### 8. Register the Permission

1. Add your permission type to the permission handler factory:
```typescript
case 'your-permission-type':
  handler = createPermissionHandler(yourPermissionDefinition);
  break;
```

2. Add your permission to the default offers in `snap-permission-registry.ts`:
```typescript
export const DEFAULT_OFFERS: GatorPermission[] = [
  // ... existing permissions
  {
    type: 'your-permission-type',
    proposedName: 'Your Permission Name',
  },
];
```

## Best Practices

1. **Type Safety**: Use TypeScript and Zod for robust type checking and validation.
2. **Error Handling**: Implement comprehensive validation with clear error messages.
3. **UI Consistency**: Follow existing UI patterns and components.
4. **Documentation**: Add JSDoc comments for all public functions and types.
5. **Testing**: Write unit tests for validation and business logic.
