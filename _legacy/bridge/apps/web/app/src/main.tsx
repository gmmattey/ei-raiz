import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/routes";
import { AppStoreProvider } from "@/core/state/app_store";
import { DataSourcesProvider } from "@/core/data/react";
import { GlobalErrorModal } from "@/components/system/GlobalErrorModal";
import "@/styles/index.css";

import { GhostModeProvider } from "@/core/contexts/GhostModeContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppStoreProvider>
      <DataSourcesProvider>
        <GhostModeProvider>
          <GlobalErrorModal />
          <RouterProvider router={router} />
        </GhostModeProvider>
      </DataSourcesProvider>
    </AppStoreProvider>
  </React.StrictMode>,
);
