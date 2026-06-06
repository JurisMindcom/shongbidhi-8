import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Payload = {
  name: string;
  roll: string;
  password: string;
  registration_number?: string | null;
  session?: string | null;
  batch?: string | null;
  blood_group?: string | null;
  district?: string | null;
  gender: "Male" | "Female";
  phone?: string | null;
  facebook_link?: string | null;
  profile_photo?: string | null;
  role?: "student" | "cr" | "admin";
};

const clean = (v?: string | null) => {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t.length ? t : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Missing auth token" });

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json(401, { error: "Invalid session" });
  const caller = userData.user;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: rolesData } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id);
  const callerRoles = (rolesData ?? []).map((r: { role: string }) => r.role);
  const isAdmin = callerRoles.includes("admin");
  const isCR = callerRoles.includes("cr");
  if (!isAdmin && !isCR) return json(403, { error: "Not authorized" });

  let body: Payload;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON" }); }

  const name = clean(body.name);
  const roll = clean(body.roll);
  const password = body.password;
  if (!name || !roll || !password || password.length < 6) {
    return json(400, { error: "Name, roll, and a password of 6+ chars are required" });
  }
  if (!body.gender || (body.gender !== "Male" && body.gender !== "Female")) {
    return json(400, { error: "Gender is required" });
  }

  // CRs can ONLY create students
  let role: "student" | "cr" | "admin" = body.role ?? "student";
  if (!isAdmin) role = "student";
  if (!["student", "cr", "admin"].includes(role)) role = "student";

  // Duplicate roll guard
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("roll", roll)
    .maybeSingle();
  if (existing) return json(409, { error: "A student with this roll already exists" });

  const email = `${roll}@law.iu.local`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, roll },
  });
  if (createErr || !created.user) {
    return json(400, { error: createErr?.message ?? "Failed to create account" });
  }
  const id = created.user.id;

  const { error: profileErr } = await admin.from("profiles").upsert({
    id,
    name,
    roll,
    registration_number: clean(body.registration_number),
    session: clean(body.session),
    batch: clean(body.batch),
    blood_group: clean(body.blood_group),
    district: clean(body.district),
    gender: body.gender,
    phone: clean(body.phone),
    facebook_link: clean(body.facebook_link),
    profile_photo: clean(body.profile_photo),
    status: "active",
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(id);
    return json(400, { error: profileErr.message });
  }

  // Replace any auto-assigned role with the requested one
  await admin.from("user_roles").delete().eq("user_id", id);
  const { error: roleErr } = await admin.from("user_roles").insert({ user_id: id, role });
  if (roleErr) return json(400, { error: roleErr.message });

  return json(200, { ok: true, id });
});