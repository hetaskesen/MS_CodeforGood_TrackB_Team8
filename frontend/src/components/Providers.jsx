"use client";

import { DataProvider } from "@/lib/dataCache";

export default function Providers({ apiUrl = "", children }) {
  return (
    <DataProvider apiUrl={apiUrl}>
      {children}
    </DataProvider>
  );
}
