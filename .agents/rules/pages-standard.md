---
description: Padrão para páginas (max-w-400) e layout fluido
---

# Padrões de Layout para Páginas (Pages)

Sempre que você criar ou editar um componente do tipo página (geralmente arquivos `page.tsx`), deve seguir rigorosamente a diretriz de layout fluido, substituindo o uso de classes tradicionais como `max-w-4xl`, `max-w-5xl`, `max-w-7xl` por **`max-w-400`**.

## Motivação
O uso de `max-w-400` garante que a interface possa se esticar e se adaptar graciosamente em telas mais largas (1600px+), preenchendo as laterais elegantemente sem ficar restrita a uma largura central pequena.

## Como implementar
A div principal que engloba o conteúdo de uma rota deve possuir as seguintes classes:
- `max-w-400`
- `mx-auto`
- `w-full`
- `p-4 md:p-6` (espaçamento padrão)
- Opcional mas recomendado para transições: `animate-in fade-in duration-500 min-h-[calc(100vh-100px)]`

**Exemplo correto:**
```tsx
export default function MinhaNovaPagina() {
  return (
    <>
      <AdminHeader title="Minha Nova Página" />
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        {/* Conteúdo */}
      </div>
    </>
  );
}
```

**Exemplo incorreto (NÃO USE):**
```tsx
export default function MinhaNovaPagina() {
  return (
    <>
      <AdminHeader title="Minha Nova Página" />
      {/* NUNCA use max-w-5xl ou max-w-7xl nas páginas principais */}
      <div className="max-w-5xl mx-auto p-6">
        {/* Conteúdo */}
      </div>
    </>
  );
}
```
