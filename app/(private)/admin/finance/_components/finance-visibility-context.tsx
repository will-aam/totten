// app/(private)/admin/finance/_components/finance-visibility-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type FinanceVisibilityContextType = {
  hideValues: boolean;
  toggleHideValues: () => void;
  formatMasked: (formattedValue: string) => string;
};

const FinanceVisibilityContext = createContext<FinanceVisibilityContextType>({
  hideValues: false,
  toggleHideValues: () => {},
  formatMasked: (val) => val,
});

export function FinanceVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hideValues, setHideValues] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("totten_finance_hide_values");
      if (saved === "true") {
        setHideValues(true);
      }
    } catch {
      // Ignora erro caso localStorage não esteja acessível
    }
  }, []);

  const toggleHideValues = () => {
    setHideValues((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("totten_finance_hide_values", String(next));
      } catch {
        // Ignora erro
      }
      return next;
    });
  };

  const formatMasked = (formattedValue: string) => {
    if (!hideValues) return formattedValue;
    return "••••••";
  };

  return (
    <FinanceVisibilityContext.Provider
      value={{ hideValues, toggleHideValues, formatMasked }}
    >
      {children}
    </FinanceVisibilityContext.Provider>
  );
}

export function useFinanceVisibility() {
  return useContext(FinanceVisibilityContext);
}
