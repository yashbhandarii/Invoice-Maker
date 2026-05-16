import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { useTransporters } from "@/lib/api";
import { type Transporter } from "@/lib/invoice-types";

interface TransporterAutocompleteProps {
    value: string;
    onSelect: (transporter: Transporter | null, customName?: string) => void;
    className?: string;
    placeholder?: string;
}

export function TransporterAutocomplete({
    value,
    onSelect,
    className,
    placeholder = "Select transporter...",
}: TransporterAutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const { data: transporters = [] } = useTransporters();
    const [inputValue, setInputValue] = React.useState("");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-8 font-normal", !value && "text-muted-foreground", className)}
                >
                    {value || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search transporter..."
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2">
                                <p className="text-sm text-muted-foreground mb-2">No transporter found.</p>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="w-full h-8"
                                    onClick={() => {
                                        onSelect(null, inputValue); // Pass custom name
                                        setOpen(false);
                                    }}
                                >
                                    <Plus className="mr-2 h-3 w-3" />
                                    Use "{inputValue}"
                                </Button>
                            </div>
                        </CommandEmpty>
                        <CommandGroup heading="Existing Transporters">
                            {transporters.map((transporter) => (
                                <CommandItem
                                    key={transporter.id}
                                    value={transporter.name}
                                    onSelect={() => {
                                        onSelect(transporter);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === transporter.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{transporter.name}</span>
                                        {transporter.vehicleNo && <span className="text-xs text-muted-foreground">{transporter.vehicleNo}</span>}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
