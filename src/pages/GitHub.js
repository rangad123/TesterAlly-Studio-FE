import React, { useState, useEffect } from 'react';
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
  
  // New state for path selection and cloning
  const [paths, setPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState('');
  const [cloneStatus, setCloneStatus] = useState('');
  const [cloneMessage, setCloneMessage] = useState('');
  const [cloneLoading, setCloneLoading] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  
  const userId = 2;

  // Check connection status when component mounts
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const success = urlParams.get('success');
    
    if (code && success === 'true') {
      setShowSuccessModal(true);
      setConnectionStatus('connected');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Check connection status by trying to fetch repositories
  const checkConnectionStatus = async () => {
    try {
      setConnectionStatus('checking');
      console.log('Checking connection status...');
      
      const response = await fetch(`http://127.0.0.1:8000/integrate/github/repositories/?user_id=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Connection check response:', data);
        
        if (data.repositories && Array.isArray(data.repositories)) {
          setConnectionStatus('connected');
          setRepositories(data.repositories);
        } else {
          setConnectionStatus('disconnected');
        }
      } else if (response.status === 401 || response.status === 403) {
        setConnectionStatus('disconnected');
      } else {
        console.error('Failed to check connection:', response.status);
        setConnectionStatus('disconnected');
      }
    } catch (err) {
      console.error('Failed to check connection status:', err);
      setConnectionStatus('disconnected');
    }
  };

  // Fetch available paths
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

  // Clone repository to selected path
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
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/github/disconnect/?user_id=${userId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setConnectionStatus('disconnected');
        setUserInfo(null);
        setRepositories([]);
        setSelectedRepo('');
        setConnectedRepo('');
        setRepoSelected(false);
        setCurrentView('main');
        // Reset clone-related states
        setPaths([]);
        setSelectedPath('');
        setCloneStatus('');
        setCloneMessage('');
        setShowPaths(false);
      } else {
        setError('Failed to disconnect from GitHub');
      }
    } catch (err) {
      setError('Failed to disconnect from GitHub');
    } finally {
      setLoading(false);
    }
  };

  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="text-center mb-4">
          <div className="mx-auto bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Successfully Connected!</h3>
          <p className="text-gray-600 mt-2">
            Your GitHub account has been connected successfully.
          </p>
        </div>
        <button
          onClick={() => {
            setShowSuccessModal(false);
            setCurrentView('main');
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const MainView = () => (
    <div>
      <div className="text-center mb-6">
        <div className="bg-gray-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Github className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">GitHub Integration</h2>
      </div>

      {connectionStatus === 'checking' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-700">Checking connection status...</span>
          </div>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-semibold">Connected to GitHub</span>
          </div>
          <div className="text-green-600 text-sm">
            <p>Welcome, {userInfo.name || userInfo.login || 'GitHub User'}!</p>
            {userInfo.email && <p>Email: {userInfo.email}</p>}
            {connectedRepo && (
              <p className="mt-2 font-medium">
                Connected Repository: <span className="text-blue-600">{connectedRepo}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {connectionStatus === 'disconnected' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="text-center">
            <Github className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <span className="text-gray-600">Not connected to GitHub</span>
          </div>
        </div>
      )}

      {/* Clone Status Messages */}
      {cloneStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-semibold">Clone Successful!</span>
          </div>
          <p className="text-green-600 text-sm mt-1">{cloneMessage}</p>
        </div>
      )}

      {cloneStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700 font-semibold">Clone Failed</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{cloneMessage}</p>
        </div>
      )}

      <div className="mb-4">
        {connectionStatus === 'disconnected' && (
          <button
            onClick={connectGitHub}
            disabled={loading || !userId}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-4 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-lg"
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
          <div className="space-y-3">
            {!repoSelected ? (
              <button
                onClick={() => {
                  setCurrentView('repositories');
                  if (repositories.length === 0) {
                    fetchRepositories();
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Select Repository
              </button>
            ) : (
              <>
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
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading Paths...</span>
                    </>
                  ) : (
                    <>
                      <FolderOpen className="w-5 h-5" />
                      <span>{showPaths ? 'Hide Paths' : 'Select Path'}</span>
                    </>
                  )}
                </button>

                {/* Path Selection */}
                {showPaths && paths.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Clone Path:</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {paths.map((pathItem, index) => (
                        <div 
                          key={index}
                          onClick={() => setSelectedPath(pathItem.path)}
                          className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                            selectedPath === pathItem.path ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center">
                            <FolderOpen className="w-4 h-4 text-gray-600 mr-2" />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-800">{pathItem.name}</div>
                              <div className="text-xs text-gray-600">{pathItem.path}</div>
                            </div>
                            {selectedPath === pathItem.path && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clone Repository Button */}
                {selectedPath && (
                  <button
                    onClick={cloneRepository}
                    disabled={cloneLoading || !selectedPath}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {cloneLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Cloning Repository...</span>
                      </>
                    ) : (
                      <>
                        <Github className="w-5 h-5" />
                        <span>Clone Repository</span>
                      </>
                    )}
                  </button>
                )}

                {/* Change Repository Button */}
                <button
                  onClick={() => setCurrentView('repositories')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Change Repository
                </button>
              </>
            )}

            {/* Disconnect Button */}
            <button
              onClick={disconnectGitHub}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Disconnecting...</span>
                </>
              ) : (
                <span>Disconnect</span>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-gray-500 text-sm">
        {userId ? `User ID: ${userId}` : 'Please login to continue'}
      </div>
    </div>
  );

  const RepositoriesView = () => (
    <div>
      <div className="flex items-center mb-6">
        <button 
          onClick={() => setCurrentView('main')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {repoSelected ? 'Change Repository' : 'Select Repository'}
        </h2>
      </div>

      {connectedRepo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-700 text-sm">
            Currently connected: <span className="font-semibold">{connectedRepo}</span>
          </p>
        </div>
      )}

      <div className="mb-6">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
            <span className="text-blue-700 text-lg">Loading repositories...</span>
          </div>
        ) : repositories.length > 0 ? (
          <div className="space-y-3">
            <p className="text-gray-600 mb-2">
              {repoSelected ? 'Select a different repository:' : 'Select a repository to connect with your project:'}
            </p>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {repositories.map((repo) => (
                <div 
                  key={repo.full_name}
                  onClick={() => setSelectedRepo(repo.full_name)}
                  className={`p-4 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedRepo === repo.full_name ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  } ${
                    connectedRepo === repo.full_name ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      <BookOpen className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{repo.name}</div>
                      {repo.description && (
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">{repo.description}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">{repo.full_name}</div>
                      {connectedRepo === repo.full_name && (
                        <div className="text-xs text-green-600 mt-1 font-medium">Currently Connected</div>
                      )}
                    </div>
                    {selectedRepo === repo.full_name && (
                      <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={selectRepository}
              disabled={loading || !selectedRepo || selectedRepo === connectedRepo}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Selecting Repository...</span>
                </>
              ) : selectedRepo === connectedRepo ? (
                <span>Already Connected</span>
              ) : (
                <span>{repoSelected ? 'Change to Selected Repository' : 'Connect Selected Repository'}</span>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center p-8 border border-gray-200 rounded-lg">
            <Github className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 mb-2">No repositories found</p>
            <p className="text-gray-500 text-sm mb-4">
              We couldn't find any repositories in your GitHub account.
            </p>
            <button
              onClick={fetchRepositories}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Refresh Repositories
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      {showSuccessModal && <SuccessModal />}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {currentView === 'main' && <MainView />}
      {currentView === 'repositories' && <RepositoriesView />}
    </div>
  );
}

export default GitHub;