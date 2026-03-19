import React, { memo } from "react";
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

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        zIndex: 110,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        width: "100%",
        height: "48px",
        borderTop: "1px solid #e0e0e0",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        justifyContent: "center",
        gap: "16px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {absenceTypes.map((type) => {
          const isSelected = selectedIds.includes(type.id);

          return (
            <div
              key={type.id}
              className="footer-chip"
              onClick={() => onToggle(type.id)}
              style={{
                height: "26px",
                display: "flex",
                alignItems: "center",
                padding: "0 10px",
                borderRadius: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: "1px solid",
                userSelect: "none",
                gap: "8px",
                backgroundColor: isSelected
                  ? rgba(type.color, 0.1)
                  : "transparent",
                borderColor: isSelected ? rgba(type.color, 0.3) : "#ddd",
                opacity: isSelected ? 1 : 0.7,
                filter: isSelected ? "none" : "grayscale(0.9)",
              }}
            >
              {/* Color Dot */}
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: type.color,
                  boxShadow: isSelected ? `0 0 6px ${type.color}` : "none",
                  transition: "0.2s",
                }}
              />

              {/* Label */}
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "#333" : "#999",
                }}
              >
                {type.label}
              </span>

              {/* Edit Action */}
              <button
                title="Redigera"
                className="edit-action"
                onClick={(e) => {
                  e.stopPropagation();
                  onAbsenceTypeClick(type);
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  marginLeft: "2px",
                  cursor: "pointer",
                  color: "rgba(0,0,0,0.3)",
                  display: isSelected ? "flex" : "none",
                  alignItems: "center",
                }}
              >
                <MoreIcon />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        .footer-chip:hover {
            opacity: 1 !important;
            filter: none !important;
            border-color: #999 !important;
        }
        .footer-chip:hover .edit-action {
            display: flex !important;
        }
        .edit-action:hover {
            color: #1976d2 !important;
        }
      `}</style>
    </div>
  );
}

export default memo(TimelineFooter);
