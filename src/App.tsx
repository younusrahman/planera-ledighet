
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "dayjs/locale/sv";
import { GlobalSnackbar } from "./services/stores/globalSnackbar";
import { GlobalDialogProvider } from "./services/dialog/GlobalDialogProvider";
import { Timeline } from "./components/Timeline";
import "./App.css";


export const queryClient = new QueryClient();
console.log("App rendered")
function App() {
  return (
    <QueryClientProvider client={queryClient}>
          <GlobalDialogProvider />
          <GlobalSnackbar />
          <Timeline />
    </QueryClientProvider>
  );
}

export default App;
