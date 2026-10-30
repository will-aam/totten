// app/(private)/admin/finance/_components/finance-visibility-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { FinanceViewMode } from "@/types/finance";

type FinanceVisibilityContextType = {
  hideValues: boolean;
  toggleHideValues: () => void;
  formatMasked: (formattedValue: string) => string;
  viewMode: FinanceViewMode;
  setViewMode: (mode: FinanceViewMode) => void;
};

const FinanceVisibilityContext = createContext<FinanceVisibilityContextType>({
  hideValues: false,
  toggleHideValues: () => {},
  formatMasked: (val) => val,
  viewMode: "COMPETENCIA",
  setViewMode: () => {},
});

export function FinanceVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hideValues, setHideValues] = useState<boolean>(false);
  const [viewMode, setViewModeState] = useState<FinanceViewMode>("COMPETENCIA");

  useEffect(() => {
    try {
      const savedHide = localStorage.getItem("totten_finance_hide_values");
      if (savedHide === "true") {
        setHideValues(true);
      }
      const savedMode = localStorage.getItem("totten_finance_view_mode") as FinanceViewMode | null;
      if (savedMode === "COMPETENCIA" || savedMode === "CAIXA") {
        setViewModeState(savedMode);
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

  const setViewMode = (mode: FinanceViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem("totten_finance_view_mode", mode);
    } catch {
      // Ignora erro
    }
  };

  const formatMasked = (formattedValue: string) => {
    if (!hideValues) return formattedValue;
    return "••••••";
  };

  return (
    <FinanceVisibilityContext.Provider
      value={{
        hideValues,
        toggleHideValues,
        formatMasked,
        viewMode,
        setViewMode,
      }}
    >
      {children}
    </FinanceVisibilityContext.Provider>
  );
}

export function useFinanceVisibility() {
  return useContext(FinanceVisibilityContext);
}
