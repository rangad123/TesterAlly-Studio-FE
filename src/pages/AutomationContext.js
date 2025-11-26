// AutomationContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AutomationContext = createContext();

export const useAutomation = () => {
  const context = useContext(AutomationContext);
  if (!context) {
    throw new Error('useAutomation must be used within AutomationProvider');
  }
  return context;
};

export const AutomationProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [isFloatingWidgetVisible, setIsFloatingWidgetVisible] = useState(false);

  // Generate unique session ID
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (currentSession) {
      localStorage.setItem('activeAutomationSession', JSON.stringify(currentSession));
      setIsFloatingWidgetVisible(true);
    } else {
      localStorage.removeItem('activeAutomationSession');
      setIsFloatingWidgetVisible(false);
    }
  }, [currentSession]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('activeAutomationSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        // Only restore if status is running or completed (within last hour)
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        if (session.startTime > oneHourAgo) {
          setCurrentSession(session);
          console.log('✅ Restored automation session:', session.sessionId);
        } else {
          // Clear old session
          localStorage.removeItem('activeAutomationSession');
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('activeAutomationSession');
      }
    }
  }, []);

  // Start new automation session
  const startAutomation = useCallback((automationData) => {
    const sessionId = generateSessionId();
    const newSession = {
      sessionId,
      status: 'running',
      startTime: Date.now(),
      prompt: automationData.prompt || '',
      testCaseInfo: automationData.testCaseInfo || {},
      projectData: automationData.projectData || null,
      testUrl: automationData.testUrl || '',
      scenarioName: automationData.scenarioName || '',
      testResults: null,
      error: null,
      progress: {
        current: 0,
        total: 0,
        message: 'Starting automation...'
      }
    };

    setCurrentSession(newSession);
    console.log('🚀 Started automation session:', sessionId);
    console.log('📦 Session data:', newSession);
    return sessionId;
  }, []);

  // Update automation progress (optional - for future polling)
  const updateProgress = useCallback((progressData) => {
    setCurrentSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        progress: {
          ...prev.progress,
          ...progressData
        }
      };
    });
  }, []);

  // Complete automation with results
  const completeAutomation = useCallback((results, error = null) => {
    setCurrentSession(prev => {
      if (!prev) return null;

      // ✅ Determine status based on error type
        let finalStatus = 'completed';
        if (error) {
        finalStatus = error.toLowerCase().includes('cancel') ? 'cancelled' : 'error';
        }

      return {
        ...prev,
        status: finalStatus,
        testResults: results,
        error: error,
        endTime: Date.now(),
        progress: {
          current: prev.progress.total || 100,
          total: prev.progress.total || 100,
          message: error ? 'Automation failed' : 'Automation completed successfully'
        }
      };
    });
    console.log('✅ Completed automation session:', error ? 'with error' : 'successfully');
  }, []);

  // Clear/dismiss session
  const clearSession = useCallback(() => {
    setCurrentSession(null);
    localStorage.removeItem('activeAutomationSession');
    console.log('🗑️ Cleared automation session');
  }, []);

  // Check if there's an active running session
  const hasActiveSession = currentSession?.status === 'running';
  const hasCompletedSession = currentSession?.status === 'completed';
  const hasErrorSession = currentSession?.status === 'error';

  const value = {
    currentSession,
    isFloatingWidgetVisible,
    hasActiveSession,
    hasCompletedSession,
    hasErrorSession,
    startAutomation,
    updateProgress,
    completeAutomation,
    clearSession,
  };

  return (
    <AutomationContext.Provider value={value}>
      {children}
    </AutomationContext.Provider>
  );
};