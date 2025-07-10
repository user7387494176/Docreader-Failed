import React, { useState, useEffect } from 'react';
import { Clock, Sun, Moon, Sunset, Sunrise, Edit3, Check, X } from 'lucide-react';

export const TimeGreetingModule: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [timeIcon, setTimeIcon] = useState<React.ReactNode>(<Sun />);
  const [userName, setUserName] = useState('user');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('user');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [showTimezone, setShowTimezone] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 12) {
      setGreeting('Good morning');
      setTimeIcon(<Sunrise className="h-6 w-6" />);
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good afternoon');
      setTimeIcon(<Sun className="h-6 w-6" />);
    } else if (hour >= 17 && hour < 21) {
      setGreeting('Good evening');
      setTimeIcon(<Sunset className="h-6 w-6" />);
    } else {
      setGreeting('Good night');
      setTimeIcon(<Moon className="h-6 w-6" />);
    }
  }, [currentTime]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone
    });
  };

  const handleEditName = () => {
    setTempName(userName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setTempName(userName);
    setIsEditingName(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-coral-100 overflow-hidden w-full h-full">
      <div className="flex items-center justify-between p-4 border-b border-coral-100">
        <div className="flex items-center space-x-2 text-coral-600">
          <Clock className="h-5 w-5" />
          <span className="font-medium">Current Time</span>
        </div>
        <div className="flex items-center space-x-2">
          {timeIcon}
          <button
            onClick={() => setShowTimezone(!showTimezone)}
            className="text-xs text-coral-500 hover:text-coral-700 transition-colors"
            title="Change timezone"
          >
            {timezone.split('/').pop()}
          </button>
        </div>
      </div>
      
      {showTimezone && (
        <div className="p-3 bg-coral-25 border-b border-coral-100">
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full p-2 text-xs border border-coral-200 rounded focus:outline-none focus:ring-2 focus:ring-coral-500"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Asia/Shanghai">Shanghai</option>
            <option value="Australia/Sydney">Sydney</option>
          </select>
        </div>
      )}
      
      <div className="text-center px-4 py-4">
        <div className="text-4xl font-bold text-gray-800 mb-2 font-mono">
          {formatTime(currentTime)}
        </div>
        
        <div className="text-lg text-coral-600 mb-3 flex items-center justify-center space-x-2">
          <span>{greeting}, </span>
          {isEditingName ? (
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleKeyPress}
                className="px-2 py-1 text-sm border border-coral-300 rounded focus:outline-none focus:ring-2 focus:ring-coral-500 text-coral-600 bg-white min-w-0 w-20"
                autoFocus
                maxLength={20}
              />
              <button
                onClick={handleSaveName}
                className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                title="Save name"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                title="Cancel"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <span className="font-medium">{userName}!</span>
              <button
                onClick={handleEditName}
                className="p-1 text-coral-500 hover:bg-coral-100 rounded transition-colors"
                title="Edit name"
              >
                <Edit3 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          {formatDate(currentTime)}
        </div>
        
        <div className="text-xs text-coral-500 mt-1">
          {timezone.replace('_', ' ')}
        </div>
      </div>
    </div>
  );
};