// FloatingTestSuiteWidget.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTestExecution } from '../pages/TestExecutionContext';
import { CheckCircle, AlertCircle, Loader, X, Eye, XCircle } from 'lucide-react';

const FloatingTestSuiteWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentExecution, clearExecution, completeExecution, isExecutionWidgetVisible } = useTestExecution();
  const [isCanceling, setIsCanceling] = useState(false);

  // ✅ Only show for TEST SUITE executions
  if (!isExecutionWidgetVisible || !currentExecution || currentExecution.executionType !== 'test_suite') {
    return null;
  }

  // ✅ Don't show on test suite page itself
  const isOnTestSuitePage = location.pathname === '/testsuite';
  if (isOnTestSuitePage) {
    return null;
  }

  const { status, progress, testSuiteName, completedTests, totalTests, passedTests, failedTests, currentTestName } = currentExecution;

  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return {
          icon: Loader,
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          message: progress.message || 'Running test suite...',
          iconClass: 'animate-spin'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-500',
          textColor: 'text-white',
          message: 'Test suite completed',
          iconClass: ''
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          message: 'Test suite failed',
          iconClass: ''
        };
      case 'cancelled':
        return {
          icon: XCircle,
          bgColor: 'bg-orange-500',
          textColor: 'text-white',
          message: 'Test suite cancelled',
          iconClass: ''
        };
      default:
        return {
          icon: Loader,
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          message: 'Processing...',
          iconClass: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const handleViewDetails = () => {
    // Navigate back to test suite page
    navigate('/testsuite', {
      state: {
        testSuiteName: currentExecution.testSuiteName,
        projectId: currentExecution.projectId,
        testSuite: currentExecution.passedTestSuite,
        ProjectType: currentExecution.ProjectType,
        Platform: currentExecution.Platform
      }
    });
  };

  const handleCancel = async (e) => {
    e.stopPropagation();
    
    if (status !== 'running') {
      clearExecution();
      return;
    }

    if (!window.confirm('Are you sure you want to cancel the running test suite?')) {
      return;
    }

    setIsCanceling(true);
    
    try {
      console.log('🛑 Sending stop signal to backend...');
      
      // ✅ Use appropriate cancel endpoint based on project type
      const response = await fetch('http://127.0.0.1:8000/AI/test/run-stop/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log('✅ Stop signal sent successfully');
        completeExecution(null, 'Test suite cancelled by user');
        
        setTimeout(() => {
          clearExecution();
        }, 2000);
        
      } else {
        console.error('❌ Failed to send stop signal');
        alert('Failed to stop test suite. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error stopping test suite:', error);
      alert('Error stopping test suite. Please try again.');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    if (status !== 'running') {
      clearExecution();
    }
  };

  // Calculate progress percentage
  const progressPercentage = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`${config.bgColor} ${config.textColor} rounded-lg shadow-2xl p-4 max-w-sm cursor-pointer hover:shadow-3xl transition-all duration-300 hover:scale-105`}
        onClick={handleViewDetails}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <Icon className={`w-5 h-5 ${config.iconClass}`} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {testSuiteName || 'Test Suite'}
              </p>
              <p className="text-xs opacity-90">
                {config.message}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-2">
            {status === 'running' ? (
              <button
                onClick={handleCancel}
                disabled={isCanceling}
                className="hover:bg-white hover:bg-opacity-20 rounded p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Cancel test suite"
              >
                {isCanceling ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="hover:bg-white hover:bg-opacity-20 rounded p-1.5 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Section - Show for running status */}
        {status === 'running' && (
          <div className="mt-2 space-y-2">
            {/* Progress Bar */}
            {totalTests > 0 && (
              <div>
                <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1 opacity-90">
                  <span>{completedTests} / {totalTests} tests</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
              </div>
            )}

            {/* Current Test Name */}
            {currentTestName && (
              <div className="text-xs opacity-90 bg-white bg-opacity-20 rounded p-2 truncate">
                Running: {currentTestName}
              </div>
            )}

            {/* Pass/Fail Counts */}
            {(passedTests > 0 || failedTests > 0) && (
              <div className="flex gap-2 text-xs">
                <span className="bg-green-500 bg-opacity-30 px-2 py-1 rounded">
                  ✓ {passedTests}
                </span>
                <span className="bg-red-500 bg-opacity-30 px-2 py-1 rounded">
                  ✗ {failedTests}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Status message for cancelled/error */}
        {(status === 'cancelled' || status === 'error') && (
          <div className="mt-2 text-xs opacity-90 bg-white bg-opacity-20 rounded p-2">
            {status === 'cancelled' ? 'The test suite was stopped.' : 'Test suite execution failed.'}
          </div>
        )}

        {/* Completion Summary */}
        {status === 'completed' && (
          <div className="mt-2 text-xs bg-white bg-opacity-20 rounded p-2">
            <div className="flex justify-between">
              <span>Passed: {passedTests}</span>
              <span>Failed: {failedTests}</span>
            </div>
          </div>
        )}

        {/* Click to view details */}
        <div className="mt-3 flex items-center gap-2 text-xs opacity-90 hover:opacity-100">
          <Eye className="w-3 h-3" />
          <span>Click to view details</span>
        </div>
      </div>
    </div>
  );
};

export default FloatingTestSuiteWidget;



