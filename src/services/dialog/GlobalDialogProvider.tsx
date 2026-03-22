import React, { useEffect } from "react";
import { useDialogStore } from "./dialogStore";
import { dialogRegistry } from "./DialogRegistry";
import styles from "./GlobalDialogProvider.module.css"; // Import the scoped CSS

export function GlobalDialogProvider() {
  const { stack, close } = useDialogStore();

  // Prevent background scrolling when dialog is open
  useEffect(() => {
    if (stack.length > 0) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [stack.length]);

  if (stack.length === 0) return null;

  return (
    <div className={styles.overlay}>
      {stack.map((item, index) => {
        const registration =
          dialogRegistry[item.id as keyof typeof dialogRegistry];
        if (!registration) return null;

        const Component = registration.component;
        const isFullScreen = item.maxWidth === "xl";

        return (
          <div
            key={`${item.id}-${index}`}
            className={styles.backdrop}
            style={{ zIndex: 1300 + index }}
            onClick={close} // Close when clicking backdrop
          >
            <div
              className={styles.paper}
              style={{
                maxWidth: getWidth(item.maxWidth),
                width: isFullScreen ? "100%" : "95%",
                height: isFullScreen ? "100%" : "auto",
                borderRadius: isFullScreen ? "0" : "12px",
              }}
              onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
            >
              <div className={styles.content}>
                <Component {...(item.props as any)} onClose={close} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper to handle MUI-like maxWidths
const getWidth = (width?: string) => {
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
};
  