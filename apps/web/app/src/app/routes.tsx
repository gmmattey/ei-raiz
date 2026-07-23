import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { AuthedAppShell } from "@/app/shell/AuthedAppShell";
import { HomePage } from "@/pages/HomePage";
import { PortfolioPage } from "@/pages/PortfolioPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SplashPage } from "@/pages/SplashPage";
import { StartPage } from "@/pages/StartPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { HoldingDetailPage } from "@/pages/HoldingDetailPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ImportStartPage } from "@/pages/ImportStartPage";
import { ImportPreviewPage } from "@/pages/ImportPreviewPage";
import { ImportConflictsPage } from "@/pages/ImportConflictsPage";
import { ImportOpsPage } from "@/pages/ImportOpsPage";
import { ImportDetailOpsPage } from "@/pages/ImportDetailOpsPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { HistoryImportsPage } from "@/pages/HistoryImportsPage";
import { RadarPage } from "@/pages/RadarPage";
import { ScorePage } from "@/pages/ScorePage";
import { AlertsPage } from "@/pages/AlertsPage";
import { AlertDetailPage } from "@/pages/AlertDetailPage";
import { GoalsPage } from "@/pages/GoalsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SplashPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/start",
    element: <StartPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/app",
    element: <AuthedAppShell />,
    children: [
      { path: "home", element: <HomePage /> },
      { path: "onboarding", element: <OnboardingPage /> },
      { path: "import", element: <ImportStartPage /> },
      { path: "import/:importId/preview", element: <ImportPreviewPage /> },
      { path: "import/:importId/conflicts", element: <ImportConflictsPage /> },
      { path: "import/:importId/ops", element: <ImportOpsPage /> },
      { path: "import/:importId/detail", element: <ImportDetailOpsPage /> },
      // Compat com targets antigos dos contratos/backend
      { path: "imports/entry", element: <ImportStartPage /> },
      { path: "imports/:importId/preview", element: <ImportPreviewPage /> },
      { path: "imports/:importId/conflicts", element: <ImportConflictsPage /> },
      { path: "imports/:importId/engine-status", element: <ImportOpsPage /> },
      { path: "imports/:importId/detail", element: <ImportDetailOpsPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "history/imports", element: <HistoryImportsPage /> },
      // Compat com backend nextStep do commit do import (/history/snapshots)
      { path: "history/snapshots", element: <HistoryPage /> },
      { path: "radar", element: <RadarPage /> },
      { path: "score", element: <ScorePage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "alerts/:alertId", element: <AlertDetailPage /> },
      { path: "goals", element: <GoalsPage /> },
      { path: "portfolio", element: <PortfolioPage /> },
      {
        path: "portfolio/:portfolioId/holdings/:holdingId",
        element: <HoldingDetailPage />,
      },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
]);
