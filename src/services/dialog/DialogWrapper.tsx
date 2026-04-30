import React, { useEffect } from "react";
import { dialogMap, useDialogStore } from "./dialog";
import styles from "./DialogWrapper.module.css";

export function DialogWrapper() {
  const { dialogs, close } = useDialogStore();

  // Prevent body scroll when any dialog is open
  useEffect(() => {
    document.body.style.overflow = dialogs.length > 0 ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [dialogs.length]);

  if (dialogs.length === 0) return null;

  return (
    <>
      {dialogs.map((item, index) => {
        const Component = dialogMap[item.id] as React.ComponentType<
          Record<string, unknown> & { onClose: () => void }
        >;
        const isTop = index === dialogs.length - 1;
        const isFullscreen = item.maxWidth === "xl";

        if (!Component) return null;

        // Calculate max width based on prop (xs, sm, md, lg, xl)
        const maxWidth = getWidth(item.maxWidth);

        return (
          <div
            key={`${item.id}-${index}`}
            className={styles.backdrop}
            style={{
              zIndex: 1300 + index,
              padding: isFullscreen ? 0 : undefined,
            }}
            onClick={() => {
              if (isTop) close();
            }}
            aria-modal="true"
            role="dialog"
          >
            <div
              className={`${styles.paper} ${isFullscreen ? styles.fullscreen : ""}`}
              style={{
                maxWidth: isFullscreen ? "100vw" : maxWidth,
                borderRadius: isFullscreen ? 0 : undefined,
              }}
              onClick={(e) => e.stopPropagation()}
              aria-labelledby={`dialog-title-${item.id}-${index}`}
              aria-describedby={`dialog-content-${item.id}-${index}`}
            >
              <div
                className={styles.content}
                style={{
                  maxHeight: isFullscreen
                    ? "100vh"
                    : window.innerWidth <= 768
                      ? "calc(100vh - 24px)"
                      : "calc(100vh - 40px)",
                }}
              >
                <Component {...item.props} onClose={() => close([item.id])} />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function getWidth(width?: string): string {
  switch (width) {
    case "xs":
      return "444px";
    case "sm":
      return "600px";
    case "md":
      return "900px";
    case "lg":
      return "1200px";
    case "xl":
      return "100%";
    default:
      return "600px";
  }
}
