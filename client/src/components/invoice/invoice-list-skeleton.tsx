import { Skeleton } from "@/components/ui/skeleton";

export function InvoiceListSkeleton() {
    return (
        <div className="divide-y max-h-[400px] overflow-auto">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-2">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Skeleton className="h-8 w-8 rounded" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <div className="flex justify-between items-center w-full sm:w-auto mt-2 sm:mt-0 gap-4">
                        <div className="space-y-2 flex flex-col items-end">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
