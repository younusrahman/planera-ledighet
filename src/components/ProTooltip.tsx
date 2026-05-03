import React, {
  type ReactElement,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

// ─── Contrast helper ────────────────────────────────────────────────
const getContrast = (hex: string): string => {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return "#fff";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
};

// ─── Types ──────────────────────────────────────────────────────────
type Placement = "top" | "bottom" | "left" | "right";

type ProTooltipProps = {
  title: ReactNode;
  children: ReactElement;
  color?: string;
  placement?: Placement;
  arrow?: boolean;
  fullWidth?: boolean;
  offset?: number;
  zIndex?: number;
};

// ─── Styles ─────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  // Wrapper
  wrapperInline: {
    position: "relative",
    display: "inline-block",
  },
  wrapperBlock: {
    position: "relative",
    display: "block",
    width: "100%",
  },

  // Tooltip bubble
  tooltipBase: {
    position: "fixed",
    padding: "6px 10px",
    fontSize: 13,
    borderRadius: 6,
    whiteSpace: "nowrap",
    pointerEvents: "none",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
    transition: "opacity 0.2s ease",
    willChange: "opacity",
  },
  hidden: {
    opacity: 0,
    visibility: "hidden" as const,
    pointerEvents: "none" as const,
  },
  visible: {
    opacity: 1,
    visibility: "visible" as const,
  },

  // Arrow base
  arrowBase: {
    position: "absolute",
    width: 0,
    height: 0,
    borderStyle: "solid",
  },

  // Arrow per placement
  arrowTop: {
    bottom: -5,
    left: "50%",
    transform: "translateX(-50%)",
    borderWidth: "5px 5px 0 5px",
  },
  arrowBottom: {
    top: -5,
    left: "50%",
    transform: "translateX(-50%)",
    borderWidth: "0 5px 5px 5px",
  },
  arrowLeft: {
    right: -5,
    top: "50%",
    transform: "translateY(-50%)",
    borderWidth: "5px 0 5px 5px",
  },
  arrowRight: {
    left: -5,
    top: "50%",
    transform: "translateY(-50%)",
    borderWidth: "5px 5px 5px 0",
  },
};

// ─── Arrow style builder ────────────────────────────────────────────
const getArrowStyle = (
  placement: Placement,
  color: string,
): React.CSSProperties => {
  const transparent = "transparent";
  switch (placement) {
    case "top":
      return {
        ...styles.arrowBase,
        ...styles.arrowTop,
        borderColor: `${color} ${transparent} ${transparent} ${transparent}`,
      };
    case "bottom":
      return {
        ...styles.arrowBase,
        ...styles.arrowBottom,
        borderColor: `${transparent} ${transparent} ${color} ${transparent}`,
      };
    case "left":
      return {
        ...styles.arrowBase,
        ...styles.arrowLeft,
        borderColor: `${transparent} ${transparent} ${transparent} ${color}`,
      };
    case "right":
      return {
        ...styles.arrowBase,
        ...styles.arrowRight,
        borderColor: `${transparent} ${color} ${transparent} ${transparent}`,
      };
    default:
      return {};
  }
};

// ─── Position calculator ────────────────────────────────────────────
const calcPosition = (
  triggerRect: DOMRect,
  tipRect: DOMRect,
  placement: Placement,
  offset: number,
): { top: number; left: number } => {
  let top = 0;
  let left = 0;

  switch (placement) {
    case "top":
      top = triggerRect.top - tipRect.height - offset;
      left = triggerRect.left + triggerRect.width / 2 - tipRect.width / 2;
      break;
    case "bottom":
      top = triggerRect.bottom + offset;
      left = triggerRect.left + triggerRect.width / 2 - tipRect.width / 2;
      break;
    case "left":
      top = triggerRect.top + triggerRect.height / 2 - tipRect.height / 2;
      left = triggerRect.left - tipRect.width - offset;
      break;
    case "right":
      top = triggerRect.top + triggerRect.height / 2 - tipRect.height / 2;
      left = triggerRect.right + offset;
      break;
  }

  // Clamp to viewport
  const pad = 8;
  left = Math.max(pad, Math.min(left, window.innerWidth - tipRect.width - pad));
  top = Math.max(pad, Math.min(top, window.innerHeight - tipRect.height - pad));

  return { top, left };
};

// ─── Component ──────────────────────────────────────────────────────
export const ProTooltip = ({
  title,
  children,
  color = "#333",
  placement = "top",
  arrow = true,
  fullWidth = false,
  offset = 8,
  zIndex = 10000,
}: ProTooltipProps) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // ── Recompute position ──
  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tipRect = tooltipRef.current.getBoundingClientRect();
    setCoords(calcPosition(triggerRect, tipRect, placement, offset));
  };

  // ── Position on open / placement change ──
  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, placement, offset]);

  // ── Reposition on scroll / resize while open ──
  useEffect(() => {
    if (!open) return;

    const handler = () => updatePosition();

    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);

    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open, placement, offset]);

  // ── Derived values ──
  const textColor = getContrast(color);

  const tooltipStyle: React.CSSProperties = {
    ...styles.tooltipBase,
    ...(open ? styles.visible : styles.hidden),
    top: coords.top,
    left: coords.left,
    backgroundColor: color,
    color: textColor,
    zIndex,
  };

  const wrapperStyle = fullWidth ? styles.wrapperBlock : styles.wrapperInline;

  // ── Don't render tooltip if title is empty ──
  if (!title) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Trigger */}
      <div
        ref={triggerRef}
        style={wrapperStyle}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </div>

      {/* Tooltip — portalled to body */}
      {createPortal(
        <div ref={tooltipRef} role="tooltip" style={tooltipStyle}>
          {title}
          {arrow && <span style={getArrowStyle(placement, color)} />}
        </div>,
        document.body,
      )}
    </>
  );
};
