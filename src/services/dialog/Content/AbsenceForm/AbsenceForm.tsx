import React, { useCallback, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";

export type AbsenceType = { id: string; label: string; color: string };

export type AbsenceFormData = {
  typeId: string;
  startDate: Dayjs;
  duration: number;
};

export interface AbsenceFormProps {
  title: string;
  mode: "create" | "edit";
  data: {
    typeId: string;
    startDate: string | Date | Dayjs;
    duration: number;
  };
  absenceTypes: AbsenceType[];
  blockPastDays: boolean;
  today: Dayjs;
  onSave: (data: AbsenceFormData) => void;
  onClose?: () => void;
}

type Errors = Partial<Record<keyof AbsenceFormData, string>>;

const cx = (...classes: Array<string | false | undefined | null>) =>
  classes.filter(Boolean).join(" ");

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
  const [state, setState] = useState<AbsenceFormData>(() => ({
    typeId: data.typeId,
    startDate: dayjs(data.startDate),
    duration: data.duration,
  }));

  const [errors, setErrors] = useState<Errors>({});

  const endDate = useMemo(
    () => state.startDate.add(Math.max(1, state.duration) - 1, "day"),
    [state.startDate, state.duration],
  );

  const isPast = useMemo(
    () => state.startDate.isBefore(today, "day"),
    [state.startDate, today],
  );

  const selectedType = useMemo(
    () => absenceTypes.find((t) => t.id === state.typeId),
    [absenceTypes, state.typeId],
  );

  const canSubmit = !(blockPastDays && isPast);

  const validate = useCallback(() => {
    const next: Errors = {};
    if (!state.typeId) next.typeId = "Välj en frånvarotyp";
    if (blockPastDays && isPast) next.startDate = "Datum kan inte vara i dåtid";
    if (state.duration < 1) next.duration = "Minst 1 dag krävs";

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [blockPastDays, isPast, state.typeId, state.duration]);

  const setFieldError = (key: keyof AbsenceFormData, msg?: string) =>
    setErrors((p) => ({ ...p, [key]: msg }));

  const onStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextStart = dayjs(e.target.value);
    if (!nextStart.isValid()) return;

    if (blockPastDays && nextStart.isBefore(today, "day")) {
      setFieldError("startDate", "Datum kan inte vara i dåtid");
    } else {
      setFieldError("startDate");
    }

    // keep current endDate by adjusting duration
    const nextDuration = Math.max(1, endDate.diff(nextStart, "day") + 1);

    setState((p) => ({ ...p, startDate: nextStart, duration: nextDuration }));
  };

  const onEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextEnd = dayjs(e.target.value);
    if (!nextEnd.isValid()) return;

    const nextDuration = Math.max(1, nextEnd.diff(state.startDate, "day") + 1);
    setState((p) => ({ ...p, duration: nextDuration }));
    setFieldError("duration");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (!validate()) return;
    onSave(state);
  };

  const baseInput =
    "mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2";
  const okInput =
    "border-slate-300 focus:border-slate-400 focus:ring-slate-200";
  const errInput = "border-rose-500 focus:border-rose-500 focus:ring-rose-100";

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-xl rounded-2xl"
    >

      {/* Type */}
      <div className="mb-4">
        <label htmlFor="typeId" className="text-sm font-medium text-slate-700">
          Frånvarotyp
        </label>

        <select
          id="typeId"
          value={state.typeId}
          onChange={(e) => {
            setState((p) => ({ ...p, typeId: e.target.value }));
            setFieldError("typeId");
          }}
          className={cx(
            baseInput,
            errors.typeId ? errInput : okInput,
            "appearance-none",
          )}
          aria-invalid={!!errors.typeId}
        >
          <option value="">Välj typ...</option>
          {absenceTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        {errors.typeId && (
          <p className="mt-1 text-xs font-medium text-rose-600">
            {errors.typeId}
          </p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="startDate"
            className="text-sm font-medium text-slate-700"
          >
            Startdatum
          </label>

          <input
            id="startDate"
            type="date"
            min={blockPastDays ? today.format("YYYY-MM-DD") : undefined}
            value={state.startDate.format("YYYY-MM-DD")}
            onChange={onStartDateChange}
            className={cx(baseInput, errors.startDate ? errInput : okInput)}
            aria-invalid={!!errors.startDate}
          />

          {errors.startDate && (
            <p className="mt-1 text-xs font-medium text-rose-600">
              {errors.startDate}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="text-sm font-medium text-slate-700"
          >
            Slutdatum (beräknat)
          </label>

          <input
            id="endDate"
            type="date"
            min={state.startDate.format("YYYY-MM-DD")}
            value={endDate.format("YYYY-MM-DD")}
            onChange={onEndDateChange}
            className={cx(baseInput, okInput)}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <div className="font-semibold text-slate-900">
            {state.duration} {state.duration === 1 ? "dag" : "dagar"}
          </div>
          <div className="text-xs text-slate-500">
            {state.startDate.format("D MMM")} – {endDate.format("D MMM YYYY")}
          </div>
        </div>

        {selectedType && (
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: selectedType.color }}
            title={selectedType.label}
          >
            {selectedType.label}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center justify-end gap-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Avbryt
          </button>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={cx(
            "rounded-lg px-4 py-2 text-sm font-semibold text-white transition",
            canSubmit
              ? "bg-slate-900 hover:bg-slate-800"
              : "cursor-not-allowed bg-slate-300",
          )}
        >
          {mode === "create" ? "Skapa" : "Spara"}
        </button>
      </div>
    </form>
  );
}
