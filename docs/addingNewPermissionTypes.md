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
// Metadata is anything derived from the context that is not editable, such as validtion errors
export type YourPermissionMetadata = {
  // Add metadata fields
  validationErrors: {
    // Add validation error fields
  };
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
  // Validation failures should throw meaningful errors.
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

### 9. Add the Permission to the demo dapp

### 10. Implement Permission Form Component

Create a new form component in `packages/site/src/components/permissions/` for your permission type. For example, `YourPermissionForm.tsx`:

```typescript
import { useCallback, useEffect, useState } from 'react';
import { StyledForm } from './styles';
import type { YourPermissionRequest } from './types';

type YourPermissionFormProps = {
  onChange: (request: YourPermissionRequest) => void;
}

export const YourPermissionForm = ({
  onChange,
}: YourPermissionFormProps) => {
  // 1. Define state for each form field
  const [field1, setField1] = useState(initialValue1);
  const [field2, setField2] = useState(initialValue2);
  // ... add more state as needed

  // 2. Implement change handlers for each field
  const handleField1Change = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
      setField1(value);
    },
    [],
  );

  // 3. Use useEffect to emit changes to parent
  useEffect(() => {
    onChange({
      type: 'your-permission-type',
      field1,
      field2,
      // ... include all fields
    });
  }, [onChange, field1, field2 /* ... */]);

  // 4. Render form fields
  return (
    <StyledForm>
      <div>
        <label htmlFor="field1">Field 1:</label>
        <input
          type="text"
          id="field1"
          name="field1"
          value={field1}
          onChange={handleField1Change}
          placeholder="Enter field 1"
        />
      </div>
      {/* Add more form fields */}
    </StyledForm>
  );
};
```

Then, add your form to the permission type selector in `packages/site/src/pages/index.tsx`:

1. Import your form component:
```typescript
import { YourPermissionForm } from '../components/permissions';
```

2. Add your permission type to the select options:
```typescript
<select
  id="permissionType"
  name="permissionType"
  value={permissionType}
  onChange={handlePermissionTypeChange}
>
  {/* ... existing options ... */}
  <option value="your-permission-type">Your Permission Type</option>
</select>
```

3. Add the form component to the conditional rendering:
```typescript
{permissionType === 'your-permission-type' && (
  <YourPermissionForm
    onChange={(request: YourPermissionRequest) => {
      setPermissionRequest(request);
    }}
  />
)}
```

Key points for implementing permission forms:
1. Use the `StyledForm` component for consistent styling
2. Implement proper type safety with TypeScript
3. Use controlled form components with React state
4. Emit changes to parent component using the `onChange` prop
5. Include all required fields from your permission type definition
6. Add appropriate validation and error handling
7. Follow the existing pattern of using `useCallback` for event handlers
8. Use `useEffect` to emit form changes to the parent

## Best Practices

1. **Type Safety**: Use TypeScript and Zod for robust type checking and validation.
2. **Error Handling**: Implement comprehensive validation with clear error messages.
3. **UI Consistency**: Follow existing UI patterns and components.
4. **Documentation**: Add JSDoc comments for all public functions and types.
5. **Testing**: Write unit tests for validation and business logic.
