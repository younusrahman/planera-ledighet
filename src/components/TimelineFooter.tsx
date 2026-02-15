import React from "react";
import { Box, Paper, Typography, Chip, alpha, useTheme } from "@mui/material";
import { useAbsenceTypes } from "../services/hooks/useData";
interface TimelineFooterProps {
  onAbsenceTypeClick: (type: any) => void;
}
export default function TimelineFooter({
  onAbsenceTypeClick,
}: TimelineFooterProps) {
  const { data: absenceTypes = [] } = useAbsenceTypes();
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: "sticky",
        bottom: 0,
        left: 0,
        zIndex: 110,
        bgcolor: "white",
        width: "100%",
        height: 56,
        borderTop: "1px solid rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        px: 2,
        color: "text.secondary",
        fontWeight: 600,
        fontSize: "0.85rem",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          gap: 1.5,
        }}
      >
        {!absenceTypes || absenceTypes.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              px: 1.5,
              py: 1,
              bgcolor: alpha(theme.palette.info.main, 0.04),
              borderColor: alpha(theme.palette.info.main, 0.2),
              borderRadius: 1,
              width: "100%",

              marginLeft: "0.5rem",
              mt: 1, // Add some top margin for spacing
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mr: 0.5,
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13px",
                    }}
                  >
                    Inge frånvarotyper har lagts till ännu.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        ) : (
          absenceTypes.map((type) => (
            <Chip
              key={type.id}
              onClick={() => onAbsenceTypeClick(type)}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: type.color,
                      border: `5px solid ${type.color}`,
                    }}
                  />
                  <Typography variant="caption">{type.label}</Typography>
                </Box>
              }
              size="small"
              sx={{
                border: `1px solid ${alpha(type.color, 0.5)}`,
                cursor: "pointer",
                bgcolor: "transparent",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
