'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  if (!PRIVY_APP_ID) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-white text-stone-900">
          <p className="p-8 text-sm text-stone-500">
            Set NEXT_PUBLIC_PRIVY_APP_ID in .env.local to enable wallet authentication.
            The app is running in demo mode.
          </p>
          {children}
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          loginMethods: ['wallet', 'google', 'email'],
          appearance: {
            theme: 'light',
            accentColor: '#1a5632',
          },
        }}
      >
        {children}
      </PrivyProvider>
    </QueryClientProvider>
  );
}
