"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import {
  addIntegration as addIntegrationAction,
  updateIntegration as updateIntegrationAction,
  deleteIntegration as deleteIntegrationAction,
} from "@/actions/integrations";

import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/types/supabase-auto";

import { createClient } from "@/lib/supabase/client";

type User = Tables<"users">;
type Integration = Tables<"integrations">;

type UserUpdate = TablesUpdate<"users">;
type IntegrationInsert = TablesInsert<"integrations">;
type IntegrationUpdate = TablesUpdate<"integrations">;

type AddIntegrationInput = Omit<
  IntegrationInsert,
  "user_id" | "secret"
> & {
  secret?: string | null;
};

type UpdateIntegrationInput = Omit<
  IntegrationUpdate,
  "user_id" | "secret"
> & {
  secret?: string | null;
};

interface UserContextValue {
  user: User | null;
  integrations: Integration[];
  loading: boolean;

  refreshUser: () => Promise<void>;

  updateUser: (
    updates: UserUpdate
  ) => Promise<{
    data: User | null;
    error: Error | null;
  }>;

  addIntegration: (
    integration: AddIntegrationInput
  ) => Promise<{
    data: Integration | null;
    error: Error | null;
  }>;

  updateIntegration: (
    id: string,
    updates: UpdateIntegrationInput
  ) => Promise<{
    data: Integration | null;
    error: Error | null;
  }>;

  deleteIntegration: (
    id: string
  ) => Promise<{
    error: Error | null;
  }>;

  getIntegration: (
    id: string
  ) => Integration | undefined;
}

const UserContext = createContext<UserContextValue | undefined>(
  undefined
);

export function UserProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  // Keep one Supabase client for this provider instance.
  const [supabase] = useState(() => createClient());

  const [user, setUser] = useState<User | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  /**
   * Auth pages should not try to load the public user row.
   *
   * This matches:
   * /auth
   * /auth/login
   * /auth/signup
   * /auth/forgot-password
   * etc.
   */
  const isAuthPage = pathname.startsWith("/auth");

  /**
   * Fetch the current authenticated user's public.users row
   * and their integrations.
   *
   * IMPORTANT:
   * We intentionally do NOT select "secret".
   */
  const refreshUser = useCallback(async () => {
    // Don't fetch user data on auth pages.
    if (isAuthPage) {
      setUser(null);
      setIntegrations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      // No authenticated user.
      if (!authUser) {
        setUser(null);
        setIntegrations([]);
        return;
      }

      const [userResult, integrationsResult] =
        await Promise.all([
          supabase
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .single(),

          supabase
            .from("integrations")
            .select(
              "id, user_id, type, name, config, created_at, updated_at"
            )
            .eq("user_id", authUser.id)
            .order("created_at", {
              ascending: false,
            }),
        ]);

      if (userResult.error) {
        throw userResult.error;
      }

      if (integrationsResult.error) {
        throw integrationsResult.error;
      }

      setUser(userResult.data);
      setIntegrations(integrationsResult.data);
    } catch (error) {
      console.error("Failed to fetch user data:", error);

      setUser(null);
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }, [pathname, supabase]);

  /**
   * Update the current user's public.users row.
   */
  const updateUser = useCallback(
    async (
      updates: UserUpdate
    ): Promise<{
      data: User | null;
      error: Error | null;
    }> => {
      // A user is always required to update their profile.
      if (!user) {
        return {
          data: null,
          error: new Error("No authenticated user"),
        };
      }

      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error,
        };
      }

      setUser(data);

      return {
        data,
        error: null,
      };
    },
    [supabase, user]
  );

  /**
   * Add an integration.
   *
   * This calls the SERVER ACTION so that secrets such
   * as Telegram bot tokens are encrypted server-side.
   */
  const addIntegration = useCallback(
    async (
      integration: AddIntegrationInput
    ): Promise<{
      data: Integration | null;
      error: Error | null;
    }> => {
      const result = await addIntegrationAction({
        ...integration,
      });

      if (result.error) {
        return {
          data: null,
          error: new Error(result.error),
        };
      }

      if (!result.data) {
        return {
          data: null,
          error: new Error(
            "Integration was created but no data was returned."
          ),
        };
      }

      setIntegrations((current) => [
        result.data!,
        ...current,
      ]);

      return {
        data: result.data,
        error: null,
      };
    },
    []
  );

  /**
   * Update an integration.
   *
   * This goes through the SERVER ACTION because
   * the update may contain a new secret.
   */
  const updateIntegration = useCallback(
    async (
      id: string,
      updates: UpdateIntegrationInput
    ): Promise<{
      data: Integration | null;
      error: Error | null;
    }> => {
      const result = await updateIntegrationAction(
        id,
        updates
      );

      if (result.error) {
        return {
          data: null,
          error: new Error(result.error),
        };
      }

      if (!result.data) {
        return {
          data: null,
          error: new Error(
            "Integration was updated but no data was returned."
          ),
        };
      }

      setIntegrations((current) =>
        current.map((integration) =>
          integration.id === id
            ? result.data!
            : integration
        )
      );

      return {
        data: result.data,
        error: null,
      };
    },
    []
  );

  /**
   * Delete an integration.
   */
  const deleteIntegration = useCallback(
    async (
      id: string
    ): Promise<{
      error: Error | null;
    }> => {
      const result = await deleteIntegrationAction(id);

      if (result.error) {
        return {
          error: new Error(result.error),
        };
      }

      setIntegrations((current) =>
        current.filter(
          (integration) => integration.id !== id
        )
      );

      return {
        error: null,
      };
    },
    []
  );

  /**
   * Get one integration from the already-loaded integrations.
   */
  const getIntegration = useCallback(
    (id: string) => {
      return integrations.find(
        (integration) => integration.id === id
      );
    },
    [integrations]
  );

  /**
   * Initial load and route changes.
   *
   * When navigating to /auth/*, the provider immediately
   * clears user data and stops loading.
   *
   * When navigating away from /auth/*, user data is loaded.
   */
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /**
   * Keep the context synchronized with Supabase auth.
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Don't fetch public user data while on auth pages.
      if (isAuthPage) {
        return;
      }

      refreshUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, supabase, refreshUser]);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      integrations,
      loading,
      refreshUser,
      updateUser,
      addIntegration,
      updateIntegration,
      deleteIntegration,
      getIntegration,
    }),
    [
      user,
      integrations,
      loading,
      refreshUser,
      updateUser,
      addIntegration,
      updateIntegration,
      deleteIntegration,
      getIntegration,
    ]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error(
      "useUser must be used inside a UserProvider"
    );
  }

  return context;
}