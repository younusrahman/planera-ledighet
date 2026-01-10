import React from "react";
import Tooltip, { type TooltipProps } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";

const getContrast = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
};

type ProTooltipProps = TooltipProps & {
  color?: string;
};

const StyledTooltip = styled(
  ({ className, color, ...props }: ProTooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  )
)(({ color }) => {
  const textColor = color ? getContrast(color) : "#fff";

  return {
    "& .MuiTooltip-tooltip": {
      backgroundColor: color || "#333",
      color: textColor,
      fontSize: 13,
      padding: "6px 10px",
      borderRadius: 6,
    },
    "& .MuiTooltip-arrow": {
      color: color || "#333",
    },
  };
});

export const ProTooltip = (props: ProTooltipProps) => {
  return <StyledTooltip arrow {...props} />;
};
