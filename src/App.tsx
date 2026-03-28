import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "dayjs/locale/sv";
import { GlobalSnackbar } from "./services/stores/globalSnackbar";
import { GlobalDialogProvider } from "./services/dialog/GlobalDialogProvider";
import { Timeline } from "./components/Timeline";
import "./App.css";
import {
  useHydrateUiConfig,
  useResponsiveSidebarMode,
} from "./services/hooks/useHydrateUiConfig";

export const queryClient = new QueryClient();
function App() {
  useHydrateUiConfig();
  useResponsiveSidebarMode();
  return (
    <>
      <GlobalDialogProvider />
      <GlobalSnackbar />
      <Timeline />
    </>
  );
}

export default App;
