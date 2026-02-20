// AiChatContext.js
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AiChatContext = createContext();

export const useAiChat = () => {
  const context = useContext(AiChatContext);
  if (!context) {
    throw new Error('useAiChat must be used within AiChatProvider');
  }
  return context;
};

export const AiChatProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [isFloatingWidgetVisible, setIsFloatingWidgetVisible] = useState(false);

  // The active fetch AbortController lives here in context — outside any
  // component. Navigation (unmount/remount of AiChat) does NOT cancel it.
  const activeFetchController = useRef(null);

  // ─── internal helper ────────────────────────────────────────────────────────

  const mergeSession = useCallback((updates) => {
    setCurrentSession((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates, updatedAt: new Date().toISOString() };
    });
  }, []);

  // ─── public API ─────────────────────────────────────────────────────────────

  /**
   * initChatSession
   * Call ONCE when the very first message of a brand-new chat is sent.
   */
  const initChatSession = useCallback((sessionData) => {
    setCurrentSession({
      id: `session_${Date.now()}`,
      messages: [],
      inputMessage: '',
      isLoading: false,
      chatHistory: [],
      currentChatId: null,
      projectData: null,
      scenarioName: '',
      scenarioType: '',
      scenarioPriority: '',
      testUrl: '',
      apiKey: null,
      gptVersion: null,
      useClaude: false,
      startedAt: new Date().toISOString(),
      ...sessionData,
    });
    setIsFloatingWidgetVisible(true);
  }, []);

  /**
   * saveSessionSnapshot
   * Called on component unmount — merges latest local state into context.
   * Never resets session id or startedAt.
   */
  const saveSessionSnapshot = useCallback((snapshot) => {
    setCurrentSession((prev) => {
      if (!prev) {
        return {
          id: `session_${Date.now()}`,
          startedAt: new Date().toISOString(),
          ...snapshot,
          savedAt: new Date().toISOString(),
        };
      }
      return { ...prev, ...snapshot, savedAt: new Date().toISOString() };
    });

    if (snapshot.messages && snapshot.messages.length > 0) {
      setIsFloatingWidgetVisible(true);
    }
  }, []);

  /**
   * updateChatSession
   * Lightweight live merge — called from component during active chat.
   */
  const updateChatSession = useCallback((updates) => {
    mergeSession(updates);
  }, [mergeSession]);

  /**
   * dispatchTestRequest
   * The actual API fetch lives HERE in context — not inside AiChat component.
   *
   * This means the HTTP request survives React navigation/unmount/remount.
   * When response arrives, session is updated in context regardless of whether
   * the AiChat component is currently mounted.
   *
   * onSuccess(assistantMessage, updatedChatHistory, updatedChatId)
   *   — called only when component is still mounted, passing computed values
   *     directly so the component can sync local state without a second read.
   */
  const dispatchTestRequest = useCallback(async ({
    userMessage,
    requestBody,
    currentChatId,
    onSuccess,
  }) => {
    // Cancel any previous in-flight request before starting a new one
    if (activeFetchController.current) {
      activeFetchController.current.abort();
    }
    activeFetchController.current = new AbortController();
    const { signal } = activeFetchController.current;

    // Optimistically append user message and set loading on session
    setCurrentSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...(prev.messages || []), userMessage],
        isLoading: true,
        updatedAt: new Date().toISOString(),
      };
    });

    try {
      const response = await fetch('http://127.0.0.1:8000/agentic/test/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get response');
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data,
        timestamp: new Date().toISOString(),
      };

      // Compute the updated chat history synchronously inside the setState
      // updater so we capture the exact same values that go into the session.
      // These are then passed directly to onSuccess — no second async read needed.
      let finalChatHistory = [];
      let finalChatId = null;

      setCurrentSession((prev) => {
        if (!prev) return prev;

        let updatedChatHistory = [...(prev.chatHistory || [])];
        const chatId = currentChatId || prev.currentChatId;
        let newCurrentChatId = prev.currentChatId;

        if (chatId) {
          updatedChatHistory = updatedChatHistory.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, userMessage, assistantMessage],
                  updatedAt: new Date(),
                }
              : chat
          );
          newCurrentChatId = chatId;
        } else {
          const newChat = {
            id: Date.now(),
            title:
              userMessage.content.slice(0, 50) +
              (userMessage.content.length > 50 ? '...' : ''),
            messages: [userMessage, assistantMessage],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          updatedChatHistory = [newChat, ...updatedChatHistory];
          newCurrentChatId = newChat.id;
        }

        // Capture for the onSuccess call below — same computed values
        finalChatHistory = updatedChatHistory;
        finalChatId = newCurrentChatId;

        return {
          ...prev,
          messages: [...(prev.messages || []), assistantMessage],
          isLoading: false,
          chatHistory: updatedChatHistory,
          currentChatId: newCurrentChatId,
          updatedAt: new Date().toISOString(),
        };
      });

      // Notify the component if it is still mounted so it can sync local state.
      // Passes the exact same computed values — no stale reads.
      if (typeof onSuccess === 'function') {
        onSuccess(assistantMessage, finalChatHistory, finalChatId);
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        // Intentional abort from a new request — do not update session
        return;
      }

      console.error('dispatchTestRequest error:', error);

      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: { error: true, message: error.message },
        timestamp: new Date().toISOString(),
      };

      setCurrentSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), errorMessage],
          isLoading: false,
          updatedAt: new Date().toISOString(),
        };
      });

    } finally {
      activeFetchController.current = null;
    }
  }, []);

  const hideFloatingWidget = useCallback(() => {
    setIsFloatingWidgetVisible(false);
  }, []);

  const showFloatingWidget = useCallback(() => {
    setIsFloatingWidgetVisible((prev) => {
      if (currentSession && currentSession.messages?.length > 0) return true;
      return prev;
    });
  }, [currentSession]);

  const clearSession = useCallback(() => {
    if (activeFetchController.current) {
      activeFetchController.current.abort();
      activeFetchController.current = null;
    }
    setCurrentSession(null);
    setIsFloatingWidgetVisible(false);
  }, []);

  const value = {
    currentSession,
    isFloatingWidgetVisible,
    initChatSession,
    saveSessionSnapshot,
    updateChatSession,
    dispatchTestRequest,
    hideFloatingWidget,
    showFloatingWidget,
    clearSession,
    startChatSession: initChatSession, // legacy alias
  };

  return (
    <AiChatContext.Provider value={value}>
      {children}
    </AiChatContext.Provider>
  );
};