import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Trade {
  date: string;
  pnl: number;
}

interface CalendarPNLProps {
  trades: Trade[];
}

const CalendarPNL: React.FC<CalendarPNLProps> = ({ trades }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Map trades by date for quick lookup
  const tradeMap = trades.reduce((acc, trade) => {
    acc[trade.date] = trade.pnl;
    return acc;
  }, {} as Record<string, number>);

  // Get current month and year
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get first day of month and how many days in month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  // Generate calendar days
  const days = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">P&L Calendar</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={previousMonth}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span className="text-lg font-medium text-gray-900 min-w-[140px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {/* Day Headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="bg-gray-50 border-b border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700"
          >
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map((day, index) => {
          if (day === null) {
            return (
              <div
                key={index}
                className="h-20 border-r border-b border-gray-200 bg-gray-25"
              />
            );
          }
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const pnl = tradeMap[dateStr];
          const hasData = pnl !== undefined;
          const isToday = new Date().toISOString().slice(0, 10) === dateStr;
          
          return (
            <div
              key={day}
              className={`h-20 border-r border-b border-gray-200 p-2 relative hover:bg-gray-50 transition-colors ${
                isToday ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {day}
              </div>
              
              {hasData && (
                <div className="mt-1">
                  <div
                    className={`text-sm px-2 py-1 rounded-full text-center font-semibold ${
                      pnl >= 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                  </div>
                </div>
              )}
              
              {isToday && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Monthly Summary */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(() => {
          const monthlyTrades = trades.filter(trade => {
            const tradeDate = new Date(trade.date);
            return tradeDate.getMonth() === month && tradeDate.getFullYear() === year;
          });
          
          const totalPnL = monthlyTrades.reduce((sum, trade) => sum + trade.pnl, 0);
          const profitableDays = monthlyTrades.filter(trade => trade.pnl > 0).length;
          const losingDays = monthlyTrades.filter(trade => trade.pnl < 0).length;
          
          return (
            <>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">Monthly P&L</div>
                <div className={`text-lg font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">Profitable Days</div>
                <div className="text-lg font-semibold text-green-600">
                  {profitableDays}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">Losing Days</div>
                <div className="text-lg font-semibold text-red-600">
                  {losingDays}
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default CalendarPNL;
