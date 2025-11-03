# Snaps Metrics Implementation

This document describes the Snaps metrics tracking implementation for the 7715 Permissions Snap.

## Overview

The analytics implementation tracks key user interactions and system events throughout the permission lifecycle. This data helps understand user behavior, identify friction points, and measure system performance.

## Architecture

### SnapsMetricsService

Location: `packages/gator-permissions-snap/src/services/snapsMetricsService.ts`

The `SnapsMetricsService` class provides methods to track various events using MetaMask's `snap_trackEvent` API. It's integrated throughout the permission lifecycle orchestration.

### Integration Points

1. **Main Entry Point** (`packages/gator-permissions-snap/src/index.ts`)
   - SnapsMetricsService is instantiated and passed to orchestrator and profile sync manager

2. **Permission Lifecycle Orchestrator** (`packages/gator-permissions-snap/src/core/permissionRequestLifecycleOrchestrator.ts`)
   - Tracks permission requests, approvals, rejections
   - Tracks delegation signing events

3. **Profile Sync** (`packages/gator-permissions-snap/src/profileSync/profileSync.ts`)
   - Tracks profile sync operations (store, retrieve, batch_store)

## Tracked Events

### 1. Permission Type and Value Tracking

**Events:**
- `Permission Request Started`: When a user initiates a permission request
- `Permission Dialog Shown`: When the confirmation dialog is displayed
- `Permission Rejected`: When the user rejects a permission
- `Permission Granted`: When a permission is successfully granted

**Tracked Data:**
- `permission_type`: One of `native-token-stream`, `native-token-periodic`, `erc20-token-stream`, `erc20-token-periodic`
- `chain_id`: The blockchain network ID
- `period_seconds`: The time period for periodic permissions
- `amount`: The token amount
- `token`: The token address (0x0 for native tokens)
- `duration_seconds`: Permission duration/expiry
- `is_adjustment_allowed`: Boolean indicating if permission adjustment was allowed

### 2. Smart Account Upgrades

**Event:**
- `Smart Account Upgraded`: Tracks smart account (EIP-7702) upgrades

**Tracked Data:**
- `account_address`: The account that was upgraded
- `chain_id`: The chain where the upgrade occurred
- `success`: Boolean indicating success/failure

**Note:** This event is defined in the service but not yet called from account upgrade code, as the snap uses EIP-7702 accounts which handle delegation via signatures rather than explicit upgrades.

### 3. Profile Sync Operations

**Event:**
- `Profile Sync`: Tracks profile synchronization operations

**Operations Tracked:**
- `store`: Storing a single permission
- `retrieve`: Retrieving permissions
- `batch_store`: Batch storing multiple permissions

**Tracked Data:**
- `operation`: The type of operation
- `success`: Boolean indicating success/failure
- `error_message`: Error details if operation failed

## Event Properties

All events include:
- `message`: A human-readable description
- `origin`: The dapp origin requesting the permission
- Additional event-specific properties


## Data Flow

1. User initiates permission request → `trackPermissionRequestStarted`
2. Dialog shown to user → `trackPermissionDialogShown`
3. User approves → (continues to delegation signing)
4. OR User rejects → `trackPermissionRejected`
5. Delegation signing → `trackDelegationSigning`
6. Permission granted → `trackPermissionGranted`
7. Profile sync (if enabled) → `trackProfileSync`

