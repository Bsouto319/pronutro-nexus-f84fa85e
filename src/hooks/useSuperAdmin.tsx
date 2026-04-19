import { useAuth } from "@/hooks/useAuth";

const SUPER_ADMIN_EMAIL = "brunosouto1108@gmail.com";

export function useSuperAdmin() {
  const { user, loading } = useAuth();
  const isSuperAdmin = !!user?.email && user.email.toLowerCase() === SUPER_ADMIN_EMAIL;
  return { isSuperAdmin, loading };
}
