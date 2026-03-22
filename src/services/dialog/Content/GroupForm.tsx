import React, { useState, useEffect } from "react";
import styles from "./GroupForm.module.css";

export interface GroupFormProps {
  title: string;
  initialName?: string;
  isEditMode?: boolean;
  onSave: (name: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const GroupForm: React.FC<GroupFormProps> = ({
  title,
  initialName = "",
  isEditMode = false,
  onSave,
  onDelete,
  onClose,
}) => {
  const [name, setName] = useState(initialName);
  const [isFocused, setIsFocused] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);

  const maxLength = 50;
  const minAlphabetChars = 3;

  useEffect(() => {
    setName(initialName);
    setSaveAttempted(false);
  }, [initialName]);

  const countAlphabetChars = (text: string) => {
    const alphabetRegex = /[a-zA-ZåäöÅÄÖ]/g;
    const matches = text.match(alphabetRegex);
    return matches ? matches.length : 0;
  };

  const alphabetCount = countAlphabetChars(name);
  const isNameValid =
    name.trim().length > 0 && alphabetCount >= minAlphabetChars;
  const showError = saveAttempted && !isNameValid;

  const handleSave = () => {
    if (isNameValid) {
      onSave(name.trim());
    } else {
      setSaveAttempted(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {/* Groups Icon SVG */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <h2 className={styles.title}>{title}</h2>
      </div>

      <div className={styles.inputWrapper}>
        <label className={styles.label}>Gruppnamn</label>

        {/* Adornment Icon */}
        <div
          className={`${styles.iconAdornment} ${isFocused ? styles.iconActive : ""}`}
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
          </svg>
        </div>

        <input
          autoFocus
          className={`${styles.inputField} ${showError ? styles.inputError : ""}`}
          value={name}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) setName(e.target.value);
          }}
          onKeyDown={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ange gruppnamn..."
        />

        {showError && (
          <span className={styles.errorText}>
            Namnet kräver minst {minAlphabetChars} bokstäver.
          </span>
        )}
      </div>

      <div className={styles.footer}>
        <div>
          {isEditMode && onDelete && (
            <button
              className={`${styles.btn} ${styles.btnDelete}`}
              onClick={onDelete}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Ta bort
            </button>
          )}
        </div>

        <div className={styles.btnGroup}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onClose}
          >
            Avbryt
          </button>
          <button
            className={`${styles.btn} ${isEditMode ? styles.btnWarning : styles.btnPrimary}`}
            onClick={handleSave}
            disabled={!isNameValid}
          >
            {isEditMode ? "Spara" : "Skapa"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupForm;
