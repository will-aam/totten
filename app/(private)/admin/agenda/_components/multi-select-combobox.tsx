import React, { useState } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export interface Option {
  label: string;
  value: string;
}

interface MultiSelectComboboxProps {
  options: Option[];
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

export function MultiSelectCombobox({
  options,
  selectedValues,
  onSelectedValuesChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Pesquisar...",
  emptyText = "Nenhum resultado encontrado.",
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectedValuesChange(selectedValues.filter((item) => item !== value));
    } else {
      onSelectedValuesChange([...selectedValues, value]);
    }
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectedValuesChange(selectedValues.filter((item) => item !== value));
  };

  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full bg-muted/20 border border-input rounded-lg min-h-10 h-auto px-3 py-2 flex justify-between items-center shadow-none text-muted-foreground hover:bg-muted/40 transition-colors focus:ring-1 focus:ring-primary/20 font-medium font-normal"
        >
          <div className="flex flex-wrap gap-1 w-full mr-2">
            {selectedOptions.length === 0 && (
              <span className="text-muted-foreground self-center ml-1">{placeholder}</span>
            )}
            {selectedOptions.map((option) => (
              <Badge
                key={option.value}
                variant="secondary"
                className="rounded-md font-medium px-2 py-0.5 flex items-center gap-1 hover:bg-secondary/80 bg-secondary/60 text-secondary-foreground shrink-0 whitespace-nowrap"
              >
                {option.label}
                <div
                  role="button"
                  onClick={(e) => handleRemove(option.value, e)}
                  className="rounded-full hover:bg-muted-foreground/20 p-0.5 ml-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remover {option.label}</span>
                </div>
              </Badge>
            ))}
          </div>
          <div className="bg-muted/60 rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground shrink-0 self-start mt-0.5">
            <ChevronDown className="w-4 h-4" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border border-border/50 shadow-lg z-[100]" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label} // Search by label
                    onSelect={() => handleSelect(option.value)}
                    className="font-medium"
                  >
                    <span>{option.label}</span>
                  </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
