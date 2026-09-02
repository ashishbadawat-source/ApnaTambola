import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Calendar,
  Sparkles,
  Award,
  Flame,
  Zap,
  Download,
  Share2,
  BarChart3,
  UserCheck,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { User, ReferralCommission } from '../../types';

interface ReferralGrowthAnalyticsProps {
  users: User[];
  commissions?: ReferralCommission[];
  onNavigateToReferrals?: () => void;
  title?: string;
  description?: string;
  className?: string;
}

type TimeRange = '7days' | '14days' | '30days' | '60days' | 'all';
type ViewMode = 'line' | 'area' | 'cumulative';

interface DailyAggregatedData {
  dateKey: string;
  displayDate: string;
  rawDate: Date;
  referralsCount: number;
  organicCount: number;
  cumulativeReferrals: number;
  totalSignups: number;
  topSponsorName?: string;
  topSponsorCode?: string;
}

export const ReferralGrowthAnalytics: React.FC<ReferralGrowthAnalyticsProps> = ({
  users,
  commissions = [],
  onNavigateToReferrals,
  title = 'Referral Sign-ups Growth Analysis (Last 30 Days)',
  description = 'Real-time daily aggregation of newly registered referral players via createdAt timestamp.',
  className = '',
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [viewMode, setViewMode] = useState<ViewMode>('line');
  const [showOrganicComparison, setShowOrganicComparison] = useState<boolean>(true);

  const daysCount = useMemo(() => {
    switch (timeRange) {
      case '7days':
        return 7;
      case '14days':
        return 14;
      case '30days':
        return 30;
      case '60days':
        return 60;
      case 'all':
        return 90;
      default:
        return 30;
    }
  }, [timeRange]);

  // Aggregate user signups by filtering & processing 'createdAt'
  const { chartData, stats, topCampaigns, peakDay } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dayBuckets: { [key: string]: DailyAggregatedData } = {};
    const dateKeys: string[] = [];

    // Build timeline buckets
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;

      const displayDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      dateKeys.push(dateKey);
      dayBuckets[dateKey] = {
        dateKey,
        displayDate,
        rawDate: d,
        referralsCount: 0,
        organicCount: 0,
        cumulativeReferrals: 0,
        totalSignups: 0,
      };
    }

    const sponsorTally: { [codeOrId: string]: { count: number; name?: string; code?: string } } = {};
    const dailySponsorTally: { [dateKey: string]: { [codeOrId: string]: number } } = {};

    let totalReferralInRange = 0;
    let totalOrganicInRange = 0;

    // Filter and tally by createdAt
    users.forEach((u) => {
      const createdStr = u.createdAt || u.created_at || (u as any).date;
      if (!createdStr) return;

      const userDate = new Date(createdStr);
      if (isNaN(userDate.getTime())) return;

      const yyyy = userDate.getFullYear();
      const mm = String(userDate.getMonth() + 1).padStart(2, '0');
      const dd = String(userDate.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;

      const isReferred = Boolean(
        u.referrer_id ||
        (u.referredBy && u.referredBy.trim().length > 0) ||
        (u.referredByUserId && u.referredByUserId.trim().length > 0)
      );

      const sponsorRef = (u.referredBy || u.referrer_id || u.referredByUserId || '').trim().toUpperCase();

      if (dayBuckets[dateKey]) {
        if (isReferred) {
          dayBuckets[dateKey].referralsCount += 1;
          totalReferralInRange += 1;

          if (sponsorRef) {
            sponsorTally[sponsorRef] = sponsorTally[sponsorRef] || { count: 0, code: sponsorRef };
            sponsorTally[sponsorRef].count += 1;

            if (!dailySponsorTally[dateKey]) dailySponsorTally[dateKey] = {};
            dailySponsorTally[dateKey][sponsorRef] = (dailySponsorTally[dateKey][sponsorRef] || 0) + 1;
          }
        } else {
          dayBuckets[dateKey].organicCount += 1;
          totalOrganicInRange += 1;
        }
        dayBuckets[dateKey].totalSignups += 1;
      }
    });

    let runningCumulative = 0;
    const sortedChartData = dateKeys.map((k) => {
      const item = dayBuckets[k];
      runningCumulative += item.referralsCount;
      item.cumulativeReferrals = runningCumulative;

      if (dailySponsorTally[k]) {
        const topForDay = Object.entries(dailySponsorTally[k]).sort((a, b) => b[1] - a[1])[0];
        if (topForDay) {
          const sponsorUser = users.find(
            (usr) =>
              usr.referralCode?.toUpperCase() === topForDay[0] ||
              usr.id === topForDay[0] ||
              usr.phone === topForDay[0]
          );
          item.topSponsorCode = topForDay[0];
          item.topSponsorName = sponsorUser ? sponsorUser.name : topForDay[0];
        }
      }

      return item;
    });

    let maxReferralDay: DailyAggregatedData | null = null;
    sortedChartData.forEach((d) => {
      if (!maxReferralDay || d.referralsCount > maxReferralDay.referralsCount) {
        maxReferralDay = d;
      }
    });

    const topCampaignsList = Object.entries(sponsorTally)
      .map(([refKey, info]) => {
        const matchUser = users.find(
          (usr) =>
            usr.referralCode?.toUpperCase() === refKey ||
            usr.id === refKey ||
            usr.phone === refKey
        );
        return {
          code: info.code || refKey,
          name: matchUser?.name || 'Sponsor ' + refKey,
          phone: matchUser?.phone,
          count: info.count,
          avatar: matchUser?.avatar,
          totalEarnings: commissions
            .filter((c) => c.userId === matchUser?.id || (c as any).sponsorId === matchUser?.id)
            .reduce((s, c) => s + (c.commissionAmount || 0), 0),
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const dailyAvg = (totalReferralInRange / Math.max(1, daysCount)).toFixed(1);
    const referralSharePercent =
      totalReferralInRange + totalOrganicInRange > 0
        ? Math.round((totalReferralInRange / (totalReferralInRange + totalOrganicInRange)) * 100)
        : 0;

    const half = Math.floor(sortedChartData.length / 2);
    const firstHalfSum = sortedChartData.slice(0, half).reduce((sum, d) => sum + d.referralsCount, 0);
    const secondHalfSum = sortedChartData.slice(half).reduce((sum, d) => sum + d.referralsCount, 0);
    const growthDiff = secondHalfSum - firstHalfSum;
    const growthPercent =
      firstHalfSum > 0 ? ((growthDiff / firstHalfSum) * 100).toFixed(1) : secondHalfSum > 0 ? '+100' : '0.0';

    return {
      chartData: sortedChartData,
      stats: {
        totalReferrals: totalReferralInRange,
        totalOrganic: totalOrganicInRange,
        totalSignups: totalReferralInRange + totalOrganicInRange,
        dailyAvg,
        referralSharePercent,
        growthPercent,
        growthDiff,
      },
      topCampaigns: topCampaignsList,
      peakDay: maxReferralDay,
    };
  }, [users, commissions, daysCount]);

  const handleExportCSV = () => {
    let csv = 'Date,Referral Sign-ups,Direct Sign-ups,Total Sign-ups,Cumulative Referrals,Top Sponsor Campaign\n';
    chartData.forEach((d) => {
      csv += `${d.dateKey},${d.referralsCount},${d.organicCount},${d.totalSignups},${d.cumulativeReferrals},"${d.topSponsorCode || 'N/A'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apna_tambola_referral_growth_${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: DailyAggregatedData = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-xl p-3.5 shadow-2xl min-w-[220px] text-xs space-y-2 z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-black text-amber-400 font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {item.displayDate} ({item.dateKey})
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">Total: {item.totalSignups}</span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                Referral Sign-ups:
              </span>
              <span className="font-mono font-black text-amber-300 text-sm">+{item.referralsCount}</span>
            </div>

            {showOrganicComparison && (
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  Direct / Organic:
                </span>
                <span className="font-mono font-bold text-cyan-300">+{item.organicCount}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-1 text-[11px]">
              <span className="text-slate-400 font-medium">Cumulative Total:</span>
              <span className="font-mono font-bold text-emerald-400">{item.cumulativeReferrals} users</span>
            </div>

            {item.topSponsorCode && (
              <div className="bg-amber-950/40 border border-amber-500/20 rounded-lg px-2 py-1 mt-1">
                <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  Top Campaign:
                </div>
                <div className="text-[11px] text-slate-200 font-mono truncate">
                  {item.topSponsorName || item.topSponsorCode}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-gradient-to-br from-slate-900 via-[#191428] to-slate-950 border border-amber-500/30 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Referrals ({daysCount}d)</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1.5">
            {stats.totalReferrals.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-amber-400 font-bold">{stats.referralSharePercent}%</span> of all {stats.totalSignups} sign-ups
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-[#0e1d2c] to-slate-950 border border-cyan-500/30 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Daily Velocity</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono mt-1.5">
            {stats.dailyAvg}
            <span className="text-xs font-medium text-slate-400 ml-1">/day</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            Growth:{' '}
            <span className={`font-bold ${Number(stats.growthPercent) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {Number(stats.growthPercent) >= 0 ? `+${stats.growthPercent}%` : `${stats.growthPercent}%`}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-[#0e251a] to-slate-950 border border-emerald-500/30 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span>Peak Day Burst</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono mt-1.5">
            {peakDay ? `+${peakDay.referralsCount}` : '0'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {peakDay && peakDay.referralsCount > 0 ? (
              <span className="text-emerald-400 font-semibold">{peakDay.displayDate} (Peak Spike)</span>
            ) : (
              'No viral burst yet'
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-[#26102a] to-slate-950 border border-purple-500/30 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-purple-400" />
            <span>Top Campaign</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-purple-300 font-mono mt-1.5 truncate">
            {topCampaigns[0] ? topCampaigns[0].name : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {topCampaigns[0] ? (
              <span className="text-purple-400 font-bold">
                +{topCampaigns[0].count} invites ({topCampaigns[0].code})
              </span>
            ) : (
              'Awaiting invite activity'
            )}
          </div>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                {title}
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold">
                  {daysCount} Days Window
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time Window Buttons */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              {(['7days', '14days', '30days', '60days'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    timeRange === range
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range === '7days' ? '7D' : range === '14days' ? '14D' : range === '30days' ? '30D' : '60D'}
                </button>
              ))}
            </div>

            {/* View Mode: Line vs Area vs Cumulative */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setViewMode('line')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'line' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Line Trend
              </button>
              <button
                onClick={() => setViewMode('area')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'area' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Area Fill
              </button>
              <button
                onClick={() => setViewMode('cumulative')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'cumulative' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cumulative
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              title="Download CSV report"
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-semibold px-2.5"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* The Recharts Graphic */}
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'line' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                />
                {showOrganicComparison && (
                  <Line
                    type="monotone"
                    dataKey="organicCount"
                    name="Direct Sign-ups"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 2, fill: '#06b6d4' }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="referralsCount"
                  name="Referral Sign-ups"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f59e0b' }}
                  activeDot={{ r: 7, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                />
                {peakDay && peakDay.referralsCount > 0 && (
                  <ReferenceLine
                    x={peakDay.displayDate}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{
                      value: `Spike (+${peakDay.referralsCount})`,
                      fill: '#34d399',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                )}
              </LineChart>
            ) : viewMode === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaReferralGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="areaOrganicGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                />
                {showOrganicComparison && (
                  <Area
                    type="monotone"
                    dataKey="organicCount"
                    name="Direct Sign-ups"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#areaOrganicGrad)"
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="referralsCount"
                  name="Referral Sign-ups"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaReferralGrad)"
                  activeDot={{ r: 7, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaCumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeReferrals"
                  name="Total Cumulative Referred Users"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaCumulativeGrad)"
                  activeDot={{ r: 7, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Bottom Campaign Summary Grid */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-2 bg-slate-950/70 rounded-2xl p-4 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-amber-300 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Referral Performance Overview
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOrganicComparison}
                  onChange={(e) => setShowOrganicComparison(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                />
                Compare with Direct Signups
              </label>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              Over the last <strong className="text-white">{daysCount} days</strong>, referral registrations contributed{' '}
              <strong className="text-amber-300">{stats.totalReferrals}</strong> out of{' '}
              <strong className="text-white">{stats.totalSignups}</strong> total new users (
              <span className="text-amber-400 font-bold">{stats.referralSharePercent}% share</span>).
              {peakDay && peakDay.referralsCount > 0 ? (
                <>
                  {' '}The single largest viral surge was recorded on{' '}
                  <strong className="text-emerald-400">{peakDay.displayDate}</strong> with{' '}
                  <strong className="text-emerald-300">+{peakDay.referralsCount} new registrations</strong>
                  {peakDay.topSponsorCode && (
                    <>
                      {' '}spearheaded by campaign code{' '}
                      <span className="font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        {peakDay.topSponsorCode}
                      </span>
                    </>
                  )}
                  .
                </>
              ) : (
                ' Referral growth remains positive.'
              )}
            </p>
          </div>

          <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/90 space-y-2">
            <div className="font-black text-amber-300 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Top Campaign Leaders
              </span>
              {onNavigateToReferrals && (
                <button
                  onClick={onNavigateToReferrals}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  View All <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
            {topCampaigns.length > 0 ? (
              <div className="space-y-1.5">
                {topCampaigns.slice(0, 3).map((camp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : 'bg-amber-700 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200 truncate">{camp.name}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono font-bold text-amber-300 shrink-0">
                      +{camp.count} <span className="text-[9px] text-slate-500 font-normal">users</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-3 text-center">No campaign signups recorded in range.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModuleReferralAnalytics = ReferralGrowthAnalytics;
