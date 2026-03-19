import React, { memo, useState, useRef, useEffect } from "react";
import type { Team, TeamWithEmployees } from "../types";
import { ROW_HEIGHT } from "../utils";
import { ProTooltip } from "./ProTooltip";

// --- HELPERS ---
const rgba = (hex: string, opacity: number) => {
  if (!hex || hex === "transparent") return `rgba(0,0,0,${opacity})`;
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// --- SVG ICONS ---
const Icon = {
  Chevron: ({ rotated }: { rotated: boolean }) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{
        transition: "0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: rotated ? "rotate(-90deg)" : "rotate(0deg)",
        marginRight: 4,
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  More: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  ),
  Dot: () => (
    <svg
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ marginRight: 8, opacity: 0.5 }}
    >
      <circle cx="12" cy="12" r="12" />
    </svg>
  ),
  Edit: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ marginRight: 10 }}
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Delete: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ marginRight: 10 }}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Add: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ marginRight: 10 }}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

interface TimelineSidebarProps {
  groups: TeamWithEmployees[];
  sidebarMode: "full" | "initials" | "hidden";
  collapsedGroups: string[];
  disableDeletion: boolean;
  toggleGroup: (teamId: string) => void;
  handleDeleteResource: (groupId: string, resId: string) => void;
  handleDeleteGroup: (groupId: string) => void;
  handleDialogGroupTrigger: (group?: Team) => void;
  handleDialogResourceTrigger: (
    resourceToEdit?: { id: string; name: string },
    currentGroupId?: string,
  ) => void;
}

const TimelineSidebar: React.FC<TimelineSidebarProps> = ({
  groups,
  sidebarMode,
  collapsedGroups,
  disableDeletion,
  toggleGroup,
  handleDeleteResource,
  handleDeleteGroup,
  handleDialogGroupTrigger,
  handleDialogResourceTrigger,
}) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    type: "group" | "resource";
  } | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null,
  );

  const closeMenus = () => setMenu(null);

  useEffect(() => {
    if (!menu) return;
    const handleGlobalClick = () => closeMenus();
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [menu]);

  const handleOpenMenu = (
    e: React.MouseEvent,
    type: "group" | "resource",
    gId: string,
    rId?: string,
  ) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu({ x: rect.left, y: rect.bottom, type });
    setSelectedGroupId(gId);
    if (rId) setSelectedResourceId(rId);
  };

  const isFull = sidebarMode === "full";
  const isInitials = sidebarMode === "initials";

  return (
    <div
      style={{
        width: isFull ? 200 : isInitials ? 70 : 0,
        position: "sticky",
        left: 0,
        zIndex: 1150,
        height: "fit-content",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s ease",
        backgroundColor: "white",
        borderRight: "1px solid rgba(0,0,0,0.1)",
        flexShrink: 0,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          height: 105,
          borderBottom: "1px solid rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0,
          left: 0,
          zIndex: 1200,
          backgroundColor: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {sidebarMode !== "hidden" && (
          <div
            style={{
              width: 40,
              height: 40,
              backgroundColor: "#1976d2",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
            }}
          >
            YR
          </div>
        )}
      </div>

      <div style={{ flex: 1 }}>
        {groups.length === 0 ? (
          <div
            style={{
              margin: "8px",
              padding: "12px",
              backgroundColor: rgba("#0288d1", 0.05),
              border: `1px solid ${rgba("#0288d1", 0.2)}`,
              borderRadius: "4px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 700 }}>
              Grupp lista är tom
            </span>
          </div>
        ) : (
          groups.map((group) => {
            const isCollapsed = collapsedGroups.includes(group.id);
            return (
              <div key={group.id}>
                {/* GROUP ROW */}
                <div
                  onClick={() => toggleGroup(group.id)}
                  className="sidebar-row-hover"
                  style={{
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isInitials ? "center" : "space-between",
                    padding: isInitials ? "0" : "0 16px",
                    backgroundColor: "rgba(0,0,0,0.04)",
                    borderBottom: "1px solid rgba(0,0,0,0.03)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      overflow: "hidden",
                    }}
                  >
                    {isFull && <Icon.Chevron rotated={isCollapsed} />}
                    <ProTooltip title={group.name} placement="right" arrow>
                      <span
                        style={{
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontSize: "14px",
                        }}
                      >
                        {isInitials ? getInitials(group.name) : group.name}
                      </span>
                    </ProTooltip>
                  </div>
                  {isFull && (
                    <button
                      className="more-btn"
                      onClick={(e) => handleOpenMenu(e, "group", group.id)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 4,
                        cursor: "pointer",
                        opacity: 0,
                      }}
                    >
                      <Icon.More />
                    </button>
                  )}
                </div>

                {/* ANIMATED WRAPPER FOR EMPLOYEES */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: isCollapsed ? "0fr" : "1fr",
                    transition:
                      "grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
                    opacity: isCollapsed ? 0 : 1,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ minHeight: 0 }}>
                    {(group.employees || []).map((res) => {
                      const row = (
                        <div
                          key={res.id}
                          className="sidebar-row-hover"
                          style={{
                            height: ROW_HEIGHT,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: isFull ? "space-between" : "center",
                            padding: isInitials ? "0" : "0 16px",
                            borderBottom: "1px solid rgba(0,0,0,0.03)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              maxWidth: isFull ? "calc(100% - 35px)" : "100%",
                            }}
                          >
                            <Icon.Dot />
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {isInitials ? getInitials(res.name) : res.name}
                            </span>
                          </div>
                          {isFull && (
                            <button
                              className="more-btn"
                              onClick={(e) =>
                                handleOpenMenu(e, "resource", group.id, res.id)
                              }
                              style={{
                                background: "none",
                                border: "none",
                                padding: 4,
                                cursor: "pointer",
                                opacity: 0,
                              }}
                            >
                              <Icon.More />
                            </button>
                          )}
                        </div>
                      );

                      return isInitials ? (
                        <ProTooltip
                          key={res.id}
                          title={res.name}
                          placement="right"
                        >
                          {row}
                        </ProTooltip>
                      ) : (
                        row
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONTEXT MENU (Simplified display check) */}
      {menu && (
        <div
          style={{
            position: "fixed",
            top: menu.y,
            left: menu.x,
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 2000,
            padding: "4px 0",
            minWidth: "160px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {menu.type === "resource" ? (
            <>
              <div
                className="menu-item-hover"
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={() => {
                  const g = groups.find((g) => g.id === selectedGroupId);
                  const r = g?.employees?.find(
                    (r) => r.id === selectedResourceId,
                  );
                  if (r) handleDialogResourceTrigger(r, selectedGroupId!);
                  closeMenus();
                }}
              >
                <Icon.Edit /> Redigera
              </div>
              {!disableDeletion && (
                <div
                  className="menu-item-hover"
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    color: "#d32f2f",
                  }}
                  onClick={() => {
                    if (selectedGroupId && selectedResourceId)
                      handleDeleteResource(selectedGroupId, selectedResourceId);
                    closeMenus();
                  }}
                >
                  <Icon.Delete /> Ta bort
                </div>
              )}
            </>
          ) : (
            <>
              <div
                className="menu-item-hover"
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={() => {
                  handleDialogResourceTrigger(undefined, selectedGroupId!);
                  closeMenus();
                }}
              >
                <Icon.Add /> Lägg till anställd
              </div>
              <div
                className="menu-item-hover"
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={() => {
                  const g = groups.find((g) => g.id === selectedGroupId);
                  if (g) handleDialogGroupTrigger(g);
                  closeMenus();
                }}
              >
                <Icon.Edit /> Redigera
              </div>
              {!disableDeletion && (
                <div
                  className="menu-item-hover"
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    color: "#d32f2f",
                  }}
                  onClick={() => {
                    if (selectedGroupId) handleDeleteGroup(selectedGroupId);
                    closeMenus();
                  }}
                >
                  <Icon.Delete /> Ta bort
                </div>
              )}
            </>
          )}
        </div>
      )}

      <style>{`
        .sidebar-row-hover:hover { background-color: rgba(0,0,0,0.04) !important; }
        .sidebar-row-hover:hover .more-btn { opacity: 1 !important; }
        .menu-item-hover:hover { background-color: #f5f5f5; }
        .more-btn:hover { background-color: rgba(0,0,0,0.1); border-radius: 50%; }
      `}</style>
    </div>
  );
};

export default memo(TimelineSidebar);
