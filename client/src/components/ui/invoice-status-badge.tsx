import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface InvoiceStatusBadgeProps {
    status: "Paid" | "Pending" | "Overdue";
    className?: string;
    showIcon?: boolean;
}

export function InvoiceStatusBadge({ status, className = "", showIcon = false }: InvoiceStatusBadgeProps) {
    const getStatusConfig = () => {
        switch (status) {
            case "Paid":
                return {
                    variant: "default" as const,
                    className: "bg-green-500 hover:bg-green-600 text-white",
                    icon: CheckCircle2,
                    label: "Paid"
                };
            case "Pending":
                return {
                    variant: "secondary" as const,
                    className: "bg-orange-400 hover:bg-orange-500 text-white",
                    icon: Clock,
                    label: "Pending"
                };
            case "Overdue":
                return {
                    variant: "destructive" as const,
                    className: "bg-red-500 hover:bg-red-600 text-white",
                    icon: AlertCircle,
                    label: "Overdue"
                };
            default:
                return {
                    variant: "secondary" as const,
                    className: "bg-gray-400 hover:bg-gray-500 text-white",
                    icon: Clock,
                    label: status
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <Badge
            variant={config.variant}
            className={`text-[10px] h-5 px-2 ${config.className} ${className}`}
        >
            {showIcon && <Icon className="h-3 w-3 mr-1" />}
            {config.label}
        </Badge>
    );
}
