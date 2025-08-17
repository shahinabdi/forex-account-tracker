import React from 'react';
import { Coffee, MessageCircle } from 'lucide-react';

interface SupportButtonsProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const SupportButtons: React.FC<SupportButtonsProps> = ({ isMobile = false, onClose }) => {
  const handleCoffeeClick = () => {
    window.open('https://buymeacoffee.com/shahinabdi', '_blank');
    onClose?.();
  };

  const handleFeedbackClick = () => {
    window.open('mailto:fxappfeedback@proton.me?subject=Forex Tracker Feedback', '_blank');
    onClose?.();
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        <button
          onClick={handleCoffeeClick}
          className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium shadow-md w-full coffee-button mobile-touch-target"
        >
          <Coffee size={16} />
          Buy Me a Coffee ☕
        </button>
        <button
          onClick={handleFeedbackClick}
          className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium shadow-md w-full feedback-button mobile-touch-target"
        >
          <MessageCircle size={16} />
          Send Feedback 💬
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-4">
      <button
        onClick={handleCoffeeClick}
        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-md coffee-button"
      >
        <Coffee size={16} />
        Buy Me a Coffee ☕
      </button>
      <button
        onClick={handleFeedbackClick}
        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-md feedback-button"
      >
        <MessageCircle size={16} />
        Send Feedback 💬
      </button>
    </div>
  );
};

export default SupportButtons;
