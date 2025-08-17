import React from 'react';
import { TrendingUp, TrendingDown, Target, Calendar, Activity, BarChart3, DollarSign, Award, Clock, Zap } from 'lucide-react';
import { XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface Trade {
  id: number;
  date: string;
  balance: number;
  pnl: number | null;
  amountToTarget: number;
  dailyGain: number | null;
  milestone: string;
  milestoneValue: number | null;
  type: 'trade' | 'deposit' | 'withdrawal' | 'starting';
  depositAmount?: string;
}

interface Goal {
  level: string;
  startBalance: number;
  targetBalance: number;
  status: 'In Progress' | 'Completed' | 'Not Started';
  progress: string;
}

interface SummaryPageProps {
  trades: Trade[];
  goals: Goal[];
}

const SummaryPage: React.FC<SummaryPageProps> = ({ trades, goals }) => {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate performance metrics
  const calculateMetrics = () => {
    const tradingData = trades.filter(t => t.type === 'trade' && t.pnl !== null);
    const totalPnL = tradingData.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = tradingData.filter(t => (t.pnl || 0) > 0);
    const losingTrades = tradingData.filter(t => (t.pnl || 0) < 0);
    const winRate = tradingData.length > 0 ? (winningTrades.length / tradingData.length) * 100 : 0;
    
    const bestDay = tradingData.length > 0 ? Math.max(...tradingData.map(t => t.pnl || 0)) : 0;
    const worstDay = tradingData.length > 0 ? Math.min(...tradingData.map(t => t.pnl || 0)) : 0;
    const avgDaily = tradingData.length > 0 ? totalPnL / tradingData.length : 0;
    
    const deposits = trades.filter(t => t.type === 'deposit').reduce((sum, t) => sum + parseFloat(t.depositAmount || '0'), 0);
    const withdrawals = trades.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + parseFloat(t.depositAmount || '0'), 0);
    const netDeposits = deposits - withdrawals;
    
    return {
      totalPnL,
      winRate,
      bestDay,
      worstDay,
      avgDaily,
      totalTradingDays: tradingData.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      deposits,
      withdrawals,
      netDeposits
    };
  };

  // Get monthly data for chart
  const getMonthlyData = () => {
    const monthlyData: { [key: string]: number } = {};
    
    trades.filter(t => t.type === 'trade' && t.pnl !== null).forEach(trade => {
      const date = new Date(trade.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (trade.pnl || 0);
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, pnl]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        pnl
      }));
  };

  // Get recent activities
  const getRecentActivities = () => {
    return [...trades]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  // Calculate current streak
  const getCurrentStreak = () => {
    const sortedTrades = trades
      .filter(t => t.type === 'trade' && t.pnl !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sortedTrades.length === 0) return { type: 'none', count: 0 };
    
    const firstTrade = sortedTrades[0];
    const isWinning = (firstTrade.pnl || 0) > 0;
    let streak = 1;
    
    for (let i = 1; i < sortedTrades.length; i++) {
      const trade = sortedTrades[i];
      const tradeIsWinning = (trade.pnl || 0) > 0;
      
      if (tradeIsWinning === isWinning) {
        streak++;
      } else {
        break;
      }
    }
    
    return { type: isWinning ? 'winning' : 'losing', count: streak };
  };

  const metrics = calculateMetrics();
  const monthlyData = getMonthlyData();
  const recentActivities = getRecentActivities();
  const currentStreak = getCurrentStreak();

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Total P&L</h3>
          </div>
          <p className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.totalPnL >= 0 ? '+' : ''}{formatCurrency(metrics.totalPnL)}
          </p>
          <p className="text-sm text-gray-500 mt-1">All time performance</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target size={20} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Win Rate</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {metrics.winRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">{metrics.winningTrades}/{metrics.totalTradingDays} trades</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Best Day</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            +{formatCurrency(metrics.bestDay)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Highest single day</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 size={20} className="text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Avg Daily</h3>
          </div>
          <p className={`text-2xl font-bold ${metrics.avgDaily >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.avgDaily >= 0 ? '+' : ''}{formatCurrency(metrics.avgDaily)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Per trading day</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar size={20} className="text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Monthly Performance</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Bar dataKey="pnl">
                  {monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trading Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Activity size={20} className="text-cyan-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Trading Statistics</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Deposits</span>
              <span className="font-semibold text-green-600">+{formatCurrency(metrics.deposits)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Withdrawals</span>
              <span className="font-semibold text-red-600">-{formatCurrency(metrics.withdrawals)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-gray-600">Net Deposits</span>
              <span className="font-semibold">{formatCurrency(metrics.netDeposits)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Streak</span>
              <div className="flex items-center gap-1">
                <span className={`font-semibold ${currentStreak.type === 'winning' ? 'text-green-600' : 'text-red-600'}`}>
                  {currentStreak.count} {currentStreak.type}
                </span>
                {currentStreak.type === 'winning' ? (
                  <TrendingUp size={16} className="text-green-600" />
                ) : (
                  <TrendingDown size={16} className="text-red-600" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Progress & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award size={20} className="text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Goal Progress</h3>
          </div>
          <div className="space-y-3">
            {goals.slice(0, 5).map((goal, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">{goal.level}</span>
                  <p className="text-sm text-gray-500">{formatCurrency(goal.targetBalance)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    goal.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    goal.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {goal.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Clock size={20} className="text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Recent Activities</h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'trade' ? 
                      (activity.pnl || 0) >= 0 ? 'bg-green-500' : 'bg-red-500' :
                    activity.type === 'deposit' ? 'bg-blue-500' :
                    activity.type === 'withdrawal' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`} />
                  <div>
                    <span className="font-medium text-gray-900 capitalize">{activity.type}</span>
                    <p className="text-sm text-gray-500">{activity.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.type === 'trade' && activity.pnl !== null && (
                    <span className={`font-semibold ${activity.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {activity.pnl >= 0 ? '+' : ''}{formatCurrency(activity.pnl)}
                    </span>
                  )}
                  {(activity.type === 'deposit' || activity.type === 'withdrawal') && (
                    <span className={`font-semibold ${activity.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                      {activity.type === 'deposit' ? '+' : '-'}{formatCurrency(parseFloat(activity.depositAmount || '0'))}
                    </span>
                  )}
                  {activity.type === 'starting' && (
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(activity.balance)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Analytics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Zap size={20} className="text-red-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Risk Analytics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Worst Day</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(metrics.worstDay)}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Losing Days</p>
            <p className="text-lg font-semibold text-orange-600">{metrics.losingTrades}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Win/Loss Ratio</p>
            <p className="text-lg font-semibold text-blue-600">
              {metrics.losingTrades > 0 ? (metrics.winningTrades / metrics.losingTrades).toFixed(2) : '∞'}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Trading Days</p>
            <p className="text-lg font-semibold text-purple-600">{metrics.totalTradingDays}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
