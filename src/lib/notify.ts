import { supabase } from "@/integrations/supabase/client";

type NotifyArgs = {
  userIds: string[];
  actorId?: string | null;
  kind: string;
  title: string;
  body?: string | null;
  link?: string | null;
};

/**
 * Fan-out insert. Best-effort — errors are logged but never thrown.
 */
export async function notifyMany({ userIds, actorId, kind, title, body, link }: NotifyArgs) {
  const rows = userIds
    .filter((id) => id && id !== actorId)
    .map((user_id) => ({
      user_id,
      actor_id: actorId ?? null,
      kind,
      title,
      body: body ?? null,
      link: link ?? null,
    }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.warn("[notify]", error.message);
}

export async function notifyAllExcept(args: Omit<NotifyArgs, "userIds">) {
  const { data } = await supabase.from("profiles").select("id");
  const userIds = ((data ?? []) as { id: string }[]).map((r) => r.id);
  await notifyMany({ ...args, userIds });
}