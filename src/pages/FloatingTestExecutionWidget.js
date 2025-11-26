// FloatingTestExecutionWidget.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTestExecution } from '../pages/TestExecutionContext';
import { CheckCircle, AlertCircle, Loader, X, Eye, XCircle } from 'lucide-react';

const FloatingTestExecutionWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentExecution, clearExecution, completeExecution, isExecutionWidgetVisible } = useTestExecution();
  const [isCanceling, setIsCanceling] = useState(false);

  // ✅ Only show for TEST SCRIPT executions (not test suites)
  if (!isExecutionWidgetVisible || !currentExecution || currentExecution.executionType === 'test_suite') {
    return null;
  }

  // ✅ FIX: Check if current path is the test script page (dynamic route)
  const isOnTestScriptPage = location.pathname.includes('/test-cases/') && location.pathname.includes('/script');
  if (isOnTestScriptPage) {
    return null;
  }

  const { status, progress, testCaseName } = currentExecution;

  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return {
          icon: Loader,
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          message: progress.message || 'Running test...',
          iconClass: 'animate-spin'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-500',
          textColor: 'text-white',
          message: 'Test completed',
          iconClass: ''
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          message: 'Test failed',
          iconClass: ''
        };
      case 'cancelled':
        return {
          icon: XCircle,
          bgColor: 'bg-orange-500',
          textColor: 'text-white',
          message: 'Test cancelled',
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
    // ✅ FIX: Navigate to dynamic route
    const testCaseId = currentExecution.testCaseName || 'unknown';
    
    navigate(`/test-cases/${encodeURIComponent(testCaseId)}/script`, {
      state: {
        testCaseName: currentExecution.testCaseName,
        projectName: currentExecution.projectName,
        testFileName: currentExecution.testFileName,
        testFilePath: currentExecution.testFilePath,
        projectId: currentExecution.projectId
      }
    });
  };

  const handleCancel = async (e) => {
    e.stopPropagation();
    
    if (status !== 'running') {
      clearExecution();
      return;
    }

    if (!window.confirm('Are you sure you want to cancel the running test?')) {
      return;
    }

    setIsCanceling(true);
    
    try {
      console.log('🛑 Sending stop signal to backend...');
      
      const response = await fetch('http://127.0.0.1:8000/AI/test/run-stop/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log('✅ Stop signal sent successfully');
        completeExecution(null, 'Test cancelled by user');
        
        setTimeout(() => {
          clearExecution();
        }, 2000);
        
      } else {
        console.error('❌ Failed to send stop signal');
        alert('Failed to stop test. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error stopping test:', error);
      alert('Error stopping test. Please try again.');
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
                {testCaseName || 'Test Execution'}
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
                title="Cancel test"
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

        {/* Status message for cancelled/error */}
        {(status === 'cancelled' || status === 'error') && (
          <div className="mt-2 text-xs opacity-90 bg-white bg-opacity-20 rounded p-2">
            {status === 'cancelled' ? 'The test was stopped.' : 'Test execution failed.'}
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

export default FloatingTestExecutionWidget;


