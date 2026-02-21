import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  alpha,
  Paper,
  useTheme,
  Grow,
  Menu,
  MenuItem,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import type { Employee, Team } from "../types";
import { ROW_HEIGHT } from "../utils";
import { ProTooltip } from "./ProTooltip";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

interface TimelineSidebarProps {
  groups: Team[];
  sidebarMode: "full" | "initials" | "hidden";
  collapsedGroups: string[];
  disableDeletion: boolean;
  toggleGroup: (groupId: string) => void;
  toggleSidebar: () => void;
  openConfig: () => void;
  handleDeleteResource: (groupId: string, resId: string) => void;
  handleDeleteGroup: (groupId: string) => void;
  handleDialogGroupTrigger: (group?: Team) => void;
  handleDialogAbsenceTypeTrigger: () => void;
  handleDialogDatabaseSystemTrigger: () => void;
  handleDialogResourceTrigger: (
    resourceToEdit?: { id: string; name: string },
    currentGroupId?: string,
  ) => void;
}
export const TimelineSidebar: React.FC<TimelineSidebarProps> = ({
  groups,
  sidebarMode,
  collapsedGroups,
  disableDeletion,
  toggleGroup,
  toggleSidebar,
  openConfig,
  handleDeleteResource,
  handleDeleteGroup,
  handleDialogGroupTrigger,
  handleDialogAbsenceTypeTrigger,
  handleDialogResourceTrigger,
  handleDialogDatabaseSystemTrigger,
}) => {
  const theme = useTheme();
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [resourceMenuAnchor, setResourceMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null,
  );
  const [mainMenuAnchor, setMainMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const closeMenus = () => {
    setMainMenuAnchor(null);
    setGroupMenuAnchor(null);
    setResourceMenuAnchor(null);
  };

  console.log({ groups });
  return (
    <Box
      sx={{
        width:
          sidebarMode === "full" ? 200 : sidebarMode === "initials" ? 70 : 0,
        position: "sticky",
        left: 0, // Keeps names visible during horizontal scroll
        zIndex: 1150, // Higher than grid blocks
        height: "fit-content",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s ease",
        background: "white",
        borderRight: "1px solid rgba(0, 0, 0, 0.1)",
        flexShrink: 0, // Prevent sidebar from squishing
      }}
    >
      {/* SIDEBAR HEADER - Needs to be sticky TOP and LEFT */}
      <Box
        sx={{
          height: 105, // Matches the 40+25+40 height of the date header
          borderBottom: "1px solid rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0, // Keeps it at the top during vertical scroll
          left: 0,
          zIndex: 1200,
          bgcolor: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {sidebarMode !== "hidden" && (
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: "primary.main",
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
            }}
          >
            YR
          </Box>
        )}
      </Box>

      {/* Group List */}
      <Box sx={{ flex: 1 }}>
        {groups.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              px: 1.5,
              py: 1,
              bgcolor: alpha(theme.palette.info.main, 0.04),
              borderColor: alpha(theme.palette.info.main, 0.2),
              borderRadius: 1,
              width: "100%",
              maxWidth: "100%",
              marginRight: "1rem",
              mt: 1,
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
                    Grupp lista är tom
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        ) : (
          <Box sx={{ flex: 1 }}>
            {groups.map((group) => {
              const isCollapsed = collapsedGroups.includes(group.id);
              const isInitials = sidebarMode === "initials";
              const isFull = sidebarMode === "full";

              return (
                <Box key={group.id}>
                  <Box
                    onClick={() => toggleGroup(group.id)}
                    sx={{
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isInitials ? "center" : "space-between",
                      px: isInitials ? 0 : 2,
                      bgcolor: "rgba(0,0,0,0.04)",
                      borderBottom: "1px solid rgba(0,0,0,0.03)",
                      cursor: "pointer",
                      "&:hover": { "& .group-more": { opacity: 1 } },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      {isFull && (
                        <KeyboardArrowDownIcon
                          fontSize="small"
                          sx={{
                            mr: 0.5,
                            transition: "0.3s",
                            transform: isCollapsed
                              ? "rotate(-90deg)"
                              : "rotate(0deg)",
                          }}
                        />
                      )}
                      <ProTooltip
                        key={group.id}
                        title={group.name}
                        placement="right"
                        arrow
                      >
                        <Typography
                          variant="subtitle1"
                          noWrap
                          sx={{ fontWeight: 700 }}
                        >
                          {isInitials ? getInitials(group.name) : group.name}
                        </Typography>
                      </ProTooltip>
                    </Box>
                    {isFull && (
                      <IconButton
                        className="group-more"
                        size="small"
                        sx={{ opacity: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGroupId(group.id);
                          setGroupMenuAnchor(e.currentTarget);
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  {/* Anställda-rader */}
                  <Collapse in={!isCollapsed}>
                    {(group.resources || []).map((res) => {
                      const resRow = (
                        <Box
                          key={res.id}
                          sx={{
                            height: ROW_HEIGHT,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: isFull ? "space-between" : "center",
                            px: isInitials ? 0 : 2,
                            borderBottom: "1px solid rgba(0,0,0,0.03)",
                            boxSizing: "border-box",
                            "&:hover": {
                              bgcolor: "rgba(0,0,0,0.04)",
                              "& .res-more": { opacity: 1 },
                            },
                          }}
                        >
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{
                              fontWeight: 500,
                              maxWidth: isFull ? "calc(100% - 35px)" : "100%",
                            }}
                            component="span"
                          >
                            <FiberManualRecordIcon
                              sx={{
                                fontSize: 8,
                                mr: 0.5,
                                color: "text.secondary",
                              }}
                            />

                            <span>
                              {isInitials ? getInitials(res.name) : res.name}
                            </span>
                          </Typography>

                          {isFull && (
                            <IconButton
                              className="res-more"
                              size="small"
                              sx={{
                                opacity: 0,
                                transition: "opacity 0.2s",
                                ml: 1,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGroupId(group.id);
                                setSelectedResourceId(res.id);
                                setResourceMenuAnchor(e.currentTarget);
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      );

                      return isInitials ? (
                        <ProTooltip
                          key={res.id}
                          title={res.name}
                          placement="right"
                          arrow
                        >
                          {resRow}
                        </ProTooltip>
                      ) : (
                        resRow
                      );
                    })}
                  </Collapse>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
      {/* Resursmeny (Anställd) */}
      <Menu
        anchorEl={resourceMenuAnchor}
        open={Boolean(resourceMenuAnchor)}
        onClose={closeMenus}
        slots={{ transition: Grow }}
      >
        <MenuItem
          onClick={() => {
            const group = groups.find((g) => g.id === selectedGroupId);
            const res = (group?.resources || []).find(
              (r) => r.id === selectedResourceId,
            );
            if (res) handleDialogResourceTrigger(res, selectedGroupId!);
            closeMenus();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1.5 }} /> Redigera
        </MenuItem>
        {!disableDeletion && (
          <MenuItem
            onClick={() => {
              if (selectedGroupId && selectedResourceId)
                handleDeleteResource(selectedGroupId, selectedResourceId);
              closeMenus();
            }}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Ta bort
          </MenuItem>
        )}
      </Menu>

      {/* Gruppmeny */}
      <Menu
        anchorEl={groupMenuAnchor}
        open={Boolean(groupMenuAnchor)}
        onClose={closeMenus}
        slots={{ transition: Grow }}
      >
        <MenuItem
          onClick={() => {
            handleDialogResourceTrigger(undefined, selectedGroupId!);
            closeMenus();
          }}
        >
          <AddIcon fontSize="small" sx={{ mr: 1.5 }} /> Lägg till anställd
        </MenuItem>
        <MenuItem
          onClick={() => {
            const group = groups.find((g) => g.id === selectedGroupId);
            if (group) handleDialogGroupTrigger(group);
            closeMenus();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1.5 }} /> Redigera
        </MenuItem>
        {!disableDeletion && (
          <MenuItem
            onClick={() => {
              if (selectedGroupId) handleDeleteGroup(selectedGroupId);
              closeMenus();
            }}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Ta bort
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};
