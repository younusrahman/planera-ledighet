import type { Team, Employee, Absence, AbsenceCategory } from "../types";

export interface AnalyticsInput {
  teams: Team[];
  employees: Employee[];
  absences: Absence[];
  categories: AbsenceCategory[];
}

export function buildAnalytics(input: AnalyticsInput) {
  const { teams, employees, absences, categories } = input;

  const employeesByTeam = groupBy(employees, e => e.teamId);
  const absencesByEmployee = groupBy(absences, a => a.employeeId);

  const absencesByTeam = teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    absences:
      (employeesByTeam[team.id]?.flatMap(e => absencesByEmployee[e.id] ?? [])) ??
      []
  }));

  const absencesByCategory = categories.map(cat => ({
    categoryId: cat.id,
    label: cat.label,
    color: cat.color,
    count: absences.filter(a => a.absenceCategoryId === cat.id).length
  }));

  const absencesByTeamAndCategory = teams.map(team => {
    const teamAbsences =
      absencesByTeam.find(t => t.teamId === team.id)?.absences ?? [];

    return {
      teamId: team.id,
      teamName: team.name,
      categories: categories.map(cat => ({
        categoryId: cat.id,
        label: cat.label,
        color: cat.color,
        count: teamAbsences.filter(a => a.absenceCategoryId === cat.id).length
      }))
    };
  });

  return {
    absencesByTeam,
    absencesByCategory,
    absencesByTeamAndCategory
  };
}


export function groupBy<T, K extends string | number | symbol>(
  list: T[],
  getKey: (item: T) => K,
): Record<K, T[]> {
  return list.reduce(
    (acc, item) => {
      const key = getKey(item);
      (acc[key] ||= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}
