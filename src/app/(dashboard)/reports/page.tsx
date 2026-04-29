"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  ShoppingBag, 
  Ban, 
  Calendar,
  ChevronRight,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw
} from "lucide-react";
import dynamic from "next/dynamic";
import { getDailySalesAction, getTopItemsAction, getOrderHistoryAction } from "@/lib/actions/reports";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Dynamic imports for Recharts to optimize bundle
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const Legend = dynamic(() => import("recharts").then(m => m.Legend), { ssr: false });

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

/**
 * Reports and Analytics Dashboard
 */
export default function ReportsPage() {
  return (
    <ErrorBoundary>
      <ReportsContent />
    </ErrorBoundary>
  );
}

function ReportsContent() {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 7),
    end: new Date()
  });

  // Fetch Analytics Data
  const { data: dailySales, isLoading: loadingSales, refetch: refetchSales } = useQuery({
    queryKey: ["dailySales", dateRange],
    queryFn: async () => {
      const res = await getDailySalesAction(dateRange.start, dateRange.end);
      if (!res.success) throw new Error(res.error);
      return res.data;
    }
  });

  const { data: topItems, isLoading: loadingTop } = useQuery({
    queryKey: ["topItems"],
    queryFn: async () => {
      const res = await getTopItemsAction(5);
      if (!res.success) throw new Error(res.error);
      return res.data;
    }
  });

  const { data: ordersHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["recentActivity"],
    queryFn: async () => {
      const res = await getOrderHistoryAction({});
      if (!res.success) throw new Error(res.error);
      return res.data;
    }
  });

  // Aggregated KPI Stats
  const stats = useMemo(() => {
    if (!ordersHistory) return { revenue: 0, orders: 0, voids: 0 };
    return ordersHistory.reduce((acc: any, order: any) => {
      if (order.status === 'DONE') {
        acc.revenue += parseFloat(order.total);
        acc.orders += 1;
      } else if (order.status === 'VOID') {
        acc.voids += 1;
      }
      return acc;
    }, { revenue: 0, orders: 0, voids: 0 });
  }, [ordersHistory]);

  const handleDateChange = (days: number) => {
    setDateRange({
      start: subDays(new Date(), days),
      end: new Date()
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Analytics</h1>
          <p className="text-white/50 text-sm mt-1">Real-time performance metrics</p>
        </div>

        <div className="flex bg-[#1C161A] p-1 rounded-xl border border-white/10" role="group" aria-label="Date range filter">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => handleDateChange(days)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                subDays(new Date(), days).toDateString() === dateRange.start.toDateString()
                  ? "bg-[#8B5CF6] text-white shadow-lg"
                  : "text-white/40 hover:text-white"
              }`}
              aria-label={`View last ${days} days`}
            >
              {days}D
            </button>
          ))}
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<TrendingUp className="text-green-400" />}
          trend="+12.5%"
          loading={loadingHistory}
        />
        <StatCard 
          title="Total Orders" 
          value={stats.orders.toString()} 
          icon={<ShoppingBag className="text-blue-400" />}
          trend="+5.2%"
          loading={loadingHistory}
        />
        <StatCard 
          title="Voided Orders" 
          value={stats.voids.toString()} 
          icon={<Ban className="text-red-400" />}
          trend="-2.1%"
          isNegative
          loading={loadingHistory}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-[#1C161A] border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#8B5CF6]" />
              Sales Performance
            </h3>
            <button onClick={() => refetchSales()} className="p-2 hover:bg-white/5 rounded-full transition-colors" aria-label="Refresh chart">
              <RefreshCw className={`w-4 h-4 text-white/40 ${loadingSales ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="h-[300px] w-full">
            {loadingSales ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff40" 
                    fontSize={10} 
                    tickFormatter={(str) => format(new Date(str), "dd MMM")}
                  />
                  <YAxis stroke="#ffffff40" fontSize={10} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1C161A', borderColor: '#ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#8B5CF6' }}
                    labelFormatter={(str) => format(new Date(str), "eeee, MMM dd")}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#8B5CF6" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#8B5CF6' }} 
                    activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2, fill: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Items Pie */}
        <div className="bg-[#1C161A] border border-white/10 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-8">
            <PieChartIcon className="w-5 h-5 text-[#EC4899]" />
            Top Selling Items
          </h3>
          <div className="h-[300px] w-full">
            {loadingTop ? (
              <ChartSkeleton isPie />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topItems}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="quantity"
                  >
                    {topItems?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1C161A', borderColor: '#ffffff10', borderRadius: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, isNegative, loading }: any) {
  return (
    <div className="bg-[#1C161A] border border-white/10 rounded-2xl p-6 shadow-xl hover:border-[#8B5CF6]/30 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-[#8B5CF6]/10 transition-colors">
          {icon}
        </div>
        {!loading && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isNegative ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase text-white/40 tracking-wider">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />
        ) : (
          <h4 className="text-3xl font-bold tracking-tight text-white">{value}</h4>
        )}
      </div>
    </div>
  );
}

function ChartSkeleton({ isPie }: { isPie?: boolean }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-xl animate-pulse">
      {isPie ? (
        <div className="w-32 h-32 rounded-full border-8 border-white/10" />
      ) : (
        <div className="w-full h-full flex items-end gap-2 p-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex-1 bg-white/10 rounded-t" style={{ height: `${Math.random() * 80 + 20}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}
