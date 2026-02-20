// FloatingAiChatWidget.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAiChat } from '../pages/AiChatContext';
import { MessageCircle, Loader, X, Eye, AlertCircle } from 'lucide-react';

const FloatingAiChatWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentSession, hideFloatingWidget, isFloatingWidgetVisible, clearSession } = useAiChat();
  const [isDismissing, setIsDismissing] = useState(false);

  // Don't show widget if not visible, no session, already on AI Chat page,
  // or session has no messages worth resuming.
  if (
    !isFloatingWidgetVisible ||
    !currentSession ||
    location.pathname === '/ai-chat'
  ) {
    return null;
  }

  const { messages = [], isLoading, scenarioName, projectData } = currentSession;
  const messageCount = messages.filter((m) => m.role === 'user').length;

  const getStatusConfig = () => {
    if (isLoading) {
      return {
        icon: Loader,
        bgColor: 'bg-blue-500',
        textColor: 'text-white',
        message: 'Generating test strategy...',
        iconClass: 'animate-spin',
      };
    }

    if (messages.length === 0) {
      return {
        icon: MessageCircle,
        bgColor: 'bg-purple-500',
        textColor: 'text-white',
        message: 'AI Chat conversation ready',
        iconClass: '',
      };
    }

    return {
      icon: MessageCircle,
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      message: `${messageCount} question${messageCount !== 1 ? 's' : ''} asked`,
      iconClass: '',
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const handleViewChat = () => {
    // Pass the full current session snapshot so AiChat.js restores it exactly.
    // resumeSession: true tells AiChat to use location.state.sessionData
    // rather than falling back to the context value (which may lag behind
    // if React batched the last saveSessionSnapshot update).
    navigate('/ai-chat', {
      state: {
        resumeSession: true,
        sessionData: currentSession,
      },
    });
    hideFloatingWidget();
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsDismissing(true);
    setTimeout(() => {
      hideFloatingWidget();
      setIsDismissing(false);
    }, 300);
  };

  const handleClearSession = (e) => {
    e.stopPropagation();
    if (
      window.confirm(
        'Are you sure you want to clear this AI Chat session? This action cannot be undone.'
      )
    ) {
      clearSession();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`${config.bgColor} ${config.textColor} rounded-lg shadow-2xl p-4 max-w-sm cursor-pointer hover:shadow-3xl transition-all duration-300 hover:scale-105 ${
          isDismissing ? 'opacity-0 transform scale-95' : 'opacity-100'
        }`}
        onClick={handleViewChat}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <Icon className={`w-5 h-5 ${config.iconClass}`} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {scenarioName || 'AI Test Chat'}
              </p>
              <p className="text-xs opacity-90">{config.message}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={handleClearSession}
              className="hover:bg-white hover:bg-opacity-20 rounded p-1.5 transition-colors"
              title="Clear session"
            >
              <AlertCircle className="w-4 h-4" />
            </button>
            <button
              onClick={handleDismiss}
              className="hover:bg-white hover:bg-opacity-20 rounded p-1.5 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Project Info */}
        {projectData && (
          <div className="mt-2 text-xs opacity-90 bg-white bg-opacity-20 rounded p-2">
            <p className="truncate">
              <span className="font-medium">Project:</span> {projectData.project_type}
            </p>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="mt-2">
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300 animate-pulse"
                style={{ width: '60%' }}
              />
            </div>
            <p className="text-xs mt-1 opacity-90">Processing your request...</p>
          </div>
        )}

        {/* Message count */}
        {!isLoading && messages.length > 0 && (
          <div className="mt-2 text-xs opacity-90 bg-white bg-opacity-20 rounded p-2">
            <p>
              {messages.length} message{messages.length !== 1 ? 's' : ''} in conversation
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-3 flex items-center gap-2 text-xs opacity-90 hover:opacity-100">
          <Eye className="w-3 h-3" />
          <span>Click to continue chat</span>
        </div>
      </div>
    </div>
  );
};

export default FloatingAiChatWidget;