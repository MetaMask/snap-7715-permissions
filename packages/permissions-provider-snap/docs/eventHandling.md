# Event Handling Architecture

## Overview

This document will provide a over of the MetaMask Smart Account Snap internal event handling process that allow for user attenuation.

## Event handler registration Flow(permission request)

The Event registration Flow diagram shows the path of an incoming permission request takes to determine which event handlers are required to fulfil the permission.

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

    Note over onRpcRequest: RPC entrypoint(incoming RPC permission request)
    Note over ConfirmationDialog: User interacts with Dialog while orchestrate wait for the confirmation result

    onRpcRequest->>rpcHandler: Forward the RPC request to rpcHandler to handle the permission request
    rpcHandler->>orchestratorFactory: Use the orchestratorFactory to determine the correct orchestrator needed to fulfil the permission request
    rpcHandler->>orchestrate: Send the orchestrator to start the orchestrate process
    orchestrate->>orchestrator(permission specific): Call the .getConfirmationDialogEventHandlers() on the orchestrator to return a set of event handlers for the confirmation dialog specific to the permission type
    orchestrate->>PermissionConfirmationContext: Builds the context with the handler and elements default state
    orchestrate->>renderHandler: Create the confirmation dialog
    orchestrate->>UserEventDispatcher: Register the event handlers
    orchestrate->>renderHandler: Wait for the confirmation result.
    ConfirmationDialog->>onUserInput: Events are sent to onUserInput.
```

## Event Handle Flow
The Event Handle Flow diagram shows the path of an event triggered by a user interaction takes to dynamically update the UI state.

```mermaid
sequenceDiagram
    autonumber
    participant onUserInput
    participant UserEventDispatcher
    participant Handler
    participant PermissionConfirmationContext

    Note over onUserInput: Event entrypoint(incoming UI event)

    onUserInput->>UserEventDispatcher: Forward the event to the UserEventDispatcher to figure out which handler to call
    UserEventDispatcher->>Handler: From the set of registered handlers find the handler that maps to the event name
    Handler->>PermissionConfirmationContext: The handler uses the event name as the stateKey to update desired element state
    Handler->>UserEventDispatcher: THe Handler returns the attenuated context after updated the element state
    UserEventDispatcher->>onUserInput: Event done being process and the onUserInput request returns waiting for the next event
```