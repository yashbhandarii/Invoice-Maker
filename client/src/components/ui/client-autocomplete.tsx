import * as React from "react"
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ClientData } from "@/lib/invoice-types"

interface ClientAutocompleteProps {
    clients: ClientData[]
    value?: string
    onChange: (value: string) => void
    onSelect: (client: ClientData) => void
    onAddNew?: (name: string) => void
    placeholder?: string
}

export function ClientAutocomplete({
    clients,
    value,
    onChange,
    onSelect,
    onAddNew,
    placeholder = "Select client..."
}: ClientAutocompleteProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState(value || "")

    React.useEffect(() => {
        setInputValue(value || "")
    }, [value])

    const handleSelect = (client: ClientData) => {
        onSelect(client)
        onChange(client.name)
        setInputValue(client.name)
        setOpen(false)
    }

    const handleAddNew = () => {
        if (onAddNew && inputValue) {
            onAddNew(inputValue)
            setOpen(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-8 text-xs"
                >
                    {inputValue || placeholder}
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search client..."
                        value={inputValue}
                        onValueChange={(val) => {
                            setInputValue(val)
                            onChange(val)
                        }}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-center text-sm">
                                No client found.
                                {inputValue && onAddNew && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mt-2 h-8 text-xs"
                                        onClick={handleAddNew}
                                    >
                                        <UserPlus className="mr-2 h-3 w-3" />
                                        Add "{inputValue}"
                                    </Button>
                                )}
                            </div>
                        </CommandEmpty>
                        <CommandGroup heading="Clients">
                            {clients.map((client) => (
                                <CommandItem
                                    key={client.id}
                                    value={client.name}
                                    onSelect={() => handleSelect(client)}
                                    className="text-xs"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-3 w-3",
                                            value === client.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {client.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
