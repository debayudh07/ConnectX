'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { avalanche, avalancheFuji } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'ConnectX',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [avalanche, avalancheFuji],
  ssr: true,
});