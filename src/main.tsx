import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { NavigationProvider } from "@/lib/navigation";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NavigationProvider>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster theme="dark" position="top-center" richColors />
        </AuthProvider>
      </ThemeProvider>
    </NavigationProvider>
  </React.StrictMode>,
);