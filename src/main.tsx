import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App, { queryClient } from "./App.tsx";
import { QueryClientProvider } from "@tanstack/react-query";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <StrictMode>
      <App />
    </StrictMode>
  </QueryClientProvider>,
);
