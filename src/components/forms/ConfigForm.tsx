import React, { useState } from "react";
import {
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Button,
  DialogTitle,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Lock, Delete, Close } from "@mui/icons-material";

export interface ConfigFormProps {
  title?: string;
  blockPastDays: boolean;
  disableDeletion: boolean;
  onUpdate: (key: string, value: boolean) => void;
  onClose?: () => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({
  title,
  blockPastDays: initialBlock,
  disableDeletion: initialDisable,
  onUpdate,
  onClose,
}) => {
  const [block, setBlock] = useState(initialBlock);
  const [disable, setDisable] = useState(initialDisable);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const handleBlockChange = (val: boolean) => {
    setBlock(val);
    onUpdate("blockPastDays", val);

    if (!val) {
      setDisable(false);
      onUpdate("disableDeletion", false);
    }
  };

  const handleDisableChange = (val: boolean) => {
    setDisable(val);
    onUpdate("disableDeletion", val);
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: { xs: "100%", sm: 500, md: 600 },
        mx: "auto",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3 },
      }}
    >
      {title && (
        <DialogTitle
          sx={{
            px: 0,
            pt: 0,
            pb: { xs: 1.5, sm: 2 },
            fontWeight: 600,
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          {title}
        </DialogTitle>
      )}

      <Stack spacing={{ xs: 2, sm: 3 }}>
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{
            fontSize: { xs: "1.125rem", sm: "1.25rem" },
            color: "text.primary",
          }}
        >
          Inställningar
        </Typography>

        <FormGroup>
          {/* Main Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={block}
                onChange={(e) => handleBlockChange(e.target.checked)}
                icon={
                  <Lock
                    sx={{
                      opacity: 0.6,
                      fontSize: { xs: "1.25rem", sm: "1.5rem" },
                    }}
                  />
                }
                checkedIcon={
                  <Lock
                    sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
                    color="primary"
                  />
                }
                size={isMobile ? "small" : "medium"}
                sx={{
                  mr: { xs: 1, sm: 1.5 },
                  "&:hover": {
                    transform: "scale(1.05)",
                    transition: "transform 0.2s ease",
                  },
                }}
              />
            }
            label={
              <Box sx={{ ml: { xs: 0.5, sm: 1 } }}>
                <Typography
                  variant="body1"
                  fontWeight={550}
                  sx={{
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
                    lineHeight: 1.3,
                    mb: 0.5,
                  }}
                >
                  Spärr för gångna dagar
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                    lineHeight: 1.4,
                    display: "block",
                  }}
                >
                  Förhindrar ändringar av historiska data
                </Typography>
              </Box>
            }
            sx={{
              mb: 2,
              p: { xs: 1, sm: 1.5 },
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                borderColor: theme.palette.primary.light,
              },
            }}
          />

          {/* Nested Checkbox */}
          <Box
            sx={{
              ml: { xs: 4, sm: 5, md: 6 },
              pl: { xs: 2, sm: 3 },
              borderLeft: `2px solid ${
                block ? theme.palette.primary.light : theme.palette.divider
              }`,
              transition: "border-color 0.3s ease",
              mt: { xs: 1, sm: 1.5 },
              position: "relative",
              "&::before": block
                ? {
                    content: '""',
                    position: "absolute",
                    left: -4,
                    top: -10,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: theme.palette.primary.main,
                    animation: "pulse 2s infinite",
                  }
                : {},
              "@keyframes pulse": {
                "0%": { transform: "scale(1)", opacity: 1 },
                "50%": { transform: "scale(1.2)", opacity: 0.7 },
                "100%": { transform: "scale(1)", opacity: 1 },
              },
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={disable}
                  onChange={(e) => handleDisableChange(e.target.checked)}
                  disabled={!block}
                  icon={
                    <Delete
                      sx={{
                        opacity: 0.6,
                        fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      }}
                    />
                  }
                  checkedIcon={
                    <Delete
                      sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
                      color={disable ? "error" : "inherit"}
                    />
                  }
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    mr: { xs: 1, sm: 1.5 },
                    "&.Mui-checked": {
                      animation: "bounce 0.3s",
                    },
                    "@keyframes bounce": {
                      "0%": { transform: "scale(1)" },
                      "50%": { transform: "scale(1.2)" },
                      "100%": { transform: "scale(1)" },
                    },
                  }}
                />
              }
              label={
                <Box sx={{ ml: { xs: 0.5, sm: 1 } }}>
                  <Typography
                    variant="body1"
                    fontWeight={550}
                    sx={{
                      fontSize: { xs: "0.9375rem", sm: "1rem" },
                      lineHeight: 1.3,
                      mb: 0.5,
                      color: disable ? "error.main" : "text.primary",
                      transition: "color 0.2s ease",
                    }}
                  >
                    Ta bort möjligheten att radera
                  </Typography>
                  <Typography
                    variant="caption"
                    color={disable ? "error.light" : "text.secondary"}
                    sx={{
                      fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                      lineHeight: 1.4,
                      display: "block",
                    }}
                  >
                    Permanent borttagning av raderingsfunktionen
                  </Typography>
                </Box>
              }
              sx={{
                p: { xs: 1, sm: 1.5 },
                borderRadius: 2,
                border: `1px solid ${
                  disable ? theme.palette.error.light : theme.palette.divider
                }`,
                backgroundColor: disable
                  ? theme.palette.error.light + "10"
                  : "transparent",
                transition: "all 0.3s ease",
                opacity: block ? 1 : 0.6,
                cursor: block ? "pointer" : "not-allowed",
                "&:hover": block
                  ? {
                      backgroundColor: disable
                        ? theme.palette.error.light + "15"
                        : theme.palette.action.hover,
                      borderColor: disable
                        ? theme.palette.error.main
                        : theme.palette.primary.light,
                      transform: "translateX(4px)",
                    }
                  : {},
              }}
            />
          </Box>
        </FormGroup>

        {/* Responsive Close Button */}
        <Stack
          sx={{
            mt: { xs: 3, sm: 4 },
            pt: { xs: 2, sm: 3 },
            borderTop: `1px solid ${theme.palette.divider}`,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            variant="outlined"
            startIcon={!isMobile && <Close />}
            color="warning"
            onClick={onClose}
            sx={{
              width: "100%",
              maxWidth: { xs: "100%", sm: 320, md: 360 },
              borderRadius: 2,
              py: { xs: 1.1, sm: 1.2 },
              px: { xs: 2, sm: 3 },
              fontWeight: 600,
              fontSize: { xs: "0.875rem", sm: "0.9375rem" },
              textTransform: "none",
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 2,
              },
              "& .MuiButton-startIcon": {
                mr: { xs: 1, sm: 1.5 },
              },
            }}
          >
            Stäng
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ConfigForm;
