import { type CSSProperties, type JSX } from "react";

export default function DialogHeader({
  Icon,
  title,
  onClose,
}: {
  Icon?: JSX.Element;
  title?: string;
  onClose: () => void;
}) {
  const styles: Record<string, CSSProperties> = {
    headerBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 14px",
      borderBottom: "1px solid #e2e8f0",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)",
      flexShrink: 0,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    headerTitle: {
      fontSize: "1.1rem",
      fontWeight: 800,
      color: "#0f172a",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "flex",
      gap: 8,
    },
    closeBtn: {
      height: 34,
      padding: "0 12px",
      borderRadius: 10,
      border: "1px solid rgba(0,0,0,0.08)",
      background: "#fff",
      color: "#475569",
      fontSize: "12px",
      fontWeight: 700,
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.headerBar}>
      <div style={styles.headerTitle}>{Icon && Icon } {title ?? ""}</div>
      <button style={styles.closeBtn} onClick={onClose}>
        Stäng
      </button>
    </div>
  );
}
