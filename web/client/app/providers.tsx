'use client';

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  avalanche,
  avalancheFuji,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

const config = getDefaultConfig({
  appName: 'ConnectX',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, optimism, arbitrum, base, avalanche,avalancheFuji],
  ssr: true,
});

const queryClient = new QueryClient();

const customTheme = darkTheme({
  accentColor: '#dc2626', // Red-600
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme}>
          {children}
          <Toaster
            toastOptions={{
              style: {
                background: 'rgb(0 0 0 / 0.9)',
                border: '1px solid rgb(255 255 255 / 0.1)',
                color: 'white',
                backdropFilter: 'blur(12px)',
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}