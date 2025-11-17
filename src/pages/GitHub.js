import React, { useState, useEffect, useCallback } from 'react';
import { Github, CheckCircle, AlertCircle, Loader2, ArrowLeft, BookOpen, FolderOpen } from 'lucide-react';

function GitHub() {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState({ name: 'GitHub User' });
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentView, setCurrentView] = useState('main'); 
  const [repoSelected, setRepoSelected] = useState(false);
  const [connectedRepo, setConnectedRepo] = useState('');
  
  const [paths, setPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState('');
  const [cloneStatus, setCloneStatus] = useState('');
  const [cloneMessage, setCloneMessage] = useState('');
  const [cloneLoading, setCloneLoading] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  
  const userId = localStorage.getItem("userId");

  const checkCloneStatusOnLoad = useCallback(async (repository) => {
    try {
      console.log('Checking clone status for:', repository);
      const response = await fetch(`http://127.0.0.1:8000/integrate/clone_status/?user_id=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Clone status response:', data);
        
        if (data.cloned && data.clone_path) {
          setCloneStatus('success');
          setCloneMessage(`Repository already cloned at: ${data.clone_path}`);
          setSelectedPath(data.clone_path);
          console.log('Repository is already cloned at:', data.clone_path);
        } else {
          setCloneStatus('');
          setCloneMessage('');
          setSelectedPath('');
          console.log('Repository not cloned yet');
        }
      }
    } catch (err) {
      console.error('Failed to check clone status:', err);
    }
  }, [userId]); 
  
  const checkConnectionStatus = useCallback(async () => {
    try {
      setConnectionStatus('checking');
      console.log('Checking connection status...');
      
      const response = await fetch(`http://127.0.0.1:8000/integrate/git_status/?user_id=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Connection check response:', data);
        
        if (data.connected) {
          setConnectionStatus('connected');
          if (data.repository) {
            setConnectedRepo(data.repository);
            setRepoSelected(true);
            
            // Check clone status after confirming connection
            checkCloneStatusOnLoad(data.repository);
          }
          
          // Fetch repositories list
          const repoResponse = await fetch(`http://127.0.0.1:8000/integrate/github/repositories/?user_id=${userId}`);
          if (repoResponse.ok) {
            const repoData = await repoResponse.json();
            if (repoData.repositories && Array.isArray(repoData.repositories)) {
              setRepositories(repoData.repositories);
            }
          }
        } else {
          setConnectionStatus('disconnected');
        }
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (err) {
      console.error('Failed to check connection status:', err);
      setConnectionStatus('disconnected');
    }
  }, [userId, checkCloneStatusOnLoad]);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    
    if (success === 'true' && connected === 'github') {
      setShowSuccessModal(true);
      setConnectionStatus('connected');
      window.history.replaceState({}, document.title, window.location.pathname);
      checkConnectionStatus();
    } else if (error) {
      setError(`Authentication failed: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [checkConnectionStatus]);

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
        setError('Failed to fetch paths');
      }
    } catch (err) {
      console.error('Failed to fetch paths:', err);
      setError('Failed to fetch paths');
    } finally {
      setLoading(false);
    }
  };

  const cloneRepository = async () => {
    if (!selectedPath || !connectedRepo) {
      setError('Please select a path and ensure repository is connected');
      return;
    }

    setCloneLoading(true);
    setError('');
    setCloneStatus('');
    setCloneMessage('');

    try {
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
          setCloneMessage(data.message || 'Repository cloned successfully');
        } else {
          setCloneStatus('error');
          setCloneMessage(data.message || 'Failed to clone repository');
          setError(data.message || 'Failed to clone repository');
        }
      } else if (response.status === 400) {
        const errorData = await response.json();
        console.error('Backend 400 response:', errorData);

        const message = errorData.message || 'You have already cloned this repository. Please check.';
        setCloneStatus('error');
        setCloneMessage(message);
        setError(message);
      } else {
        setCloneStatus('error');
        setCloneMessage('Failed to clone repository');
        setError('Failed to clone repository');
      }
    } catch (err) {
      console.error('Failed to clone repository:', err);
      setCloneStatus('error');
      setCloneMessage('Failed to clone repository');
      setError('Failed to clone repository');
    } finally {
      setCloneLoading(false);
    }
  };

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching repositories...');
      
      const response = await fetch(`http://127.0.0.1:8000/integrate/github/repositories/?user_id=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Repositories fetched:', data);
        setRepositories(data.repositories || []);
        setConnectionStatus('connected');
      } else {
        console.error('Failed to fetch repositories:', response.status);
        setError('Failed to fetch repositories');
        if (response.status === 401 || response.status === 403) {
          setConnectionStatus('disconnected');
        }
      }
    } catch (err) {
      console.error('Failed to fetch repositories:', err);
      setError('Failed to fetch repositories');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const connectGitHub = async () => {
    if (!userId) {
      setError("No userId found");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const loginUrl = `http://127.0.0.1:8000/integrate/github/login/?user_id=${userId}`;
      window.location.href = loginUrl;
    } catch (err) {
      setError('Failed to connect to GitHub');
      setLoading(false);
    }
  };

  const selectRepository = async () => {
    if (!selectedRepo) {
      setError('Please select a repository');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/integrate/github/select_repository/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          repository: selectedRepo
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setError('');
          setRepoSelected(true);
          setConnectedRepo(selectedRepo);
          setCurrentView('main'); // Go back to main view to show path options
        } else {
          setError(data.error || 'Failed to select repository');
        }
      } else {
        setError('Failed to select repository');
      }
    } catch (err) {
      setError('Failed to select repository');
    } finally {
      setLoading(false);
    }
  };

  const disconnectGitHub = async () => {
    if (!window.confirm('Are you sure you want to disconnect GitHub? This will remove all GitHub integration data.')) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://127.0.0.1:8000/integrate/github/disconnect/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Disconnect response:', data);
        
        // Reset all states
        setConnectionStatus('disconnected');
        setUserInfo({ name: 'GitHub User' });
        setRepositories([]);
        setSelectedRepo('');
        setConnectedRepo('');
        setRepoSelected(false);
        setCurrentView('main');
        setPaths([]);
        setSelectedPath('');
        setCloneStatus('');
        setCloneMessage('');
        setShowPaths(false);
        
        // Show success message
        alert('GitHub disconnected successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to disconnect from GitHub');
      }
    } catch (err) {
      console.error('Failed to disconnect from GitHub:', err);
      setError('Failed to disconnect from GitHub');
    } finally {
      setLoading(false);
    }
  };

  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto bg-gradient-to-r from-green-400 to-green-600 rounded-full w-20 h-20 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Successfully Connected!</h3>
          <p className="text-gray-600 mb-6">
            Your GitHub account has been connected successfully.
          </p>
          <button
            onClick={() => {
              setShowSuccessModal(false);
              setCurrentView('main');
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  const MainView = () => (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Github className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">GitHub Integration</h2>
        <p className="text-gray-600">Connect and manage your repositories</p>
      </div>

      {/* Status Cards */}
      {connectionStatus === 'checking' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-blue-700 font-medium">Checking connection status...</span>
          </div>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-green-700 font-bold text-lg">Connected to GitHub</span>
          </div>
          <div className="text-green-700 space-y-1">
            <p className="font-medium">Welcome, {userInfo.name || userInfo.login || 'GitHub User'}!</p>
            {userInfo.email && <p className="text-sm opacity-90">Email: {userInfo.email}</p>}
          </div>
        </div>
      )}

      {connectionStatus === 'disconnected' && (
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-8 shadow-sm">
          <div className="text-center">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Github className="w-8 h-8 text-gray-500" />
            </div>
            <span className="text-gray-600 font-medium">Not connected to GitHub</span>
            <p className="text-sm text-gray-500 mt-2">Connect to access your repositories</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        {connectionStatus === 'disconnected' && (
          <button
            onClick={connectGitHub}
            disabled={loading || !userId}
            className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Github className="w-6 h-6" />
                <span>Connect with GitHub</span>
              </>
            )}
          </button>
        )}

        {connectionStatus === 'connected' && (
          <div className="grid gap-4">
            {!repoSelected ? (
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Select Repository</h3>
                <p className="text-gray-500 text-sm mb-6">Choose a repository to connect with your project</p>
                <button
                  onClick={() => {
                    setCurrentView('repositories');
                    if (repositories.length === 0) {
                      fetchRepositories();
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Browse Repositories
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {/* Repository Connected Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Repository Connected</h3>
                      <p className="text-blue-600 font-medium">{connectedRepo}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentView('repositories')}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                  >
                    <span>Change Repository</span>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>

                {/* Clone Status Display - Show if already cloned */}
                {cloneStatus === 'success' && selectedPath ? (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="text-green-700 font-bold text-lg">Repository Cloned</span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Clone Location:</p>
                        <p className="font-mono text-sm text-gray-800 break-all">{selectedPath}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Show path selection only if not cloned */
                  <>
                    {/* Clone Error Message */}
                    {cloneStatus === 'error' && (
                      <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center space-x-3 mb-2">
                          <AlertCircle className="w-6 h-6 text-red-600" />
                          <span className="text-red-700 font-bold text-lg">Clone Failed</span>
                        </div>
                        <p className="text-red-600 pl-9">{cloneMessage}</p>
                      </div>
                    )}

                    {/* Path Selection Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-600 rounded-full w-10 h-10 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">Clone Location</h3>
                            <p className="text-gray-500 text-sm">Select destination path</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (paths.length === 0) {
                              fetchPaths();
                            } else {
                              setShowPaths(!showPaths);
                            }
                          }}
                          disabled={loading}
                          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <FolderOpen className="w-4 h-4" />
                              <span>{showPaths ? 'Hide' : 'Browse'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Path Selection */}
                      {showPaths && paths.length > 0 && (
                        <div className="space-y-3">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-700 mb-3">Available Paths:</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {paths.map((pathItem, index) => (
                                <div 
                                  key={index}
                                  onClick={() => setSelectedPath(pathItem.path)}
                                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                    selectedPath === pathItem.path 
                                      ? 'bg-purple-50 border-purple-500 shadow-md' 
                                      : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <FolderOpen className="w-5 h-5 text-gray-600" />
                                      <div>
                                        <div className="font-medium text-gray-800">{pathItem.name}</div>
                                        <div className="text-sm text-gray-600">{pathItem.path}</div>
                                      </div>
                                    </div>
                                    {selectedPath === pathItem.path && (
                                      <CheckCircle className="w-5 h-5 text-purple-600" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedPath && cloneStatus !== 'success' && (
                        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-sm text-purple-700">
                            <span className="font-medium">Selected Path:</span> {selectedPath}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Clone Button - Only show if not cloned */}
                    {selectedPath && cloneStatus !== 'success' && (
                      <button
                        onClick={cloneRepository}
                        disabled={cloneLoading || !selectedPath}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        {cloneLoading ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>Cloning Repository...</span>
                          </>
                        ) : (
                          <>
                            <Github className="w-6 h-6" />
                            <span>Clone Repository</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Disconnect Button */}
            <button
              onClick={disconnectGitHub}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-red-400 disabled:to-rose-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Disconnecting...</span>
                </>
              ) : (
                <span>Disconnect GitHub</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const RepositoriesView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setCurrentView('main')}
          className="p-3 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-gray-800">
            {repoSelected ? 'Change Repository' : 'Select Repository'}
          </h2>
          <p className="text-gray-600 text-sm mt-1">Choose from your GitHub repositories</p>
        </div>
        <div className="w-12"></div> {/* Spacer for center alignment */}
      </div>

      {/* Current Repository Info */}
      {connectedRepo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-700 font-medium">Currently Connected</p>
              <p className="font-bold text-gray-800">{connectedRepo}</p>
            </div>
          </div>
        </div>
      )}

      {/* Repository List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
            <span className="text-blue-700 text-lg">Loading repositories...</span>
          </div>
        ) : repositories.length > 0 ? (
          <div>
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Available Repositories</h3>
              <p className="text-gray-600 text-sm mt-1">
                {repoSelected ? 'Select a different repository:' : 'Select a repository to connect:'}
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {repositories.map((repo, index) => (
                <div 
                  key={repo.full_name}
                  onClick={() => setSelectedRepo(repo.full_name)}
                  className={`p-6 border-b border-gray-100 last:border-b-0 cursor-pointer transition-all duration-200 ${
                    selectedRepo === repo.full_name 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : 'hover:bg-gray-50'
                  } ${
                    connectedRepo === repo.full_name ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-100 rounded-lg w-12 h-12 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-lg">{repo.name}</div>
                        {repo.description && (
                          <div className="text-gray-600 mt-1 line-clamp-2">{repo.description}</div>
                        )}
                        <div className="flex items-center space-x-4 mt-3">
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {repo.full_name}
                          </div>
                          {connectedRepo === repo.full_name && (
                            <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded font-medium">
                              Currently Connected
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedRepo === repo.full_name && (
                      <CheckCircle className="w-6 h-6 text-green-600 ml-4" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={selectRepository}
                disabled={loading || !selectedRepo || selectedRepo === connectedRepo}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Selecting Repository...</span>
                  </>
                ) : selectedRepo === connectedRepo ? (
                  <span>Repository Already Connected</span>
                ) : (
                  <span>{repoSelected ? 'Change to Selected Repository' : 'Connect Selected Repository'}</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-12">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Github className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No repositories found</h3>
            <p className="text-gray-500 mb-6">
              We couldn't find any repositories in your GitHub account.
            </p>
            <button
              onClick={fetchRepositories}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Refresh Repositories
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="from-gray-50 to-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {showSuccessModal && <SuccessModal />}
            
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6 mb-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              </div>
            )}

            {currentView === 'main' && <MainView />}
            {currentView === 'repositories' && <RepositoriesView />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GitHub;