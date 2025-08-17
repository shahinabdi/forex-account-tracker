import { useState, useEffect } from 'react';
import CalendarPNL from './components/CalendarPNL';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';
import { TrendingUp, Target, DollarSign, Calendar, Download, Upload, Plus, Trash2, PlusCircle, MinusCircle, Coffee, MessageCircle, Menu, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import SupportButtons from './components/SupportButtons';

// Type definitions
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
}

interface Goal {
  level: string;
  startBalance: number;
  targetBalance: number;
  status: 'In Progress' | 'Completed' | 'Not Started';
  progress: string;
}

interface Summary {
  latestBalance: number;
  targetStatus: string;
  currentTarget: number;
  startForTarget: number;
  progressToTarget: number;
}

export default function ForexTracker() {
  const [showCalendarPNL, setShowCalendarPNL] = useState(false);
  const [summary, setSummary] = useState<Summary>({
    latestBalance: 0,
    targetStatus: 'No Goals Set',
    currentTarget: 0,
    startForTarget: 0,
    progressToTarget: 0
  });

  const [settings, setSettings] = useState<Goal[]>([]);
  const [tradingData, setTradingData] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const [editingTrade, setEditingTrade] = useState<{
    id: number;
    date: string;
    balance: string;
    pnl: string;
    milestone: string;
    type: string;
  } | null>(null);
  const [validationError, setValidationError] = useState('');
  const [tradeValidationError, setTradeValidationError] = useState('');

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Simple date validation handler
  const handleDateChange = (selectedDate: string) => {
    const today = getTodayDate();
    if (selectedDate > today) {
      // Reset to today and show warning
      setNewTrade({ ...newTrade, date: today });
      setTradeValidationError('Future dates are not allowed. Date has been set to today.');
      setTimeout(() => setTradeValidationError(''), 2000);
    } else {
      setNewTrade({ ...newTrade, date: selectedDate });
      // Clear any existing date-related errors
      if (tradeValidationError.includes('Future dates are not allowed')) {
        setTradeValidationError('');
      }
    }
  };

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

  // Monitor date changes and enforce restrictions
  useEffect(() => {
    const today = getTodayDate();
    if (newTrade.date > today) {
      setNewTrade(prev => ({ ...prev, date: today }));
      setTradeValidationError('Future dates are not allowed. Date corrected to today.');
      setTimeout(() => setTradeValidationError(''), 3000);
    }
  }, [newTrade.date]);

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
          // Recalculate all balances to ensure consistency with correct amount to target for each trade
          const recalculatedData = recalculateBalances(tradingData);
          setTradingData(recalculatedData);
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
        // Recalculate all data to ensure correct amount to target for each trade
        const recalculatedData = recalculateBalances(tradingData);

        const hasChanges = recalculatedData.some((trade, index) =>
          trade.amountToTarget !== tradingData[index].amountToTarget
        );

        if (hasChanges) {
          setTradingData(recalculatedData);
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

  // Helper function to get the current balance including all entries
  const getCurrentBalance = () => {
    if (tradingData.length === 0) {
      const currentStep = settings.find(s => s.status === 'In Progress');
      return currentStep ? currentStep.startBalance : 0;
    }
    
    // Sort all data by date and get the most recent balance
    const sortedData = [...tradingData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sortedData[sortedData.length - 1].balance;
  };

  const calculateCorrectDailyGain = (currentBalance: number, previousBalance: number, type: string) => {
    if (type === 'deposit' || type === 'withdrawal' || type === 'starting') {
      return 0;
    }
    if (previousBalance <= 0) return 0;
    return ((currentBalance - previousBalance) / previousBalance) * 100;
  };

  // Helper function to determine which step was active for a given balance and date
  const getActiveStepForBalance = (balance: number): Goal | null => {
    if (settings.length === 0) return null;
    
    // Sort settings by target balance to ensure proper order
    const sortedSettings = [...settings].sort((a, b) => a.targetBalance - b.targetBalance);
    
    // Find the appropriate step based on balance
    for (let i = 0; i < sortedSettings.length; i++) {
      const step = sortedSettings[i];
      
      // If balance is below this step's target, this should be the active step
      if (balance < step.targetBalance) {
        return step;
      }
    }
    
    // If balance exceeds all targets, return the last step
    return sortedSettings[sortedSettings.length - 1];
  };

  // Function to recalculate all balances in correct order
  const recalculateBalances = (data: Trade[]) => {
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBalance = 0;
    
    // Find the first starting balance or use the first goal's start balance
    const firstEntry = sortedData[0];
    if (firstEntry?.type === 'starting') {
      runningBalance = firstEntry.balance;
    } else {
      const firstGoal = settings.find(s => s.status === 'In Progress') || settings[0];
      runningBalance = firstGoal ? firstGoal.startBalance : 0;
    }

    return sortedData.map((trade, index) => {
      let currentBalance = trade.balance;
      let pnl = 0;
      let dailyGain = 0;
      
      const prevBalance = index > 0 ? sortedData[index - 1].balance : runningBalance;

      switch (trade.type) {
        case 'starting':
          currentBalance = trade.balance;
          break;
        case 'deposit':
          currentBalance = prevBalance + (trade.balance - prevBalance);
          break;
        case 'withdrawal':
          currentBalance = prevBalance - (prevBalance - trade.balance);
          break;
        case 'trade':
          // For trades, if pnl is provided, use it; otherwise calculate from balance difference
          if (trade.pnl !== null && trade.pnl !== 0) {
            pnl = trade.pnl;
            currentBalance = prevBalance + pnl;
          } else {
            pnl = currentBalance - prevBalance;
          }
          dailyGain = calculateCorrectDailyGain(currentBalance, prevBalance, 'trade');
          break;
      }

      // Calculate amount to target based on what step was active for this trade's balance
      const activeStepForThisTrade = getActiveStepForBalance(currentBalance);
      const amountToTarget = activeStepForThisTrade ? Math.max(activeStepForThisTrade.targetBalance - currentBalance, 0) : 0;

      return {
        ...trade,
        balance: currentBalance,
        pnl: trade.type === 'trade' ? pnl : 0,
        dailyGain: trade.type === 'trade' ? dailyGain : 0,
        amountToTarget
      };
    });
  };

  // Helper function to suggest milestone text based on balance and current step
  const getSuggestedMilestone = (balance: number): string => {
    if (settings.length === 0) return '';
    
    const activeStep = getActiveStepForBalance(balance);
    if (!activeStep) return '';
    
    // Check if balance reaches or exceeds the current step target
    if (balance >= activeStep.targetBalance) {
      return `🎯 Reached ${activeStep.level} target - ${formatCurrency(activeStep.targetBalance)}`;
    }
    
    // Check if balance is close to target (within 10%)
    const progressToTarget = (balance - activeStep.startBalance) / (activeStep.targetBalance - activeStep.startBalance);
    if (progressToTarget >= 0.9) {
      return `🔥 Almost at ${activeStep.level} target - ${((progressToTarget * 100).toFixed(1))}% complete`;
    }
    
    return '';
  };

  const handleTradeValueChange = (value: string, field: string) => {
    if (newTrade.type === 'deposit' || newTrade.type === 'withdrawal') {
      // For deposits/withdrawals, the value represents the amount to add/subtract
      const amount = parseFloat(value) || 0;
      const currentBalance = getCurrentBalance();

      // Validate withdrawal amount
      if (newTrade.type === 'withdrawal' && amount > currentBalance) {
        setTradeValidationError(`Withdrawal amount (${formatCurrency(amount)}) cannot exceed current balance (${formatCurrency(currentBalance)})`);
        setNewTrade({
          ...newTrade,
          balance: '',
          depositAmount: value
        });
        return;
      } else {
        setTradeValidationError(''); // Clear error if validation passes
      }

      let newBalance;
      if (newTrade.type === 'deposit') {
        newBalance = currentBalance + amount;
      } else { // withdrawal
        newBalance = currentBalance - amount;
      }

      const suggestedMilestone = getSuggestedMilestone(newBalance);

      setNewTrade({
        ...newTrade,
        balance: newBalance.toString(),
        pnl: '', // Deposits/withdrawals don't have P&L
        depositAmount: value, // Store the deposit/withdrawal amount
        milestone: suggestedMilestone || newTrade.milestone
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
      const prevBalance = getCurrentBalance();

      if (field === 'balance') {
        const calculatedPnL = numValue - prevBalance;
        const suggestedMilestone = getSuggestedMilestone(numValue);
        setNewTrade({
          ...newTrade,
          balance: value,
          pnl: calculatedPnL.toString(),
          inputMode: 'balance',
          milestone: suggestedMilestone || newTrade.milestone
        });
      } else if (field === 'pnl') {
        const calculatedBalance = prevBalance + numValue;
        const suggestedMilestone = getSuggestedMilestone(calculatedBalance);
        setNewTrade({
          ...newTrade,
          balance: calculatedBalance.toString(),
          pnl: value,
          inputMode: 'pnl',
          milestone: suggestedMilestone || newTrade.milestone
        });
      }
    }
  };

  const validateTradeEntry = () => {
    const selectedDate = newTrade.date;
    const selectedType = newTrade.type;
    const today = new Date().toISOString().split('T')[0];

    setTradeValidationError('');

    // Check if date is in the future
    if (selectedDate > today) {
      setTradeValidationError('Cannot add entries for future dates. Please select today or an earlier date.');
      return false;
    }

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
        // Use the getCurrentBalance helper to get the most recent balance
        prevBalance = getCurrentBalance();
      } else if (newTrade.type === 'starting') {
        prevBalance = 0;
      } else {
        prevBalance = summary.startForTarget;
      }

      let currentBalance = parseFloat(newTrade.balance);
      let pnl = 0;
      let dailyGain = 0;

      switch (newTrade.type) {
        case 'trade':
          pnl = parseFloat(newTrade.pnl) || (currentBalance - prevBalance);
          dailyGain = calculateCorrectDailyGain(currentBalance, prevBalance, 'trade');
          break;
        case 'deposit':
          // For deposits, the entered amount is added to previous balance
          if (newTrade.depositAmount) {
            const depositAmount = parseFloat(newTrade.depositAmount);
            currentBalance = prevBalance + depositAmount;
          }
          pnl = 0;
          dailyGain = 0;
          break;
        case 'withdrawal':
          // For withdrawals, the entered amount is subtracted from previous balance
          if (newTrade.depositAmount) {
            const withdrawalAmount = parseFloat(newTrade.depositAmount);
            currentBalance = prevBalance - withdrawalAmount;
          }
          pnl = 0;
          dailyGain = 0;
          break;
        default:
          pnl = 0;
          dailyGain = 0;
      }

      const activeStepForThisTrade = getActiveStepForBalance(currentBalance);
      const amountToTarget = activeStepForThisTrade ? Math.max(activeStepForThisTrade.targetBalance - currentBalance, 0) : 0;

      const trade: Trade = {
        id: Date.now(),
        date: newTrade.date,
        balance: currentBalance,
        pnl: pnl,
        amountToTarget: amountToTarget,
        dailyGain: dailyGain,
        milestone: newTrade.milestone,
        milestoneValue: null,
        type: newTrade.type as Trade['type']
      };

      // Add the new trade and recalculate all balances to ensure consistency
      const newTradingData = [...tradingData, trade];
      const recalculatedData = recalculateBalances(newTradingData);
      setTradingData(recalculatedData);
      
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
          
          let pnl = 0;

          switch (editingTrade.type) {
            case 'trade':
              pnl = parseFloat(editingTrade.pnl) || 0;
              break;
            default:
              pnl = 0;
          }

          return {
            ...trade,
            date: editingTrade.date,
            balance: currentBalance,
            pnl: pnl,
            milestone: editingTrade.milestone,
            type: editingTrade.type as Trade['type']
          };
        }
        return trade;
      });

      // Recalculate all balances to ensure consistency
      const recalculatedData = recalculateBalances(updatedTradingData);
      setTradingData(recalculatedData);
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
      const goal: Goal = {
        level: newGoal.level,
        startBalance: parseFloat(newGoal.startBalance),
        targetBalance: parseFloat(newGoal.targetBalance),
        status: (settings.length === 0 ? 'In Progress' : 'Not Started') as Goal['status'],
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
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

  const getTypeLabel = (type: string) => {
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

  // Get completed step targets for reference lines
  const completedSteps = settings.filter(s => s.status === 'Completed');
  
  // Prepare deposits and withdrawals for markers
  const deposits = tradingData.filter(trade => trade.type === 'deposit');
  const withdrawals = tradingData.filter(trade => trade.type === 'withdrawal');
  
  // Sort trading data by date and time to ensure proper order
  const sortedTradingData = [...tradingData].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA === dateB) {
      // If same date, sort by ID to maintain consistent order
      return a.id - b.id;
    }
    return dateA - dateB;
  });

  const balanceChartData = sortedTradingData.map((trade, index) => {
    // Get previous balance for context
    let previousBalance = 0;
    if (index > 0) {
      previousBalance = sortedTradingData[index - 1].balance;
    } else {
      const currentStep = settings.find(s => s.status === 'In Progress');
      previousBalance = currentStep ? currentStep.startBalance : 0;
    }

    // Calculate the deposit/withdrawal amount
    let transactionAmount = 0;
    if (trade.type === 'deposit') {
      transactionAmount = trade.balance - previousBalance;
    } else if (trade.type === 'withdrawal') {
      transactionAmount = previousBalance - trade.balance;
    }

    // Create unique identifier for each entry
    const sameDayEntries = sortedTradingData.filter(t => t.date === trade.date);
    const entryIndex = sameDayEntries.findIndex(t => t.id === trade.id);
    const displayDate = sameDayEntries.length > 1 
      ? `${formatDate(trade.date)} (${entryIndex + 1})`
      : formatDate(trade.date);

    const dataPoint: any = {
      date: displayDate,
      originalDate: trade.date,
      balance: trade.balance,
      target: summary.currentTarget,
      // Add markers for deposits and withdrawals
      isDeposit: trade.type === 'deposit',
      isWithdrawal: trade.type === 'withdrawal',
      entryType: trade.type,
      previousBalance: previousBalance,
      transactionAmount: transactionAmount,
      tradeData: trade, // Store full trade data for tooltip
      entryId: trade.id, // Unique ID for this entry
      entryIndex: entryIndex + 1, // Position in same day entries
      totalSameDayEntries: sameDayEntries.length
    };
    
    // Add completed step reference lines
    completedSteps.forEach((step) => {
      dataPoint[`completed_${step.level}`] = step.targetBalance;
    });
    
    return dataPoint;
  });

  const pnlChartData = tradingData
    .filter(trade => trade.pnl !== null && trade.type === 'trade')
    .map(trade => ({
      date: formatDate(trade.date),
      pnl: trade.pnl,
      dailyGain: trade.dailyGain,
      fill: (trade.pnl ?? 0) >= 0 ? '#10b981' : '#ef4444' // Green for positive, Red for negative
    }));

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPnLColorClass = (trade: Trade) => {
    if (trade.type !== 'trade') return 'text-gray-400';
    if ((trade.pnl ?? 0) > 0) return 'text-green-600';
    if ((trade.pnl ?? 0) < 0) return 'text-red-600';
    return '';
  };

  const getDailyGainColorClass = (trade: Trade) => {
    if (trade.type !== 'trade') return 'text-gray-400';
    if ((trade.dailyGain ?? 0) > 0) return 'text-green-600';
    if ((trade.dailyGain ?? 0) < 0) return 'text-red-600';
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Forex Account Tracker</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Track your trading progress and milestones</p>
            </div>
            
            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex gap-2">
              <button
                onClick={exportData}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download size={16} />
                <span className="hidden lg:inline">Export</span>
              </button>
              <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm">
                <Upload size={16} />
                <span className="hidden lg:inline">Import</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={importData}
                  className="hidden"
                />
              </label>
              <button
                onClick={checkAndAdvanceSteps}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Target size={16} />
                <span className="hidden lg:inline">Check Progress</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 mobile-touch-target press-feedback ${
                  isMobileMenuOpen 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                    : 'bg-gradient-to-r from-white to-gray-50 text-gray-700 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 hover:from-gray-50 hover:to-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`transition-all duration-300 ${isMobileMenuOpen ? 'rotate-180 scale-110' : 'hover:scale-110'}`}>
                    {isMobileMenuOpen ? <X size={18} className="drop-shadow-sm" /> : <Menu size={18} />}
                  </div>
                  <span className="text-sm font-semibold tracking-wide">Menu</span>
                </div>
                {!isMobileMenuOpen && (
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse shadow-sm"></div>
                )}
              </button>
            </div>

            {/* Mobile Action Buttons */}
            {isMobileMenuOpen && (
              <>
                {/* Overlay */}
                <div 
                  className="fixed inset-0 bg-black bg-opacity-25 z-40 sm:hidden backdrop-blur-sm" 
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                {/* Menu */}
                <div className="sm:hidden bg-white border border-gray-100 rounded-2xl p-4 absolute top-16 right-2 z-50 shadow-2xl min-w-52 animate-slide-down">
                  <div className="flex flex-col gap-3">
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Actions</div>
                    <button
                      onClick={() => {
                        exportData();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 bg-green-50 text-green-700 px-4 py-3 rounded-xl hover:bg-green-100 transition-all duration-200 text-sm mobile-touch-target group"
                    >
                      <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <Download size={16} />
                      </div>
                      <span className="font-medium">Export Data</span>
                    </button>
                    <label className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-3 rounded-xl hover:bg-blue-100 transition-all duration-200 cursor-pointer text-sm mobile-touch-target group">
                      <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Upload size={16} />
                      </div>
                      <span className="font-medium">Import Data</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                          importData(e);
                          setIsMobileMenuOpen(false);
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => {
                        checkAndAdvanceSteps();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 bg-purple-50 text-purple-700 px-4 py-3 rounded-xl hover:bg-purple-100 transition-all duration-200 text-sm mobile-touch-target group"
                    >
                      <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <Target size={16} />
                      </div>
                      <span className="font-medium">Check Progress</span>
                    </button>
                    
                    <hr className="my-2 border-gray-200" />
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Support</div>
                    
                    <button
                      onClick={() => {
                        window.open('https://buymeacoffee.com/shahinabdi', '_blank');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 px-4 py-3 rounded-xl hover:from-yellow-100 hover:to-orange-100 transition-all duration-200 text-sm mobile-touch-target group"
                    >
                      <div className="p-1.5 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                        <Coffee size={16} />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Buy Me a Coffee</span>
                        <span className="text-xs text-yellow-600">Support the app ☕</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        window.open('mailto:fxappfeedback@proton.me?subject=Forex Tracker Feedback', '_blank');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 px-4 py-3 rounded-xl hover:from-indigo-100 hover:to-blue-100 transition-all duration-200 text-sm mobile-touch-target group"
                    >
                      <div className="p-1.5 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                        <MessageCircle size={16} />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Send Feedback</span>
                        <span className="text-xs text-indigo-600">Share your thoughts 💭</span>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Desktop Feedback and Coffee Buttons */}
          <div className="hidden sm:flex justify-center mt-4 pt-4 border-t border-gray-200">
            <SupportButtons />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-4 sm:mb-6">
          <div className="flex overflow-x-auto">
            {['dashboard', 'trading', 'goals'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setIsMobileMenuOpen(false);
                }}
                className={`px-4 sm:px-6 py-3 sm:py-4 font-medium capitalize rounded-t-xl transition-colors flex-shrink-0 text-sm sm:text-base ${activeTab === tab
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
          <div className="space-y-4 sm:space-y-6">
            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-xl font-medium shadow-sm border ${showCalendarPNL ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'}`}
                onClick={() => setShowCalendarPNL(!showCalendarPNL)}
              >
                <Calendar size={18} className="inline mr-2" /> Calendar P&L
              </button>
            </div>
            {showCalendarPNL && (
              <CalendarPNL trades={tradingData.filter(t => t.type === 'trade' && t.pnl !== null).map(t => ({ date: t.date, pnl: Number(t.pnl) }))} />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                    <DollarSign className="text-green-600" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Current Balance</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{formatCurrency(summary.latestBalance)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                    <Target className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Current Target</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{formatCurrency(summary.currentTarget)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                    <TrendingUp className="text-purple-600" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Progress</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-800">{(summary.progressToTarget * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-orange-100 rounded-full">
                    <Calendar className="text-orange-600" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Current Step</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{summary.targetStatus}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Progress to Target</h3>
              <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 sm:h-4 rounded-full transition-all duration-500"
                  style={{ width: `${summary.progressToTarget * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                <span>{formatCurrency(summary.startForTarget)}</span>
                <span>{formatCurrency(summary.latestBalance)} / {formatCurrency(summary.currentTarget)}</span>
              </div>
            </div>

            {/* Charts */}
            {tradingData.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Balance Over Time</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={balanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={12}
                        interval="preserveStartEnd"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          if (name === 'balance') return [formatCurrency(Number(value)), 'Current Balance'];
                          if (name === 'target') return [formatCurrency(Number(value)), 'Current Target'];
                          if (name.startsWith('completed_')) {
                            const stepName = name.replace('completed_', '');
                            return [formatCurrency(Number(value)), `✓ ${stepName} (Completed)`];
                          }
                          return [formatCurrency(Number(value)), name];
                        }}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const dataPoint = payload[0].payload;
                            const isDeposit = dataPoint.isDeposit;
                            const isWithdrawal = dataPoint.isWithdrawal;
                            const entryType = dataPoint.entryType;
                            const currentBalance = dataPoint.balance;
                            const transactionAmount = dataPoint.transactionAmount;
                            const tradeData = dataPoint.tradeData;
                            const entryIndex = dataPoint.entryIndex;
                            const totalSameDayEntries = dataPoint.totalSameDayEntries;
                            
                            return (
                              <div
                                style={{
                                  backgroundColor: '#f9fafb',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  padding: '8px',
                                  minWidth: '160px',
                                  fontSize: '11px'
                                }}
                              >
                                <p style={{ color: '#374151', margin: 0, marginBottom: '6px', fontWeight: 'bold', fontSize: '12px' }}>
                                  {formatDate(dataPoint.originalDate)}
                                  {totalSameDayEntries > 1 && (
                                    <span style={{ fontSize: '10px', color: '#6b7280', marginLeft: '4px' }}>
                                      (Entry {entryIndex} of {totalSameDayEntries})
                                    </span>
                                  )}
                                </p>
                                
                                {/* Current Balance */}
                                <p style={{ color: '#3b82f6', margin: 0, fontWeight: '600', marginBottom: '4px' }}>
                                  Balance: {formatCurrency(currentBalance)}
                                </p>
                                
                                {/* Entry Type Specific Information */}
                                {isDeposit && (
                                  <p style={{ color: '#10b981', margin: 0, fontSize: '10px', fontWeight: '600' }}>
                                    💰 Deposit: +{formatCurrency(transactionAmount)}
                                  </p>
                                )}
                                
                                {isWithdrawal && (
                                  <p style={{ color: '#ef4444', margin: 0, fontSize: '10px', fontWeight: '600' }}>
                                    💸 Withdrawal: -{formatCurrency(transactionAmount)}
                                  </p>
                                )}
                                
                                {entryType === 'starting' && (
                                  <p style={{ color: '#8b5cf6', margin: 0, fontSize: '10px', fontWeight: '600' }}>
                                    🎯 Starting Balance
                                  </p>
                                )}
                                
                                {entryType === 'trade' && (
                                  <div>
                                    <p style={{ color: '#6b7280', margin: 0, fontSize: '10px', fontWeight: '600' }}>
                                      📈 Trade
                                      {tradeData.pair && (
                                        <span style={{ marginLeft: '4px', fontSize: '9px', color: '#9ca3af' }}>
                                          ({tradeData.pair})
                                        </span>
                                      )}
                                    </p>
                                    {tradeData.pnl !== null && tradeData.pnl !== 0 && (
                                      <p style={{ 
                                        color: tradeData.pnl > 0 ? '#10b981' : '#ef4444', 
                                        margin: 0, 
                                        fontSize: '10px', 
                                        fontWeight: '600',
                                        marginTop: '2px'
                                      }}>
                                        P&L: {tradeData.pnl > 0 ? '+' : ''}{formatCurrency(tradeData.pnl)}
                                      </p>
                                    )}
                                    {tradeData.dailyGain !== null && tradeData.dailyGain !== 0 && (
                                      <p style={{ 
                                        color: tradeData.dailyGain > 0 ? '#10b981' : '#ef4444', 
                                        margin: 0, 
                                        fontSize: '9px',
                                        marginTop: '1px'
                                      }}>
                                        Daily Gain: {tradeData.dailyGain > 0 ? '+' : ''}{tradeData.dailyGain.toFixed(2)}%
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                {/* Show milestone if present */}
                                {tradeData.milestone && (
                                  <p style={{ color: '#f59e0b', margin: 0, fontSize: '9px', marginTop: '3px' }}>
                                    🏆 {tradeData.milestone}
                                  </p>
                                )}

                                {/* Show notes if present */}
                                {tradeData.notes && (
                                  <p style={{ color: '#6b7280', margin: 0, fontSize: '9px', marginTop: '3px', fontStyle: 'italic' }}>
                                    📝 {tradeData.notes}
                                  </p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }}
                        formatter={(value: any) => {
                          if (value === 'balance') return 'Current Balance';
                          if (value === 'target') return 'Current Target';
                          if (value.startsWith('completed_')) {
                            const stepName = value.replace('completed_', '');
                            return `✓ ${stepName} (Completed)`;
                          }
                          return value;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        name="balance"
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          if (payload.isDeposit) {
                            return (
                              <circle 
                                cx={cx} 
                                cy={cy} 
                                r={4} 
                                fill="#10b981" 
                                stroke="#ffffff" 
                                strokeWidth={2}
                              />
                            );
                          }
                          if (payload.isWithdrawal) {
                            return (
                              <circle 
                                cx={cx} 
                                cy={cy} 
                                r={4} 
                                fill="#ef4444" 
                                stroke="#ffffff" 
                                strokeWidth={2}
                              />
                            );
                          }
                          if (payload.entryType === 'starting') {
                            return (
                              <circle 
                                cx={cx} 
                                cy={cy} 
                                r={4} 
                                fill="#8b5cf6" 
                                stroke="#ffffff" 
                                strokeWidth={2}
                              />
                            );
                          }
                          // Default dot for trades - smaller and less prominent
                          return (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={3} 
                              fill="#3b82f6" 
                              stroke="#ffffff" 
                              strokeWidth={1}
                            />
                          );
                        }}
                      />
                      <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} name="target" dot={false} />
                      
                      {/* Reference lines for completed steps */}
                      {completedSteps.map((step) => (
                        <Line 
                          key={`completed-${step.level}`}
                          type="monotone" 
                          dataKey={`completed_${step.level}`}
                          stroke="#10b981" 
                          strokeDasharray="3 3" 
                          strokeWidth={1.5}
                          strokeOpacity={0.6}
                          name={`completed_${step.level}`}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  
                  {/* Legend explanation */}
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {/* Completed milestones */}
                    {completedSteps.length > 0 && (
                      <div className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-green-700 font-medium mb-1">Completed Milestones:</p>
                        <div className="text-xs text-green-600 space-y-1">
                          {completedSteps.map(step => (
                            <div key={step.level} className="truncate">
                              ✓ {step.level}: {formatCurrency(step.targetBalance)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Chart markers legend */}
                    <div className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-700 font-medium mb-2">Chart Markers:</p>
                      <div className="text-xs text-blue-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                          <span>💰 Deposits</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                          <span>💸 Withdrawals</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-purple-500 flex-shrink-0"></div>
                          <span>🎯 Starting Balance</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                          <span>📈 Trading Activity</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Trading Profit & Loss</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={pnlChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={12}
                        interval="preserveStartEnd"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          if (name === 'P&L') {
                            return [formatCurrency(Number(value)), 'P&L'];
                          }
                          return [formatCurrency(Number(value)), name];
                        }}
                        labelStyle={{ color: '#374151', fontSize: '12px' }}
                        contentStyle={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
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
                                  padding: '8px',
                                  fontSize: '12px'
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
                          <Cell key={`cell-${index}`} fill={(entry.pnl ?? 0) >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* No Data Message */}
            {tradingData.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <TrendingUp size={36} className="mx-auto sm:block hidden" />
                  <TrendingUp size={32} className="mx-auto sm:hidden" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Trading Data Yet</h3>
                <p className="text-gray-500 mb-4 text-sm sm:text-base">
                  {settings.length === 0
                    ? "First set up your goals in the Goals & Targets tab, then add your trading data here."
                    : "Start by adding your first trade or initial balance in the Trading tab."
                  }
                </p>
                <button
                  onClick={() => setActiveTab(settings.length === 0 ? 'goals' : 'trading')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  {settings.length === 0 ? "Set Up Goals First" : "Go to Trading Tab"}
                </button>
              </div>
            )}

            {/* Data Persistence Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-blue-800">💾 Data Storage Information</h3>
              <p className="text-blue-700 mb-2 text-sm sm:text-base">Your data is automatically saved in your browser local storage and persists between sessions.</p>
              <div className="text-xs sm:text-sm text-blue-600 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                <p>• Auto Save: All changes are saved instantly</p>
                <p>• Export/Import: Use Excel files for backup</p>
                <p>• Privacy: Data stays on your device</p>
                <p>• Auto-Advancement: Steps advance automatically</p>
              </div>
            </div>

            {/* Mobile Coffee and Feedback Buttons */}
            <div className="sm:hidden bg-white rounded-xl shadow-lg p-4">
              <SupportButtons isMobile={true} />
            </div>
          </div>
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Add New Entry</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
                <select
                  value={newTrade.type}
                  onChange={(e) => setNewTrade({ ...newTrade, type: e.target.value })}
                  className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNSIgdmlld0JveD0iMCAwIDEwIDUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoMTBMNSA1eiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4=')] bg-no-repeat bg-[position:right_12px_center]"
                >
                  <option value="trade">Trade</option>
                  <option value="starting">Starting Balance</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                </select>
                <div className="relative">
                  <input
                    type="date"
                    value={newTrade.date}
                    max={getTodayDate()}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full bg-white shadow-sm"
                  />
                </div>
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
                  className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm"
                />
                {newTrade.type === 'trade' ? (
                  <input
                    type="number"
                    step="0.01"
                    placeholder="OR P&L Amount"
                    value={newTrade.pnl}
                    onChange={(e) => handleTradeValueChange(e.target.value, 'pnl')}
                    className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm"
                  />
                ) : (
                  <div className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-500 text-sm shadow-sm">
                    N/A
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Milestone (optional)"
                  value={newTrade.milestone}
                  onChange={(e) => setNewTrade({ ...newTrade, milestone: e.target.value })}
                  className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:col-span-1 bg-white shadow-sm"
                />
                <button
                  onClick={addNewTrade}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm sm:col-span-1 lg:col-span-1 shadow-sm font-medium"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Add Entry</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>

              {/* Mobile Date Restriction Notice */}
              <div className="sm:hidden bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-700 text-xs">
                  📅 <strong>Date Restriction:</strong> Only today ({getTodayDate()}) and past dates are allowed. 
                  Future dates will be automatically corrected.
                </p>
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
                    <p>• Current Balance: {formatCurrency(getCurrentBalance())}</p>
                    {newTrade.balance && (
                      <p>• New Balance After {newTrade.type === 'deposit' ? 'Deposit' : 'Withdrawal'}: {formatCurrency(parseFloat(newTrade.balance) || 0)}</p>
                    )}
                    {newTrade.depositAmount && (
                      <p>• {newTrade.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Amount: {formatCurrency(parseFloat(newTrade.depositAmount) || 0)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Current Step Info */}
              {settings.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
                  <p className="text-purple-700 text-sm">📊 Current Step Information:</p>
                  <div className="text-xs text-purple-600 mt-1">
                    {(() => {
                      const currentStep = settings.find(s => s.status === 'In Progress');
                      if (currentStep) {
                        const currentBalance = getCurrentBalance();
                        const progress = Math.max(0, (currentBalance - currentStep.startBalance) / (currentStep.targetBalance - currentStep.startBalance));
                        const remaining = Math.max(0, currentStep.targetBalance - currentBalance);
                        return (
                          <>
                            <p>• Active Step: <strong>{currentStep.level}</strong></p>
                            <p>• Target: {formatCurrency(currentStep.targetBalance)} | Remaining: {formatCurrency(remaining)}</p>
                            <p>• Progress: {(progress * 100).toFixed(1)}% complete</p>
                            {newTrade.milestone && (
                              <p>• Suggested Milestone: <em>"{newTrade.milestone}"</em></p>
                            )}
                          </>
                        );
                      } else {
                        return <p>• No active step found</p>;
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Trading History */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Trading History</h3>
              {tradingData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm sm:text-base">
                    {settings.length === 0
                      ? "Set up your goals first, then add your trading entries here."
                      : "No entries yet. Add your first entry above to get started."
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Type</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Date</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Balance</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">P&L</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Amount to Target</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Daily Gain %</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Milestone</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradingData.map((trade) => (
                        <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2 sm:px-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              {getTypeIcon(trade.type)}
                              <span className="text-xs sm:text-sm hidden sm:inline">{getTypeLabel(trade.type)}</span>
                              <span className="text-xs sm:hidden">{getTypeLabel(trade.type).slice(0,4)}</span>
                            </div>
                          </td>

                          <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                            {editingTrade && editingTrade.id === trade.id ? (
                              <input
                                type="date"
                                value={editingTrade.date}
                                max={getTodayDate()}
                                onChange={(e) => {
                                  const selectedDate = e.target.value;
                                  const today = getTodayDate();
                                  if (selectedDate <= today) {
                                    setEditingTrade({ ...editingTrade, date: selectedDate });
                                  }
                                }}
                                className="border border-gray-300 rounded px-2 py-1 text-xs w-full max-w-[120px]"
                              />
                            ) : (
                              formatDate(trade.date)
                            )}
                          </td>

                          <td className="py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                            {editingTrade && editingTrade.id === trade.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editingTrade.balance}
                                onChange={(e) => handleBalanceChange(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-xs w-full max-w-[100px]"
                              />
                            ) : (
                              <span className="hidden sm:inline">{formatCurrency(trade.balance)}</span>
                            )}
                            <span className="sm:hidden">${(trade.balance / 1000).toFixed(1)}k</span>
                          </td>

                          <td className={`py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm ${getPnLColorClass(trade)}`}>
                            {trade.type === 'trade' ? (
                              editingTrade && editingTrade.id === trade.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingTrade.pnl}
                                  onChange={(e) => handlePnLChange(e.target.value)}
                                  className="border border-gray-300 rounded px-2 py-1 text-xs w-full max-w-[100px]"
                                />
                              ) : (
                                <>
                                  <span className="hidden sm:inline">{trade.pnl !== null ? formatCurrency(trade.pnl) : '-'}</span>
                                  <span className="sm:hidden">{trade.pnl !== null ? `${trade.pnl > 0 ? '+' : ''}${(trade.pnl / 1000).toFixed(1)}k` : '-'}</span>
                                </>
                              )
                            ) : (
                              '-'
                            )}
                          </td>

                          <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                            <span className="hidden sm:inline">{formatCurrency(trade.amountToTarget)}</span>
                            <span className="sm:hidden">${(trade.amountToTarget / 1000).toFixed(1)}k</span>
                          </td>

                          <td className={`py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm ${getDailyGainColorClass(trade)}`}>
                            {trade.type === 'trade' && trade.dailyGain !== null ? `${trade.dailyGain.toFixed(2)}%` : '-'}
                          </td>

                          <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 max-w-[100px] sm:max-w-none">
                            {editingTrade && editingTrade.id === trade.id ? (
                              <input
                                type="text"
                                value={editingTrade.milestone}
                                onChange={(e) => setEditingTrade({ ...editingTrade, milestone: e.target.value })}
                                className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                              />
                            ) : (
                              <span className="truncate block" title={trade.milestone || '-'}>
                                {trade.milestone || '-'}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-2 sm:px-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              {editingTrade && editingTrade.id === trade.id ? (
                                <>
                                  <button
                                    onClick={saveEditedTrade}
                                    className="text-green-600 hover:text-green-800 transition-colors text-sm"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditingTrade(trade)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => deleteTrade(trade.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                  >
                                    <Trash2 size={14} />
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
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Add New Goal</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <input
                    type="text"
                    placeholder="Goal Name (e.g., Step1)"
                    value={newGoal.level}
                    onChange={(e) => setNewGoal({ ...newGoal, level: e.target.value })}
                    onFocus={handleGoalNameFocus}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Start Balance"
                    value={newGoal.startBalance}
                    onChange={(e) => setNewGoal({ ...newGoal, startBalance: e.target.value })}
                    onFocus={handleStartBalanceFocus}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Target Balance"
                    value={newGoal.targetBalance}
                    onChange={(e) => setNewGoal({ ...newGoal, targetBalance: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={addNewGoal}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Add Goal</span>
                    <span className="sm:hidden">Add</span>
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

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Trading Goals & Targets</h3>
              {settings.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <Target size={36} className="mx-auto mb-4 text-gray-400 sm:block hidden" />
                  <Target size={32} className="mx-auto mb-4 text-gray-400 sm:hidden" />
                  <p className="text-base sm:text-lg font-medium mb-2">No Goals Set Yet</p>
                  <p className="text-sm sm:text-base">Add your first trading goal above to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Goal</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Start Balance</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Target Balance</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Multiplier</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Profit Target</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Status</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settings.map((setting, index) => (
                        <tr key={setting.level} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">{setting.level}</td>
                          <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                            <span className="hidden sm:inline">{formatCurrency(setting.startBalance)}</span>
                            <span className="sm:hidden">${(setting.startBalance / 1000).toFixed(1)}k</span>
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                            <span className="hidden sm:inline">{formatCurrency(setting.targetBalance)}</span>
                            <span className="sm:hidden">${(setting.targetBalance / 1000).toFixed(1)}k</span>
                          </td>
                          <td className="py-3 px-2 sm:px-4 font-semibold text-blue-600 text-xs sm:text-sm">
                            {(setting.targetBalance / setting.startBalance).toFixed(1)}x
                          </td>
                          <td className="py-3 px-2 sm:px-4 font-semibold text-green-600 text-xs sm:text-sm">
                            <span className="hidden sm:inline">{formatCurrency(setting.targetBalance - setting.startBalance)}</span>
                            <span className="sm:hidden">+${((setting.targetBalance - setting.startBalance) / 1000).toFixed(1)}k</span>
                          </td>
                          <td className="py-3 px-2 sm:px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(setting.status)}`}>
                              <span className="hidden sm:inline">{setting.status}</span>
                              <span className="sm:hidden">
                                {setting.status === 'In Progress' ? 'Active' : 
                                 setting.status === 'Completed' ? 'Done' : 'Wait'}
                              </span>
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-4">
                            <button
                              onClick={() => removeGoal(index)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 size={14} />
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