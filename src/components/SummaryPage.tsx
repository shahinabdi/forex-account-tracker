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
    
    // Calculate deposits (including starting balances) and withdrawals from balance differences
    const deposits = trades.filter(t => t.type === 'deposit' || t.type === 'starting').reduce((sum, t) => {
      if (t.type === 'starting') {
        // Starting balance is considered a deposit
        return sum + t.balance;
      } else {
        // For deposits, the amount is the difference between current and previous balance
        const sortedTrades = trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const currentIndex = sortedTrades.findIndex(trade => trade.id === t.id);
        const prevBalance = currentIndex > 0 ? sortedTrades[currentIndex - 1].balance : 0;
        const depositAmount = t.balance - prevBalance;
        return sum + Math.max(0, depositAmount);
      }
    }, 0);
    
    const withdrawals = trades.filter(t => t.type === 'withdrawal').reduce((sum, t) => {
      // For withdrawals, the amount is the difference between previous and current balance
      const sortedTrades = trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const currentIndex = sortedTrades.findIndex(trade => trade.id === t.id);
      const prevBalance = currentIndex > 0 ? sortedTrades[currentIndex - 1].balance : 0;
      const withdrawalAmount = prevBalance - t.balance;
      return sum + Math.max(0, withdrawalAmount);
    }, 0);
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
      .slice(0, 5);
  };

  // Calculate current streak - counts consecutive wins or losses from most recent trades
  const getCurrentStreak = () => {
    const tradingData = trades
      .filter(t => t.type === 'trade' && t.pnl !== null && t.pnl !== 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first
    
    if (tradingData.length === 0) return { type: 'none', count: 0 };
    
    // Start with the most recent trade
    const mostRecentTrade = tradingData[0];
    const isWinningStreak = (mostRecentTrade.pnl || 0) > 0;
    let streakCount = 0;
    
    // Count consecutive trades of the same type (win/loss) from most recent backwards
    for (const trade of tradingData) {
      const isWin = (trade.pnl || 0) > 0;
      
      if (isWin === isWinningStreak) {
        streakCount++;
      } else {
        break; // Stop when we hit a different type of trade
      }
    }
    
    return { 
      type: isWinningStreak ? 'winning' : 'losing', 
      count: streakCount 
    };
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
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Monthly Performance</h3>
              <p className="text-sm text-gray-500">Last 6 months P&L</p>
            </div>
          </div>
          <div className="h-72 bg-gray-50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={monthlyData} 
                margin={{ top: 40, right: 30, left: 20, bottom: 20 }}
                barCategoryGap="20%"
              >
                <XAxis 
                  dataKey="month" 
                  fontSize={12} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  fontSize={12} 
                  tickFormatter={(value) => {
                    if (Math.abs(value) >= 1000) {
                      return `$${(value/1000).toFixed(1)}k`;
                    }
                    return `$${value.toFixed(2)}`;
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tick={{ fill: '#6B7280' }}
                />
                <defs>
                  <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <Bar 
                  dataKey="pnl" 
                  radius={[8, 8, 0, 0]}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                  label={{
                    position: 'top',
                    fontSize: 11,
                    fontWeight: 600,
                    fill: '#374151',
                    formatter: (value: any) => {
                      const num = Number(value);
                      if (Math.abs(num) >= 1000) {
                        return num >= 0 ? `+$${(Math.abs(num)/1000).toFixed(1)}k` : `-$${(Math.abs(num)/1000).toFixed(1)}k`;
                      }
                      return num >= 0 ? `+$${Math.abs(num).toFixed(2)}` : `-$${Math.abs(num).toFixed(2)}`;
                    }
                  }}
                >
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pnl >= 0 ? 'url(#positiveGradient)' : 'url(#negativeGradient)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Monthly Summary */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 font-medium">Profitable Months</p>
              <p className="text-lg font-bold text-green-700">
                {monthlyData.filter(m => m.pnl > 0).length}
              </p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-600 font-medium">Loss Months</p>
              <p className="text-lg font-bold text-red-700">
                {monthlyData.filter(m => m.pnl < 0).length}
              </p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 font-medium">Best Month</p>
              <p className="text-lg font-bold text-blue-700">
                {monthlyData.length > 0 ? formatCurrency(Math.max(...monthlyData.map(m => m.pnl))) : '$0.00'}
              </p>
            </div>
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
            {recentActivities.map((activity) => {
              // Calculate deposit/withdrawal amounts from balance differences
              const sortedTrades = trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              const currentIndex = sortedTrades.findIndex(t => t.id === activity.id);
              const prevBalance = currentIndex > 0 ? sortedTrades[currentIndex - 1].balance : 0;
              
              let displayAmount = 0;
              if (activity.type === 'deposit') {
                displayAmount = Math.max(0, activity.balance - prevBalance);
              } else if (activity.type === 'withdrawal') {
                displayAmount = Math.max(0, prevBalance - activity.balance);
              } else if (activity.type === 'starting') {
                displayAmount = activity.balance; // Starting balance is the full amount
              }

              return (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'trade' ? 
                        (activity.pnl || 0) >= 0 ? 'bg-green-500' : 'bg-red-500' :
                      activity.type === 'deposit' ? 'bg-blue-500' :
                      activity.type === 'withdrawal' ? 'bg-orange-500' :
                      activity.type === 'starting' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`} />
                    <div>
                      <span className="font-medium text-gray-900 capitalize">
                        {activity.type === 'starting' ? 'Starting Balance' : activity.type}
                      </span>
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.type === 'trade' && activity.pnl !== null && (
                      <span className={`font-semibold ${activity.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {activity.pnl >= 0 ? '+' : ''}{formatCurrency(activity.pnl)}
                      </span>
                    )}
                    {(activity.type === 'deposit' || activity.type === 'starting') && (
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(displayAmount)}
                      </span>
                    )}
                    {activity.type === 'withdrawal' && (
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(displayAmount)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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
