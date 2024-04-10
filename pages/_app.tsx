import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import {
  sepolia,
} from 'wagmi/chains';
import { darkTheme, getDefaultConfig, lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import Layout from '../layouts/layout';
import { useDark } from '../hooks/dark';

const config = getDefaultConfig({
  appName: 'Red Envelope DApp',
  projectId: 'YOUR_PROJECT_ID',
  chains: [
    sepolia,
  ],
  ssr: true,
});

const client = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  const isDark = useDark()
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider theme={isDark ? darkTheme() : lightTheme()}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
