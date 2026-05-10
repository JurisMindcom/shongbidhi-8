import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/bootstrap")({
  server: {
    handlers: {
      POST: async () => {
        const ADMIN_ROLL = "2426006";
        const ADMIN_EMAIL = `${ADMIN_ROLL}@law.iu.local`;
        const ADMIN_PASSWORD = "Rony54321#$";

        // Check if admin profile already exists
        const { data: existing } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("roll", ADMIN_ROLL)
          .maybeSingle();
        if (existing) {
          return new Response(JSON.stringify({ ok: true, already: true }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { name: "Rony", roll: ADMIN_ROLL },
        });
        if (error || !created.user) {
          return new Response(JSON.stringify({ ok: false, error: error?.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        const uid = created.user.id;
        await supabaseAdmin.from("profiles").insert({
          id: uid,
          name: "Rony",
          roll: ADMIN_ROLL,
          department: "Law and Land Administration",
          status: "active",
        });
        await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: "admin" });

        return new Response(JSON.stringify({ ok: true, created: true }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});