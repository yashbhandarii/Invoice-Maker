import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface LedgerEntry {
  date: string;
  description: string;
  type: "debit" | "credit";
  amount: number;
  balance: number;
}

interface LedgerData {
  buyerName: string;
  totalOutstanding: number;
  entries: LedgerEntry[];
}

export function CustomerLedger({ buyerName }: { buyerName: string }) {
  const { data, isLoading, error } = useQuery<LedgerData>({
    queryKey: ["/api/ledger", buyerName],
    queryFn: async () => {
      const res = await fetch(`/api/ledger/${encodeURIComponent(buyerName)}`);
      if (!res.ok) throw new Error("Failed to fetch ledger");
      return res.json();
    },
    enabled: !!buyerName,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading ledger: {(error as Error).message}</div>;
  }

  if (!data || data.entries.length === 0) {
    return <div className="p-4 text-center text-slate-500">No transactions found for {buyerName}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end bg-slate-50 p-4 rounded-lg border">
        <div>
          <h3 className="text-sm font-medium text-slate-500">Total Outstanding</h3>
          <p className={`text-2xl font-bold ${data.totalOutstanding > 0 ? "text-orange-600" : "text-green-600"}`}>
            ₹{Math.abs(data.totalOutstanding).toFixed(2)}
            {data.totalOutstanding > 0 ? " Dr" : data.totalOutstanding < 0 ? " Cr" : ""}
          </p>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Debit (₹)</TableHead>
              <TableHead className="text-right">Credit (₹)</TableHead>
              <TableHead className="text-right">Balance (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.entries.map((entry, idx) => (
              <TableRow key={idx}>
                <TableCell>{format(new Date(entry.date), "dd/MM/yyyy")}</TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell className="text-right text-orange-600">
                  {entry.type === "debit" ? entry.amount.toFixed(2) : ""}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {entry.type === "credit" ? entry.amount.toFixed(2) : ""}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {entry.balance.toFixed(2)} {entry.balance > 0 ? "Dr" : entry.balance < 0 ? "Cr" : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
