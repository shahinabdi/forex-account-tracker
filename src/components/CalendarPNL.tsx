import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface Trade {
  date: string;
  pnl: number;
}

interface CalendarPNLProps {
  trades: Trade[];
}

const CalendarPNL: React.FC<CalendarPNLProps> = ({ trades }) => {
  // Map trades by date for quick lookup
  const tradeMap = trades.reduce((acc, trade) => {
    acc[trade.date] = trade.pnl;
    return acc;
  }, {} as Record<string, number>);

  // Custom tile content to show P&L
  const tileContent = ({ date }: { date: Date }) => {
    const dateStr = date.toISOString().slice(0, 10);
    if (tradeMap[dateStr] !== undefined) {
      return (
        <div style={{ fontSize: '0.8em', color: tradeMap[dateStr] >= 0 ? 'green' : 'red' }}>
          {tradeMap[dateStr] >= 0 ? '+' : ''}{tradeMap[dateStr]}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Calendar P&L View</h3>
      <Calendar tileContent={tileContent} />
    </div>
  );
};

export default CalendarPNL;
