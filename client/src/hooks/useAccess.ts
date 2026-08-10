import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export function useAccess() {
  const auth = useAuth();
  const access = trpc.access.me.useQuery(undefined, { enabled: Boolean(auth.user) });
  return {
    ...auth,
    permissions: access.data?.permissions,
    supplierProfile: access.data?.supplierProfile,
    accessLoading: auth.loading || access.isLoading,
    accessError: access.error,
  };
}

