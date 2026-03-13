import React, { createContext, useContext, useState } from 'react';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [analysisData, setAnalysisData] = useState(null);
  const [quizArchetype, setQuizArchetype] = useState(null);

  return (
    <AnalysisContext.Provider value={{ analysisData, setAnalysisData, quizArchetype, setQuizArchetype }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider');
  return ctx;
}
