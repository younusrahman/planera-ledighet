import React, { useState, useEffect, useMemo } from "react";
import styles from "./AbsenceCategoryForm.module.css";

export const PREDEFINED_COLORS = [
  "#1976d2",
  "#0288d1",
  "#7b1fa2",
  "#512da8",
  "#1e21ed",
  "#00796b",
  "#689f38",
  "#d32f2f",
  "#c2185b",
  "#ad1457",
  "#ed6c02",
  "#f57c00",
  "#ffa000",
  "#afb42b",
  "#616161",
  "#455a64",
  "#5d4037",
  "#00acc1",
  "#e64a19",
  "#303f9f",
];

export interface AbsenceCategoryFormProps {
  title: string;
  initialLabel?: string;
  initialColor?: string;
  typeId?: string;
  absenceTypes: { id: string; color: string; label: string }[];
  isEditMode?: boolean;
  onSave: (label: string, color: string) => Promise<void> | void;
  onDelete?: () => void;
  onClose?: () => void;
}

const AbsenceCategoryForm: React.FC<AbsenceCategoryFormProps> = ({
  title,
  initialLabel = "",
  initialColor = "",
  typeId,
  absenceTypes = [],
  isEditMode = false,
  onSave,
  onDelete,
  onClose,
}) => {
  const [label, setLabel] = useState(initialLabel);
  const [color, setColor] = useState(initialColor || PREDEFINED_COLORS[0]);
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLabel(initialLabel);
    setColor(initialColor || PREDEFINED_COLORS[0]);
    setTouched(false);
  }, [initialLabel, initialColor, typeId]);

  const isLabelTaken = useMemo(() => {
    const currentLabel = label.trim().toLowerCase();
    if (currentLabel.length === 0) return false;

    return absenceTypes.some(
      (t) => t.id !== typeId && t.label.toLowerCase().trim() === currentLabel,
    );
  }, [label, absenceTypes, typeId]);

  const isColorTakenByOther = useMemo(() => {
    const currentColor = color.toLowerCase();
    return absenceTypes.some(
      (t) => t.id !== typeId && t.color.toLowerCase() === currentColor,
    );
  }, [color, absenceTypes, typeId]);

  const hasChanges = useMemo(() => {
    return (
      label.trim() !== initialLabel.trim() ||
      color.toLowerCase() !== (initialColor || "").toLowerCase()
    );
  }, [label, color, initialLabel, initialColor]);

  const isLabelValid = label.trim().length >= 3;

  const canSave =
    isLabelValid &&
    !isLabelTaken &&
    !isColorTakenByOther &&
    (!isEditMode || hasChanges) &&
    !isSaving;

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    try {
      await onSave(label.trim(), color);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getColorContrast = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8M8 12h8" />
        </svg>
        {title || (isEditMode ? "Redigera frånvarotyp" : "Ny frånvarotyp")}
      </h2>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          Namn på frånvarotyp (minst 3 tecken)
        </label>
        <input
          className={`${styles.input} ${
            touched && (!isLabelValid || isLabelTaken) ? styles.inputError : ""
          }`}
          value={label}
          disabled={isSaving}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="T.ex. Semester eller Sjukfrånvaro"
        />
        <div className={styles.errorText}>
          {touched && !isLabelValid
            ? "Minst 3 tecken krävs"
            : isLabelTaken
              ? "Detta namn används redan"
              : ""}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Välj färg</label>

        {isColorTakenByOther && (
          <div className={styles.alert}>
            Denna färg används redan. Välj en annan cirkel.
          </div>
        )}

        <div className={styles.colorGrid}>
          {PREDEFINED_COLORS.map((c) => {
            const isSelected = color.toLowerCase() === c.toLowerCase();
            const isUsedByOther = absenceTypes.some(
              (t) =>
                t.id !== typeId && t.color.toLowerCase() === c.toLowerCase(),
            );

            return (
              <div
                key={c}
                onClick={() => !isUsedByOther && setColor(c)}
                className={`${styles.colorCircle} ${
                  isSelected ? styles.selected : ""
                } ${isUsedByOther ? styles.disabled : ""}`}
                style={{ backgroundColor: c }}
              >
                {isSelected && (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={getColorContrast(c)}
                    strokeWidth="3"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.actions}>
        {isEditMode && onDelete && (
          <button
            className={`${styles.btn} ${styles.btnDelete}`}
            onClick={onDelete}
            disabled={isSaving}
          >
            Ta bort
          </button>
        )}

        <div className={styles.spacer} />

        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={onClose}
          disabled={isSaving}
        >
          Avbryt
        </button>

        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleSave}
          disabled={!canSave}
        >
          {isSaving ? "Sparar..." : isEditMode ? "Spara" : "Skapa"}
        </button>
      </div>
    </div>
  );
};

export default AbsenceCategoryForm;
