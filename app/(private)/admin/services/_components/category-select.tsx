// app/(private)/admin/services/_components/category-select.tsx
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, LoaderDots, Plus } from "@boxicons/react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
// Importamos a nova Server Action aqui:
import { createCategoryAction } from "@/app/actions/categories";

type Category = {
  id: string;
  name: string;
};

type CategorySelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
};

export function CategorySelect({
  value,
  onValueChange,
  error,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // O GET continua via API para alimentar o client-side
      const data = await apiClient<Category[]>("categories", {
        params: { active: "true" },
      });
      setCategories(data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setCreating(true);
    try {
      // Chamada direta para a Server Action
      const result = await createCategoryAction(trimmedName);

      if (result.error) {
        if (result.error === "Categoria já existe") {
          // Fallback inteligente: se já existe, acha na lista e seleciona
          const existingCategory = categories.find(
            (c) => c.name.toLowerCase() === trimmedName.toLowerCase(),
          );
          if (existingCategory) {
            onValueChange(existingCategory.id);
            setOpen(false);
            toast.info("Categoria já existe, selecionada automaticamente");
          } else {
            toast.error(result.error);
          }
        } else {
          toast.error(result.error);
        }
        return;
      }

      if (result.success && result.category) {
        setCategories([...categories, result.category]);
        onValueChange(result.category.id);
        setSearchQuery("");
        setOpen(false);
        toast.success(`Categoria "${result.category.name}" criada!`);
      }
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      const exists = categories.find(
        (c) => c.name.toLowerCase() === searchQuery.trim().toLowerCase(),
      );
      if (!exists) {
        createCategory(searchQuery);
      } else {
        onValueChange(exists.id);
        setOpen(false);
      }
    }
  };

  const selectedCategory = categories.find((c) => c.id === value);

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-muted/50 border-border/50 h-11",
              error && "border-destructive",
            )}
          >
            {loading ? (
              <span className="text-muted-foreground">Carregando...</span>
            ) : selectedCategory ? (
              selectedCategory.name
            ) : (
              <span className="text-muted-foreground">
                Selecione ou crie uma categoria
              </span>
            )}
            <ChevronsUpDown size="sm" className="ml-2 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar ou criar categoria..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              onKeyDown={handleKeyDown}
            />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <LoaderDots size="sm" className="animate-spin mr-2" />
                  Carregando...
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Categoria não encontrada
                      </p>
                      {searchQuery.trim() && (
                        <Button
                          size="sm"
                          onClick={() => createCategory(searchQuery)}
                          disabled={creating}
                          className="mt-2"
                        >
                          {creating ? (
                            <>
                              <LoaderDots
                                size="xs"
                                className="animate-spin mr-2"
                              />
                              Criando...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-3 w-3" />
                              Criar "{searchQuery}"
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {categories.map((category) => (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => {
                          onValueChange(category.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          size="sm"
                          className={cn(
                            "mr-2",
                            value === category.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {category.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {searchQuery.trim() &&
                    !categories.find(
                      (c) =>
                        c.name.toLowerCase() ===
                        searchQuery.trim().toLowerCase(),
                    ) && (
                      <div className="border-t border-border px-2 py-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => createCategory(searchQuery)}
                          disabled={creating}
                          className="w-full justify-start"
                        >
                          {creating ? (
                            <>
                              <LoaderDots
                                size="xs"
                                className="animate-spin mr-2"
                              />
                              Criando...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-3 w-3" />
                              Criar "{searchQuery}"
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-xs font-medium text-destructive ml-1">{error}</p>
      )}
      <p className="text-xs text-muted-foreground ml-1">
        Digite o nome e pressione{" "}
        <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">
          Enter
        </kbd>{" "}
        para criar uma nova categoria.
      </p>
    </div>
  );
}
