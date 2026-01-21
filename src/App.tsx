import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/sv";
import { GlobalSnackbar } from "./services/globalSnackbar";
import { GlobalDialogProvider } from "./services/dialog/GlobalDialogProvider";
import { Timeline } from "./components/Timeline";
import { getEntity } from "./services/globalState";
import { useEffect } from "react";
import { absenceTypes } from "./services/entities/absenceTypes";
import { leaves } from "./services/entities/leaves";
import { resources } from "./services/entities/resources";
import { groups } from "./services/entities/groups";
import { appServicesStatic } from "./services/appServices";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    background: { default: "#f5f5f5" },
  },
});
export function expologGlobalState() {
  console.log("=== GLOBAL STATE ===");

  console.log("groups:", groups.useStore.getState());
  console.log("resources:", resources.useStore.getState());
  console.log("absenceTypes:", absenceTypes.useStore.getState());
  console.log("leaves:", leaves.useStore.getState());
}

function App() {
  useEffect(() => {
    async function init() {
      await appServicesStatic.refreshAllData(); // loads all Zustand slices
      expologGlobalState(); // logs actual state
    }
    init();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="sv">
        <CssBaseline />
        <GlobalDialogProvider />
        <GlobalSnackbar />
        <Timeline />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
