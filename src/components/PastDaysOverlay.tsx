import React from "react";
import { Box } from "@mui/material";

interface PastDaysOverlayProps {
  width: number;
  isVisible: boolean;
}

export const PastDaysOverlay: React.FC<PastDaysOverlayProps> = ({
  width,
  isVisible,
}) => {
  if (!isVisible || width <= 0) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        left: 0,
        top: 0,
        height: "100%",
        width: `${width}px`,
        background: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(10px) saturate(180%)",
        WebkitBackdropFilter: "blur(10px) saturate(180%)",
        boxShadow:
          "inset -4px 0 12px -6px rgba(0, 0, 0, 0.1), 4px 0 8px -4px rgba(0, 0, 0, 0.05)",
        borderRight: "1px solid rgba(255, 255, 255, 0.8)",
        zIndex: 1,
        pointerEvents: "none",
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(0, 0, 0, 0.03) 10px,
          rgba(0, 0, 0, 0.03) 20px
        )`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 60px,
            rgba(0, 0, 0, 0.02) 60px,
            rgba(0, 0, 0, 0.02) 120px
          )`,
          maskImage: `linear-gradient(rgba(0,0,0,0.8), transparent), 
          repeating-linear-gradient(0deg, 
            transparent 0px, 
            transparent 30px, 
            rgba(0,0,0,1) 30px, 
            rgba(0,0,0,1) 60px
          )`,
          maskComposite: "source-in",
          maskSize: "auto, auto 120px",
          maskRepeat: "no-repeat, repeat",
          pointerEvents: "none",
        },
      }}
    />
  );
};
