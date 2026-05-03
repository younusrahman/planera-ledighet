import React, { useState, useEffect } from "react";
import styles from "./EmployeeForm.module.css";

export interface EmployeeFormProps {
  title?: string;
  initialName?: string;
  initialGroupId?: string;
  groups: { id: string; name: string }[];
  onSave: (name: string, groupId: string) => void;
  onClose: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  title = "Anställd",
  initialName = "",
  initialGroupId = "",
  groups,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialName);
  const [groupId, setGroupId] = useState(initialGroupId);
  const [touched, setTouched] = useState({ name: false, group: false });
  const [isFocused, setIsFocused] = useState(false);

  // Validation
  const isNameValid = name.trim().length > 0;
  const isGroupValid =
    groupId !== "" && groupId !== null && groupId !== undefined;
  const isFormValid = isNameValid && isGroupValid;

  const showNameError = touched.name && !isNameValid;
  const showGroupError = touched.group && !isGroupValid;

  useEffect(() => {
    setName(initialName);
    setGroupId(initialGroupId);
    setTouched({ name: false, group: false });
  }, [initialName, initialGroupId]);

  const handleSave = () => {
    if (isFormValid) {
      onSave(name.trim(), groupId);
    } else {
      setTouched({ name: true, group: true });
    }
  };
  return (
    <div className={styles.container}>
      {/* Name Input */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Namn på anställd</label>
        <div className={styles.inputWrapper}>
          <div
            className={`${styles.inputIcon} ${isFocused ? styles.iconActive : ""}`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <input
            autoFocus
            className={`${styles.input} ${showNameError ? styles.inputError : ""}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (touched.name) setTouched((p) => ({ ...p, name: false }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, name: true }))}
            onFocus={() => setIsFocused(true)}
            onBlurCapture={() => setIsFocused(false)}
            placeholder="Skriv fullständigt namn..."
          />
        </div>
        {showNameError && <div className={styles.errorText}>Namn krävs</div>}
      </div>

      {/* Group Select */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Grupp</label>
        <div className={styles.inputWrapper}>
          <div
            className={`${styles.inputIcon} ${groupId ? styles.iconActive : ""}`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <select
            className={`${styles.select} ${showGroupError ? styles.inputError : ""}`}
            value={groupId}
            onChange={(e) => {
              setGroupId(e.target.value);
              if (touched.group) setTouched((p) => ({ ...p, group: false }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, group: true }))}
          >
            <option value="" disabled>
              Välj grupp...
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        {showGroupError && (
          <span className={styles.errorText}>Du måste välja en grupp</span>
        )}
      </div>

      <footer className={styles.footer}>
        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={onClose}
        >
          Avbryt
        </button>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleSave}
          disabled={!isFormValid}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="16" y1="11" x2="22" y2="11" />
          </svg>
          Spara
        </button>
      </footer>
    </div>
  );
};

export default EmployeeForm;
