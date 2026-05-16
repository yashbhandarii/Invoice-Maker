import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { InvoiceData } from "@/lib/invoice-types";
import { calculateInvoiceTotals } from "@/lib/invoice-utils";
import { format, parseISO, startOfMonth } from "date-fns";

interface RevenueChartProps {
    invoices: InvoiceData[];
}

export function RevenueChart({ invoices }: RevenueChartProps) {
    const data = useMemo(() => {
        const monthlyData: Record<string, number> = {};

        invoices.forEach((inv) => {
            if (!inv.date) return;
            const date = parseISO(inv.date);
            const monthKey = format(startOfMonth(date), "MMM yyyy");
            const { grandTotal } = calculateInvoiceTotals(inv);

            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + grandTotal;
        });

        return Object.entries(monthlyData)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
            .slice(-6); // Show last 6 months
    }, [invoices]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                No data available for chart
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, "Revenue"]}
                />
                <Bar
                    dataKey="total"
                    fill="currentColor"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
