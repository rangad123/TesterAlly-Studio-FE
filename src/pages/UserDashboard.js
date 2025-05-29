import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./style.css";

const UserDashboard = () => {
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [showCloneWarning, setShowCloneWarning] = useState(false);
  const [isGitHubConnected, setIsGitHubConnected] = useState(null); // null = loading, true/false = status
  const [isRepoCloned, setIsRepoCloned] = useState(null);
  const [clonePath, setClonePath] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    const checkGitHubConnectionAndCloneStatus = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem("userId");

        if (!userId) {
          console.error("User ID not found");
          setLoading(false);
          return;
        }

        const gitResponse = await fetch(`http://127.0.0.1:8000/integrate/git_status/?user_id=${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (gitResponse.ok) {
          const gitData = await gitResponse.json();
          console.log("GitHub response:", gitData);
          const isConnected = gitData.connected || false;

          setIsGitHubConnected(isConnected);

          if (isConnected) {
            await checkCloneStatus(userId);
          } else {
            setShowGitHubModal(true);
          }
        } else {
          console.error("Failed to check GitHub connection");
          setIsGitHubConnected(false);
          setShowGitHubModal(true);
        }
      } catch (error) {
        console.error("Error checking GitHub connection:", error);
        setIsGitHubConnected(false);
        setShowGitHubModal(true);
      } finally {
        setLoading(false);
      }
    };

    checkGitHubConnectionAndCloneStatus();
  }, []); 

  const checkCloneStatus = async (userId) => {
    try {

      const cloneResponse = await fetch(`http://127.0.0.1:8000/integrate/clone_status/?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (cloneResponse.ok) {
        const cloneData = await cloneResponse.json();
        console.log("Clone response:", cloneData);
        const isCloned = cloneData.cloned || false;
        const path = cloneData.clone_path || "";
        
        setIsRepoCloned(isCloned);
        setClonePath(path);
        
        if (!isCloned) {
          setShowCloneWarning(true);
        }
      } else {
        console.error("Failed to check clone status");
        setIsRepoCloned(false);
        setShowCloneWarning(true);
      }
    } catch (error) {
      console.error("Error checking clone status:", error);
      setIsRepoCloned(false);
      setShowCloneWarning(true);
    }
  };

  const handleConnectGitHub = () => {
    navigate("/github");
    setShowGitHubModal(false);
  };

  const handleSkipForNow = () => {
    setShowGitHubModal(false);
    toast.info("You can connect GitHub anytime from Integration.");
  };

  const handleCloneRepository = () => {
    navigate("/github");
    setShowCloneWarning(false);
  };

  const handleSkipClone = () => {
    setShowCloneWarning(false);
    toast.info("You can clone the repository later from project settings.");
  };

  const GitHubConnectionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="text-center">
          {/* GitHub Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
            <svg className="h-6 w-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            GitHub Integration Required
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            You need to connect with GitHub before creating projects. This allows TesterAlly to access your repositories and provide better testing automation.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleConnectGitHub}
              className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 transition-colors font-medium"
            >
              Connect with GitHub
            </button>
            
            <button
              onClick={handleSkipForNow}
              className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 transition-colors"
            >
              Skip for now
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            You can always connect GitHub later from your account settings.
          </p>
        </div>
      </div>
    </div>
  );

  const CloneWarningModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Repository Not Cloned
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            Your GitHub repository is not cloned locally yet. You need to clone the repository to start creating and running test automation projects.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleCloneRepository}
              className="w-full py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:ring-4 focus:ring-yellow-300 transition-colors font-medium"
            >
              Clone Repository Now
            </button>
            
            <button
              onClick={handleSkipClone}
              className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 transition-colors"
            >
              Skip for now
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            You can clone the repository later from project settings.
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="main-content">
          <div className="text-center space-y-5">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="text-center space-y-5">
          <h1 className="text-5xl font-bold">Welcome to TesterAlly</h1>
          <p className="text-xl text-gray-600">
            AI-based Test Automation Tool to simplify your testing process. Empower your testing with the power of AI.
          </p>
          
          {/* GitHub Connection Status */}
          {isGitHubConnected !== null && (
            <div className="mt-8 space-y-4">
              {isGitHubConnected ? (
                <>
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    GitHub Connected
                  </div>
                  
                  {/* Repository Clone Status */}
                  {isRepoCloned !== null && (
                    <div>
                      {isRepoCloned ? (
                        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                          </svg>
                          Repository Cloned
                          {clonePath && (
                            <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
                              {clonePath.split('\\').pop() || clonePath.split('/').pop()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-lg">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Repository Not Cloned
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  GitHub Not Connected
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* GitHub Connection Modal */}
      {showGitHubModal && <GitHubConnectionModal />}
      
      {/* Clone Warning Modal */}
      {showCloneWarning && <CloneWarningModal />}
    </div>
  );
};

export default UserDashboard;