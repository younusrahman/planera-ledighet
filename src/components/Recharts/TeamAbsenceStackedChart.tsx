import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTeams, useEmployees } from "../../services/hooks/useData";
import { absence } from "../../services/stores/absenceDataStore";
import useFilterStore from "../../services/stores/analyticsStore";
import dayjs from "dayjs";
import { getSwedishHolidays } from "../../utils/holidayHelper";
import styles from "./TeamAbsenceStackedChart.module.css";

// Constants for Chart Colors (MUI theme replacements)
const COLOR_SUCCESS = "#22c55e"; // Green
const COLOR_ERROR = "#ef4444";   // Red

export function TeamAbsenceStackedChart() {
  const { data: teams = [] } = useTeams();
  const { data: employees = [] } = useEmployees();
  const absences = absence.useItems();
  const { teamSelections, getSelectedEmployeeIds, selectedStatuses } = useFilterStore();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const h = getSwedishHolidays(dayjs().year());
    return Object.keys(h).sort().find(d => d >= dayjs().format("YYYY-MM-DD")) || "";
  });
  const [showOnlyWithoutAbsence, setShowOnlyWithoutAbsence] = useState(false);

  // --- Logic Helpers (Kept identical to original) ---
  const upcomingHolidays = useMemo(() => {
    const years = [dayjs().year(), dayjs().year() + 1];
    const allHolidays: any[] = [];
    years.forEach(y => {
      const h = getSwedishHolidays(y);
      Object.entries(h).forEach(([date, holiday]) => {
        if (date >= dayjs().format("YYYY-MM-DD")) allHolidays.push({ date, name: holiday.name });
      });
    });
    return allHolidays.sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  const selectedEmployeeIds = useMemo(() => getSelectedEmployeeIds(employees), [teamSelections, employees]);

  const employeesWithAnyAbsence = useMemo(() => {
    if (!selectedDate) return new Set<string>();
    const checkDate = dayjs(selectedDate).startOf("day");
    const ids = new Set<string>();
    absences.forEach(abs => {
      const s = dayjs(abs.startDate).startOf("day");
      const e = dayjs(abs.endDate).endOf("day");
      if ((checkDate.isAfter(s) || checkDate.isSame(s, 'd')) && (checkDate.isBefore(e) || checkDate.isSame(e, 'd'))) {
        if (selectedEmployeeIds.includes(abs.employeeId)) ids.add(abs.employeeId);
      }
    });
    return ids;
  }, [selectedDate, absences, selectedEmployeeIds]);

  const attendanceByTeam = useMemo(() => {
    const res: Record<string, { absent: any[], working: any[] }> = {};
    const checkDate = dayjs(selectedDate).startOf("day");

    // Filter relevant employees
    const filtered = employees.filter(emp => {
      const inSelection = selectedEmployeeIds.includes(emp.id);
      if (showOnlyWithoutAbsence) return inSelection && !employeesWithAnyAbsence.has(emp.id);
      return inSelection;
    });

    filtered.forEach(emp => {
      if (!res[emp.teamId]) res[emp.teamId] = { absent: [], working: [] };
      
      const isAbsent = !showOnlyWithoutAbsence && absences.some(abs => {
        if (!selectedStatuses.includes(abs.status)) return false;
        const s = dayjs(abs.startDate).startOf("day");
        const e = dayjs(abs.endDate).endOf("day");
        return (checkDate.isAfter(s) || checkDate.isSame(s, 'd')) && (checkDate.isBefore(e) || checkDate.isSame(e, 'd')) && abs.employeeId === emp.id;
      });

      if (isAbsent) res[emp.teamId].absent.push(emp);
      else res[emp.teamId].working.push(emp);
    });
    return res;
  }, [selectedDate, employees, selectedEmployeeIds, showOnlyWithoutAbsence, employeesWithAnyAbsence, absences, selectedStatuses]);

  const chartData = useMemo(() => {
    return teams
      .map(team => {
        const data = attendanceByTeam[team.id] || { working: [], absent: [] };
        return {
          teamName: team.name,
          Arbetar: data.working.length,
          Ledig: data.absent.length,
          teamId: team.id,
          total: data.working.length + data.absent.length
        };
      })
      .filter(t => t.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [teams, attendanceByTeam]);

  // --- Custom Tooltip ---
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const teamId = payload[0].payload.teamId;
    const { working, absent } = attendanceByTeam[teamId];

    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipTitle}>
          {payload[0].payload.teamName} — {selectedDate}
        </div>
        
        <div className={styles.statsGrid}>
          <span style={{ color: COLOR_SUCCESS }} className={styles.statItem}>Arbetar: {working.length}</span>
          {!showOnlyWithoutAbsence && <span style={{ color: COLOR_ERROR }} className={styles.statItem}>Ledig: {absent.length}</span>}
        </div>

        {!showOnlyWithoutAbsence && absent.length > 0 && (
          <div className={`${styles.employeeList} ${styles.listAbsent}`}>
            <span className={styles.listTitle}>Frånvarande:</span>
            {absent.map(e => <div key={e.id} className={styles.employeeName}>{e.name}</div>)}
          </div>
        )}

        {working.length > 0 && (
          <div className={`${styles.employeeList} ${styles.listWorking}`}>
            <span className={styles.listTitle}>
              {showOnlyWithoutAbsence ? "Anställda utan frånvaro:" : "I tjänst:"}
            </span>
            {working.map(e => <div key={e.id} className={styles.employeeName}>{e.name}</div>)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.selectGroup}>
          <label className={styles.label}>Välj helgdag</label>
          <select 
            className={styles.select} 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
          >
            {upcomingHolidays.map(h => (
              <option key={h.date} value={h.date}>{h.date} – {h.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.checkboxGroup} onClick={() => setShowOnlyWithoutAbsence(!showOnlyWithoutAbsence)}>
          <input 
            type="checkbox" 
            className={styles.checkbox} 
            checked={showOnlyWithoutAbsence}
            onChange={() => {}} // Handled by div click
          />
          <span style={{ fontSize: '0.85rem' }}>Visa endast utan frånvaro</span>
          <span className={styles.infoIcon} title="Ignorerar statusfilter och visar bara de som inte har någon bokad frånvaro alls">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </span>
          {showOnlyWithoutAbsence && <span className={styles.chip}>Åsidosätter statusfilter</span>}
        </div>
      </div>

      <div className={styles.card}>
        <div style={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="teamName" tick={{ fontSize: 12, fontWeight: 600 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
              <Legend verticalAlign="top" align="right" height={36}/>
              <Bar dataKey="Arbetar" stackId="a" fill={COLOR_SUCCESS} radius={showOnlyWithoutAbsence ? [0, 4, 4, 0] : [0, 0, 0, 0]} />
              {!showOnlyWithoutAbsence && <Bar dataKey="Ledig" stackId="a" fill={COLOR_ERROR} radius={[0, 4, 4, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}