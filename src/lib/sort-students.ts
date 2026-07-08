import type { Profile } from "@/lib/auth";

export const genderRank = (gender?: string | null) =>
  gender === "Male" ? 0 : gender === "Female" ? 1 : 2;

export function compareStudents(
  a: Pick<Profile, "gender" | "roll" | "name">,
  b: Pick<Profile, "gender" | "roll" | "name">,
  sortBy: "roll" | "name" = "roll",
): number {
  const genderDiff = genderRank(a.gender) - genderRank(b.gender);
  if (genderDiff !== 0) return genderDiff;
  return sortBy === "name"
    ? a.name.localeCompare(b.name)
    : a.roll.localeCompare(b.roll);
}
