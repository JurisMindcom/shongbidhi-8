import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const studentSchema = z.object({
  name: z.string().min(1).max(120),
  roll: z.string().min(1).max(40),
  password: z.string().min(6).max(120),
  registration_number: z.string().max(60).optional().nullable(),
  session: z.string().max(40).optional().nullable(),
  batch: z.string().max(40).optional().nullable(),
  blood_group: z.string().max(10).optional().nullable(),
  district: z.string().max(80).optional().nullable(),
  gender: z.string().max(20).optional().nullable(),
  facebook_link: z.string().max(300).optional().nullable(),
  profile_photo: z.string().max(600).optional().nullable(),
  role: z.enum(["student", "cr", "admin"]).default("student"),
});

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Response("Forbidden", { status: 403 });
}

export const adminCreateStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => studentSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const email = `${data.roll.trim()}@law.iu.local`;
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, roll: data.roll },
    });
    if (error || !created.user) throw new Response(error?.message ?? "Failed", { status: 400 });
    const uid = created.user.id;
    const { error: pErr } = await supabaseAdmin.from("profiles").insert({
      id: uid,
      name: data.name,
      roll: data.roll,
      registration_number: data.registration_number ?? null,
      session: data.session ?? null,
      batch: data.batch ?? null,
      blood_group: data.blood_group ?? null,
      district: data.district ?? null,
      gender: data.gender ?? null,
      facebook_link: data.facebook_link ?? null,
      profile_photo: data.profile_photo ?? null,
    });
    if (pErr) throw new Response(pErr.message, { status: 400 });
    await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: data.role });
    return { ok: true, id: uid };
  });

export const adminDeleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), password: z.string().min(6) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, { password: data.password });
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });