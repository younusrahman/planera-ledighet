import React, { useState } from "react";
import {
  Tooltip,
  styled,
  tooltipClasses,
  Box,
  Typography,
  IconButton,
  ClickAwayListener,
  Fade,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import type { SxProps, Theme } from "@mui/material/styles";

export interface EnhancedTooltipProps {
  children: React.ReactElement;
  title: React.ReactNode;
  subtitle?: string;
  /** Control tooltip programmatically */
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  /** Show close button */
  closable?: boolean;
  /** Tooltip width */
  width?: number | string;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Persistent tooltip (requires manual close) */
  persistent?: boolean;
  sx?: SxProps<Theme>;
}

const StyledTooltip = styled(Tooltip)(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    maxWidth: 400,
    padding: 0,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: (theme.shape.borderRadius as number) * 2,
    boxShadow: theme.shadows[8],
  },
}));

const TooltipContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  position: "relative",
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(0.5),
  right: theme.spacing(0.5),
  padding: theme.spacing(0.5),
}));

const Header = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  children,
  title,
  subtitle,
  open: controlledOpen,
  onOpen,
  onClose,
  closable = false,
  width = 300,
  icon = <InfoOutlinedIcon fontSize="small" />,
  persistent = false,
  sx,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpen = () => {
    if (!isControlled) {
      setUncontrolledOpen(true);
    }
    onOpen?.();
  };

  const handleClose = () => {
    if (!isControlled) {
      setUncontrolledOpen(false);
    }
    onClose?.();
  };

  const tooltipContent = (
    <ClickAwayListener onClickAway={persistent ? () => {} : handleClose}>
      <TooltipContainer sx={{ width }}>
        {closable && (
          <CloseButton size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </CloseButton>
        )}
        <Header>
          <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Header>
        <Typography variant="body2">
          {typeof title === "string" ? title : title}
        </Typography>
      </TooltipContainer>
    </ClickAwayListener>
  );

  return (
    <StyledTooltip
      title={tooltipContent}
      open={open}
      onOpen={handleOpen}
      onClose={handleClose}
      TransitionComponent={Fade}
      disableFocusListener={persistent}
      disableHoverListener={persistent}
      disableTouchListener={persistent}
      arrow
      sx={sx}
    >
      {children}
    </StyledTooltip>
  );
};
