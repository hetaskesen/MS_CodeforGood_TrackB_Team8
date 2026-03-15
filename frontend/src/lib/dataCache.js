"use client";

import { createContext, useContext, useState, useEffect } from "react";

const DataContext = createContext(null);

// Module-level singleton guard — survives remounts and multiple DataProvider instances (e.g. Strict Mode, iframes)
let globalFetchStarted = false;

export function DataProvider({ apiUrl, children }) {
  const [govData, setGovData] = useState(null);
  const [resources, setResources] = useState([]);
  const [resourcesMeta, setResourcesMeta] = useState(null);
  const [govLoading, setGovLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  useEffect(() => {
    if (!apiUrl || globalFetchStarted) return;
    globalFetchStarted = true;

    // Fetch gov data + resources in parallel, once, on app load
    fetch(`${apiUrl}/api/gov/data`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.underservedZips) setGovData(data);
        setGovLoading(false);
      })
      .catch(() => setGovLoading(false));

    Promise.all([
      fetch(`${apiUrl}/api/resources`).then(r => r.ok ? r.json() : null),
      fetch(`${apiUrl}/api/resources/meta`).then(r => r.ok ? r.json() : null),
    ]).then(([res, meta]) => {
      if (Array.isArray(res)) setResources(res);
      if (meta) setResourcesMeta(meta);
      setResourcesLoading(false);
    }).catch(() => setResourcesLoading(false));
  }, [apiUrl]);

  return (
    <DataContext.Provider value={{
      govData,
      resources,
      resourcesMeta,
      govLoading,
      resourcesLoading,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useAppData must be used inside DataProvider");
  return ctx;
}
