// FloatingAutomationWidget.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAutomation } from '../pages/AutomationContext';
import { CheckCircle, AlertCircle, Loader, X, Eye, XCircle } from 'lucide-react';

const FloatingAutomationWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentSession, clearSession, completeAutomation, isFloatingWidgetVisible } = useAutomation();
  const [isCanceling, setIsCanceling] = useState(false);

  // Don't show widget if not visible or no session or already on test-scenario page
  if (!isFloatingWidgetVisible || !currentSession || location.pathname === '/test-scenario') {
    return null;
  }

  const { status, progress, scenarioName } = currentSession;

  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return {
          icon: Loader,
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          message: progress.message || 'Running automation...',
          iconClass: 'animate-spin'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-500',
          textColor: 'text-white',
          message: 'Automation completed',
          iconClass: ''
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          message: 'Automation failed',
          iconClass: ''
        };
      case 'cancelled':
        return {
          icon: XCircle,
          bgColor: 'bg-orange-500',
          textColor: 'text-white',
          message: 'Automation cancelled',
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
    navigate('/test-scenario');
  };

  const handleCancel = async (e) => {
    e.stopPropagation();
    
    if (status !== 'running') {
      // Just dismiss if not running
      clearSession();
      return;
    }

    // Confirm cancellation for running automation
    if (!window.confirm('Are you sure you want to cancel the running automation?')) {
      return;
    }

    setIsCanceling(true);
    
    try {
      console.log('🛑 Sending stop signal to backend...');
      
      const response = await fetch('http://127.0.0.1:8000/AI/test/stop/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log('✅ Stop signal sent successfully');
        
        // Update session to cancelled state
        completeAutomation(null, 'Automation cancelled by user');
        
        // Update status in current session to show cancelled
        setTimeout(() => {
          clearSession();
        }, 2000); // Give user 2 seconds to see "cancelled" state
        
      } else {
        console.error('❌ Failed to send stop signal');
        alert('Failed to stop automation. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error stopping automation:', error);
      alert('Error stopping automation. Please try again.');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    if (status !== 'running') {
      clearSession();
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
                {scenarioName || 'Test Automation'}
              </p>
              <p className="text-xs opacity-90">
                {config.message}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-2">
            {status === 'running' ? (
              // Cancel button for running automation
              <button
                onClick={handleCancel}
                disabled={isCanceling}
                className="hover:bg-white hover:bg-opacity-20 rounded p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Cancel automation"
              >
                {isCanceling ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </button>
            ) : (
              // Close button for completed/error/cancelled
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

        {/* Progress bar for running status */}
        {status === 'running' && progress.total > 0 && (
          <div className="mt-2">
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs mt-1 opacity-90">
              {progress.current} / {progress.total} steps
            </p>
          </div>
        )}

        {/* Status message for cancelled/error */}
        {(status === 'cancelled' || status === 'error') && (
          <div className="mt-2 text-xs opacity-90 bg-white bg-opacity-20 rounded p-2">
            {status === 'cancelled' ? 'The automation was stopped.' : 'An error occurred during automation.'}
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

export default FloatingAutomationWidget;