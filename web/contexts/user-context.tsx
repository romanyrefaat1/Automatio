"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";


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
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  /**
   * Fetch the current user's public.users row
   * and their integrations.
   *
   * IMPORTANT:
   * We intentionally do NOT select "secret".
   */
  const refreshUser = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

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
      console.error(
        "Failed to fetch user data:",
        error
      );

      setUser(null);
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

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
      if (!user) {
        return {
          data: null,
          error: new Error(
            "No authenticated user"
          ),
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
   * This also goes through the SERVER ACTION because
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
      const result =
        await deleteIntegrationAction(id);

      if (result.error) {
        return {
          error: new Error(result.error),
        };
      }

      setIntegrations((current) =>
        current.filter(
          (integration) =>
            integration.id !== id
        )
      );

      return {
        error: null,
      };
    },
    []
  );

  /**
   * Get one integration from the already-loaded
   * integrations.
   */
  const getIntegration = useCallback(
    (id: string) => {
      return integrations.find(
        (integration) =>
          integration.id === id
      );
    },
    [integrations]
  );

  /**
   * Initial load.
   */
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /**
   * Keep the context synchronized with auth.
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refreshUser]);

  return (
    <UserContext.Provider
      value={{
        user,
        integrations,
        loading,
        refreshUser,
        updateUser,
        addIntegration,
        updateIntegration,
        deleteIntegration,
        getIntegration,
      }}
    >
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