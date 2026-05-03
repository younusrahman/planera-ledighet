import React, { useEffect } from "react";
import styles from "./DialogWrapper.module.css";
import DialogHeader from "./DialoagHeader";
import { useDialogStore, dialogMap } from "./dialog";

export function DialogWrapper() {
  const { dialogs, close } = useDialogStore();

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
        const Component = dialogMap[item.id] as React.ComponentType<any>;
        const isTop = index === dialogs.length - 1;
        const maxWidth = getWidth(item.maxWidth);

        return (
          <div
            key={`${item.id}-${index}`}
            className={styles.backdrop}
            style={{ zIndex: 1300 + index }}
            onClick={() => {
              if (isTop) close();
            }}
            aria-modal="true"
            role="dialog"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: `min(92vw, ${maxWidth})`,
                maxWidth,
                maxHeight: "min(88vh, 900px)",
                margin: 20,
                display: "flex",
                flexDirection: "column",
                borderRadius: 20,
                overflow: "hidden",
                background: "rgba(255,255,255,0.97)",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
              }}
            >
              <DialogHeader
                title={item.title}
                onClose={() => close([item.id])}
                Icon={item.Icon}
              />
              <div
                style={{
                  padding: item.id === "dataManagementDashboard" ? 0 : 16,
                  overflow: "auto",
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
      return "1800px";
    default:
      return "600px";
  }
}
