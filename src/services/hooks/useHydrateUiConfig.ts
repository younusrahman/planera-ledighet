import { useEffect } from "react";
import { useUiConfig } from "../hooks/useData";
import { useConfigActions } from "../stores/uiStore";

export const useHydrateUiConfig = () => {
  const { data } = useUiConfig();
  const { hydrateFromBackend } = useConfigActions();

  useEffect(() => {
    if (data) {
      hydrateFromBackend(data);
    }
  }, [data, hydrateFromBackend]);
};


export const useResponsiveSidebarMode = () => {
  const { setSidebarMode } = useConfigActions();

  useEffect(() => {
    const applyMode = () => {
      if (window.innerWidth < 768) {
        setSidebarMode("compact");
      } else {
        setSidebarMode("full");
      }
    };

    applyMode();
    window.addEventListener("resize", applyMode);
    return () => window.removeEventListener("resize", applyMode);
  }, [setSidebarMode]);
};