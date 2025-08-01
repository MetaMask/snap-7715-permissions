import type { Snap } from '../types';
import { isLocalSnap } from './snap';

export const shouldDisplayReconnectButton = (installedSnap: Snap | undefined) =>
  installedSnap && isLocalSnap(installedSnap?.id);
