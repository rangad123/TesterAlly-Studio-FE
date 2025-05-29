import React, { useState, useEffect, useCallback } from 'react';
import MemberSidebar from "./MemberSidebar";
import { Github, CheckCircle, AlertCircle, Loader2, FolderOpen, Download } from 'lucide-react';

function MemberGithub() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gitStatus, setGitStatus] = useState(null);
  const [paths, setPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState('');
  const [cloneStatus, setCloneStatus] = useState('');
  const [cloneMessage, setCloneMessage] = useState('');
  const [cloneLoading, setCloneLoading] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [isRepoCloned, setIsRepoCloned] = useState(null);


    const checkGitStatusAndCloneStatus = useCallback(async () => {
    try {
        setLoading(true);
        setError('');
        const userId = localStorage.getItem("userId");

        if (!userId) {
        setError('User ID not found');
        setLoading(false);
        return;
        }

        // Check git status first
        const gitResponse = await fetch(`http://127.0.0.1:8000/integrate/git_status/?user_id=${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
        });

        if (gitResponse.ok) {
        const gitData = await gitResponse.json();
        console.log("Git status response:", gitData);
        setGitStatus(gitData);

        // If admin has connected with GitHub and repository is assigned
        if (gitData.connected && gitData.repository) {
            // Check clone status
            await checkCloneStatus(userId);
        }
        } else {
        console.error("Failed to check git status");
        setError('Failed to check git status');
        setGitStatus({ connected: false });
        }
    } catch (err) {
        console.error('Error checking git status:', err);
        setError('Failed to check git status');
        setGitStatus({ connected: false });
    } finally {
        setLoading(false);
    }
    }, []);

    useEffect(() => {
    checkGitStatusAndCloneStatus();
    }, [checkGitStatusAndCloneStatus]);

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
        console.log("Clone status response:", cloneData);
        setIsRepoCloned(cloneData.cloned || false);
      } else {
        console.error("Failed to check clone status");
        setIsRepoCloned(false);
      }
    } catch (error) {
      console.error("Error checking clone status:", error);
      setIsRepoCloned(false);
    }
  };

  const fetchPaths = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching paths...');
      
      const response = await fetch('http://127.0.0.1:8000/integrate/get_path/');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Paths fetched:', data);
        setPaths(data.paths || []);
        setShowPaths(true);
      } else {
        console.error('Failed to fetch paths:', response.status);
        setError('Failed to fetch available paths');
      }
    } catch (err) {
      console.error('Failed to fetch paths:', err);
      setError('Failed to fetch available paths');
    } finally {
      setLoading(false);
    }
  };

  const cloneRepository = async () => {
    if (!selectedPath) {
      setError('Please select a path for cloning');
      return;
    }

    setCloneLoading(true);
    setError('');
    setCloneStatus('');
    setCloneMessage('');

    try {
      const userId = localStorage.getItem("userId");
      const response = await fetch('http://127.0.0.1:8000/integrate/clone_repo/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          selected_path: selectedPath
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Clone response:', data);
        
        if (data.status === 'success') {
          setCloneStatus('success');
          setCloneMessage(data.message || 'Repository cloned successfully to the selected path');
          setIsRepoCloned(true);
        } else {
          setCloneStatus('error');
          setCloneMessage(data.message || 'Failed to clone repository');
          setError(data.message || 'Failed to clone repository');
        }
      } else {
        setCloneStatus('error');
        setCloneMessage('Failed to clone repository - server error');
        setError('Failed to clone repository - server error');
      }
    } catch (err) {
      console.error('Failed to clone repository:', err);
      setCloneStatus('error');
      setCloneMessage('Network error - failed to clone repository');
      setError('Network error - failed to clone repository');
    } finally {
      setCloneLoading(false);
    }
  };

  return (
    <div>
      <MemberSidebar />
      <div className="flex justify-center items-start pt-8 px-4">
        <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <Github className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Repository Clone</h1>
                <p className="text-purple-100">Clone your assigned repository</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Checking repository status...</p>
              </div>
            )}

            {/* Admin Not Connected */}
            {!loading && gitStatus && (!gitStatus.connected || !gitStatus.repository) && (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Admin Setup Required</h3>
                  <p className="text-gray-600 mb-4">
                    Your admin has not connected with GitHub yet or hasn't assigned a repository. 
                    Please inform your administrator to complete the GitHub setup.
                  </p>
                  <button
                    onClick={checkGitStatusAndCloneStatus}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            )}

            {/* Repository Information */}
            {!loading && gitStatus && gitStatus.connected && gitStatus.repository && (
              <>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 rounded-full p-3">
                      <Github className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Assigned Repository</h3>
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <div className="font-semibold text-purple-700 text-lg">{gitStatus.repository}</div>
                        {gitStatus.branch && (
                          <div className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Branch:</span> {gitStatus.branch}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-3 bg-gray-50 px-3 py-1 rounded inline-block">
                          {gitStatus.repository}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clone Status Display */}
                {isRepoCloned !== null && (
                  <div className="mb-6">
                    {isRepoCloned ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-green-700">Repository Already Cloned</div>
                            <div className="text-green-600 text-sm mt-1">Your repository is already cloned locally</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-yellow-700">Repository Not Cloned</div>
                            <div className="text-yellow-600 text-sm mt-1">Please clone the repository to start working</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Clone Success Message */}
                {cloneStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-green-700">Clone Successful!</div>
                        <div className="text-green-600 text-sm mt-1">{cloneMessage}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clone Error Message */}
                {cloneStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-red-700">Clone Failed</div>
                        <div className="text-red-600 text-sm mt-1">{cloneMessage}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions - Only show if repo is not cloned */}
                {!isRepoCloned && (
                  <div className="space-y-4">
                    
                    {/* Select Path Button */}
                    <button
                      onClick={() => {
                        if (paths.length === 0) {
                          fetchPaths();
                        } else {
                          setShowPaths(!showPaths);
                        }
                      }}
                      disabled={loading}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 shadow-md hover:shadow-lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Loading Paths...</span>
                        </>
                      ) : (
                        <>
                          <FolderOpen className="w-5 h-5" />
                          <span>{showPaths ? 'Hide Clone Paths' : 'Select Clone Path'}</span>
                        </>
                      )}
                    </button>

                    {/* Path Selection */}
                    {showPaths && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <FolderOpen className="w-5 h-5 mr-2 text-purple-600" />
                          Select Clone Destination
                        </h3>
                        
                        {paths.length > 0 ? (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {paths.map((pathItem, index) => (
                              <div 
                                key={index}
                                onClick={() => setSelectedPath(pathItem.path)}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                                  selectedPath === pathItem.path 
                                    ? 'bg-purple-50 border-purple-500 shadow-md' 
                                    : 'bg-white border-gray-200 hover:border-purple-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <FolderOpen className="w-5 h-5 text-gray-600" />
                                    <div>
                                      <div className="font-medium text-gray-800">{pathItem.name}</div>
                                      <div className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                                        {pathItem.path}
                                      </div>
                                    </div>
                                  </div>
                                  {selectedPath === pathItem.path && (
                                    <CheckCircle className="w-6 h-6 text-purple-600" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No clone paths available</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Clone Repository Button */}
                    {selectedPath && (
                      <button
                        onClick={cloneRepository}
                        disabled={cloneLoading || !selectedPath}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 shadow-md hover:shadow-lg"
                      >
                        {cloneLoading ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>Cloning Repository...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-6 h-6" />
                            <span>Clone Repository</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Selected Path Info */}
                    {selectedPath && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm">
                          <span className="text-blue-700 font-medium">Selected path: </span>
                          <span className="text-blue-600 font-mono">{selectedPath}</span>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Already Cloned Actions */}
                {isRepoCloned && (
                  <div className="space-y-4">
                    <button
                      onClick={checkGitStatusAndCloneStatus}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3"
                    >
                      <Loader2 className="w-5 h-5" />
                      <span>Refresh Status</span>
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default MemberGithub;