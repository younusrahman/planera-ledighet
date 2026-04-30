import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { useAbsenceCategories } from "../services/hooks/useData";

// --- HELPERS ---
const rgba = (hex: string, opacity: number) => {
  if (!hex || hex === "transparent") return `rgba(0,0,0,${opacity})`;
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const MoreIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const FilterIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

interface TimelineFooterProps {
  onAbsenceTypeClick: (type: any) => void;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

function TimelineFooter({
  onAbsenceTypeClick,
  selectedIds,
  onToggle,
}: TimelineFooterProps) {
  const { data: absenceTypes = [] } = useAbsenceCategories();

  const [isOpen, setIsOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [visibleChipCount, setVisibleChipCount] = useState<number>(0);

  const panelRef = useRef<HTMLDivElement>(null);
  const footerInnerRef = useRef<HTMLDivElement>(null);
  const chipMeasureRef = useRef<HTMLDivElement>(null);
  const filterMeasureRef = useRef<HTMLButtonElement>(null);
  const moreMeasureRef = useRef<HTMLDivElement>(null);

  const isMobile = windowWidth <= 768;
  const isSmallMobile = windowWidth <= 520;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const sortedTypes = useMemo(() => {
    const selected = absenceTypes.filter((t) => selectedIds.includes(t.id));
    const unselected = absenceTypes.filter((t) => !selectedIds.includes(t.id));
    return [...selected, ...unselected];
  }, [absenceTypes, selectedIds]);

  const allSelected = useMemo(() => {
    return (
      absenceTypes.length > 0 && selectedIds.length === absenceTypes.length
    );
  }, [absenceTypes, selectedIds]);

  useEffect(() => {
    const calculateVisibleChips = () => {
      if (isMobile) {
        setVisibleChipCount(0);
        return;
      }

      const container = footerInnerRef.current;
      const chipProbe = chipMeasureRef.current;
      const filterProbe = filterMeasureRef.current;
      const moreProbe = moreMeasureRef.current;

      if (!container || !chipProbe || !filterProbe || !moreProbe) return;

      const containerWidth = container.clientWidth;
      const filterWidth = filterProbe.offsetWidth;
      const chipWidth = chipProbe.offsetWidth;
      const moreWidth = moreProbe.offsetWidth;
      const gap = 8;
      const sidePaddingSafety = 8;

      let remaining = containerWidth - filterWidth - gap - sidePaddingSafety;

      if (remaining <= chipWidth) {
        setVisibleChipCount(0);
        return;
      }

      let count = 0;

      for (let i = 0; i < sortedTypes.length; i++) {
        const hiddenAfterThis = sortedTypes.length - (i + 1);
        const extraMoreWidth = hiddenAfterThis > 0 ? moreWidth + gap : 0;
        const nextNeed = chipWidth + (count > 0 ? gap : 0) + extraMoreWidth;

        if (remaining >= nextNeed) {
          remaining -= chipWidth + (count > 0 ? gap : 0);
          count++;
        } else {
          break;
        }
      }

      setVisibleChipCount(count);
    };

    calculateVisibleChips();
    const timeout = window.setTimeout(calculateVisibleChips, 50);
    return () => window.clearTimeout(timeout);
  }, [sortedTypes, isMobile, windowWidth]);

  const visibleTypes = useMemo(() => {
    if (isMobile) return [];
    return sortedTypes.slice(0, visibleChipCount);
  }, [sortedTypes, visibleChipCount, isMobile]);

  const hiddenCount = useMemo(() => {
    if (isMobile) return 0;
    return Math.max(sortedTypes.length - visibleTypes.length, 0);
  }, [sortedTypes.length, visibleTypes.length, isMobile]);

  const shouldCenterFilterButton = isMobile || visibleTypes.length === 0;

  const handleSelectAll = () => {
    absenceTypes.forEach((type) => {
      if (!selectedIds.includes(type.id)) {
        onToggle(type.id);
      }
    });
  };

  const handleClearAll = () => {
    absenceTypes.forEach((type) => {
      if (selectedIds.includes(type.id)) {
        onToggle(type.id);
      }
    });
  };

  const handleEdit = (type: any) => {
    setIsOpen(false);
    requestAnimationFrame(() => {
      onAbsenceTypeClick(type);
    });
  };
  const selectedCount = useMemo(() => {
    const set = new Set(selectedIds);
    return absenceTypes.filter((t) => set.has(t.id)).length;
  }, [absenceTypes, selectedIds]);

  const unselectedCount = useMemo(() => {
    return Math.max(absenceTypes.length - selectedCount, 0);
  }, [absenceTypes.length, selectedCount]);
  const styles: Record<string, React.CSSProperties> = {
    footer: {
      position: "sticky",
      bottom: 0,
      left: 0,
      zIndex: 110,
      width: "100%",
      boxSizing: "border-box",
      background: "rgba(255,255,255,0.9)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      borderTop: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 -10px 30px rgba(0,0,0,0.05)",
      padding: isSmallMobile ? "10px 12px" : "10px 16px",
    },

    footerInner: {
      width: "100%",

      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "auto 1fr auto", // Knapp | Center | Ghost
      alignItems: "center",
      gap: 10,
      // padding: "0 16px", // valfritt för luft kanterna
    },

    chipsArea: {
      display: isMobile ? "none" : "flex",
      alignItems: "center",
      gap: 8,
      minWidth: 0,
      overflow: "hidden",
      flex: 1,
      justifyContent: "center",
    },

    chip: {
      height: 30,
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "0 10px",
      borderRadius: 999,
      border: "1px solid rgba(0,0,0,0.08)",
      background: "rgba(255,255,255,0.7)",
      whiteSpace: "nowrap",
      flexShrink: 0,
      cursor: "pointer",
      transition: "all 0.18s ease",
    },

    chipDot: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      flexShrink: 0,
    },

    chipLabel: {
      fontSize: "0.74rem",
      fontWeight: 700,
      color: "#334155",
    },

    moreCount: {
      height: 30,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 12px",
      borderRadius: 999,
      border: "1px dashed rgba(0,0,0,0.16)",
      color: "#64748b",
      fontSize: "0.74rem",
      fontWeight: 700,
      background: "rgba(248,250,252,0.9)",
      flexShrink: 0,
    },

    filterBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      border: "1px solid rgba(0,0,0,0.08)",
      background: "white",
      color: "#334155",
      borderRadius: 12,
      padding: isSmallMobile ? "10px 12px" : "10px 14px",
      fontWeight: 700,
      fontSize: "0.82rem",
      cursor: "pointer",
      boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
      flexShrink: 0,
      minWidth: isMobile ? "100%" : undefined,
      justifySelf: isMobile ? "center" : "start", // <-- center on mobile, left on desktop
      width: isMobile ? "min(92vw, 360px)" : undefined,
    },

    overlayRoot: {
      position: "fixed",
      inset: 0,
      zIndex: 5000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isSmallMobile ? 10 : 20,
    },

    overlayBackdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.28)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      animation: "footerFadeIn 0.2s ease",
    },

    panel: {
      position: "relative",
      zIndex: 1,
      pointerEvents: "auto",
      width: isMobile ? "100%" : "min(92vw, 560px)",
      maxWidth: 560,
      maxHeight: isMobile ? "88vh" : "70vh",
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderRadius: 20,
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
      overflow: "hidden",
      animation: "footerPopIn 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
      transformOrigin: "center center",
    },

    panelHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: isSmallMobile ? "14px 14px 10px" : "16px 18px 12px",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.9))",
    },

    panelTitleWrap: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      minWidth: 0,
    },

    panelTitle: {
      fontSize: "0.95rem",
      fontWeight: 800,
      color: "#0f172a",
    },

    panelSubTitle: {
      fontSize: "0.76rem",
      color: "#64748b",
      fontWeight: 500,
    },

    closeBtn: {
      background: "#0f172a",
      color: "white",
      border: "none",
      borderRadius: 10,
      padding: "8px 12px",
      fontSize: "0.72rem",
      fontWeight: 800,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },

    actionsRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: isSmallMobile ? "10px 14px" : "12px 18px",
      borderBottom: "1px solid rgba(0,0,0,0.05)",
      flexWrap: "wrap",
    },

    actionBtn: {
      border: "1px solid rgba(0,0,0,0.08)",
      background: "white",
      color: "#334155",
      borderRadius: 10,
      padding: "8px 12px",
      fontSize: "0.76rem",
      fontWeight: 700,
      cursor: "pointer",
    },

    actionPrimary: {
      color: "#1976d2",
      border: "1px solid rgba(25,118,210,0.18)",
      background: "rgba(25,118,210,0.04)",
    },

    list: {
      maxHeight: isMobile ? "calc(88vh - 150px)" : "calc(70vh - 150px)",
      overflowY: "auto",
      padding: "8px 0",
    },

    row: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: isSmallMobile ? "12px 14px" : "12px 18px",
      borderBottom: "1px solid rgba(0,0,0,0.04)",
    },

    rowLeft: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      minWidth: 0,
      flex: 1,
      cursor: "pointer",
    },

    checkbox: {
      width: 18,
      height: 18,
      accentColor: "#1976d2",
      cursor: "pointer",
      flexShrink: 0,
    },

    colorDot: {
      width: 10,
      height: 10,
      borderRadius: "50%",
      flexShrink: 0,
    },

    labelWrap: {
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
    },

    label: {
      fontSize: "0.88rem",
      fontWeight: 700,
      color: "#1e293b",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    subLabel: {
      fontSize: "0.72rem",
      color: "#64748b",
      marginTop: 2,
    },

    rowRight: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexShrink: 0,
    },

    selectedPill: {
      fontSize: "0.68rem",
      fontWeight: 700,
      padding: "4px 8px",
      borderRadius: 999,
      background: "rgba(16,185,129,0.1)",
      color: "#059669",
      border: "1px solid rgba(16,185,129,0.18)",
      whiteSpace: "nowrap",
    },

    editBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      border: "1px solid rgba(0,0,0,0.08)",
      background: "white",
      color: "#64748b",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      flexShrink: 0,
    },

    hiddenMeasureWrap: {
      position: "fixed",
      visibility: "hidden",
      pointerEvents: "none",
      left: -9999,
      top: -9999,
      display: "flex",
      gap: 8,
    },
  };

  return (
    <>
      <div style={styles.footer}>
        <div ref={footerInnerRef} style={styles.footerInner}>
          <button
            onClick={() => setIsOpen(true)}
            style={styles.filterBtn}
            aria-expanded={isOpen}
            ref={filterMeasureRef}
          >
            <FilterIcon />
            {`Filter ${unselectedCount}/${absenceTypes.length}`}
          </button>

          {!shouldCenterFilterButton && (
            <div style={styles.chipsArea}>
              {visibleTypes.map((type) => {
                const isSelected = selectedIds.includes(type.id);

                return (
                  <div
                    key={type.id}
                    style={{
                      ...styles.chip,
                      background: isSelected
                        ? rgba(type.color, 0.12)
                        : "rgba(255,255,255,0.7)",
                      borderColor: isSelected
                        ? rgba(type.color, 0.28)
                        : "rgba(0,0,0,0.08)",
                      opacity: isSelected ? 1 : 0.75,
                    }}
                    onClick={() => onToggle(type.id)}
                  >
                    <div
                      style={{
                        ...styles.chipDot,
                        backgroundColor: type.color,
                        boxShadow: isSelected
                          ? `0 0 8px ${rgba(type.color, 0.8)}`
                          : "none",
                      }}
                    />
                    <span style={styles.chipLabel}>{type.label}</span>
                  </div>
                );
              })}

              {hiddenCount > 0 && (
                <div style={styles.moreCount}>+{hiddenCount}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={styles.hiddenMeasureWrap}>
        <div ref={chipMeasureRef} style={styles.chip}>
          <div style={{ ...styles.chipDot, backgroundColor: "#1976d2" }} />
          <span style={styles.chipLabel}>Semester</span>
        </div>
        <div ref={moreMeasureRef} style={styles.moreCount}>
          +99
        </div>
      </div>

      {isOpen && (
        <div style={styles.overlayRoot}>
          <div
            style={styles.overlayBackdrop}
            onClick={() => setIsOpen(false)}
          />

          <div ref={panelRef} style={styles.panel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitleWrap}>
                <div style={styles.panelTitle}>Filtrera frånvarotyper</div>
                <div style={styles.panelSubTitle}>
                  Välj vilka typer som ska visas i tidslinjen
                </div>
              </div>

              <button style={styles.closeBtn} onClick={() => setIsOpen(false)}>
                STÄNG
              </button>
            </div>

            <div style={styles.actionsRow}>
              <button
                style={{
                  ...styles.actionBtn,
                  ...styles.actionPrimary,
                  opacity: allSelected ? 0.5 : 1,
                  cursor: allSelected ? "default" : "pointer",
                }}
                onClick={handleSelectAll}
                disabled={allSelected}
              >
                Välj alla
              </button>

              <button
                style={{
                  ...styles.actionBtn,
                  opacity: selectedIds.length === 0 ? 0.5 : 1,
                  cursor: selectedIds.length === 0 ? "default" : "pointer",
                }}
                onClick={handleClearAll}
                disabled={selectedIds.length === 0}
              >
                Rensa
              </button>
            </div>

            <div style={styles.list}>
              {sortedTypes.map((type) => {
                const isSelected = selectedIds.includes(type.id);

                return (
                  <div key={type.id} style={styles.row}>
                    <div
                      style={styles.rowLeft}
                      onClick={() => onToggle(type.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => onToggle(type.id)}
                        style={styles.checkbox}
                      />

                      <div
                        style={{
                          ...styles.colorDot,
                          backgroundColor: type.color,
                          boxShadow: isSelected
                            ? `0 0 10px ${rgba(type.color, 0.7)}`
                            : "none",
                        }}
                      />

                      <div style={styles.labelWrap}>
                        <span style={styles.label}>{type.label}</span>
                        <span style={styles.subLabel}>
                          {isSelected
                            ? "Visas i tidslinjen"
                            : "Dold i tidslinjen"}
                        </span>
                      </div>
                    </div>

                    <div style={styles.rowRight}>
                      {isSelected && (
                        <span style={styles.selectedPill}>Vald</span>
                      )}

                      <button
                        title="Redigera"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(type);
                        }}
                        style={styles.editBtn}
                      >
                        <MoreIcon />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes footerFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes footerPopIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

export default memo(TimelineFooter);
