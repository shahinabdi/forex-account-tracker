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
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">P&L Calendar</h3>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={previousMonth}
            className="p-1.5 sm:p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <span className="text-sm sm:text-lg font-medium text-gray-900 min-w-[120px] sm:min-w-[140px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 sm:p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {/* Day Headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="bg-gray-50 border-b border-gray-200 px-1 sm:px-3 py-2 text-center text-xs sm:text-sm font-medium text-gray-700"
          >
            <span className="sm:hidden">{day.slice(0, 1)}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map((day, index) => {
          if (day === null) {
            return (
              <div
                key={index}
                className="h-16 sm:h-20 border-r border-b border-gray-200 bg-gray-25"
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
              className={`h-16 sm:h-20 border-r border-b border-gray-200 p-1 sm:p-2 relative hover:bg-gray-50 transition-colors ${
                isToday ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className={`text-xs sm:text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {day}
              </div>
              
              {hasData && (
                <div className="mt-0.5 sm:mt-1">
                  <div
                    className={`text-xs sm:text-sm px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-center font-semibold leading-tight ${
                      pnl >= 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                    style={{ fontSize: 'clamp(8px, 2.5vw, 14px)' }}
                  >
                    <span className="sm:hidden">
                      {pnl >= 0 ? '+' : ''}{Math.abs(pnl) >= 1000 ? `${(pnl/1000).toFixed(0)}k` : `${pnl.toFixed(0)}`}
                    </span>
                    <span className="hidden sm:inline">
                      {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                    </span>
                  </div>
                </div>
              )}
              
              {isToday && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Monthly Summary */}
      <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4">
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
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Monthly P&L</div>
                <div className={`text-sm sm:text-lg font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Win Days</div>
                <div className="text-sm sm:text-lg font-semibold text-green-600">
                  {profitableDays}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Loss Days</div>
                <div className="text-sm sm:text-lg font-semibold text-red-600">
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
