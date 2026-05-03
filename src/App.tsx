import "dayjs/locale/sv";
import { GlobalSnackbar } from "./services/stores/globalSnackbar";
import { LeaveRequest } from "./components/Application";
import "./App.css";
import {
  useHydrateUiConfig,
  useResponsiveSidebarMode,
} from "./services/hooks/useHydrateUiConfig";
import { DialogWrapper } from "./services/dialog/DialogWrapper";

function App() {
  useHydrateUiConfig();
  useResponsiveSidebarMode();
  return (
    <>
      <DialogWrapper />
      <GlobalSnackbar />
      <LeaveRequest />
    </>
  );
}

export default App;
