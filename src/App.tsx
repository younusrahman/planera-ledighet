import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/sv";
import { GlobalSnackbar } from "./services/globalSnackbar";
import { GlobalDialogProvider } from "./services/dialog/GlobalDialogProvider";
import { Timeline } from "./components/Timeline";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    background: { default: "#f5f5f5" },
  },
});

function App() {
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
