import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize demo user if not exists
const initializeDemoUser = () => {
  const users = JSON.parse(localStorage.getItem('forexTracker_users') || '[]');
  
  const demoUserExists = users.some((user: any) => user.email === 'demo@example.com');
  
  if (!demoUserExists) {
    const demoUser = {
      id: 'demo-user-1',
      email: 'demo@example.com',
      password: 'demo123',
      name: 'Demo User',
      createdAt: new Date().toISOString()
    };
    
    users.push(demoUser);
    localStorage.setItem('forexTracker_users', JSON.stringify(users));

    // Add sample data for demo user
    const sampleSettings = [
      {
        level: 'Step1',
        startBalance: 1000,
        targetBalance: 2000,
        status: 'Completed',
        progress: ''
      },
      {
        level: 'Step2',
        startBalance: 2000,
        targetBalance: 4000,
        status: 'In Progress',
        progress: ''
      },
      {
        level: 'Step3',
        startBalance: 4000,
        targetBalance: 8000,
        status: 'Not Started',
        progress: ''
      }
    ];

    const sampleTradingData = [
      {
        id: 1,
        date: '2025-08-10',
        balance: 1000,
        pnl: 0,
        amountToTarget: 1000,
        dailyGain: 0,
        milestone: '🎯 Starting balance set',
        milestoneValue: null,
        type: 'starting'
      },
      {
        id: 2,
        date: '2025-08-11',
        balance: 1150,
        pnl: 150,
        amountToTarget: 850,
        dailyGain: 15,
        milestone: '',
        milestoneValue: null,
        type: 'trade'
      },
      {
        id: 3,
        date: '2025-08-12',
        balance: 1300,
        pnl: 150,
        amountToTarget: 700,
        dailyGain: 13.04,
        milestone: '',
        milestoneValue: null,
        type: 'trade'
      },
      {
        id: 4,
        date: '2025-08-13',
        balance: 2000,
        pnl: 700,
        amountToTarget: 0,
        dailyGain: 53.85,
        milestone: '🎯 Reached Step1 target - $2,000',
        milestoneValue: null,
        type: 'trade'
      },
      {
        id: 5,
        date: '2025-08-14',
        balance: 2500,
        pnl: 500,
        amountToTarget: 1500,
        dailyGain: 25,
        milestone: '',
        milestoneValue: null,
        type: 'trade'
      }
    ];

    const sampleSummary = {
      latestBalance: 2500,
      targetStatus: 'Step2',
      currentTarget: 4000,
      startForTarget: 2000,
      progressToTarget: 0.25
    };

    localStorage.setItem(`forexTracker_settings_${demoUser.id}`, JSON.stringify(sampleSettings));
    localStorage.setItem(`forexTracker_tradingData_${demoUser.id}`, JSON.stringify(sampleTradingData));
    localStorage.setItem(`forexTracker_summary_${demoUser.id}`, JSON.stringify(sampleSummary));
  }
};

initializeDemoUser();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
