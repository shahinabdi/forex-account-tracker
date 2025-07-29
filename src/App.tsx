import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, DollarSign, Calendar, Download, Upload, Plus, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ForexTracker() {
  // Initial data from your Excel file
  const [summary, setSummary] = useState({
    latestBalance: 134,
    targetStatus: 'Step1',
    currentTarget: 150,
    startForTarget: 15,
    progressToTarget: 0.8814814815
  });

  const [settings, setSettings] = useState([
    { level: 'Step1', startBalance: 15, targetBalance: 150, status: 'In Progress', progress: '' },
    { level: 'Step2', startBalance: 150, targetBalance: 1500, status: 'Not Started', progress: '' },
    { level: 'Step3', startBalance: 1500, targetBalance: 3000, status: 'Not Started', progress: '' },
    { level: 'Step4', startBalance: 3000, targetBalance: 9000, status: 'Not Started', progress: '' },
    { level: 'Step5', startBalance: 9000, targetBalance: 15000, status: 'Not Started', progress: '' },
    { level: 'Step6', startBalance: 15000, targetBalance: 30000, status: 'Not Started', progress: '' },
    { level: 'Step7', startBalance: 30000, targetBalance: 50000, status: 'Not Started', progress: '' },
    { level: 'Step8', startBalance: 50000, targetBalance: 150000, status: 'Not Started', progress: '' },
    { level: 'Step9', startBalance: 150000, targetBalance: 255000, status: 'Not Started', progress: '' }
  ]);

  const [tradingData, setTradingData] = useState([
    { id: 1, date: '', balance: 15.03, pnl: null, amountToTarget: 134.97, dailyGain: null, milestone: '', milestoneValue: null },
    { id: 2, date: '2025-07-24', balance: 63.68, pnl: 48.65, amountToTarget: 86.32, dailyGain: 3.24, milestone: '', milestoneValue: null },
    { id: 3, date: '2025-07-27', balance: 89.98, pnl: 26.3, amountToTarget: 60.02, dailyGain: 0.41, milestone: '', milestoneValue: null },
    { id: 4, date: '2025-07-28', balance: 134, pnl: 44.02, amountToTarget: 16, dailyGain: 0.49, milestone: '', milestoneValue: null }
  ]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [newTrade, setNewTrade] = useState({
    date: new Date().toISOString().split('T')[0],
    balance: '',
    pnl: '',
    milestone: ''
  });

  const [newGoal, setNewGoal] = useState({
    level: '',
    startBalance: '',
    targetBalance: ''
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('forexTracker_settings');
    const savedTradingData = localStorage.getItem('forexTracker_tradingData');
    const savedSummary = localStorage.getItem('forexTracker_summary');

    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    if (savedTradingData) {
      setTradingData(JSON.parse(savedTradingData));
    }
    if (savedSummary) {
      setSummary(JSON.parse(savedSummary));
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('forexTracker_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('forexTracker_tradingData', JSON.stringify(tradingData));
  }, [tradingData]);

  useEffect(() => {
    localStorage.setItem('forexTracker_summary', JSON.stringify(summary));
  }, [summary]);

  // Calculate derived values
  useEffect(() => {
    if (tradingData.length > 0) {
      const latest = tradingData[tradingData.length - 1];
      const currentStep = settings.find(s => s.status === 'In Progress');
      if (currentStep && latest.balance) {
        const progress = (latest.balance - currentStep.startBalance) / (currentStep.targetBalance - currentStep.startBalance);
        setSummary(prev => ({
          ...prev,
          latestBalance: latest.balance,
          progressToTarget: Math.min(progress, 1),
          currentTarget: currentStep.targetBalance,
          startForTarget: currentStep.startBalance
        }));
      }
    }
  }, [tradingData, settings]);

  const addNewTrade = () => {
    if (newTrade.balance) {
      const prevBalance = tradingData.length > 0 ? tradingData[tradingData.length - 1].balance : summary.startForTarget;
      const pnl = parseFloat(newTrade.pnl) || (parseFloat(newTrade.balance) - prevBalance);
      const dailyGain = prevBalance > 0 ? ((parseFloat(newTrade.balance) - prevBalance) / prevBalance) * 100 : 0;
      const currentStep = settings.find(s => s.status === 'In Progress');
      const amountToTarget = currentStep ? currentStep.targetBalance - parseFloat(newTrade.balance) : 0;

      const trade = {
        id: Date.now(),
        date: newTrade.date,
        balance: parseFloat(newTrade.balance),
        pnl: pnl,
        amountToTarget: Math.max(amountToTarget, 0),
        dailyGain: dailyGain,
        milestone: newTrade.milestone,
        milestoneValue: null
      };

      setTradingData([...tradingData, trade]);
      setNewTrade({
        date: new Date().toISOString().split('T')[0],
        balance: '',
        pnl: '',
        milestone: ''
      });
    }
  };

  const deleteTrade = (id) => {
    setTradingData(tradingData.filter(trade => trade.id !== id));
  };

  const addNewGoal = () => {
    if (newGoal.level && newGoal.startBalance && newGoal.targetBalance) {
      const goal = {
        level: newGoal.level,
        startBalance: parseFloat(newGoal.startBalance),
        targetBalance: parseFloat(newGoal.targetBalance),
        status: 'Not Started',
        progress: ''
      };

      setSettings([...settings, goal]);
      setNewGoal({
        level: '',
        startBalance: '',
        targetBalance: ''
      });
    }
  };

  const removeGoal = (index) => {
    const newSettings = settings.filter((_, i) => i !== index);
    setSettings(newSettings);
  };

  const exportData = () => {
    const wb = XLSX.utils.book_new();
    
    // Create Trading Log sheet
    const tradingWS = XLSX.utils.aoa_to_sheet([
      [''],
      ['', 'Latest Balance', summary.latestBalance],
      ['', 'Target Status', summary.targetStatus],
      ['', 'Current Target', summary.currentTarget],
      ['', 'Start for this Target', summary.startForTarget],
      ['', 'Progress to Target', summary.progressToTarget],
      ['', 'Progress Bar', ''],
      [''],
      ['Date', 'Balance', 'PNL', 'Amount to Target', 'Daily Gain %', 'Milestone', 'Milestone Value'],
      ...tradingData.map(trade => [
        trade.date, trade.balance, trade.pnl, trade.amountToTarget, 
        trade.dailyGain, trade.milestone, trade.milestoneValue
      ])
    ]);

    // Create Settings sheet
    const settingsWS = XLSX.utils.json_to_sheet(settings.map(s => ({
      Level: s.level,
      StartBalance: s.startBalance,
      TargetBalance: s.targetBalance,
      Status: s.status,
      Progress: s.progress,
      Multiplier: (s.targetBalance / s.startBalance).toFixed(1) + 'x',
      ProfitTarget: s.targetBalance - s.startBalance
    })));

    XLSX.utils.book_append_sheet(wb, tradingWS, 'Trading Log');
    XLSX.utils.book_append_sheet(wb, settingsWS, 'Settings');
    
    XLSX.writeFile(wb, 'Forex_Account_Tracker.xlsx');
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      
      // Import trading data
      const tradingSheet = wb.Sheets['Trading Log'];
      if (tradingSheet) {
        const importedData = XLSX.utils.sheet_to_json(tradingSheet, { range: 8 });
        const processedData = importedData
          .filter(row => row.Balance)
          .map((row, index) => ({
            id: Date.now() + index,
            date: row.Date ? new Date(row.Date).toISOString().split('T')[0] : '',
            balance: row.Balance || 0,
            pnl: row.PNL || 0,
            amountToTarget: row['Amount to Target'] || 0,
            dailyGain: row['Daily Gain %'] || 0,
            milestone: row.Milestone || '',
            milestoneValue: row['Milestone Value'] || null
          }));
        setTradingData(processedData);
      }

      // Import settings
      const settingsSheet = wb.Sheets['Settings'];
      if (settingsSheet) {
        const importedSettings = XLSX.utils.sheet_to_json(settingsSheet);
        setSettings(importedSettings.map(s => ({
          level: s.Level,
          startBalance: s.StartBalance,
          targetBalance: s.TargetBalance,
          status: s.Status,
          progress: s.Progress
        })));
      }
    }
    event.target.value = '';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  // Chart data preparation
  const balanceChartData = tradingData.map(trade => ({
    date: formatDate(trade.date),
    balance: trade.balance,
    target: summary.currentTarget
  }));

  const pnlChartData = tradingData.filter(trade => trade.pnl !== null).map(trade => ({
    date: formatDate(trade.date),
    pnl: trade.pnl,
    dailyGain: trade.dailyGain
  }));

  const progressData = [
    { name: 'Completed', value: summary.progressToTarget * 100, color: '#10b981' },
    { name: 'Remaining', value: (1 - summary.progressToTarget) * 100, color: '#e5e7eb' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Forex Account Tracker</h1>
              <p className="text-gray-600 mt-1">Track your trading progress and milestones</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportData}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={16} />
                Export
              </button>
              <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                <Upload size={16} />
                Import
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex">
            {['dashboard', 'trading', 'goals'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium capitalize rounded-t-xl transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {tab === 'goals' ? 'Goals & Targets' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.latestBalance)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Target className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Target</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.currentTarget)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <TrendingUp className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <p className="text-2xl font-bold text-gray-800">{(summary.progressToTarget * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Calendar className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Step</p>
                    <p className="text-2xl font-bold text-gray-800">{summary.targetStatus}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Progress to Target</h3>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${summary.progressToTarget * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatCurrency(summary.startForTarget)}</span>
                <span>{formatCurrency(summary.latestBalance)} / {formatCurrency(summary.currentTarget)}</span>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Balance Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Balance Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={balanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} />
                    <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* P&L Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Profit & Loss</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pnlChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="pnl" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data Persistence Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-800">💾 Data Storage Information</h3>
              <p className="text-blue-700 mb-2">Your data is automatically saved in your browser's local storage and persists between sessions.</p>
              <div className="text-sm text-blue-600">
                <p>• <strong>Automatic Save:</strong> All changes are saved instantly to your browser</p>
                <p>• <strong>Export/Import:</strong> Use Excel files to backup or transfer your data</p>
                <p>• <strong>Browser Storage:</strong> Data stays on your device - no cloud storage needed</p>
                <p>• <strong>Privacy:</strong> Your trading data never leaves your computer</p>
              </div>
            </div>
          </div>
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <div className="space-y-6">
            {/* Add New Trade */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Trade</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="date"
                  value={newTrade.date}
                  onChange={(e) => setNewTrade({...newTrade, date: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Balance"
                  value={newTrade.balance}
                  onChange={(e) => setNewTrade({...newTrade, balance: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="P&L (optional)"
                  value={newTrade.pnl}
                  onChange={(e) => setNewTrade({...newTrade, pnl: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addNewTrade}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  Add Trade
                </button>
              </div>
            </div>

            {/* Trading History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Trading History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Balance</th>
                      <th className="text-left py-3 px-4">P&L</th>
                      <th className="text-left py-3 px-4">Amount to Target</th>
                      <th className="text-left py-3 px-4">Daily Gain %</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradingData.map((trade) => (
                      <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{formatDate(trade.date)}</td>
                        <td className="py-3 px-4 font-semibold">{formatCurrency(trade.balance)}</td>
                        <td className={`py-3 px-4 font-semibold ${trade.pnl > 0 ? 'text-green-600' : trade.pnl < 0 ? 'text-red-600' : ''}`}>
                          {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                        </td>
                        <td className="py-3 px-4">{formatCurrency(trade.amountToTarget)}</td>
                        <td className={`py-3 px-4 font-semibold ${trade.dailyGain > 0 ? 'text-green-600' : trade.dailyGain < 0 ? 'text-red-600' : ''}`}>
                          {trade.dailyGain ? `${trade.dailyGain.toFixed(2)}%` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => deleteTrade(trade.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Goals/Targets Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            {/* Add New Goal */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Goal</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Goal Name (e.g., Step10)"
                  value={newGoal.level}
                  onChange={(e) => setNewGoal({...newGoal, level: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Start Balance"
                  value={newGoal.startBalance}
                  onChange={(e) => setNewGoal({...newGoal, startBalance: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Target Balance"
                  value={newGoal.targetBalance}
                  onChange={(e) => setNewGoal({...newGoal, targetBalance: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addNewGoal}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  Add Goal
                </button>
              </div>
            </div>

            {/* Goals Configuration */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Trading Goals & Targets</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Goal</th>
                      <th className="text-left py-3 px-4">Start Balance</th>
                      <th className="text-left py-3 px-4">Target Balance</th>
                      <th className="text-left py-3 px-4">Multiplier</th>
                      <th className="text-left py-3 px-4">Profit Target</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.map((setting, index) => (
                      <tr key={setting.level} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold">{setting.level}</td>
                        <td className="py-3 px-4">{formatCurrency(setting.startBalance)}</td>
                        <td className="py-3 px-4">{formatCurrency(setting.targetBalance)}</td>
                        <td className="py-3 px-4 font-semibold text-blue-600">
                          {(setting.targetBalance / setting.startBalance).toFixed(1)}x
                        </td>
                        <td className="py-3 px-4 font-semibold text-green-600">
                          {formatCurrency(setting.targetBalance - setting.startBalance)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            setting.status === 'In Progress' 
                              ? 'bg-blue-100 text-blue-800' 
                              : setting.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {setting.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => removeGoal(index)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}