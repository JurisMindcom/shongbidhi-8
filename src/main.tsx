import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { NavigationProvider } from "@/lib/navigation";
import { ComposeProvider } from "@/lib/compose";
import { PushProvider } from "@/lib/push";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NavigationProvider>
      <ThemeProvider>
        <AuthProvider>
          <PushProvider>
            <ComposeProvider>
              <App />
              <Toaster theme="dark" position="top-center" richColors />
            </ComposeProvider>
          </PushProvider>
        </AuthProvider>
      </ThemeProvider>
    </NavigationProvider>
  </React.StrictMode>,
);