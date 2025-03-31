import { sepolia } from 'viem/chains';

import ethereumIcon from '../../images/networks/ethereum.svg';
import ethIcon from '../../images/tokens/eth.svg';

export const ICONS: Record<
  number,
  {
    network: string;
    token: string;
  }
> = {
  [sepolia.id]: {
    network: ethereumIcon,
    token: ethIcon,
  },
};
