"use server";

import "server-only";

import crypto from "crypto";

import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/types/supabase-auto";
import { createClient } from "@/lib/supabase/server";

type Integration = Tables<"integrations">;
type IntegrationInsert = TablesInsert<"integrations">;
type IntegrationUpdate = TablesUpdate<"integrations">;

const ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error(
    "Missing INTEGRATION_ENCRYPTION_KEY environment variable"
  );
}

/**
 * The encryption key must be a 32-byte base64 string.
 *
 * Generate one with:
 *
 * node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */
function getEncryptionKey(): Buffer {
  const key = Buffer.from(ENCRYPTION_KEY!, "base64");

  if (key.length !== 32) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY must decode to exactly 32 bytes"
    );
  }

  return key;
}

function encryptSecret(secret: string): string {
  const key = getEncryptionKey();

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

/**
 * Connect a new integration.
 *
 * The secret/token is received by the server action,
 * encrypted on the server, and only the encrypted value
 * is stored in Supabase.
 */
export async function addIntegration(
  integration: Omit<IntegrationInsert, "user_id"> & {
    secret?: string | null;
  }
): Promise<{
  data: Integration | null;
  error: string | null;
}> {
  const supabase = await createClient();

  console.log("integration FROM addIntegration:", integration)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      data: null,
      error: "You must be authenticated.",
    };
  }

  try {
    let encryptedSecret: string | null = null;

    if (integration.secret) {
      encryptedSecret = encryptSecret(integration.secret);
    }

    const { secret: _secret, ...integrationWithoutSecret } = integration;

    const insertData = {
      ...integrationWithoutSecret,
      user_id: user.id,
      secret: encryptedSecret,
    } as IntegrationInsert;

    console.log("insertData from addIntegration:", insertData)

    const { data, error } = await supabase
      .from("integrations")
      .insert(insertData)
      .select(
        "id, user_id, type, name, config, created_at, updated_at"
      )
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as Integration,
      error: null,
    };
  } catch (error) {
    console.error("Failed to add integration:", error);

    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add integration.",
    };
  }
}

/**
 * Update an existing integration.
 *
 * If a new secret is supplied, it is encrypted before
 * being saved.
 */
export async function updateIntegration(
  id: string,
  updates: IntegrationUpdate & {
    secret?: string | null;
  }
): Promise<{
  data: Integration | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      data: null,
      error: "You must be authenticated.",
    };
  }

  try {
    const { secret, ...updatesWithoutSecret } = updates;

    const updateData: IntegrationUpdate = {
      ...updatesWithoutSecret,
    };

    if (secret !== undefined) {
      updateData.secret = secret
        ? encryptSecret(secret)
        : null;
    }

    const { data, error } = await supabase
      .from("integrations")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        "id, user_id, type, name, config, created_at, updated_at"
      )
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as Integration,
      error: null,
    };
  } catch (error) {
    console.error("Failed to update integration:", error);

    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update integration.",
    };
  }
}

/**
 * Delete an integration.
 *
 * The user_id condition makes sure the authenticated user
 * can only delete their own integration.
 */
export async function deleteIntegration(
  id: string
): Promise<{
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: "You must be authenticated.",
    };
  }

  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: error.message,
    };
  }

  return {
    error: null,
  };
}