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
  ArrowUpRight,
  Flame,
  Zap,
  Filter,
  Download,
  CheckCircle2,
  Share2,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { User, ReferralCommission } from '../../types';

interface ReferralGrowthChartProps {
  users: User[];
  commissions?: ReferralCommission[];
  title?: string;
  description?: string;
  className?: string;
}

type TimeRange = '7days' | '14days' | '30days' | '60days' | 'all';
type ChartType = 'area' | 'line' | 'cumulative';

interface DayData {
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

export const ReferralGrowthChart: React.FC<ReferralGrowthChartProps> = ({
  users,
  commissions = [],
  title = 'Referral Sign-ups Growth Analysis',
  description = 'Track daily referral registration spikes and evaluate campaign performance over time.',
  className = '',
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [showOrganicComparison, setShowOrganicComparison] = useState<boolean>(true);

  // Parse days count based on selected range
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

  // Aggregate user signups by date over the requested period
  const { chartData, stats, topCampaigns, peakDay } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Build day buckets map for the requested window
    const dayBuckets: { [key: string]: DayData } = {};
    const dateKeys: string[] = [];

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

    // Tally users into buckets & record sponsor stats
    const sponsorTally: { [codeOrId: string]: { count: number; name?: string; code?: string } } = {};
    const dailySponsorTally: { [dateKey: string]: { [codeOrId: string]: number } } = {};

    let totalReferralInRange = 0;
    let totalOrganicInRange = 0;

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

            // Track daily top sponsor
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

    // Populate daily top sponsors and compute cumulative
    let runningCumulative = 0;
    const sortedChartData = dateKeys.map((k) => {
      const item = dayBuckets[k];
      runningCumulative += item.referralsCount;
      item.cumulativeReferrals = runningCumulative;

      // Find top sponsor for this day
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

    // Find peak registration day
    let maxReferralDay: DayData | null = null;
    sortedChartData.forEach((d) => {
      if (!maxReferralDay || d.referralsCount > maxReferralDay.referralsCount) {
        maxReferralDay = d;
      }
    });

    // Calculate Top 5 overall campaigns / sponsors
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

    // Calculate summary statistics
    const dailyAvg = (totalReferralInRange / Math.max(1, daysCount)).toFixed(1);
    const referralSharePercent =
      totalReferralInRange + totalOrganicInRange > 0
        ? Math.round((totalReferralInRange / (totalReferralInRange + totalOrganicInRange)) * 100)
        : 0;

    // Growth velocity: Compare first half vs second half of the time window
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

  // Export Chart Data to CSV
  const handleExportData = () => {
    let csv = 'Date,Referral Sign-ups,Direct/Organic Sign-ups,Total Sign-ups,Cumulative Referrals,Top Campaign Code\n';
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

  // Custom Chart Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: DayData = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-xl p-3.5 shadow-2xl min-w-[220px] text-xs space-y-2 z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-black text-amber-400 font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {dataPoint.displayDate} ({dataPoint.dateKey})
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              Total: {dataPoint.totalSignups}
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                Referral Sign-ups:
              </span>
              <span className="font-mono font-black text-amber-300 text-sm">
                +{dataPoint.referralsCount}
              </span>
            </div>

            {showOrganicComparison && (
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  Direct / Organic:
                </span>
                <span className="font-mono font-bold text-cyan-300">
                  +{dataPoint.organicCount}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-1 text-[11px]">
              <span className="text-slate-400 font-medium">Cumulative Total:</span>
              <span className="font-mono font-bold text-emerald-400">
                {dataPoint.cumulativeReferrals} users
              </span>
            </div>

            {dataPoint.topSponsorCode && (
              <div className="bg-amber-950/40 border border-amber-500/20 rounded-lg px-2 py-1 mt-1">
                <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  Top Campaign:
                </div>
                <div className="text-[11px] text-slate-200 font-mono truncate">
                  {dataPoint.topSponsorName || dataPoint.topSponsorCode}
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
    <div
      className={`rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-amber-500/30 p-5 md:p-6 shadow-xl relative overflow-hidden backdrop-blur-md ${className}`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base md:text-lg font-black text-white tracking-wide flex items-center gap-2">
              {title}
              <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold">
                Last {daysCount} Days
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
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

          {/* Chart Type Selector */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Area
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartType === 'line'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Line Trend
            </button>
            <button
              onClick={() => setChartType('cumulative')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartType === 'cumulative'
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cumulative
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportData}
            title="Download CSV report"
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-semibold px-2.5"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 relative z-10">
        <div className="bg-slate-950/60 border border-amber-500/20 rounded-xl p-3 relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            New Referrals ({daysCount}d)
          </div>
          <div className="text-xl font-black text-amber-300 font-mono mt-1">
            {(stats?.totalReferrals || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            <span className="text-amber-400 font-bold">{stats.referralSharePercent}%</span> of total signups
          </div>
        </div>

        <div className="bg-slate-950/60 border border-cyan-500/20 rounded-xl p-3 relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Daily Avg Growth
          </div>
          <div className="text-xl font-black text-cyan-300 font-mono mt-1">
            {stats.dailyAvg}
            <span className="text-xs font-medium text-slate-400 ml-1">/day</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Velocity:{' '}
            <span
              className={`font-bold ${
                Number(stats.growthPercent) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {Number(stats.growthPercent) >= 0 ? `+${stats.growthPercent}%` : `${stats.growthPercent}%`}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-emerald-500/20 rounded-xl p-3 relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            Peak Referral Day
          </div>
          <div className="text-xl font-black text-emerald-300 font-mono mt-1">
            {peakDay ? `+${peakDay.referralsCount}` : '0'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            {peakDay && peakDay.referralsCount > 0 ? (
              <span className="text-emerald-400 font-semibold">{peakDay.displayDate} (Highest)</span>
            ) : (
              'No peak record yet'
            )}
          </div>
        </div>

        <div className="bg-slate-950/60 border border-purple-500/20 rounded-xl p-3 relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            Top Campaign Leader
          </div>
          <div className="text-base font-black text-purple-300 font-mono mt-1 truncate">
            {topCampaigns[0] ? topCampaigns[0].name : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
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

      {/* Main Recharts Graphic Container */}
      <div className="h-64 sm:h-72 w-full pt-2 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {/* Amber Gradient for Referral Signups */}
                <linearGradient id="referralGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                {/* Cyan Gradient for Organic Signups */}
                <linearGradient id="organicGradient" x1="0" y1="0" x2="0" y2="1">
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
              <Tooltip content={<CustomTooltip />} />
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
                  fill="url(#organicGradient)"
                />
              )}
              <Area
                type="monotone"
                dataKey="referralsCount"
                name="Referral Sign-ups"
                stroke="#f59e0b"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#referralGradient)"
                activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
              />
              {peakDay && peakDay.referralsCount > 0 && (
                <ReferenceLine
                  x={peakDay.displayDate}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{
                    value: `Spike (${peakDay.referralsCount})`,
                    fill: '#34d399',
                    fontSize: 10,
                    position: 'top',
                  }}
                />
              )}
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <Tooltip content={<CustomTooltip />} />
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
                dot={{ r: 3, fill: '#f59e0b' }}
                activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            /* Cumulative Total Area */
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
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
              <Tooltip content={<CustomTooltip />} />
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
                fill="url(#cumulativeGradient)"
                activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Bottom Insights & Top Campaigns Section */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 text-xs">
        {/* Campaign Insights */}
        <div className="md:col-span-2 bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-black text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Campaign Growth Insights
            </span>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOrganicComparison}
                onChange={(e) => setShowOrganicComparison(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
              />
              Compare with Direct/Organic
            </label>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Over the last <strong className="text-white">{daysCount} days</strong>, referral registrations accounted for{' '}
            <strong className="text-amber-300">{stats.totalReferrals}</strong> out of{' '}
            <strong className="text-white">{stats.totalSignups}</strong> total new players (
            <span className="text-amber-400 font-bold">{stats.referralSharePercent}% share</span>).
            {peakDay && peakDay.referralsCount > 0 ? (
              <>
                {' '}The highest single-day viral peak occurred on{' '}
                <strong className="text-emerald-400">{peakDay.displayDate}</strong> with{' '}
                <strong className="text-emerald-300">+{peakDay.referralsCount} new sign-ups</strong>
                {peakDay.topSponsorCode && (
                  <>
                    {' '}largely driven by campaign code{' '}
                    <span className="font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {peakDay.topSponsorCode}
                    </span>
                  </>
                )}
                .
              </>
            ) : (
              ' Referral growth remains steady.'
            )}
          </p>
        </div>

        {/* Top 3 Leaders in Window */}
        <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 space-y-2">
          <div className="font-black text-amber-300 flex items-center gap-1.5 text-xs">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Top Campaigns ({daysCount}d)
          </div>
          {topCampaigns.length > 0 ? (
            <div className="space-y-1.5">
              {topCampaigns.slice(0, 3).map((camp, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800 text-[11px]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
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
            <div className="text-[11px] text-slate-500 py-2 text-center">No campaign signups recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
