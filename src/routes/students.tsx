import { createFileRoute, Link } from "@/lib/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/auth";
import { StudentCard } from "@/components/StudentCard";
import { FloatingParticles } from "@/components/FloatingParticles";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import studentsCover from "@/assets/students-cover.jpg";
import { ArrowLeft, Search } from "lucide-react";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Students · Law & Land Administration" },
      { name: "description", content: "Meet the students of the Department of Law and Land Administration, Islamic University, Bangladesh." },
    ],
  }),
  component: StudentsPage,
});

type SortKey = "roll" | "name";
type GenderFilter = "all" | "Male" | "Female";

function StudentsPage() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [nonStudentIds, setNonStudentIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<GenderFilter>("all");
  const [sort, setSort] = useState<SortKey>("roll");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.from("profiles").select("*").eq("status", "active").order("roll", { ascending: true }),
      supabase.from("user_roles").select("user_id, role").in("role", ["admin", "cr"]),
    ]).then(([{ data: profs }, { data: roles }]) => {
      if (!active) return;
      setNonStudentIds(new Set(((roles ?? []) as { user_id: string }[]).map((r) => r.user_id)));
      setStudents((profs as Profile[]) ?? []);
      setLoading(false);
    });

    const channel = supabase
      .channel("profiles-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, (payload) => {
        setStudents((prev) => {
          if (payload.eventType === "DELETE") {
            return prev.filter((p) => p.id !== (payload.old as Profile).id);
          }
          const next = payload.new as Profile;
          if (next.status !== "active") return prev.filter((p) => p.id !== next.id);
          const exists = prev.some((p) => p.id === next.id);
          const merged = exists ? prev.map((p) => (p.id === next.id ? next : p)) : [...prev, next];
          return merged.sort((a, b) => a.roll.localeCompare(b.roll));
        });
      })
      .subscribe();
    const rolesChannel = supabase
      .channel("user-roles-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => {
        supabase
          .from("user_roles")
          .select("user_id, role")
          .in("role", ["admin", "cr"])
          .then(({ data }) =>
            setNonStudentIds(new Set(((data ?? []) as { user_id: string }[]).map((r) => r.user_id))),
          );
      })
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
      supabase.removeChannel(rolesChannel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = students.filter((s) => {
      if (nonStudentIds.has(s.id)) return false;
      if (gender !== "all" && s.gender !== gender) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        (s.district ?? "").toLowerCase().includes(q) ||
        (s.batch ?? "").toLowerCase().includes(q)
      );
    });
    out.sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : a.roll.localeCompare(b.roll),
    );
    return out;
  }, [students, query, gender, sort, nonStudentIds]);

  // Global serial map based on Roll Number ascending, students only
  const serialByRoll = useMemo(() => {
    const onlyStudents = students.filter((s) => !nonStudentIds.has(s.id));
    onlyStudents.sort((a, b) => a.roll.localeCompare(b.roll));
    const map = new Map<string, number>();
    onlyStudents.forEach((s, i) => map.set(s.id, i + 1));
    return map;
  }, [students, nonStudentIds]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [pageCount, page]);

  return (
    <div className="relative min-h-screen bg-background pb-16">
      <FloatingParticles count={14} />
      <HamburgerMenu />
      <header className="glass sticky top-0 z-30 flex items-center justify-between px-4 py-3">
        <Link to="/" className="ml-12 flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <span className="text-xs text-foreground/70">{filtered.length} students</span>
      </header>

      <section className="relative mx-auto mt-4 max-w-7xl px-4">
        <div className="relative h-40 overflow-hidden rounded-3xl sm:h-56">
          <img src={studentsCover} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 flex items-end p-6">
            <h1 className="text-3xl font-bold sm:text-4xl">
              Department <span className="text-gradient">Students</span>
            </h1>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4">
        <div className="glass flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
            <Search className="h-4 w-4 text-secondary" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search name, roll, district…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <select
            value={gender}
            onChange={(e) => { setGender(e.target.value as GenderFilter); setPage(1); }}
            className="rounded-xl bg-muted/40 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl bg-muted/40 px-3 py-2 text-sm outline-none"
          >
            <option value="roll">Sort by roll</option>
            <option value="name">Sort by name</option>
          </select>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-foreground/70">
            No students match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visible.map((s) => (
              <StudentCard key={s.id} profile={s} serial={serialByRoll.get(s.id)} />
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg bg-muted/40 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-sm text-foreground/70">
              Page {page} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="rounded-lg bg-muted/40 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}