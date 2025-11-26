// TestExecutionContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TestExecutionContext = createContext();

export const useTestExecution = () => {
  const context = useContext(TestExecutionContext);
  if (!context) {
    throw new Error('useTestExecution must be used within TestExecutionProvider');
  }
  return context;
};

export const TestExecutionProvider = ({ children }) => {
  const [currentExecution, setCurrentExecution] = useState(null);
  const [isExecutionWidgetVisible, setIsExecutionWidgetVisible] = useState(false);

  // Generate unique execution ID
  const generateExecutionId = () => {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Save execution to localStorage whenever it changes
  useEffect(() => {
    if (currentExecution) {
      localStorage.setItem('activeTestExecution', JSON.stringify(currentExecution));
      setIsExecutionWidgetVisible(true);
    } else {
      localStorage.removeItem('activeTestExecution');
      setIsExecutionWidgetVisible(false);
    }
  }, [currentExecution]);

  // Restore execution from localStorage on mount
  useEffect(() => {
    const savedExecution = localStorage.getItem('activeTestExecution');
    if (savedExecution) {
      try {
        const execution = JSON.parse(savedExecution);
        // Only restore if within last hour
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        if (execution.startTime > oneHourAgo) {
          setCurrentExecution(execution);
          console.log('✅ Restored test execution:', execution.executionId);
        } else {
          localStorage.removeItem('activeTestExecution');
        }
      } catch (error) {
        console.error('Failed to restore execution:', error);
        localStorage.removeItem('activeTestExecution');
      }
    }
  }, []);

  // ✅ ENHANCED: Start execution (works for both test script and test suite)
  const startExecution = useCallback((executionData) => {
    const executionId = generateExecutionId();
    const newExecution = {
      executionId,
      status: 'running',
      startTime: Date.now(),
      executionType: executionData.executionType || 'test_script', // ✅ NEW: 'test_script' or 'test_suite'
      
      // Test Script fields
      testCaseName: executionData.testCaseName || '',
      projectName: executionData.projectName || '',
      testFileName: executionData.testFileName || '',
      testFilePath: executionData.testFilePath || '',
      projectId: executionData.projectId || null,
      
      // ✅ NEW: Test Suite fields
      testSuiteName: executionData.testSuiteName || '',
      totalTests: executionData.totalTests || 0,
      completedTests: 0,
      passedTests: 0,
      failedTests: 0,
      currentTestName: '',

      ProjectType: executionData.ProjectType || null,  
      Platform: executionData.Platform || null,       
      passedTestSuite: executionData.passedTestSuite || null,
          
      testResults: null,
      error: null,
      progress: {
        message: executionData.executionType === 'test_suite' 
          ? 'Starting test suite execution...' 
          : 'Running test script...'
      }
    };

    setCurrentExecution(newExecution);
    console.log('🚀 Started test execution:', executionId);
    console.log('📦 Execution data:', newExecution);
    return executionId;
  }, []);

  // ✅ NEW: Update progress (for test suite execution)
  const updateExecutionProgress = useCallback((progressData) => {
    setCurrentExecution(prev => {
      if (!prev || prev.executionType !== 'test_suite') return prev;
      
      return {
        ...prev,
        completedTests: progressData.completedTests ?? prev.completedTests,
        passedTests: progressData.passedTests ?? prev.passedTests,
        failedTests: progressData.failedTests ?? prev.failedTests,
        currentTestName: progressData.currentTestName ?? prev.currentTestName,
        progress: {
          ...prev.progress,
          message: progressData.message || prev.progress.message
        }
      };
    });
  }, []);

  // Complete execution with results
  const completeExecution = useCallback((results, error = null) => {
    setCurrentExecution(prev => {
      if (!prev) return null;

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
          message: error 
            ? (finalStatus === 'cancelled' ? 'Execution cancelled' : 'Execution failed')
            : 'Execution completed successfully'
        }
      };
    });
    console.log('✅ Completed test execution:', error ? 'with error' : 'successfully');
  }, []);

  // Clear/dismiss execution
  const clearExecution = useCallback(() => {
    setCurrentExecution(null);
    localStorage.removeItem('activeTestExecution');
    console.log('🗑️ Cleared test execution');
  }, []);

  const hasActiveExecution = currentExecution?.status === 'running';
  const hasCompletedExecution = currentExecution?.status === 'completed';
  const hasErrorExecution = currentExecution?.status === 'error';

  const value = {
    currentExecution,
    isExecutionWidgetVisible,
    hasActiveExecution,
    hasCompletedExecution,
    hasErrorExecution,
    startExecution,
    updateExecutionProgress, 
    completeExecution,
    clearExecution,
  };

  return (
    <TestExecutionContext.Provider value={value}>
      {children}
    </TestExecutionContext.Provider>
  );
};


