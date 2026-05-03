import React, { useState, useEffect } from "react";
import styles from "./TeamForm.module.css";

export interface TeamFormProps {
  title: string;
  initialName?: string;
  isEditMode?: boolean;
  onSave: (name: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const TeamForm: React.FC<TeamFormProps> = ({
  title,
  initialName = "",
  isEditMode = false,
  onSave,
  onDelete,
  onClose,
}) => {
  const [name, setName] = useState(initialName);
  const [touched, setTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const maxLength = 50;
  const minAlphabetChars = 3;

  useEffect(() => {
    setName(initialName);
    setTouched(false);
  }, [initialName]);

  const countAlphabetChars = (text: string) => {
    const alphabetRegex = /[a-zA-ZåäöÅÄÖ]/g;
    const matches = text.match(alphabetRegex);
    return matches ? matches.length : 0;
  };

  const alphabetCount = countAlphabetChars(name);

  const isNameValid =
    name.trim().length > 0 && alphabetCount >= minAlphabetChars;

  const showError = touched && !isNameValid;

  const handleSave = () => {
    if (isNameValid) {
      onSave(name.trim());
    } else {
      setTouched(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <label className={styles.label}>Gruppnamn</label>

        <div
          className={`${styles.iconAdornment} ${
            isFocused ? styles.iconActive : ""
          }`}
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
          className={`${styles.inputField} ${
            showError ? styles.inputError : ""
          }`}
          value={name}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              setName(e.target.value);
              if (touched) setTouched(false);
            }
          }}
          onKeyDown={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setTouched(true);
          }}
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
            className={`${styles.btn} ${
              isEditMode ? styles.btnWarning : styles.btnPrimary
            }`}
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

export default TeamForm;
