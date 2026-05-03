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

  return (
    <div
      className={`
        pointer-events-none absolute left-0 top-0 z-1 h-full 
        border-r border-white/80 bg-white/70 
        backdrop-blur-md backdrop-saturate-[1.8]
        /* Custom Box Shadow */
        shadow-[inset_-4px_0_12px_-6px_rgba(0,0,0,0.1),4px_0_8px_-4px_rgba(0,0,0,0.05)]
        /* Repeating Linear Gradient Background */
        bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,--theme(--color-black/3%)_10px,--theme(--color-black/3%)_20px)]
      `}
      style={{ width: `${width}px` }}
    >
      <div
        className={`
          pointer-events-none absolute inset-0
          /* Secondary Stripe Background */
          bg-[repeating-linear-gradient(45deg,transparent,transparent_60px,--theme(--color-black/2%)_60px,--theme(--color-black/2%)_120px)]
          
          /* Masking Logic */
          mask-[linear-gradient(rgba(0,0,0,0.8),transparent),repeating-linear-gradient(0deg,transparent_0px,transparent_30px,rgba(0,0,0,1)_30px,rgba(0,0,0,1)_60px)]
          [mask-composite:source-in]
          mask-[auto,auto_120px]
          [mask-repeat:no-repeat,repeat]
          
          /* Webkit compatibility for Masking */
          [-webkit-mask-image:linear-gradient(rgba(0,0,0,0.8),transparent),repeating-linear-gradient(0deg,transparent_0px,transparent_30px,rgba(0,0,0,1)_30px,rgba(0,0,0,1)_60px)]
          [-webkit-mask-composite:source-in]
          [-webkit-mask-size:auto,auto_120px]
          [-webkit-mask-repeat:no-repeat,repeat]
        `}
      />
    </div>
  );
};
