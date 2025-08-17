# 📈 Forex Account Tracker

> **A comprehensive, responsive web application for tracking forex trading progress, analyzing performance, and achieving your trading goals.**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features Overview

### 🎯 **Trading Management**
- **Complete Trading Journal**: Track trades, deposits, withdrawals, and starting balances
- **Smart P&L Calculations**: Automatic profit/loss tracking with daily gain percentages
- **Goal-Based Progression**: Set multiple trading goals with automatic tier advancement
- **Milestone Tracking**: Add custom milestones and achievements
- **Data Validation**: Intelligent date restrictions and balance validations

### � **Advanced Analytics**
- **📅 Calendar P&L View**: Visual calendar showing daily profits/losses
- **📈 Summary Analytics**: Comprehensive performance dashboard with:
  - Win rate and trading statistics
  - Monthly performance charts with actual P&L numbers
  - Current streak tracking (winning/losing)
  - Risk analytics and drawdown analysis
  - Deposit/withdrawal tracking
- **Interactive Charts**: Recharts-powered visualizations with hover details
- **Performance Metrics**: Total P&L, best/worst days, average daily returns

### � **Responsive Design**
- **Mobile-First Architecture**: Optimized for all screen sizes (320px+)
- **Touch-Friendly Interface**: 44px+ touch targets, gesture-friendly navigation
- **Adaptive Layouts**: Smart grid systems that stack and reorganize
- **Mobile-Specific Features**:
  - Collapsible hamburger menu
  - Horizontal scrolling tables
  - Condensed data display
  - Bottom-sheet style interactions

### 💾 **Data Management**
- **Local Storage Persistence**: Automatic save with browser storage
- **Excel Integration**: Import/Export with .xlsx files
- **Data Integrity**: Smart recalculation and consistency checks
- **Privacy-First**: All data stays on your device

### 🌟 **Community Features**
- **☕ Buy Me a Coffee**: Support the developer
- **📧 Feedback System**: Direct feedback via email (fxappfeedback@proton.me)
- **Responsive Placement**: Buttons adapt to device type

## 🚀 Quick Start

### Prerequisites
```bash
Node.js ≥ 16.0.0
npm ≥ 7.0.0 or yarn ≥ 1.22.0
```

### Installation & Setup
```bash
# Clone the repository
git clone https://github.com/shahinabdi/forex-account-tracker.git
cd forex-account-tracker

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 🔧 Development Commands
```bash
npm run dev        # Start dev server with HMR
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run type-check # TypeScript type checking
```

## � Usage Guide

### 🎯 **Setting Up Your Trading Goals**
1. Navigate to **"Goals & Targets"** tab
2. Click **"Add New Goal"** 
3. Enter:
   - Goal name (e.g., "Funded Account", "Profit Target")
   - Starting balance
   - Target balance
4. Goals automatically progress as you hit targets

### 📝 **Recording Trades & Transactions**
1. Go to **"Trading"** tab
2. Select entry type:
   - **Trade**: Regular trading activity
   - **Starting Balance**: Initial account funding
   - **Deposit**: Additional funds
   - **Withdrawal**: Money taken out
3. Enter balance or P&L amount
4. Add optional milestones
5. Data saves automatically ✅

### 📊 **Analyzing Performance**
1. **Dashboard**: Overview of current progress and targets
2. **📅 Calendar P&L**: Click to view daily profit/loss calendar
3. **📈 Summary Analytics**: Detailed performance metrics including:
   - Total P&L and win rate
   - Monthly performance charts
   - Trading statistics
   - Recent activity feed

### � **Mobile Usage Tips**
- **Menu Access**: Tap ☰ in header for mobile menu
- **Chart Interaction**: Tap chart elements for details
- **Table Navigation**: Swipe tables horizontally
- **Date Selection**: Uses native mobile date pickers

## 🎨 Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2+ | UI framework with modern hooks |
| **TypeScript** | 5.0+ | Type-safe development |
| **Tailwind CSS** | 3.4+ | Utility-first styling |
| **Vite** | 5.0+ | Build tool and dev server |
| **Recharts** | 2.8+ | Data visualization |
| **Lucide React** | Latest | Modern icon library |
| **XLSX** | Latest | Excel file handling |

## 📐 Architecture & Design

### 🏗️ **Project Structure**
```
src/
├── App.tsx                    # Main application component
├── index.css                  # Global styles & responsive utilities
├── main.tsx                   # Application entry point
├── components/
│   ├── CalendarPNL.tsx       # Calendar P&L view component
│   ├── SummaryPage.tsx       # Analytics dashboard
│   └── SupportButtons.tsx    # Coffee & feedback buttons
├── types/                     # TypeScript definitions
├── hooks/                     # Custom React hooks
└── utils/                     # Utility functions
```

### 🎯 **Responsive Breakpoints**
```css
/* Mobile First Approach */
xs: 0px - 639px     /* Mobile phones */
sm: 640px - 767px   /* Large phones */
md: 768px - 1023px  /* Tablets */
lg: 1024px - 1279px /* Desktop */
xl: 1280px+         /* Large desktop */
```

### � **Data Flow**
```
User Input → State Management → Local Storage → Charts/Tables → Export
```

## 🎪 **Advanced Features**

### 📅 **Calendar P&L View**
- **Visual Daily Tracking**: See profits/losses on a calendar
- **Month Navigation**: Navigate between months
- **Smart Formatting**: Abbreviated values on mobile
- **Monthly Summaries**: Win/loss day counts and totals

### � **Summary Analytics Dashboard**
- **Performance Metrics**: Win rate, total P&L, streaks
- **Monthly Charts**: Bar charts with actual dollar amounts
- **Risk Analytics**: Drawdown, volatility, best/worst days
- **Recent Activity**: Last 5 transactions with smart amount calculation

### 🎯 **Smart Calculations**
- **Auto-Balance Calculation**: Handles deposits/withdrawals intelligently  
- **Streak Detection**: Consecutive wins/losses tracking
- **Goal Progression**: Automatic tier advancement
- **P&L Analysis**: Daily gains, monthly totals, running balances

## � Privacy & Security

### 🛡️ **Data Protection**
- ✅ **100% Local Storage**: No data sent to external servers
- ✅ **No Tracking**: Zero analytics or user monitoring
- ✅ **Export Control**: You own and control your data
- ✅ **Browser-Based**: Works completely offline
- ✅ **No Registration**: No accounts or personal information required

### 💾 **Data Persistence**
- **Automatic Saves**: Every action saves immediately
- **Cross-Session**: Data persists between browser sessions
- **Export/Import**: Full backup and restore capabilities
- **Data Integrity**: Built-in validation and consistency checks

## 📱 **Mobile Optimization**

### 🎯 **Mobile-Specific Features**
- **Native Date Pickers**: Platform-specific date selection
- **Touch Gestures**: Swipe, tap, and pinch support
- **Viewport Optimization**: Perfect scaling on all devices
- **Offline Ready**: Works without internet connection

### 📐 **Responsive Design Patterns**
- **Fluid Grids**: CSS Grid and Flexbox layouts
- **Adaptive Typography**: Clamp() functions for scaling text
- **Progressive Enhancement**: Core functionality works everywhere
- **Performance Optimized**: Lazy loading and code splitting

## 🤝 **Community & Support**

### ☕ **Support the Project**
- **Buy Me a Coffee**: [https://buymeacoffee.com/shahinabdi](https://buymeacoffee.com/shahinabdi)
- **GitHub Stars**: Star the repository if it helps you!
- **Share**: Tell other traders about the tool

### 📧 **Feedback & Contact**
- **Email**: [fxappfeedback@proton.me](mailto:fxappfeedback@proton.me)
- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Community discussions welcome

## 🚧 **Roadmap & Future Features**

### 🔮 **Upcoming Features**
- [ ] **📊 Advanced Analytics**: More trading statistics
- [ ] **🌙 Dark Mode**: Theme switching capability
- [ ] **💱 Multi-Currency**: Support for different currencies
- [ ] **📈 Trading Pairs**: Track specific forex pairs
- [ ] **⚡ PWA Support**: Install as mobile app
- [ ] **☁️ Cloud Sync**: Optional cloud backup
- [ ] **🔔 Notifications**: Goal achievement alerts
- [ ] **� Templates**: Pre-built goal templates

### 🎯 **Long-term Vision**
- Advanced risk management tools
- Social trading features
- Integration with trading platforms
- AI-powered insights and recommendations

## 🔧 **Contributing**

### 🤝 **How to Contribute**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 📋 **Development Guidelines**
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Ensure mobile responsiveness
- Add appropriate type definitions
- Test across different devices

### 🧪 **Testing**
- Manual testing across devices
- Browser compatibility checks
- Performance optimization
- Accessibility compliance

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Trading Community**: For inspiration and feedback
- **Open Source Libraries**: All the amazing tools that make this possible
- **Contributors**: Everyone who helps improve the project

---

<div align="center">

**🌟 Made with ❤️ for the trading community 🌟**

**Happy Trading! 📈💰**

*"Success in trading comes from knowledge, discipline, and the right tools."*

</div>
