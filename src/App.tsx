import "dayjs/locale/sv";
import { GlobalSnackbar } from "./services/stores/globalSnackbar";
import { Timeline } from "./components/Timeline";
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
      <Timeline />
    </>
  );
}

export default App;
