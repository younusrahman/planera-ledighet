import { Box, Typography, Chip, alpha, useTheme, Tooltip } from "@mui/material";
import { useAbsenceCategories } from "../services/hooks/useData";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

interface TimelineFooterProps {
  onAbsenceTypeClick: (type: any) => void;
  // NEW PROPS
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function TimelineFooter({
  onAbsenceTypeClick,
  selectedIds,
  onToggle,
}: TimelineFooterProps) {
  const { data: absenceTypes = [] } = useAbsenceCategories();
  const theme = useTheme();
console.log("TimelineFooter rendered")
  return (
    <Box
      sx={{
        position: "sticky",
        bottom: 0,
        left: 0,
        zIndex: 110,
        bgcolor: alpha("#fff", 0.9),
        backdropFilter: "blur(10px)",
        width: "100%",
        height: 48,
        borderTop: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        px: 2,
        justifyContent: "center",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {absenceTypes.map((type) => {
          const isSelected = selectedIds.includes(type.id);

          return (
            <Chip
              key={type.id}
              size="small"
              onClick={() => onToggle(type.id)} // Use prop
              onDelete={() => onAbsenceTypeClick(type)}
              deleteIcon={
                <Tooltip title="Redigera">
                  <MoreHorizIcon
                    sx={{
                      fontSize: "13px !important",
                      "&:hover": { color: theme.palette.primary.main },
                    }}
                  />
                </Tooltip>
              }
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: type.color,
                      boxShadow: isSelected ? `0 0 6px ${type.color}` : "none",
                      transition: "0.2s",
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: isSelected ? 700 : 500,
                      userSelect: "none",
                    }}
                  >
                    {type.label}
                  </Typography>
                </Box>
              }
              sx={{
                height: 26,
                transition: "all 0.2s ease",
                bgcolor: isSelected ? alpha(type.color, 0.1) : "transparent",
                border: "1px solid",
                borderColor: isSelected
                  ? alpha(type.color, 0.3)
                  : alpha(theme.palette.divider, 0.8),
                color: isSelected ? "text.primary" : "text.disabled",
                filter: isSelected ? "none" : "grayscale(0.9)",
                opacity: isSelected ? 1 : 0.7,
                "& .MuiChip-deleteIcon": {
                  color: alpha(theme.palette.text.secondary, 0.3),
                  margin: "0 4px 0 0",
                  display: isSelected ? "block" : "none",
                },
                "&:hover": {
                  bgcolor: isSelected
                    ? alpha(type.color, 0.15)
                    : alpha(theme.palette.action.hover, 0.04),
                  borderColor: isSelected ? type.color : "text.secondary",
                  opacity: 1,
                  filter: "none",
                  "& .MuiChip-deleteIcon": { display: "block" },
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
