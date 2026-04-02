// src/app/config.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Social Network App',
  projectId: 'YOUR_PROJECT_ID', // Получите на cloud.walletconnect.com
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
});