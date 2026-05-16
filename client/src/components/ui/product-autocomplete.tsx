import * as React from "react"
import { Check, ChevronsUpDown, Package } from "lucide-react"

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
import { Product } from "@/lib/invoice-types"

interface ProductAutocompleteProps {
    products: Product[]
    value?: string
    onChange: (value: string) => void
    onSelect: (product: Product) => void
    placeholder?: string
    className?: string
}

export function ProductAutocomplete({
    products,
    value,
    onChange,
    onSelect,
    placeholder = "Search product...",
    className,
}: ProductAutocompleteProps) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    const handleSelect = (product: Product) => {
        onSelect(product)
        onChange(product.name)
        setOpen(false)
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen) {
            // Clear search so all products are visible on open
            setSearchQuery("")
        }
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-7 text-xs font-normal bg-white", className)}
                >
                    <span className="truncate">{value || placeholder}</span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <Command shouldFilter={true}>
                    <CommandInput
                        placeholder="Type to search..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-center text-xs text-muted-foreground">
                                <Package className="h-4 w-4 mx-auto mb-1 opacity-40" />
                                No product found. Type freely.
                            </div>
                        </CommandEmpty>
                        <CommandGroup heading="Products">
                            {products.filter(p => p.isActive).map((product) => (
                                <CommandItem
                                    key={product.id}
                                    value={product.name}
                                    onSelect={() => handleSelect(product)}
                                    className="text-xs"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-3 w-3",
                                            value === product.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="font-medium truncate">{product.name}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {product.hsnCode ? `HSN: ${product.hsnCode}` : ""}
                                            {product.hsnCode && product.defaultRate ? " · " : ""}
                                            {product.defaultRate ? `₹${product.defaultRate}/${product.unit}` : ""}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
