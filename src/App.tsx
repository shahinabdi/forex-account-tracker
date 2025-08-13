import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Target, DollarSign, Calendar, Download, Upload, Plus, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ForexTracker() {
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
    type: 'trade',
    inputMode: 'balance',
    depositAmount: '' // For tracking deposit/withdrawal amounts
  });

  const [newGoal, setNewGoal] = useState({
    level: '',
    startBalance: '',
    targetBalance: ''
  });

  const [editingTrade, setEditingTrade] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [tradeValidationError, setTradeValidationError] = useState('');

  useEffect(() => {
    const savedSettings = localStorage.getItem('forexTracker_settings');
    const savedTradingData = localStorage.getItem('forexTracker_tradingData');
    const savedSummary = localStorage.getItem('forexTracker_summary');

    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedTradingData) setTradingData(JSON.parse(savedTradingData));
    if (savedSummary) setSummary(JSON.parse(savedSummary));
  }, []);

  useEffect(() => {
    localStorage.setItem('forexTracker_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('forexTracker_tradingData', JSON.stringify(tradingData));
  }, [tradingData]);

  useEffect(() => {
    localStorage.setItem('forexTracker_summary', JSON.stringify(summary));
  }, [summary]);

  const checkAndAdvanceSteps = () => {
    if (tradingData.length > 0 && settings.length > 0) {
      const latest = tradingData[tradingData.length - 1];
      let needsUpdate = false;
      let newSettings = [...settings];

      while (true) {
        const currentStep = newSettings.find(s => s.status === 'In Progress');
        if (!currentStep || latest.balance < currentStep.targetBalance) {
          break;
        }

        const currentIndex = newSettings.findIndex(s => s.level === currentStep.level);
        newSettings[currentIndex] = { ...newSettings[currentIndex], status: 'Completed' };

        if (currentIndex + 1 < newSettings.length) {
          newSettings[currentIndex + 1] = { ...newSettings[currentIndex + 1], status: 'In Progress' };
          needsUpdate = true;
        } else {
          break;
        }
      }

      if (needsUpdate) setSettings(newSettings);
    }
  };

  useEffect(() => {
    checkAndAdvanceSteps();
  }, [tradingData.length, settings.length]);

  useEffect(() => {
    if (tradingData.length > 0 && settings.length > 0) {
      const latest = tradingData[tradingData.length - 1];
      let currentStep = settings.find(s => s.status === 'In Progress');
      let hasChanged = false;

      if (currentStep && latest.balance >= currentStep.targetBalance) {
        const currentIndex = settings.findIndex(s => s.level === currentStep.level);

        const newSettings = settings.map((s, index) => {
          if (s.level === currentStep.level) {
            return { ...s, status: 'Completed' };
          }
          if (index === currentIndex + 1) {
            return { ...s, status: 'In Progress' };
          }
          return s;
        });

        setSettings(newSettings);

        if (currentIndex < settings.length - 1) {
          currentStep = newSettings[currentIndex + 1];
          hasChanged = true;
        }
      }

      if (currentStep && latest.balance < currentStep.startBalance) {
        const currentIndex = settings.findIndex(s => s.level === currentStep.level);

        if (currentIndex > 0) {
          const newSettings = settings.map((s, index) => {
            if (s.level === currentStep.level) {
              return { ...s, status: 'Not Started' };
            }
            if (index === currentIndex - 1) {
              return { ...s, status: 'In Progress' };
            }
            if (index > currentIndex - 1) {
              return { ...s, status: 'Not Started' };
            }
            return s;
          });

          setSettings(newSettings);
          currentStep = newSettings[currentIndex - 1];
          hasChanged = true;
        }
      }

      if (currentStep) {
        const progress = Math.max(0, (latest.balance - currentStep.startBalance) / (currentStep.targetBalance - currentStep.startBalance));
        setSummary({
          latestBalance: latest.balance,
          progressToTarget: Math.min(progress, 1),
          currentTarget: currentStep.targetBalance,
          startForTarget: currentStep.startBalance,
          targetStatus: currentStep.level
        });

        if (hasChanged) {
          const updatedTradingData = tradingData.map(trade => ({
            ...trade,
            amountToTarget: Math.max(currentStep.targetBalance - trade.balance, 0)
          }));
          setTradingData(updatedTradingData);
        }
      }
    } else {
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

  // Force recalculate all data when something changes
  useEffect(() => {
    if (tradingData.length > 0 && settings.length > 0) {
      const currentStep = settings.find(s => s.status === 'In Progress');
      if (currentStep) {
        const updatedTradingData = tradingData.map(trade => ({
          ...trade,
          amountToTarget: Math.max(currentStep.targetBalance - trade.balance, 0)
        }));

        const hasChanges = updatedTradingData.some((trade, index) =>
          trade.amountToTarget !== tradingData[index].amountToTarget
        );

        if (hasChanges) {
          setTradingData(updatedTradingData);
        }

        // Force summary update with latest data
        const latest = tradingData[tradingData.length - 1];
        if (latest) {
          const progress = Math.max(0, (latest.balance - currentStep.startBalance) / (currentStep.targetBalance - currentStep.startBalance));
          setSummary({
            latestBalance: latest.balance,
            progressToTarget: Math.min(progress, 1),
            currentTarget: currentStep.targetBalance,
            startForTarget: currentStep.startBalance,
            targetStatus: currentStep.level
          });
        }
      }
    }
  }, [settings, tradingData.length]);

  const calculateCorrectDailyGain = (currentBalance, previousBalance, type) => {
    if (type === 'deposit' || type === 'withdrawal' || type === 'starting') {
      return 0;
    }
    if (previousBalance <= 0) return 0;
    return ((currentBalance - previousBalance) / previousBalance) * 100;
  };

  const handleTradeValueChange = (value, field) => {
    if (newTrade.type === 'deposit' || newTrade.type === 'withdrawal') {
      // For deposits/withdrawals, the value represents the amount to add/subtract
      const amount = parseFloat(value) || 0;
      let currentBalance = 0;

      if (tradingData.length > 0) {
        currentBalance = tradingData[tradingData.length - 1].balance;
      } else {
        const currentStep = settings.find(s => s.status === 'In Progress');
        currentBalance = currentStep ? currentStep.startBalance : 0;
      }

      let newBalance;
      if (newTrade.type === 'deposit') {
        newBalance = currentBalance + amount;
      } else { // withdrawal
        newBalance = currentBalance - amount;
      }

      setNewTrade({
        ...newTrade,
        balance: newBalance.toString(),
        pnl: '', // Deposits/withdrawals don't have P&L
        depositAmount: value // Store the deposit/withdrawal amount
      });
      return;
    }

    if (newTrade.type === 'starting') {
      // Starting balance is set directly
      setNewTrade({ ...newTrade, balance: value, pnl: '' });
      return;
    }

    if (newTrade.type === 'trade') {
      const numValue = parseFloat(value) || 0;
      let prevBalance = 0;

      if (tradingData.length > 0) {
        prevBalance = tradingData[tradingData.length - 1].balance;
      } else {
        const currentStep = settings.find(s => s.status === 'In Progress');
        prevBalance = currentStep ? currentStep.startBalance : summary.startForTarget;
      }

      if (field === 'balance') {
        const calculatedPnL = numValue - prevBalance;
        setNewTrade({
          ...newTrade,
          balance: value,
          pnl: calculatedPnL.toString(),
          inputMode: 'balance'
        });
      } else if (field === 'pnl') {
        const calculatedBalance = prevBalance + numValue;
        setNewTrade({
          ...newTrade,
          balance: calculatedBalance.toString(),
          pnl: value,
          inputMode: 'pnl'
        });
      }
    }
  };

  const validateTradeEntry = () => {
    const selectedDate = newTrade.date;
    const selectedType = newTrade.type;

    setTradeValidationError('');

    if (selectedType === 'trade' && !newTrade.balance && !newTrade.pnl) {
      setTradeValidationError('Either balance or P&L is required for trades');
      return false;
    }

    if (selectedType !== 'trade' && !newTrade.balance) {
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

      if (selectedType === 'starting' && (hasTradeOnDate || sameeDateEntries.some(trade => ['deposit', 'withdrawal'].includes(trade.type)))) {
        setTradeValidationError('Cannot add starting balance on a day with existing trades, deposits, or withdrawals');
        return false;
      }
    }

    return true;
  };

  const addNewTrade = () => {
    if (settings.length > 0 && validateTradeEntry()) {
      let prevBalance = 0;

      if (tradingData.length > 0) {
        prevBalance = tradingData[tradingData.length - 1].balance;
      } else if (newTrade.type === 'starting') {
        prevBalance = 0;
      } else {
        prevBalance = summary.startForTarget;
      }

      const currentBalance = parseFloat(newTrade.balance);
      let pnl = 0;
      let dailyGain = 0;

      switch (newTrade.type) {
        case 'trade':
          pnl = parseFloat(newTrade.pnl) || (currentBalance - prevBalance);
          dailyGain = calculateCorrectDailyGain(currentBalance, prevBalance, 'trade');
          break;
        default:
          pnl = 0;
          dailyGain = 0;
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
        type: 'trade',
        inputMode: 'balance',
        depositAmount: ''
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

  const handleBalanceChange = (newBalance) => {
    if (editingTrade && editingTrade.type === 'trade') {
      const currentBalance = parseFloat(newBalance) || 0;
      const tradeIndex = tradingData.findIndex(t => t.id === editingTrade.id);
      const prevBalance = tradeIndex > 0 ? tradingData[tradeIndex - 1].balance : summary.startForTarget;
      const autoPnL = currentBalance - prevBalance;

      setEditingTrade({
        ...editingTrade,
        balance: newBalance,
        pnl: autoPnL.toString()
      });
    } else {
      setEditingTrade({
        ...editingTrade,
        balance: newBalance
      });
    }
  };

  const handlePnLChange = (newPnL) => {
    if (editingTrade && editingTrade.type === 'trade') {
      const pnlValue = parseFloat(newPnL) || 0;
      const tradeIndex = tradingData.findIndex(t => t.id === editingTrade.id);
      const prevBalance = tradeIndex > 0 ? tradingData[tradeIndex - 1].balance : summary.startForTarget;
      const autoBalance = prevBalance + pnlValue;

      setEditingTrade({
        ...editingTrade,
        pnl: newPnL,
        balance: autoBalance.toString()
      });
    } else {
      setEditingTrade({
        ...editingTrade,
        pnl: newPnL
      });
    }
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
            default:
              pnl = 0;
              dailyGain = 0;
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
      const expectedBalance = formatCurrency(lastGoal.targetBalance);
      const goalName = lastGoal.level;

      if (startBalance !== lastGoal.targetBalance) {
        setValidationError('Start balance should be ' + expectedBalance + ' (matching ' + goalName + ' target balance)');
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
      return 'Step' + (stepNumbers[stepNumbers.length - 1] + 1);
    }

    return 'Step' + (settings.length + 1);
  };

  const handleStartBalanceFocus = () => {
    if (!newGoal.startBalance && settings.length > 0) {
      setNewGoal({ ...newGoal, startBalance: getNextStartBalance() });
    }
  };

  const handleGoalNameFocus = () => {
    if (!newGoal.level) {
      setNewGoal({ ...newGoal, level: getNextGoalName() });
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
    const filename = 'Forex_Account_Tracker_' + dateStr + '.xlsx';

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
      dailyGain: trade.dailyGain,
      fill: trade.pnl >= 0 ? '#10b981' : '#ef4444' // Green for positive, Red for negative
    }));

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPnLColorClass = (trade) => {
    if (trade.type !== 'trade') return 'text-gray-400';
    if (trade.pnl > 0) return 'text-green-600';
    if (trade.pnl < 0) return 'text-red-600';
    return '';
  };

  const getDailyGainColorClass = (trade) => {
    if (trade.type !== 'trade') return 'text-gray-400';
    if (trade.dailyGain > 0) return 'text-green-600';
    if (trade.dailyGain < 0) return 'text-red-600';
    return '';
  };

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
                className={`px-6 py-4 font-medium capitalize rounded-t-xl transition-colors ${activeTab === tab
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
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Balance Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={balanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [formatCurrency(value), name === 'balance' ? 'Balance' : 'Target']}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} />
                      <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Trading Profit & Loss</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pnlChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'P&L') {
                            return [formatCurrency(value), 'P&L'];
                          }
                          return [formatCurrency(value), name];
                        }}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                        // Fixed: Custom content with dynamic colors
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            const pnlValue = data.value;
                            const isPositive = pnlValue >= 0;

                            return (
                              <div
                                style={{
                                  backgroundColor: '#f9fafb',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  padding: '8px 12px'
                                }}
                              >
                                <p style={{ color: '#374151', margin: 0, marginBottom: '4px' }}>
                                  {label}
                                </p>
                                <p style={{
                                  color: isPositive ? '#10b981' : '#ef4444',
                                  margin: 0,
                                  fontWeight: '600'
                                }}>
                                  P&L: {formatCurrency(pnlValue)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="pnl"
                        fill="#10b981"
                      >
                        {pnlChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
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
              <p className="text-blue-700 mb-2">Your data is automatically saved in your browser local storage and persists between sessions.</p>
              <div className="text-sm text-blue-600">
                <p>• Auto Save: All changes are saved instantly</p>
                <p>• Export/Import: Use Excel files for backup</p>
                <p>• Privacy: Data stays on your device</p>
                <p>• Auto-Advancement: Steps advance automatically</p>
              </div>
            </div>
          </div>
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Entry</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <select
                  value={newTrade.type}
                  onChange={(e) => setNewTrade({ ...newTrade, type: e.target.value })}
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
                  onChange={(e) => setNewTrade({ ...newTrade, date: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder={
                    newTrade.type === 'trade' ? 'Final Balance' :
                      newTrade.type === 'deposit' ? 'Deposit Amount' :
                        newTrade.type === 'withdrawal' ? 'Withdrawal Amount' :
                          'Starting Balance'
                  }
                  value={newTrade.type === 'deposit' || newTrade.type === 'withdrawal' ? newTrade.depositAmount : newTrade.balance}
                  onChange={(e) => handleTradeValueChange(e.target.value, 'balance')}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {newTrade.type === 'trade' && (
                  <input
                    type="number"
                    step="0.01"
                    placeholder="OR P&L Amount"
                    value={newTrade.pnl}
                    onChange={(e) => handleTradeValueChange(e.target.value, 'pnl')}
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
                  onChange={(e) => setNewTrade({ ...newTrade, milestone: e.target.value })}
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

              {tradeValidationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                  <p className="text-red-600 text-sm font-medium">{tradeValidationError}</p>
                </div>
              )}

              {newTrade.type === 'trade' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="text-blue-700 text-sm">💡 Input Methods for Trades:</p>
                  <div className="text-xs text-blue-600 mt-1">
                    <p>• Enter Final Balance → P&L calculates automatically</p>
                    <p>• Enter P&L Amount → Final Balance calculates automatically</p>
                  </div>
                </div>
              )}

              {(newTrade.type === 'deposit' || newTrade.type === 'withdrawal') && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <p className="text-green-700 text-sm">💰 {newTrade.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Information:</p>
                  <div className="text-xs text-green-600 mt-1">
                    <p>• Enter the amount to {newTrade.type === 'deposit' ? 'add to' : 'subtract from'} your current balance</p>
                    <p>• Final Balance: {formatCurrency(parseFloat(newTrade.balance) || 0)}</p>
                    {tradingData.length > 0 && (
                      <p>• Current Balance: {formatCurrency(tradingData[tradingData.length - 1].balance)}</p>
                    )}
                  </div>
                </div>
              )}
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

                          <td className="py-3 px-4">
                            {editingTrade && editingTrade.id === trade.id ? (
                              <input
                                type="date"
                                value={editingTrade.date}
                                onChange={(e) => setEditingTrade({ ...editingTrade, date: e.target.value })}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                              />
                            ) : (
                              formatDate(trade.date)
                            )}
                          </td>

                          <td className="py-3 px-4 font-semibold">
                            {editingTrade && editingTrade.id === trade.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editingTrade.balance}
                                onChange={(e) => handleBalanceChange(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
                              />
                            ) : (
                              formatCurrency(trade.balance)
                            )}
                          </td>

                          <td className={`py-3 px-4 font-semibold ${getPnLColorClass(trade)}`}>
                            {trade.type === 'trade' ? (
                              editingTrade && editingTrade.id === trade.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingTrade.pnl}
                                  onChange={(e) => handlePnLChange(e.target.value)}
                                  className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
                                />
                              ) : (
                                trade.pnl !== null ? formatCurrency(trade.pnl) : '-'
                              )
                            ) : (
                              '-'
                            )}
                          </td>

                          <td className="py-3 px-4">{formatCurrency(trade.amountToTarget)}</td>

                          <td className={`py-3 px-4 font-semibold ${getDailyGainColorClass(trade)}`}>
                            {trade.type === 'trade' && trade.dailyGain !== null ? `${trade.dailyGain.toFixed(2)}%` : '-'}
                          </td>

                          <td className="py-3 px-4 text-sm text-gray-600">
                            {editingTrade && editingTrade.id === trade.id ? (
                              <input
                                type="text"
                                value={editingTrade.milestone}
                                onChange={(e) => setEditingTrade({ ...editingTrade, milestone: e.target.value })}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
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
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="text-gray-600 hover:text-gray-800 transition-colors"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditingTrade(trade)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => deleteTrade(trade.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
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

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Goal</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Goal Name (e.g., Step1)"
                    value={newGoal.level}
                    onChange={(e) => setNewGoal({ ...newGoal, level: e.target.value })}
                    onFocus={handleGoalNameFocus}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Start Balance"
                    value={newGoal.startBalance}
                    onChange={(e) => setNewGoal({ ...newGoal, startBalance: e.target.value })}
                    onFocus={handleStartBalanceFocus}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Target Balance"
                    value={newGoal.targetBalance}
                    onChange={(e) => setNewGoal({ ...newGoal, targetBalance: e.target.value })}
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

                {validationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm font-medium">{validationError}</p>
                  </div>
                )}

                {settings.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-700 text-sm">💡 Tip: Next goal should start where the previous goal ends.</p>
                    <p className="text-blue-600 text-xs mt-1">Expected start balance: {formatCurrency(parseFloat(getNextStartBalance()) || 0)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Trading Goals & Targets</h3>
              {settings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">No Goals Set Yet</p>
                  <p>Add your first trading goal above to get started</p>
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
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(setting.status)}`}>
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
          </div>
        )}
      </div>
    </div>
  );
}