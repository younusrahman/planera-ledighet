import React from "react";

interface PastDaysOverlayProps {
  width: number;
  isVisible: boolean;
}

export const PastDaysOverlay: React.FC<PastDaysOverlayProps> = ({
  width,
  isVisible,
}) => {
  if (!isVisible || width <= 0) return null;

  console.log("PastDaysOverlay rendered");

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-[1] h-full border-r border-white/80"
      style={{
        width: `${width}px`,
        background: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(10px) saturate(180%)",
        WebkitBackdropFilter: "blur(10px) saturate(180%)",
        boxShadow:
          "inset -4px 0 12px -6px rgba(0, 0, 0, 0.1), 4px 0 8px -4px rgba(0, 0, 0, 0.05)",
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(0, 0, 0, 0.03) 10px,
          rgba(0, 0, 0, 0.03) 20px
        )`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
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
          WebkitMaskImage: `linear-gradient(rgba(0,0,0,0.8), transparent), 
          repeating-linear-gradient(0deg, 
            transparent 0px, 
            transparent 30px, 
            rgba(0,0,0,1) 30px, 
            rgba(0,0,0,1) 60px
          )`,
          maskComposite: "source-in",
          WebkitMaskComposite: "source-in",
          maskSize: "auto, auto 120px",
          WebkitMaskSize: "auto, auto 120px",
          maskRepeat: "no-repeat, repeat",
          WebkitMaskRepeat: "no-repeat, repeat",
        }}
      />
    </div>
  );
};
