import React, { createContext, useContext, useState } from 'react';

const FeedbackContext = createContext();

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export const FeedbackProvider = ({ children }) => {
  const [showEnhancedFeedback, setShowEnhancedFeedback] = useState(false);
  const [enhancedFeedbackData, setEnhancedFeedbackData] = useState(null);
  const [currentSessionMode, setCurrentSessionMode] = useState('hr');
  const [currentRole, setCurrentRole] = useState('Software Engineer');

  const openEnhancedFeedback = (data = null, mode = 'hr', role = 'Software Engineer') => {
    setEnhancedFeedbackData(data);
    setCurrentSessionMode(mode);
    setCurrentRole(role);
    setShowEnhancedFeedback(true);
  };

  const closeEnhancedFeedback = () => {
    setShowEnhancedFeedback(false);
    setEnhancedFeedbackData(null);
  };

  const updateFeedbackData = (newData) => {
    setEnhancedFeedbackData(prev => ({ ...prev, ...newData }));
  };

  const value = {
    showEnhancedFeedback,
    enhancedFeedbackData,
    currentSessionMode,
    currentRole,
    openEnhancedFeedback,
    closeEnhancedFeedback,
    updateFeedbackData
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
}; 