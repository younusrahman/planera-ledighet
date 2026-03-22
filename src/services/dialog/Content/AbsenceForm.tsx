import React, { useState } from "react";
import dayjs from "dayjs";
import styles from "./AbsenceForm.module.css";

export interface AbsenceFormProps {
  title: string;
  mode: "create" | "edit";
  data: {
    typeId: string;
    startDate: any; // dayjs
    duration: number;
  };
  absenceTypes: { id: string; label: string; color: string }[];
  blockPastDays: boolean;
  today: any; // dayjs
  onSave: (data: AbsenceFormProps["data"]) => void;
  onClose?: () => void;
}

export default function AbsenceForm({
  title,
  mode,
  data,
  absenceTypes,
  blockPastDays,
  today,
  onSave,
  onClose,
}: AbsenceFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
 const [state, setState] = useState({
    ...data,
    startDate: dayjs(data.startDate) 
  });

  // Calculate endDate safely
  const startDateObj = dayjs(state.startDate);
  const endDate = startDateObj.add(state.duration - 1, "day");
  const isPast = state.startDate.isBefore(today, "day");

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!state.typeId) newErrors.typeId = "Välj en frånvarotyp";
    if (blockPastDays && isPast)
      newErrors.startDate = "Datum kan inte vara i dåtid";
    if (state.duration < 1) newErrors.duration = "Minst 1 dag krävs";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(state);
    }
  };

  // Logic: When start date changes, we keep the end date if possible, otherwise adjust duration
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = dayjs(e.target.value);
    if (!newStart.isValid()) return;

    // Strict validation for past days
    if (blockPastDays && newStart.isBefore(today, "day")) {
      setErrors((p) => ({ ...p, startDate: "Datum kan inte vara i dåtid" }));
    } else {
      setErrors((p) => ({ ...p, startDate: "" }));
    }

    const diff = endDate.diff(newStart, "day") + 1;
    setState((prev) => ({
      ...prev,
      startDate: newStart,
      duration: Math.max(1, diff),
    }));
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>

      {/* Type Selector */}
      <div className={styles.field}>
        <label className={styles.label}>Frånvarotyp</label>
        <select
          className={`${styles.select} ${errors.typeId ? styles.inputError : ""}`}
          value={state.typeId}
          onChange={(e) => setState((p) => ({ ...p, typeId: e.target.value }))}
        >
          <option value="">Välj typ...</option>
          {absenceTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        {errors.typeId && (
          <span className={styles.errorText}>{errors.typeId}</span>
        )}
      </div>

      {/* Date Grid */}
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label}>Startdatum</label>
          <input
            type="date"
            className={`${styles.input} ${errors.startDate ? styles.inputError : ""}`}
            min={blockPastDays ? today.format("YYYY-MM-DD") : undefined}
            value={state.startDate.format("YYYY-MM-DD")}
            onChange={handleStartChange}
          />
          {errors.startDate && (
            <span className={styles.errorText}>{errors.startDate}</span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Slutdatum (beräknat)</label>
          <input
            type="date"
            className={styles.input}
            value={endDate.format("YYYY-MM-DD")}
            min={state.startDate.format("YYYY-MM-DD")}
            onChange={(e) => {
              const diff =
                dayjs(e.target.value).diff(state.startDate, "day") + 1;
              setState((p) => ({ ...p, duration: Math.max(1, diff) }));
            }}
          />
        </div>
      </div>

      {/* Summary Area */}
      <div className={styles.summary}>
        <div>
          <div style={{ fontWeight: 600 }}>
            {state.duration} {state.duration === 1 ? "dag" : "dagar"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
            {state.startDate.format("D MMM")} - {endDate.format("D MMM YYYY")}
          </div>
        </div>
        {state.typeId && (
          <div
            style={{
              backgroundColor: absenceTypes.find((t) => t.id === state.typeId)
                ?.color,
              color: "white",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {absenceTypes.find((t) => t.id === state.typeId)?.label}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={onClose}
        >
          Avbryt
        </button>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleSave}
          disabled={blockPastDays && isPast}
        >
          {mode === "create" ? "Skapa" : "Spara"}
        </button>
      </div>
    </div>
  );
}
