import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, DollarSign, Calendar, Download, Upload, Plus, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ForexTracker() {
  // Clean initial state - no pre-populated data
  const [summary, setSummary] = useState({
    latestBalance: 0,
    targetStatus: 'No Goals Set',
    currentTarget: 0,
    startForTarget: 0,
    progressToTarget: 0
  });

  const [settings, setSettings] = useState([]);
  const [tradingData, setTradingData] = useState([]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [newTrade, setNewTrade] = useState({
    date: new Date().toISOString().split('T')[0],
    balance: '',
    pnl: '',
    milestone: '',
    type: 'trade'
  });

  const [newGoal, setNewGoal] = useState({
    level: '',
    startBalance: '',
    targetBalance: ''
  });

  const [editingTrade, setEditingTrade] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [tradeValidationError, setTradeValidationError] = useState('');

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

  // Force check advancement on initial load and whenever needed
  const checkAndAdvanceSteps = () => {
    if (tradingData.length > 0 && settings.length > 0) {
      const latest = tradingData[tradingData.length - 1];
      let needsUpdate = false;
      let newSettings = [...settings];
      
      // Check if we need to advance through multiple steps
      while (true) {
        const currentStep = newSettings.find(s => s.status === 'In Progress');
        if (!currentStep || latest.balance < currentStep.targetBalance) {
          break; // No advancement needed
        }
        
        // Mark current step as completed
        const currentIndex = newSettings.findIndex(s => s.level === currentStep.level);
        newSettings[currentIndex] = { ...newSettings[currentIndex], status: 'Completed' };
        
        // Activate next step if available
        if (currentIndex + 1 < newSettings.length) {
          newSettings[currentIndex + 1] = { ...newSettings[currentIndex + 1], status: 'In Progress' };
          needsUpdate = true;
        } else {
          break; // No more steps
        }
      }
      
      if (needsUpdate) {
        setSettings(newSettings);
      }
    }
  };

  useEffect(() => {
    checkAndAdvanceSteps();
  }, [tradingData.length, settings.length]);

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

  // Calculate derived values and auto-advance steps
  useEffect(() => {
    if (tradingData.length > 0 && settings.length > 0) {
      const latest = tradingData[tradingData.length - 1];
      let currentStep = settings.find(s => s.status === 'In Progress');
      let hasAdvanced = false;
      
      // Check if current target is reached and advance to next step
      if (currentStep && latest.balance >= currentStep.targetBalance) {
        const currentIndex = settings.findIndex(s => s.level === currentStep.level);
        
        const newSettings = settings.map((s, index) => {
          if (s.level === currentStep.level) {
            return { ...s, status: 'Completed' };
          }
          // Activate next step if it exists
          if (index === currentIndex + 1) {
            return { ...s, status: 'In Progress' };
          }
          return s;
        });
        
        setSettings(newSettings);
        
        // Update currentStep to the new active step
        if (currentIndex < settings.length - 1) {
          currentStep = newSettings[currentIndex + 1];
          hasAdvanced = true;
        }
      }
      
      // Update summary with current step info
      if (currentStep) {
        const progress = Math.max(0, (latest.balance - currentStep.startBalance) / (currentStep.targetBalance - currentStep.startBalance));
        setSummary(prev => ({
          ...prev,
          latestBalance: latest.balance,
          progressToTarget: Math.min(progress, 1),
          currentTarget: currentStep.targetBalance,
          startForTarget: currentStep.startBalance,
          targetStatus: currentStep.level
        }));
        
        // If we advanced, also update the amount to target for all entries
        if (hasAdvanced) {
          const updatedTradingData = tradingData.map(trade => ({
            ...trade,
            amountToTarget: Math.max(currentStep.targetBalance - trade.balance, 0)
          }));
          setTradingData(updatedTradingData);
        }
      }
    } else {
      // Reset to initial state when no data or no goals
      if (settings.length > 0) {
        const resetSettings = settings.map((setting, index) => ({
          ...setting,
          status: index === 0 ? 'In Progress' : 'Not Started'
        }));
        setSettings(resetSettings);
        
        const firstGoal = resetSettings[0];
        setSummary({
          latestBalance: tradingData.length > 0 ? tradingData[tradingData.length - 1].balance : 0,
          targetStatus: firstGoal.level,
          currentTarget: firstGoal.targetBalance,
          startForTarget: firstGoal.startBalance,
          progressToTarget: 0
        });
      } else {
        setSummary({
          latestBalance: tradingData.length > 0 ? tradingData[tradingData.length - 1].balance : 0,
          targetStatus: 'No Goals Set',
          currentTarget: 0,
          startForTarget: 0,
          progressToTarget: 0
        });
      }
    }
  }, [tradingData, settings.map(s => s.status).join(',')]);

  // Recalculate amount to target for all entries whenever data or settings change
  useEffect(() => {
    if (tradingData.length > 0 && settings.length > 0) {
      const currentStep = settings.find(s => s.status === 'In Progress');
      if (currentStep) {
        const updatedTradingData = tradingData.map(trade => ({
          ...trade,
          amountToTarget: Math.max(currentStep.targetBalance - trade.balance, 0)
        }));
        
        // Only update if there's actually a change to avoid infinite loops
        const hasChanges = updatedTradingData.some((trade, index) => 
          trade.amountToTarget !== tradingData[index].amountToTarget
        );
        
        if (hasChanges) {
          setTradingData(updatedTradingData);
        }
      }
    }
  }, [settings]);

  const calculateCorrectDailyGain = (currentBalance, previousBalance, type) => {
    if (type === 'deposit' || type === 'withdrawal' || type === 'starting') {
      return 0;
    }
    
    if (previousBalance <= 0) return 0;
    return ((currentBalance - previousBalance) / previousBalance) * 100;
  };

  const validateTradeEntry = () => {
    const selectedDate = newTrade.date;
    const selectedType = newTrade.type;
    
    setTradeValidationError('');
    
    if (!newTrade.balance) {
      setTradeValidationError('Balance is required');
      return false;
    }
    
    const sameeDateEntries = tradingData.filter(trade => trade.date === selectedDate);
    
    if (sameeDateEntries.length > 0) {
      const hasTradeOnDate = sameeDateEntries.some(trade => trade.type === 'trade');
      const hasStartingOnDate = sameeDateEntries.some(trade => trade.type === 'starting');
      
      if (selectedType === 'trade' && hasTradeOnDate) {
        setTradeValidationError('Only one trade entry allowed per day');
        return false;
      }
      
      if (selectedType === 'starting' && hasStartingOnDate) {
        setTradeValidationError('Only one starting balance entry allowed per day');
        return false;
      }
      
      if (selectedType === 'starting' && sameeDateEntries.length > 0) {
        setTradeValidationError('Cannot add starting balance on a day with other entries');
        return false;
      }
      
      if ((selectedType === 'deposit' || selectedType === 'withdrawal' || selectedType === 'trade') && hasStartingOnDate) {
        setTradeValidationError('Cannot add entries on a day with starting balance');
        return false;
      }
    }
    
    return true;
  };

  const addNewTrade = () => {
    if (newTrade.balance && settings.length > 0 && validateTradeEntry()) {
      let prevBalance = 0;
      let pnl = 0;
      let dailyGain = 0;

      if (tradingData.length > 0) {
        prevBalance = tradingData[tradingData.length - 1].balance;
      } else if (newTrade.type === 'starting') {
        prevBalance = 0;
      } else {
        prevBalance = summary.startForTarget;
      }

      const currentBalance = parseFloat(newTrade.balance);

      switch (newTrade.type) {
        case 'trade':
          pnl = parseFloat(newTrade.pnl) || (currentBalance - prevBalance);
          dailyGain = calculateCorrectDailyGain(currentBalance, prevBalance, 'trade');
          break;
        case 'deposit':
          pnl = 0;
          dailyGain = 0;
          break;
        case 'withdrawal':
          pnl = 0;
          dailyGain = 0;
          break;
        case 'starting':
          pnl = 0;
          dailyGain = 0;
          break;
        default:
          pnl = parseFloat(newTrade.pnl) || (currentBalance - prevBalance);
          dailyGain = calculateCorrectDailyGain(currentBalance, prevBalance, 'trade');
      }

      const currentStep = settings.find(s => s.status === 'In Progress');
      const amountToTarget = currentStep ? Math.max(currentStep.targetBalance - currentBalance, 0) : 0;

      const trade = {
        id: Date.now(),
        date: newTrade.date,
        balance: currentBalance,
        pnl: pnl,
        amountToTarget: amountToTarget,
        dailyGain: dailyGain,
        milestone: newTrade.milestone,
        milestoneValue: null,
        type: newTrade.type
      };

      setTradingData([...tradingData, trade]);
      setNewTrade({
        date: new Date().toISOString().split('T')[0],
        balance: '',
        pnl: '',
        milestone: '',
        type: 'trade'
      });
      setTradeValidationError('');
    }
  };

  const startEditingTrade = (trade) => {
    setEditingTrade({
      id: trade.id,
      date: trade.date,
      balance: trade.balance.toString(),
      pnl: trade.pnl ? trade.pnl.toString() : '',
      milestone: trade.milestone || '',
      type: trade.type
    });
  };

  const saveEditedTrade = () => {
    if (editingTrade && editingTrade.balance) {
      const updatedTradingData = tradingData.map(trade => {
        if (trade.id === editingTrade.id) {
          const currentBalance = parseFloat(editingTrade.balance);
          
          const tradeIndex = tradingData.findIndex(t => t.id === trade.id);
          const prevBalance = tradeIndex > 0 ? tradingData[tradeIndex - 1].balance : summary.startForTarget;
          
          let pnl = 0;
          let dailyGain = 0;
          
          switch (editingTrade.type) {
            case 'trade':
              pnl = parseFloat(editingTrade.pnl) || (currentBalance - prevBalance);
              dailyGain = calculateCorrectDailyGain(currentBalance, prevBalance, 'trade');
              break;
            case 'deposit':
            case 'withdrawal':
            case 'starting':
              pnl = 0;
              dailyGain = 0;
              break;
          }
          
          const currentStep = settings.find(s => s.status === 'In Progress');
          const amountToTarget = currentStep ? Math.max(currentStep.targetBalance - currentBalance, 0) : 0;
          
          return {
            ...trade,
            date: editingTrade.date,
            balance: currentBalance,
            pnl: pnl,
            amountToTarget: amountToTarget,
            dailyGain: dailyGain,
            milestone: editingTrade.milestone,
            type: editingTrade.type
          };
        }
        return trade;
      });
      
      setTradingData(updatedTradingData);
      setEditingTrade(null);
    }
  };

  const cancelEditing = () => {
    setEditingTrade(null);
  };

  const deleteTrade = (id) => {
    setTradingData(tradingData.filter(trade => trade.id !== id));
  };

  const validateNewGoal = () => {
    const startBalance = parseFloat(newGoal.startBalance);
    const targetBalance = parseFloat(newGoal.targetBalance);
    
    setValidationError('');
    
    if (!newGoal.level || !newGoal.startBalance || !newGoal.targetBalance) {
      setValidationError('All fields are required');
      return false;
    }
    
    if (isNaN(startBalance) || isNaN(targetBalance)) {
      setValidationError('Start and target balances must be valid numbers');
      return false;
    }
    
    if (targetBalance <= startBalance) {
      setValidationError('Target balance must be greater than start balance');
      return false;
    }
    
    if (settings.some(s => s.level.toLowerCase() === newGoal.level.toLowerCase())) {
      setValidationError('Goal name already exists');
      return false;
    }
    
    if (settings.length > 0) {
      const sortedSettings = [...settings].sort((a, b) => {
        const aNum = parseInt(a.level.replace(/\D/g, '')) || 0;
        const bNum = parseInt(b.level.replace(/\D/g, '')) || 0;
        if (aNum && bNum) return aNum - bNum;
        return a.level.localeCompare(b.level);
      });
      
      const lastGoal = sortedSettings[sortedSettings.length - 1];
      
      if (startBalance !== lastGoal.targetBalance) {
        setValidationError(
          `Start balance should be ${formatCurrency(lastGoal.targetBalance)} (matching ${lastGoal.level}'s target balance)`
        );
        return false;
      }
    }
    
    return true;
  };

  const addNewGoal = () => {
    if (validateNewGoal()) {
      const goal = {
        level: newGoal.level,
        startBalance: parseFloat(newGoal.startBalance),
        targetBalance: parseFloat(newGoal.targetBalance),
        status: settings.length === 0 ? 'In Progress' : 'Not Started',
        progress: ''
      };

      setSettings([...settings, goal]);
      setNewGoal({
        level: '',
        startBalance: '',
        targetBalance: ''
      });
      setValidationError('');
    }
  };

  const getNextStartBalance = () => {
    if (settings.length > 0) {
      const sortedSettings = [...settings].sort((a, b) => {
        const aNum = parseInt(a.level.replace(/\D/g, '')) || 0;
        const bNum = parseInt(b.level.replace(/\D/g, '')) || 0;
        if (aNum && bNum) return aNum - bNum;
        return a.level.localeCompare(b.level);
      });
      return sortedSettings[sortedSettings.length - 1].targetBalance.toString();
    }
    return '';
  };

  const getNextGoalName = () => {
    if (settings.length === 0) return 'Step1';
    
    const stepNumbers = settings
      .map(s => parseInt(s.level.replace(/\D/g, '')))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);
    
    if (stepNumbers.length > 0) {
      return `Step${stepNumbers[stepNumbers.length - 1] + 1}`;
    }
    
    return `Step${settings.length + 1}`;
  };

  const handleStartBalanceFocus = () => {
    if (!newGoal.startBalance && settings.length > 0) {
      setNewGoal({...newGoal, startBalance: getNextStartBalance()});
    }
  };

  const handleGoalNameFocus = () => {
    if (!newGoal.level) {
      setNewGoal({...newGoal, level: getNextGoalName()});
    }
  };

  const removeGoal = (index) => {
    const newSettings = settings.filter((_, i) => i !== index);
    setSettings(newSettings);
    setValidationError('');
  };

  const exportData = () => {
    const wb = XLSX.utils.book_new();
    
    const tradingWS = XLSX.utils.aoa_to_sheet([
      [''],
      ['', 'Latest Balance', summary.latestBalance],
      ['', 'Target Status', summary.targetStatus],
      ['', 'Current Target', summary.currentTarget],
      ['', 'Start for this Target', summary.startForTarget],
      ['', 'Progress to Target', summary.progressToTarget],
      ['', 'Progress Bar', ''],
      [''],
      ['Date', 'Balance', 'PNL', 'Amount to Target', 'Daily Gain %', 'Type', 'Milestone', 'Milestone Value'],
      ...tradingData.map(trade => [
        trade.date, trade.balance, trade.pnl, trade.amountToTarget, 
        trade.dailyGain, trade.type, trade.milestone, trade.milestoneValue
      ])
    ]);

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
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const filename = `Forex_Account_Tracker_${dateStr}.xlsx`;
    
    XLSX.writeFile(wb, filename);
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      
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
            milestoneValue: row['Milestone Value'] || null,
            type: row.Type || 'trade'
          }));
        setTradingData(processedData);
      }

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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <PlusCircle size={16} className="text-green-600" />;
      case 'withdrawal':
        return <MinusCircle size={16} className="text-red-600" />;
      case 'starting':
        return <Target size={16} className="text-blue-600" />;
      default:
        return <TrendingUp size={16} className="text-purple-600" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'starting':
        return 'Starting Balance';
      default:
        return 'Trade';
    }
  };

  const balanceChartData = tradingData.map(trade => ({
    date: formatDate(trade.date),
    balance: trade.balance,
    target: summary.currentTarget
  }));

  const pnlChartData = tradingData
    .filter(trade => trade.pnl !== null && trade.type === 'trade')
    .map(trade => ({
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
              <button
                onClick={checkAndAdvanceSteps}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Target size={16} />
                Check Progress
              </button>
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
            {tradingData.length > 0 && (
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
                  <h3 className="text-lg font-semibold mb-4">Trading Profit & Loss</h3>
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
            )}

            {/* No Data Message */}
            {tradingData.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <TrendingUp size={48} className="mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Trading Data Yet</h3>
                <p className="text-gray-500 mb-4">
                  {settings.length === 0 
                    ? "First set up your goals in the Goals & Targets tab, then add your trading data here."
                    : "Start by adding your first trade or initial balance in the Trading tab."
                  }
                </p>
                <button
                  onClick={() => setActiveTab(settings.length === 0 ? 'goals' : 'trading')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {settings.length === 0 ? "Set Up Goals First" : "Go to Trading Tab"}
                </button>
              </div>
            )}

            {/* Data Persistence Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-800">💾 Data Storage Information</h3>
              <p className="text-blue-700 mb-2">Your data is automatically saved in your browser's local storage and persists between sessions.</p>
              <div className="text-sm text-blue-600">
                <p>• <strong>Automatic Save:</strong> All changes are saved instantly to your browser</p>
                <p>• <strong>Export/Import:</strong> Use Excel files to backup or transfer your data</p>
                <p>• <strong>Browser Storage:</strong> Data stays on your device - no cloud storage needed</p>
                <p>• <strong>Privacy:</strong> Your trading data never leaves your computer</p>
                <p>• <strong>Auto-Advancement:</strong> Steps automatically advance when targets are reached</p>
              </div>
            </div>
          </div>
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <div className="space-y-6">
            {/* Add New Entry */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Entry</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <select
                  value={newTrade.type}
                  onChange={(e) => setNewTrade({...newTrade, type: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="trade">Trade</option>
                  <option value="starting">Starting Balance</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                </select>
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
                {newTrade.type === 'trade' && (
                  <input
                    type="number"
                    placeholder="P&L (optional)"
                    value={newTrade.pnl}
                    onChange={(e) => setNewTrade({...newTrade, pnl: e.target.value})}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
                {newTrade.type !== 'trade' && (
                  <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">
                    N/A
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Milestone (optional)"
                  value={newTrade.milestone}
                  onChange={(e) => setNewTrade({...newTrade, milestone: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addNewTrade}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  Add Entry
                </button>
              </div>
              
              {/* Trade Validation Error */}
              {tradeValidationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                  <p className="text-red-600 text-sm font-medium">{tradeValidationError}</p>
                </div>
              )}
              
              {/* Helper Text for Date Rules */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                <p className="text-amber-700 text-sm">
                  <strong>📅 Date Rules:</strong>
                </p>
                <div className="text-xs text-amber-600 mt-1">
                  <p>• Only 1 trade per day allowed</p>
                  <p>• Starting balance cannot be mixed with other entries on same day</p>
                  <p>• Multiple deposits/withdrawals per day are allowed</p>
                  <p>• One trade + deposits/withdrawals on same day is allowed</p>
                </div>
              </div>
            </div>

            {/* Trading History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Trading History</h3>
              {tradingData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>
                    {settings.length === 0 
                      ? "Set up your goals first, then add your trading entries here."
                      : "No entries yet. Add your first entry above to get started."
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Balance</th>
                        <th className="text-left py-3 px-4">P&L</th>
                        <th className="text-left py-3 px-4">Amount to Target</th>
                        <th className="text-left py-3 px-4">Daily Gain %</th>
                        <th className="text-left py-3 px-4">Milestone</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradingData.map((trade) => (
                        <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(trade.type)}
                              <span className="text-sm">{getTypeLabel(trade.type)}</span>
                            </div>
                          </td>
                          
                          {/* Editable Date */}
                          <td className="py-3 px-4">
                            {editingTrade && editingTrade.id === trade.id ? (
                              <input
                                type="date"
                                value={editingTrade.date}
                                onChange={(e) => setEditingTrade({...editingTrade, date: e.target.value})}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                              />
                            ) : (
                              formatDate(trade.date)
                            )}
                          </td>
                          
                          {/* Editable Balance */}
                          <td className="py-3 px-4 font-semibold">
                            {editingTrade && editingTrade.id === trade.id ? (
                              <input
                                type="number"
                                value={editingTrade.balance}
                                onChange={(e) => setEditingTrade({...editingTrade, balance: e.target.value})}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
                              />
                            ) : (
                              formatCurrency(trade.balance)
                            )}
                          </td>
                          
                          {/* Editable P&L */}
                          <td className={`py-3 px-4 font-semibold ${
                            trade.type === 'trade' 
                              ? trade.pnl > 0 ? 'text-green-600' : trade.pnl < 0 ? 'text-red-600' : ''
                              : 'text-gray-400'
                          }`}>
                            {trade.type === 'trade' ? (
                              editingTrade && editingTrade.id === trade.id ? (
                                <input
                                  type="number"
                                  value={editingTrade.pnl}
                                  onChange={(e) => setEditingTrade({...editingTrade, pnl: e.target.value})}
                                  className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
                                  placeholder="Auto-calc"
                                />
                              ) : (
                                trade.pnl !== null ? formatCurrency(trade.pnl) : '-'
                              )
                            ) : (
                              '-'
                            )}
                          </td>
                          
                          <td className="py-3 px-4">{formatCurrency(trade.amountToTarget)}</td>
                          
                          <td className={`py-3 px-4 font-semibold ${
                            trade.type === 'trade' 
                              ? trade.dailyGain > 0 ? 'text-green-600' : trade.dailyGain < 0 ? 'text-red-600' : ''
                              : 'text-gray-400'
                          }`}>
                            {trade.type === 'trade' && trade.dailyGain !== null ? `${trade.dailyGain.toFixed(2)}%` : '-'}
                          </td>
                          
                          {/* Editable Milestone */}
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {editingTrade && editingTrade.id === trade.id ? (
                              <input
                                type="text"
                                value={editingTrade.milestone}
                                onChange={(e) => setEditingTrade({...editingTrade, milestone: e.target.value})}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
                                placeholder="Milestone"
                              />
                            ) : (
                              trade.milestone || '-'
                            )}
                          </td>
                          
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {editingTrade && editingTrade.id === trade.id ? (
                                <>
                                  <button
                                    onClick={saveEditedTrade}
                                    className="text-green-600 hover:text-green-800 transition-colors"
                                    title="Save changes"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="text-gray-600 hover:text-gray-800 transition-colors"
                                    title="Cancel editing"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditingTrade(trade)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                    title="Edit entry"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => deleteTrade(trade.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                    title="Delete entry"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Goals/Targets Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            {/* Add New Goal */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Goal</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Goal Name (e.g., Step1)"
                    value={newGoal.level}
                    onChange={(e) => setNewGoal({...newGoal, level: e.target.value})}
                    onFocus={handleGoalNameFocus}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Start Balance"
                    value={newGoal.startBalance}
                    onChange={(e) => setNewGoal({...newGoal, startBalance: e.target.value})}
                    onFocus={handleStartBalanceFocus}
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
                
                {/* Validation Error */}
                {validationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm font-medium">{validationError}</p>
                  </div>
                )}
                
                {/* Helper Text */}
                {settings.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-700 text-sm">
                      <strong>💡 Tip:</strong> Next goal should start where the previous goal ends. 
                      {settings.length > 0 && ` Expected start balance: ${formatCurrency(parseFloat(getNextStartBalance()) || 0)}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Goals Configuration */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Trading Goals & Targets</h3>
              {settings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">No Goals Set Yet</p>
                  <p>Add your first trading goal above to get started with target tracking.</p>
                </div>
              ) : (
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
              )}
            </div>

            {/* Goal Advancement Info */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
              <h3 className="text-lg font-semibold mb-2 text-green-800">🎯 Automatic Goal Advancement</h3>
              <p className="text-green-700 mb-2">Goals automatically advance when targets are reached.</p>
              <div className="text-sm text-green-600">
                <p>• <strong>Auto-Complete:</strong> Current step marks as "Completed" when target is reached</p>
                <p>• <strong>Auto-Advance:</strong> Next step automatically becomes "In Progress"</p>
                <p>• <strong>Dashboard Update:</strong> Progress bars and targets update automatically</p>
                <p>• <strong>Status Sync:</strong> All tabs stay synchronized with current progress</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}