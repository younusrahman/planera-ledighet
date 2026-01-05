import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/sv";
import { Timeline } from "./components/Timeline";
import { SnackbarProvider } from "./provider/SnackbarContext";
import { DialogProvider } from "./provider/DialogProvider";

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
        <SnackbarProvider>
          <DialogProvider>
            <Timeline />
          </DialogProvider>
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
