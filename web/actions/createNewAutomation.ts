"use server";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/supabase-auto";

export type AutomationData = Pick<
  TablesInsert<"automations">,
  "name" | "description"
>;

export default async function createNewAutomation(
  data: AutomationData
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Failed to get user: ${userError.message}`);
  }

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: automation, error } = await supabase
    .from("automations")
    .insert({
      name: data.name,
      description: data.description,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to create automation: ${error.message}`
    );
  }

  return automation;
}