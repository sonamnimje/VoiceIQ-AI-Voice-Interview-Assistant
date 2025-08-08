// Practice utility functions

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculateScore = (answers, mode) => {
  // Simple scoring based on answer length and mode difficulty
  let totalScore = 0;
  const modeMultiplier = {
    beginner: 1,
    intermediate: 1.2,
    advanced: 1.5,
    behavioral: 1.3
  };

  answers.forEach(answer => {
    const wordCount = answer.split(' ').length;
    const baseScore = Math.min(wordCount * 2, 100); // Cap at 100 points per answer
    totalScore += baseScore * modeMultiplier[mode];
  });

  return Math.round(totalScore);
};

export const getPracticeTips = (mode) => {
  const tips = {
    beginner: [
      "Speak clearly and at a moderate pace",
      "Use simple, clear language",
      "Provide basic examples from your experience",
      "Focus on being honest and authentic",
      "Practice active listening"
    ],
    intermediate: [
      "Use the STAR method for behavioral questions",
      "Provide specific examples with measurable outcomes",
      "Show your problem-solving process",
      "Demonstrate your learning ability",
      "Connect your experience to the role"
    ],
    advanced: [
      "Show deep technical knowledge",
      "Explain complex concepts simply",
      "Demonstrate system thinking",
      "Show business impact of technical decisions",
      "Discuss trade-offs and alternatives"
    ],
    behavioral: [
      "Use the STAR method consistently",
      "Quantify your achievements",
      "Show both challenges and solutions",
      "Demonstrate leadership and teamwork",
      "Reflect on lessons learned"
    ]
  };
  return tips[mode] || tips.beginner;
};

export const getFeedback = (mode, score, duration) => {
  const feedback = {
    beginner: {
      high: "Excellent start! You're building a solid foundation. Consider adding more specific examples to your answers.",
      medium: "Good progress! Try to expand your answers with more details and examples.",
      low: "Keep practicing! Focus on speaking clearly and providing more detailed responses."
    },
    intermediate: {
      high: "Great work! Your answers show good experience. Try to use the STAR method more consistently.",
      medium: "Good foundation! Work on providing more specific examples and measurable outcomes.",
      low: "Keep improving! Focus on using the STAR method and providing concrete examples."
    },
    advanced: {
      high: "Outstanding! Your technical depth is impressive. Consider adding more business context.",
      medium: "Good technical knowledge! Work on explaining complex concepts more clearly.",
      low: "Keep learning! Focus on demonstrating technical expertise and problem-solving skills."
    },
    behavioral: {
      high: "Excellent behavioral responses! You're using the STAR method well. Try to quantify achievements more.",
      medium: "Good behavioral answers! Work on using the STAR method more consistently.",
      low: "Keep practicing! Focus on using the STAR method and providing specific examples."
    }
  };

  const scoreLevel = score > 80 ? 'high' : score > 50 ? 'medium' : 'low';
  return feedback[mode][scoreLevel];
};

export const generatePracticeReport = (sessionData) => {
  const { mode, answers, duration, score } = sessionData;
  
  return {
    mode,
    totalQuestions: answers.length,
    averageAnswerLength: Math.round(answers.reduce((acc, ans) => acc + ans.split(' ').length, 0) / answers.length),
    duration: formatTime(duration),
    score,
    tips: getPracticeTips(mode),
    feedback: getFeedback(mode, score, duration),
    timestamp: new Date().toISOString()
  };
};

export const savePracticeSession = (sessionData) => {
  try {
    const existingSessions = JSON.parse(localStorage.getItem('practiceSessions') || '[]');
    const newSession = generatePracticeReport(sessionData);
    existingSessions.push(newSession);
    localStorage.setItem('practiceSessions', JSON.stringify(existingSessions));
    return true;
  } catch (error) {
    console.error('Error saving practice session:', error);
    return false;
  }
};

export const getPracticeHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('practiceSessions') || '[]');
  } catch (error) {
    console.error('Error loading practice history:', error);
    return [];
  }
};

export const clearPracticeHistory = () => {
  try {
    localStorage.removeItem('practiceSessions');
    return true;
  } catch (error) {
    console.error('Error clearing practice history:', error);
    return false;
  }
}; 