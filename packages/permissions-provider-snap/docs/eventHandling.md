# Event Handling Architecture

## Overview

This document will provide an overview of the `MetaMask Smart Account Snap` internal event handling process that allows for user attenuation.

## Event handler registration Flow

The Event registration Flow diagram shows the path an incoming permission request takes to determine which event handlers are required to fulfill the permission.

```mermaid
sequenceDiagram
 autonumber
 participant onRpcRequest
 participant orchestratorFactory
 participant UserEventDispatcher
 participant rpcHandler
 participant orchestrate
 participant orchestrator(permission specific)
 participant PermissionConfirmationContext
 participant renderHandler
 participant ConfirmationDialog
participant UI module

 Note over onRpcRequest: RPC entrypoint(incoming RPC permission request)
 Note over ConfirmationDialog: The user interacts with Dialog while orchestrate waits for the confirmation result.
 Note over PermissionConfirmationContext: UI state mutation is reflected on this object.

 onRpcRequest->>rpcHandler: Forward the RPC request to rpcHandler to handle the permission request.
 rpcHandler->>orchestratorFactory: Use the orchestratorFactory to determine the correct orchestrator needed to fulfill the permission request.
 rpcHandler->>orchestrate: Send the orchestrator to orchestrate to start the orchestration process.
 orchestrate->>orchestrator(permission specific): Call the .getConfirmationDialogEventHandlers() on the orchestrator to return a set of event handlers for the confirmation dialog specific to the permission type.
orchestrator->>UI module: Fetch the permission JSX component
 orchestrate->>PermissionConfirmationContext: Builds the Snap UI context with the handler and UI elements default state.
 orchestrate->>renderHandler: Create the confirmation dialog
 orchestrate->>UserEventDispatcher: Register the event handlers
 orchestrate->>renderHandler: Wait for the confirmation result.
 ConfirmationDialog->>onUserInput: Events are sent to onUserInput.
```

## Event Handle Flow

The Event Handle Flow diagram shows the path of an event triggered by a user interaction to update the UI state dynamically.

```mermaid
sequenceDiagram
 autonumber
 participant onUserInput
 participant UserEventDispatcher
 participant Handler
 participant PermissionConfirmationContext

 Note over onUserInput: Event entrypoint(incoming UI event)

 onUserInput->>UserEventDispatcher: Forward the event to the UserEventDispatcher to figure out which handler to call.
 UserEventDispatcher->>Handler: From the set of registered handlers, find the handler that maps to the event name.
 Handler->>PermissionConfirmationContext: The handler uses the event name as the stateKey to update the desired element state.
 Handler->>UserEventDispatcher: After mutating the element state, the Handler returns the attenuated context.
 UserEventDispatcher->>onUserInput: The event done being processed and the onUserInput request returns waiting for the next event
```
