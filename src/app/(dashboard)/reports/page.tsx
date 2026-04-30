"use client";

export const maxDuration = 60;

import React, { useState, useTransition, useMemo } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { 
  TrendingUp, 
  ShoppingBag, 
  AlertCircle, 
  Calendar as CalendarIcon,
  RefreshCcw,
  FileBarChart2
} from "lucide-react";
import { getDailySalesAction, getTopItemsAction, getKPISummaryAction } from "@/lib/actions/reports";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Dynamic imports for Recharts to avoid SSR issues and improve performance
const ResponsiveContainer = dynamic(() => import("recharts").then(mod => mod.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then(mod => mod.Legend), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(mod => mod.Cell), { ssr: false });

const COLORS = ["#8B5A2B", "#A67C52", "#C2A385", "#D2B48C", "#E3D1BC", "#F4EBDD"];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 7),
    end: new Date(),
  });
  const [isPending, startTransition] = useTransition();

  // Queries
  const { data: kpi, isLoading: kpiLoading, refetch: refetchKpi } = useQuery({
    queryKey: ["reports", "kpi", dateRange],
    queryFn: () => getKPISummaryAction({ 
      start: startOfDay(dateRange.start), 
      end: endOfDay(dateRange.end) 
    }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["reports", "daily-sales", dateRange],
    queryFn: () => getDailySalesAction({ 
      start: startOfDay(dateRange.start), 
      end: endOfDay(dateRange.end) 
    }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: topItems, isLoading: topItemsLoading } = useQuery({
    queryKey: ["reports", "top-items"],
    queryFn: () => getTopItemsAction({ limit: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = () => {
    startTransition(() => {
      refetchKpi();
    });
  };

  const chartData = useMemo(() => {
    if (!sales?.success) return [];
    return sales.data.map(d => ({
      ...d,
      date: format(new Date(d.date), "MMM dd"),
    }));
  }, [sales]);

  const pieData = useMemo(() => {
    if (!topItems?.success) return [];
    return topItems.data;
  }, [topItems]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
            <FileBarChart2 className="text-primary" />
            Reporting Dashboard
          </h1>
          <p className="text-muted mt-1">Analytics and sales performance overview.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-border">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <input 
              type="date" 
              value={format(dateRange.start, "yyyy-MM-dd")}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
              className="bg-transparent text-sm text-foreground focus:outline-none cursor-pointer"
              aria-label="Start Date"
            />
            <span className="text-border">—</span>
            <input 
              type="date" 
              value={format(dateRange.end, "yyyy-MM-dd")}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
              className="bg-transparent text-sm text-foreground focus:outline-none cursor-pointer"
              aria-label="End Date"
            />
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isPending}
            className="p-2 hover:bg-surface rounded-lg transition-colors text-muted hover:text-primary disabled:opacity-50"
            aria-label="Refresh Data"
          >
            <RefreshCcw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-label="Key Performance Indicators">
        <KPICard 
          title="Total Revenue" 
          value={kpi?.success ? `$\${kpi.data.revenue?.toFixed(2) || '0.00'}` : "$0.00"} 
          sub="Filtered period"
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          loading={kpiLoading}
        />
        <KPICard 
          title="Orders Count" 
          value={kpi?.success ? kpi.data.count?.toString() || '0' : "0"} 
          sub="Successful transactions"
          icon={<ShoppingBag className="w-6 h-6 text-primary" />}
          loading={kpiLoading}
        />
        <KPICard 
          title="Void Losses" 
          value={kpi?.success ? `$\${kpi.data.voidLoss?.toFixed(2) || '0.00'}` : "$0.00"} 
          sub="Revenue lost to voids"
          icon={<AlertCircle className="w-6 h-6 text-red-600" />}
          loading={kpiLoading}
          color="text-red-600"
        />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Daily Sales Trend</h3>
          </div>
          <ErrorBoundary>
            <div className="h-[350px] w-full">
              {salesLoading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6B7280" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#6B7280" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `$\${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E2D9", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        itemStyle={{ color: "#8B5A2B", fontWeight: "bold" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8B5A2B" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: "#8B5A2B", strokeWidth: 2, stroke: "#FFFFFF" }} 
                        activeDot={{ r: 6, stroke: "#8B5A2B", strokeWidth: 2, fill: "#FFFFFF" }}
                      />
                    </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </ErrorBoundary>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Top Selling Items</h3>
          <ErrorBoundary>
            <div className="h-[350px] w-full flex flex-col items-center justify-center">
              {topItemsLoading ? (
                <div className="w-48 h-48 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
              ) : pieData.length === 0 ? (
                <p className="text-gray-500 italic">No data available</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="quantity"
                        nameKey="name"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-\${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E2D9", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {pieData.slice(0, 3).map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                        <span className="text-xs text-muted">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </ErrorBoundary>
        </div>
      </section>
    </div>
  );
}

function KPICard({ title, value, sub, icon, loading, color = "text-foreground" }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className="text-xs font-black text-muted uppercase tracking-wider">{title}</p>
        <div className="p-2.5 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">{icon}</div>
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-surface animate-pulse rounded" />
      ) : (
        <p className={`text-3xl font-black \${color} relative z-10 tracking-tight`}>{value}</p>
      )}
      <p className="text-[10px] font-bold text-muted mt-2 uppercase tracking-wide opacity-70 relative z-10">{sub}</p>
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 group-hover:bg-primary/10 transition-all duration-700 blur-2xl" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="w-full h-full flex items-end justify-between gap-2 px-4 pb-4">
      {[...Array(12)].map((_, i) => (
        <div 
          key={i} 
          className="w-full bg-surface animate-pulse rounded-t-lg"
          style={{ height: `\${Math.random() * 80 + 20}%` }}
        />
      ))}
    </div>
  );
}
