"use client";

import { SWRConfig } from "swr";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Desliga a revalidação ao focar na janela globalmente
        revalidateOnFocus: false,
        // (Opcional) Podemos já deixar um fetcher global aqui para não ter que importar em toda tela
        fetcher: (url: string) => fetch(url).then((res) => res.json()),
      }}
    >
      {children}
    </SWRConfig>
  );
}
