import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 60 * 24, // 24 hours (how long to keep in memory)
            retry: 2,
          },
        },
      })
  );

  useEffect(() => {
    const asyncStoragePersister = createAsyncStoragePersister({
      storage: AsyncStorage,
      key: 'FITNES_QUERY_CACHE',
    });

    persistQueryClient({
      queryClient,
      persister: asyncStoragePersister,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours (how long to keep in AsyncStorage)
    });
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
