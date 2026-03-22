import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  DEFAULT_CELL_WIDTH,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_SIDEBAR_WIDTH_COMPACT,
  DEFAULT_SIDEBAR_WIDTH_FULL,
  useBlockPastDays,
  useCellWidth,
  useConfigActions,
  useDisableDeletion,
  useRowHeight,
  useSidebarMode,
  useSidebarWidthCompact,
  useSidebarWidthFull,
} from "../../stores/uiStore";

interface ConfigFormProps {
  title?: string;
  onClose?: () => void;
  onSave?: (values: {
    blockPastDays: boolean;
    disableDeletion: boolean;
    cellWidth: number;
    rowHeight: number;
    sidebarWidthFull: number;
    sidebarWidthCompact: number;
  }) => void | Promise<void>;
}

const styles: Record<string, CSSProperties> = {
  root: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "stretch",
  },
  card: {
    width: "100%",
    maxWidth: 760,
    margin: "0 auto",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "18px 20px",
    borderBottom: "1px solid #e2e8f0",
    background:
      "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
  },
  titleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  title: {
    margin: 0,
    fontSize: "1.3rem",
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.2,
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    color: "#64748b",
    fontWeight: 500,
  },
  closeIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#fff",
    cursor: "pointer",
    color: "#64748b",
    fontWeight: 800,
    flexShrink: 0,
  },
  content: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
  },
  sectionText: {
    margin: 0,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.5,
  },
  optionCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    background: "#fff",
    transition: "all 0.2s ease",
    overflow: "hidden",
  },
  optionCardActive: {
    border: "1px solid rgba(25,118,210,0.22)",
    boxShadow: "0 8px 22px rgba(25,118,210,0.08)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,255,1) 100%)",
  },
  optionCardDanger: {
    border: "1px solid rgba(211,47,47,0.22)",
    boxShadow: "0 8px 22px rgba(211,47,47,0.08)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,248,248,1) 100%)",
  },
  optionButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 18px",
    textAlign: "left",
  },
  optionButtonDisabled: {
    cursor: "not-allowed",
    opacity: 0.6,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    fontSize: 18,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  optionTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.3,
  },
  optionDesc: {
    margin: 0,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.45,
  },
  switch: {
    width: 52,
    height: 30,
    borderRadius: 999,
    position: "relative",
    flexShrink: 0,
    transition: "all 0.2s ease",
    border: "1px solid #cbd5e1",
    background: "#e2e8f0",
  },
  switchOn: {
    background: "#1976d2",
    border: "1px solid #1976d2",
  },
  switchDangerOn: {
    background: "#d32f2f",
    border: "1px solid #d32f2f",
  },
  switchKnob: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
    transition: "all 0.2s ease",
  },
  nestedWrap: {
    marginLeft: 28,
    paddingLeft: 18,
    borderLeft: "2px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  grid: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "1fr 1fr",
  },
  inputCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  inputLabel: {
    display: "block",
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
  },
  input: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: 14,
    outline: "none",
    background: "#fff",
    color: "#0f172a",
    boxSizing: "border-box",
  },
  helper: {
    margin: 0,
    fontSize: 12,
    color: "#64748b",
  },
  footer: {
    borderTop: "1px solid #e2e8f0",
    padding: 18,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    background:
      "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,0.7) 100%)",
  },
  footerLeft: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  footerRight: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginLeft: "auto",
  },
  btn: {
    height: 40,
    minWidth: 120,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.18s ease",
  },
  btnPrimary: {
    border: "none",
    background: "#1976d2",
    color: "#fff",
  },
  btnWarning: {
    border: "1px solid #f59e0b",
    color: "#b45309",
    background: "#fff",
  },
  btnDangerSoft: {
    border: "1px solid rgba(211,47,47,0.22)",
    color: "#d32f2f",
    background: "#fff",
  },
};

const LockIcon = () => <span aria-hidden="true">🔒</span>;
const DeleteIcon = () => <span aria-hidden="true">🗑️</span>;
const CloseIcon = () => <span aria-hidden="true">✕</span>;
const GridIcon = () => <span aria-hidden="true">▦</span>;
const SidebarIcon = () => <span aria-hidden="true">☰</span>;

const ToggleRow = ({
  title,
  description,
  checked,
  disabled,
  danger,
  icon,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  danger?: boolean;
  icon: React.ReactNode;
  onToggle: () => void;
}) => {
  const cardStyle = {
    ...styles.optionCard,
    ...(checked
      ? danger
        ? styles.optionCardDanger
        : styles.optionCardActive
      : {}),
  };

  const switchStyle = {
    ...styles.switch,
    ...(checked ? (danger ? styles.switchDangerOn : styles.switchOn) : {}),
  };

  return (
    <div style={cardStyle}>
      <button
        type="button"
        onClick={() => {
          if (!disabled) onToggle();
        }}
        style={{
          ...styles.optionButton,
          ...(disabled ? styles.optionButtonDisabled : {}),
        }}
      >
        <div
          style={{
            ...styles.iconBox,
            background: danger && checked ? "rgba(211,47,47,0.08)" : "#f8fafc",
            border:
              danger && checked
                ? "1px solid rgba(211,47,47,0.18)"
                : "1px solid #e2e8f0",
            color:
              danger && checked ? "#d32f2f" : checked ? "#1976d2" : "#475569",
          }}
        >
          {icon}
        </div>

        <div style={styles.textWrap}>
          <p
            style={{
              ...styles.optionTitle,
              color: danger && checked ? "#b91c1c" : "#0f172a",
            }}
          >
            {title}
          </p>
          <p style={styles.optionDesc}>{description}</p>
        </div>

        <div style={switchStyle} aria-hidden="true">
          <div
            style={{
              ...styles.switchKnob,
              transform: checked ? "translateX(22px)" : "translateX(0)",
            }}
          />
        </div>
      </button>
    </div>
  );
};

const ConfigForm: React.FC<ConfigFormProps> = ({ title, onClose, onSave }) => {
  const blockPastDays = useBlockPastDays();
  const disableDeletion = useDisableDeletion();
  const cellWidth = useCellWidth();
  const rowHeight = useRowHeight();
  const sidebarMode = useSidebarMode();
  const sidebarWidthFull = useSidebarWidthFull();
  const sidebarWidthCompact = useSidebarWidthCompact();

  const {
    setBlockPastDays,
    setDisableDeletion,
    setCellWidth,
    setRowHeight,
    setSidebarWidthFull,
    setSidebarWidthCompact,
  } = useConfigActions();

  const [screenWidth, setScreenWidth] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  const [isSaving, setIsSaving] = useState(false);

  const [cellWidthInput, setCellWidthInput] = useState(String(cellWidth));
  const [rowHeightInput, setRowHeightInput] = useState(String(rowHeight));
  const [sidebarWidthFullInput, setSidebarWidthFullInput] = useState(
    String(sidebarWidthFull),
  );
  const [sidebarWidthCompactInput, setSidebarWidthCompactInput] = useState(
    String(sidebarWidthCompact),
  );

  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setCellWidthInput(String(cellWidth));
  }, [cellWidth]);

  useEffect(() => {
    setRowHeightInput(String(rowHeight));
  }, [rowHeight]);

  useEffect(() => {
    setSidebarWidthFullInput(String(sidebarWidthFull));
  }, [sidebarWidthFull]);

  useEffect(() => {
    setSidebarWidthCompactInput(String(sidebarWidthCompact));
  }, [sidebarWidthCompact]);

  const isMobile = screenWidth < 640;

  const currentSidebarWidth =
    sidebarMode === "full" ? sidebarWidthFull : sidebarWidthCompact;

  const commitNumber = (
    rawValue: string,
    setter: (value: number) => void,
    fallback: number,
  ) => {
    const parsed = Number(rawValue);

    if (rawValue.trim() === "" || Number.isNaN(parsed)) {
      setter(fallback);
      return;
    }

    setter(parsed);
  };

  const summaryBadges = useMemo(() => {
    return [
      <span
        key="block"
        style={{
          ...styles.badge,
          background: blockPastDays ? "rgba(25,118,210,0.12)" : "#f1f5f9",
          color: blockPastDays ? "#1976d2" : "#64748b",
          border: blockPastDays
            ? "1px solid rgba(25,118,210,0.18)"
            : "1px solid #e2e8f0",
        }}
      >
        {blockPastDays ? "Spärr aktiv" : "Spärr av"}
      </span>,
      <span
        key="delete"
        style={{
          ...styles.badge,
          background: disableDeletion ? "rgba(211,47,47,0.1)" : "#f1f5f9",
          color: disableDeletion ? "#d32f2f" : "#64748b",
          border: disableDeletion
            ? "1px solid rgba(211,47,47,0.18)"
            : "1px solid #e2e8f0",
        }}
      >
        {disableDeletion ? "Radering blockerad" : "Radering tillåten"}
      </span>,
      <span
        key="cell"
        style={{
          ...styles.badge,
          background: "rgba(15,23,42,0.04)",
          color: "#334155",
          border: "1px solid #e2e8f0",
        }}
      >
        Cellbredd: {cellWidth}px
      </span>,
      <span
        key="row"
        style={{
          ...styles.badge,
          background: "rgba(15,23,42,0.04)",
          color: "#334155",
          border: "1px solid #e2e8f0",
        }}
      >
        Radhöjd: {rowHeight}px
      </span>,
      <span
        key="sidebar"
        style={{
          ...styles.badge,
          background: "rgba(15,23,42,0.04)",
          color: "#334155",
          border: "1px solid #e2e8f0",
        }}
      >
        Aktiv sidebar: {sidebarMode} ({currentSidebarWidth}px)
      </span>,
    ];
  }, [
    blockPastDays,
    disableDeletion,
    cellWidth,
    rowHeight,
    sidebarMode,
    currentSidebarWidth,
  ]);

  const handleResetDefaults = () => {
    setBlockPastDays(false);
    setDisableDeletion(false);
    setCellWidth(DEFAULT_CELL_WIDTH);
    setRowHeight(DEFAULT_ROW_HEIGHT);
    setSidebarWidthFull(DEFAULT_SIDEBAR_WIDTH_FULL);
    setSidebarWidthCompact(DEFAULT_SIDEBAR_WIDTH_COMPACT);

    setCellWidthInput(String(DEFAULT_CELL_WIDTH));
    setRowHeightInput(String(DEFAULT_ROW_HEIGHT));
    setSidebarWidthFullInput(String(DEFAULT_SIDEBAR_WIDTH_FULL));
    setSidebarWidthCompactInput(String(DEFAULT_SIDEBAR_WIDTH_COMPACT));
  };

  const handleSave = async () => {
    commitNumber(cellWidthInput, setCellWidth, DEFAULT_CELL_WIDTH);
    commitNumber(rowHeightInput, setRowHeight, DEFAULT_ROW_HEIGHT);
    commitNumber(
      sidebarWidthFullInput,
      setSidebarWidthFull,
      DEFAULT_SIDEBAR_WIDTH_FULL,
    );
    commitNumber(
      sidebarWidthCompactInput,
      setSidebarWidthCompact,
      DEFAULT_SIDEBAR_WIDTH_COMPACT,
    );

    if (!onSave) return;

    try {
      setIsSaving(true);
      await onSave({
        blockPastDays,
        disableDeletion,
        cellWidth:
          cellWidthInput.trim() === "" || Number.isNaN(Number(cellWidthInput))
            ? DEFAULT_CELL_WIDTH
            : Number(cellWidthInput),
        rowHeight:
          rowHeightInput.trim() === "" || Number.isNaN(Number(rowHeightInput))
            ? DEFAULT_ROW_HEIGHT
            : Number(rowHeightInput),
        sidebarWidthFull:
          sidebarWidthFullInput.trim() === "" ||
          Number.isNaN(Number(sidebarWidthFullInput))
            ? DEFAULT_SIDEBAR_WIDTH_FULL
            : Number(sidebarWidthFullInput),
        sidebarWidthCompact:
          sidebarWidthCompactInput.trim() === "" ||
          Number.isNaN(Number(sidebarWidthCompactInput))
            ? DEFAULT_SIDEBAR_WIDTH_COMPACT
            : Number(sidebarWidthCompactInput),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <div
          style={{
            ...styles.header,
            padding: isMobile ? "16px 16px" : "18px 20px",
          }}
        >
          <div style={styles.titleWrap}>
            {title && (
              <h2
                style={{
                  ...styles.title,
                  fontSize: isMobile ? "1.1rem" : "1.3rem",
                }}
              >
                {title}
              </h2>
            )}
            <p style={styles.subtitle}>
              Hantera regler och layout för systemet
            </p>
          </div>

          {onClose && (
            <button type="button" onClick={onClose} style={styles.closeIconBtn}>
              <CloseIcon />
            </button>
          )}
        </div>

        <div
          style={{
            ...styles.content,
            padding: isMobile ? 16 : 20,
          }}
        >
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Inställningar</h3>
            <p style={styles.sectionText}>
              Välj hur historiska dagar, radering och layout ska hanteras.
            </p>
            <div style={styles.badgeRow}>{summaryBadges}</div>
          </div>

          <div style={styles.section}>
            <ToggleRow
              title="Spärr för gångna dagar"
              description="Förhindrar ändringar av historiska data."
              checked={blockPastDays}
              icon={<LockIcon />}
              onToggle={() => setBlockPastDays(!blockPastDays)}
            />

            <div
              style={{
                ...styles.nestedWrap,
                marginLeft: isMobile ? 12 : 28,
                paddingLeft: isMobile ? 12 : 18,
                borderLeft: `2px solid ${blockPastDays ? "#93c5fd" : "#e2e8f0"}`,
              }}
            >
              <ToggleRow
                title="Ta bort möjligheten att radera"
                description="Permanent borttagning av raderingsfunktionen när spärr för gångna dagar är aktiv."
                checked={disableDeletion}
                disabled={!blockPastDays}
                danger
                icon={<DeleteIcon />}
                onToggle={() => setDisableDeletion(!disableDeletion)}
              />
            </div>
          </div>

          <div
            style={{
              ...styles.section,
              borderTop: "1px solid #e2e8f0",
              paddingTop: 16,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <h3 style={styles.sectionTitle}>Layout</h3>
              <p style={styles.sectionText}>
                Anpassa cellbredd, radhöjd och sidofältets storlek.
              </p>
            </div>

            <div
              style={{
                ...styles.grid,
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              }}
            >
              <div style={styles.inputCard}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <div style={styles.iconBox}>
                    <GridIcon />
                  </div>
                  <label style={styles.inputLabel}>Cellbredd</label>
                </div>

                <input
                  type="number"
                  min={20}
                  max={120}
                  value={cellWidthInput}
                  onChange={(e) => setCellWidthInput(e.target.value)}
                  onBlur={() =>
                    commitNumber(
                      cellWidthInput,
                      setCellWidth,
                      DEFAULT_CELL_WIDTH,
                    )
                  }
                  style={styles.input}
                />
                <p style={styles.helper}>
                  Standardvärde: {DEFAULT_CELL_WIDTH} px
                </p>
              </div>

              <div style={styles.inputCard}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <div style={styles.iconBox}>
                    <GridIcon />
                  </div>
                  <label style={styles.inputLabel}>Radhöjd</label>
                </div>

                <input
                  type="number"
                  min={20}
                  max={80}
                  value={rowHeightInput}
                  onChange={(e) => setRowHeightInput(e.target.value)}
                  onBlur={() =>
                    commitNumber(
                      rowHeightInput,
                      setRowHeight,
                      DEFAULT_ROW_HEIGHT,
                    )
                  }
                  style={styles.input}
                />
                <p style={styles.helper}>
                  Standardvärde: {DEFAULT_ROW_HEIGHT} px
                </p>
              </div>

              <div style={styles.inputCard}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <div style={styles.iconBox}>
                    <SidebarIcon />
                  </div>
                  <label style={styles.inputLabel}>Sidofält full</label>
                </div>

                <input
                  type="number"
                  min={0}
                  max={400}
                  value={sidebarWidthFullInput}
                  onChange={(e) => setSidebarWidthFullInput(e.target.value)}
                  onBlur={() =>
                    commitNumber(
                      sidebarWidthFullInput,
                      setSidebarWidthFull,
                      DEFAULT_SIDEBAR_WIDTH_FULL,
                    )
                  }
                  style={styles.input}
                />
                <p style={styles.helper}>
                  Standardvärde: {DEFAULT_SIDEBAR_WIDTH_FULL} px
                </p>
              </div>

              <div style={styles.inputCard}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <div style={styles.iconBox}>
                    <SidebarIcon />
                  </div>
                  <label style={styles.inputLabel}>Sidofält compact</label>
                </div>

                <input
                  type="number"
                  min={0}
                  max={400}
                  value={sidebarWidthCompactInput}
                  onChange={(e) => setSidebarWidthCompactInput(e.target.value)}
                  onBlur={() =>
                    commitNumber(
                      sidebarWidthCompactInput,
                      setSidebarWidthCompact,
                      DEFAULT_SIDEBAR_WIDTH_COMPACT,
                    )
                  }
                  style={styles.input}
                />
                <p style={styles.helper}>
                  Standardvärde: {DEFAULT_SIDEBAR_WIDTH_COMPACT} px
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            <button
              type="button"
              onClick={handleResetDefaults}
              style={{ ...styles.btn, ...styles.btnDangerSoft }}
            >
              Återställ standard
            </button>
          </div>

          <div style={styles.footerRight}>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{ ...styles.btn, ...styles.btnWarning }}
              >
                Stäng
              </button>
            )}

            {onSave && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  ...styles.btn,
                  ...styles.btnPrimary,
                  opacity: isSaving ? 0.7 : 1,
                  cursor: isSaving ? "wait" : "pointer",
                }}
              >
                {isSaving ? "Sparar..." : "Spara"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigForm;
