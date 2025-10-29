import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppContextProvider } from "./App.context.tsx";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppContextProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </AppContextProvider>
  </StrictMode>
);
