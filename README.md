# Forex Account Tracker 📈

A responsive web application for tracking forex trading progress, goals, and milestones. Built with React, TypeScript, and Tailwind CSS.

## 🌟 Features

### Core Functionality
- **Trading Journal**: Track trades, deposits, withdrawals, and starting balances
- **Goal Management**: Set and track multiple trading goals with automatic progression
- **Progress Visualization**: Interactive charts showing balance history and P&L
- **Data Persistence**: Automatic local storage with export/import capabilities
- **Smart Calculations**: Automatic P&L, daily gain, and progress calculations

### 📱 Responsive Design
- **Mobile-First**: Fully optimized for mobile devices (320px and up)
- **Tablet Support**: Enhanced layouts for tablet devices (641px - 1024px)
- **Desktop Experience**: Full-featured desktop interface (1024px+)
- **Touch-Friendly**: All interactive elements meet 44px minimum touch target
- **Adaptive Charts**: Charts automatically resize and adjust for different screen sizes
- **Mobile Navigation**: Collapsible navigation menu for mobile devices

### 💝 Community Features
- **Buy Me a Coffee**: Support the developer with a coffee button
- **Feedback System**: Easy feedback submission via email
- **Responsive Placement**: Buttons adapt to screen size and device type

## 🎯 Device Optimization

### Mobile Phones (< 640px)
- Stacked card layouts
- Horizontal scrolling tables with condensed data
- Mobile-specific menu with touch-friendly buttons
- Abbreviated text and currency formatting (e.g., "$1.2k")
- Smaller chart heights for better scrolling
- Bottom-placed feedback and coffee buttons

### Tablets (640px - 1024px)
- Two-column card layouts where appropriate
- Larger touch targets
- Optimized chart sizes
- Responsive navigation tabs

### Desktop (> 1024px)
- Full multi-column layouts
- Larger charts with detailed tooltips
- Header-placed feedback and coffee buttons
- Full-width tables with complete data

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd forex_account_tracker

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎨 Technology Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Responsive charting library
- **Lucide React** - Modern icon library
- **XLSX** - Excel export/import functionality
- **Vite** - Fast build tool and dev server

## 📊 Usage Guide

### Setting Up Goals
1. Navigate to "Goals & Targets" tab
2. Add your trading goals with start and target balances
3. Goals automatically progress as you reach targets

### Adding Trades
1. Go to "Trading" tab
2. Select entry type (Trade, Deposit, Withdrawal, Starting Balance)
3. Enter balance or P&L amount
4. Add optional milestones
5. Data saves automatically

### Viewing Progress
1. Dashboard shows current balance, progress, and target
2. Interactive charts display balance over time and P&L
3. Color-coded markers show different entry types

## 💡 Tips for Mobile Users

- **Horizontal Scrolling**: Tables scroll horizontally on mobile - swipe left/right
- **Menu Access**: Tap the menu button in the header for additional options
- **Chart Interaction**: Tap chart points to see detailed information
- **Quick Actions**: Use the mobile menu for export, import, and feedback options

## 🎯 Responsive Breakpoints

- **xs**: 0px - 639px (Mobile)
- **sm**: 640px - 767px (Large Mobile)  
- **md**: 768px - 1023px (Tablet)
- **lg**: 1024px - 1279px (Desktop)
- **xl**: 1280px+ (Large Desktop)

## 💰 Support the Project

If you find this tool helpful, consider buying me a coffee! ☕
The "Buy Me a Coffee" button is available in:
- Desktop: Header area
- Mobile: Dedicated mobile menu and bottom section

## 📝 Feedback

We value your feedback! Use the feedback button to:
- Report bugs
- Suggest new features  
- Share your experience
- Request improvements

Available through:
- Desktop: Header feedback button
- Mobile: Mobile menu and dedicated section

## 🔒 Privacy & Security

- **Local Storage**: All data stays on your device
- **No Tracking**: No analytics or user tracking
- **Export Control**: You control your data with export/import
- **Privacy First**: No data sent to external servers

## 🏗️ Project Structure

```
src/
├── App.tsx           # Main application component
├── index.css         # Global styles and responsive utilities
├── main.tsx          # Application entry point
├── components/       # Reusable components (future expansion)
├── hooks/           # Custom React hooks (future expansion)
├── types/           # TypeScript type definitions (future expansion)
└── utils/           # Utility functions (future expansion)
```

## 🚀 Future Enhancements

- **Cloud Sync**: Optional cloud storage integration
- **Advanced Analytics**: More detailed trading statistics
- **Custom Themes**: Light/dark mode and custom themes
- **Multi-Currency**: Support for different currencies
- **Trading Pairs**: Track specific forex pairs
- **Risk Management**: Position sizing and risk calculations

## 📱 PWA Features (Coming Soon)

- Offline functionality
- Install as app on mobile devices
- Push notifications for goal achievements
- Background sync capabilities

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is open source. Please check the license file for details.

---

**Made with ❤️ for the trading community**

*Happy Trading! 📈*
