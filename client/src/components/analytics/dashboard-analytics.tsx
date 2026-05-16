import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/ui/kpi-card";
import { DollarSign, FileText, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsData {
    kpis: {
        totalRevenue: number;
        paidAmount: number;
        pendingAmount: number;
        overdueAmount: number;
        totalInvoices: number;
        averageInvoiceValue: number;
    };
    revenueByMonth: Array<{
        month: string;
        revenue: number;
        paid: number;
        pending: number;
    }>;
    paymentStatus: {
        paid: number;
        pending: number;
        overdue: number;
    };
    topCustomers: Array<{
        name: string;
        revenue: number;
        invoiceCount: number;
    }>;
}

const COLORS = {
    paid: '#10b981',    // green
    pending: '#f59e0b', // orange
    overdue: '#ef4444', // red
};

export function DashboardAnalytics() {
    const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
        queryKey: ['analytics'],
        queryFn: async () => {
            const response = await fetch('/api/analytics/dashboard');
            if (!response.ok) throw new Error('Failed to fetch analytics');
            return response.json();
        },
        refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-red-600">Failed to load analytics data</p>
                </CardContent>
            </Card>
        );
    }

    const pieData = [
        { name: 'Paid', value: analytics.paymentStatus.paid },
        { name: 'Pending', value: analytics.paymentStatus.pending },
        { name: 'Overdue', value: analytics.paymentStatus.overdue },
    ].filter(item => item.value > 0);

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <KPICard
                    title="Total Revenue"
                    value={formatCurrency(analytics.kpis.totalRevenue)}
                    icon={DollarSign}
                    color="blue"
                />
                <KPICard
                    title="Paid Amount"
                    value={formatCurrency(analytics.kpis.paidAmount)}
                    icon={CheckCircle}
                    color="green"
                />
                <KPICard
                    title="Pending"
                    value={formatCurrency(analytics.kpis.pendingAmount)}
                    icon={Clock}
                    color="orange"
                />
                <KPICard
                    title="Overdue"
                    value={formatCurrency(analytics.kpis.overdueAmount)}
                    icon={AlertCircle}
                    color="red"
                />
                <KPICard
                    title="Total Invoices"
                    value={analytics.kpis.totalInvoices.toString()}
                    icon={FileText}
                    color="purple"
                />
                <KPICard
                    title="Average Value"
                    value={formatCurrency(analytics.kpis.averageInvoiceValue)}
                    icon={TrendingUp}
                    color="blue"
                />
            </div>

            {/* Revenue Trend Chart */}
            {analytics.revenueByMonth.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.revenueByMonth}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="Total Revenue"
                                    dot={{ fill: '#3b82f6' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="paid"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    name="Paid"
                                    dot={{ fill: '#10b981' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Status Pie Chart */}
                {pieData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Status Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Top Customers Bar Chart */}
                {analytics.topCustomers.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Top 5 Customers by Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.topCustomers} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                                    <YAxis dataKey="name" type="category" width={100} />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
                                    />
                                    <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Empty State */}
            {analytics.revenueByMonth.length === 0 && analytics.topCustomers.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <p className="text-slate-500">No data available yet. Create some invoices to see analytics!</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
