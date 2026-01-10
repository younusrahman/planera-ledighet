import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Collapse,
  Menu,
  MenuItem,
  Grow,
  alpha,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Storage as DatabaseIcon,
} from "@mui/icons-material";
import type { Group } from "../types";
import { ROW_HEIGHT } from "../utils";
import { ProTooltip } from "./ProTooltip";

interface TimelineSidebarProps {
  groups: Group[];
  sidebarMode: "full" | "initials" | "hidden";
  collapsedGroups: string[];
  disableDeletion: boolean;
  toggleGroup: (groupId: string) => void;
  toggleSidebar: () => void;
  openConfig: () => void;
  handleDeleteResource: (groupId: string, resId: string) => void;
  handleDeleteGroup: (groupId: string) => void;
  handleDialogGroupTrigger: (group?: Group) => void;
  handleDialogAbsenceTypeTrigger: () => void;
  handleDialogDatabaseSystemTrigger: () => void;
  handleDialogResourceTrigger: (
    resourceToEdit?: { id: string; name: string },
    currentGroupId?: string
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
  const [mainMenuAnchor, setMainMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [resourceMenuAnchor, setResourceMenuAnchor] =
    useState<null | HTMLElement>(null);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null
  );

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const closeMenus = () => {
    setMainMenuAnchor(null);
    setGroupMenuAnchor(null);
    setResourceMenuAnchor(null);
  };

  return (
    <Box
      sx={{
        width:
          sidebarMode === "full" ? 200 : sidebarMode === "initials" ? 70 : 0,
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        zIndex: 1100,
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(20px)",
          borderRight:
            sidebarMode === "hidden" ? "none" : "1px solid rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box
          sx={{
            height: 105,
            borderBottom: "1px solid rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
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
              P
            </Box>
          )}
        </Box>

        <Box sx={{ overflowY: "auto", flex: 1, overflowX: "hidden" }}>
          {groups.map((group) => {
            const isCollapsed = collapsedGroups.includes(group.id);
            const isInitials = sidebarMode === "initials";
            const isFull = sidebarMode === "full";

            return (
              <Box key={group.id}>
                {/* Grupp-rad */}
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
                    <Typography
                      variant="subtitle1"
                      noWrap
                      sx={{ fontWeight: 700 }}
                    >
                      {isInitials ? getInitials(group.name) : group.name}
                    </Typography>
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
                          pl: isFull ? 5 : 0,
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
                        >
                          {isInitials ? getInitials(res.name) : res.name}
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
                              setSelectedGroupId(group.id); // Sätt grupp-ID för resursen
                              setSelectedResourceId(res.id); // Sätt resurs-ID
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

        {sidebarMode !== "hidden" && (
          <Box
            sx={{
              p: 1,
              borderTop: "1px solid rgba(0,0,0,0.1)",
              bgcolor: "white",
            }}
          >
            <Button
              fullWidth
              startIcon={<MenuIcon />}
              onClick={(e) => setMainMenuAnchor(e.currentTarget)}
              sx={{ fontWeight: 700 }}
            >
              {sidebarMode === "full" && "Meny"}
            </Button>
          </Box>
        )}
      </Box>

      {/* Sidofältets handtag/knapp */}
      <IconButton
        onClick={toggleSidebar}
        size="small"
        sx={{
          position: "absolute",
          bottom: 104,
          right: sidebarMode === "hidden" ? -24 : -14,
          zIndex: 1200,
          width: 38,
          height: 38,
          border: "1px solid #ddd",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          bgcolor: sidebarMode === "hidden" ? "primary.main" : "white",
          color: sidebarMode === "hidden" ? "white" : "primary.main",
          transition:
            "background-color 0.6s ease-in-out, color 0.6s ease-in-out, right 0.3s ease",
          "&:hover": {
            bgcolor: sidebarMode === "hidden" ? "primary.dark" : "#f8f9fa",
            transform: "scale(1.1)",
          },
        }}
      >
        {sidebarMode === "hidden" ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>

      {/* --- MENYER --- */}

      {/* Huvudmeny (Botten) */}
      <Menu
        anchorEl={mainMenuAnchor}
        open={Boolean(mainMenuAnchor)}
        onClose={closeMenus}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        slots={{ transition: Grow }}
      >
        <MenuItem
          onClick={() => {
            closeMenus();
            handleDialogGroupTrigger();
          }}
        >
          <AddIcon fontSize="small" sx={{ mr: 1.5 }} /> Lägg till grupp
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenus();
            handleDialogAbsenceTypeTrigger();
          }}
        >
          <CalendarMonthIcon fontSize="small" sx={{ mr: 1.5 }} /> Lägg till
          ledighetstyp
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenus();
            openConfig();
          }}
        >
          <SettingsIcon fontSize="small" sx={{ mr: 1.5 }} /> Konfigurera
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenus();
            handleDialogDatabaseSystemTrigger();
          }}
        >
          <DatabaseIcon fontSize="small" sx={{ mr: 1.5 }} />
          Databassystem
        </MenuItem>
      </Menu>

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
              (r) => r.id === selectedResourceId
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
