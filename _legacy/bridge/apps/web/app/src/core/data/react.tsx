import * as React from "react";
import type { AppDataSources } from "@/core/data/data_sources";
import { getDataSources } from "@/core/data";

const DataSourcesContext = React.createContext<AppDataSources | null>(null);

export function DataSourcesProvider({ children }: { children: React.ReactNode }) {
  const ds = React.useMemo(() => getDataSources(), []);
  return <DataSourcesContext.Provider value={ds}>{children}</DataSourcesContext.Provider>;
}

export function useDataSources(): AppDataSources {
  const ctx = React.useContext(DataSourcesContext);
  if (!ctx) throw new Error("DataSourcesProvider is missing");
  return ctx;
}

