import React, { Component } from 'react';
import axios from 'axios';

export class Agent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      osName: '',
      osIcon: '',
      osVersion: '',
      processorInfo: '',
      browserInfo: '',
      screenResolution: '',
      isDetecting: true,
      userId: null,
      downloadStarted: false,
      downloadCompleted: false,
      downloadCancelled: false,
      downloadCount: 0,
      activeInstallations: 0,
      uninstallCount: 0,
      statsLoaded: false,
      statsError: false
    };
  }

  componentDidMount() {
    // First step: Detect the operating system as soon as component mounts
    this.detectSystemInfo();
    this.getUserId();
    this.fetchUserStats();
  }

  getUserId = () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.warn("No userId found in localStorage");
    } else {
      this.setState({ userId });
    }
  }

  fetchUserStats = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      const response = await axios.get(`/api/user-installation-stats/${userId}/`);
      const { downloadCount, activeInstallations, uninstallCount } = response.data;
      
      this.setState({
        downloadCount,
        activeInstallations,
        uninstallCount,
        statsLoaded: true
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      this.setState({ statsError: true });
    }
  }

  // Enhanced system detection with more detailed information
  detectSystemInfo = () => {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    let osName = '';
    let osIcon = '';
    let osVersion = '';
    let processorInfo = '';
    
    // Detect OS and version
    if (userAgent.indexOf("Win") !== -1) {
      osName = "Windows";
      osIcon = "🪟";
      
      // Windows version detection
      if (userAgent.indexOf("Windows NT 10.0") !== -1) {
        osVersion = "Windows 10/11";
      } else if (userAgent.indexOf("Windows NT 6.3") !== -1) {
        osVersion = "Windows 8.1";
      } else if (userAgent.indexOf("Windows NT 6.2") !== -1) {
        osVersion = "Windows 8";
      } else if (userAgent.indexOf("Windows NT 6.1") !== -1) {
        osVersion = "Windows 7";
      } else {
        osVersion = "Windows (unknown version)";
      }
      
      // Detect architecture
      if (userAgent.indexOf("Win64") !== -1 || userAgent.indexOf("x64") !== -1) {
        processorInfo = "64-bit architecture";
      } else {
        processorInfo = "32-bit architecture";
      }
    } else if (userAgent.indexOf("Mac") !== -1) {
      osName = "macOS";
      osIcon = "🍎";
      
      // macOS version detection (approximate)
      if (userAgent.indexOf("Mac OS X") !== -1) {
        const versionMatch = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
        if (versionMatch) {
          osVersion = "macOS " + versionMatch[1].replace(/_/g, '.');
        } else {
          osVersion = "macOS (unknown version)";
        }
      }
      
      processorInfo = platform.indexOf("arm") !== -1 ? "Apple Silicon" : "Intel processor";
      
    } else if (userAgent.indexOf("Linux") !== -1) {
      if (userAgent.indexOf("Ubuntu") !== -1) {
        osName = "Ubuntu";
        osIcon = "🐧";
        
        const versionMatch = userAgent.match(/Ubuntu[/\s](\d+\.\d+)/);
        if (versionMatch) {
          osVersion = "Ubuntu " + versionMatch[1];
        } else {
          osVersion = "Ubuntu (unknown version)";
        }
      } else {
        osName = "Linux";
        osIcon = "🐧";
        osVersion = "Linux (distribution unknown)";
      }
      
      // Basic Linux architecture detection
      processorInfo = userAgent.indexOf("x86_64") !== -1 ? "64-bit architecture" : "Architecture unknown";
    } else {
      osName = "Unknown";
      osIcon = "❓";
      osVersion = "Unknown operating system";
    }
    
    // Detect browser
    let browserInfo = '';
    if (userAgent.indexOf("Chrome") !== -1 && userAgent.indexOf("Edg") === -1 && userAgent.indexOf("OPR") === -1) {
      browserInfo = "Chrome";
    } else if (userAgent.indexOf("Firefox") !== -1) {
      browserInfo = "Firefox";
    } else if (userAgent.indexOf("Safari") !== -1 && userAgent.indexOf("Chrome") === -1) {
      browserInfo = "Safari";
    } else if (userAgent.indexOf("Edg") !== -1) {
      browserInfo = "Microsoft Edge";
    } else if (userAgent.indexOf("OPR") !== -1) {
      browserInfo = "Opera";
    } else {
      browserInfo = "Unknown browser";
    }
    
    // Get screen resolution
    const screenResolution = `${window.screen.width}x${window.screen.height}`;

    // Simulate loading for better UX
    setTimeout(() => {
      this.setState({ 
        osName,
        osIcon,
        osVersion,
        processorInfo,
        browserInfo,
        screenResolution,
        isDetecting: false
      });
    }, 1000);
  }

  // Get the correct download file based on detected OS
  getDownloadInfo = () => {
    const { osName } = this.state;
    
    switch (osName) {
      case "Windows":
        return {
          fileName: "testerally_setup.exe",
          buttonText: "Download for Windows"
        };
      case "macOS":
        return {
          fileName: "testerally_setup.dmg",
          buttonText: "Download for macOS"
        };
      case "Ubuntu":
      case "Linux":
        return {
          fileName: "testerally_setup.deb",
          buttonText: "Download for Linux"
        };
      default:
        return {
          fileName: "",
          buttonText: "Choose your download"
        };
    }
  }

  // Track the download
  trackDownload = async (eventType = 'download_started') => {
    const { userId, osName, osVersion, processorInfo, browserInfo } = this.state;
    if (!userId) {
      console.warn("Cannot track download: No userId available");
      return false;
    }

    if (eventType === 'download_started') {
      this.setState({ downloadStarted: true });
    } else if (eventType === 'download_completed') {
      this.setState({ downloadCompleted: true });
    } else if (eventType === 'download_cancelled') {
      this.setState({ downloadCancelled: true });
    }

    try {
      // Generate a unique installation ID
      const installationId = `${userId}-${Date.now()}`;
      
      const response = await axios.post('/api/track-download/', {
        user_id: userId,
        os_type: osName,
        os_version: osVersion,
        processor_info: processorInfo,
        browser_info: browserInfo,
        installation_id: installationId,
        event_type: eventType
      });

      console.log(`${eventType} tracked successfully:`, response.data);
      
      if (eventType === 'download_started') {
        localStorage.setItem('installationId', installationId);
        
        // Update local stats immediately for better UX
        this.setState(prevState => ({
          downloadCount: prevState.downloadCount + 1
        }));
      }
      
      return true;
    } catch (error) {
      console.error(`Error tracking ${eventType}:`, error);
      return false;
    }
  }

  // Handle the download process
  handleDownload = async () => {
    const downloadInfo = this.getDownloadInfo();
    
    if (!downloadInfo.fileName) {
      console.error('Unable to determine correct download file');
      return;
    }
    
    const tracked = await this.trackDownload('download_started');
    
    if (tracked) {
      // For React public folder, use the correct path
      const downloadPath = `/${downloadInfo.fileName}`;
      
      // Create a timeout to check if download was cancelled
      const downloadTimeout = setTimeout(() => {
        // If we reach this timeout, assume download was cancelled
        this.trackDownload('download_cancelled');
      }, 10000); // Assume download cancelled if no completion in 10 seconds
      
      try {
        const link = document.createElement('a');
        link.href = downloadPath;
        link.setAttribute('download', downloadInfo.fileName);
        
        // Set up event listeners to track download completion
        link.addEventListener('click', () => {
          // Clear the timeout since user initiated download
          clearTimeout(downloadTimeout);
          
          // Set a new timeout to track successful download
          setTimeout(() => {
            this.trackDownload('download_completed');
          }, 2000); // Assume download completed after 2 seconds
        });
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Download error:', error);
        this.trackDownload('download_cancelled');
      }
    }
  }

  // Skip download
  handleSkipDownload = () => {
    this.trackDownload('download_skipped');
    this.setState({ downloadCancelled: true });
  }

  // Helper function to get installation instructions based on OS
  getInstallationInstructions = () => {
    const { osName } = this.state;
    
    switch(osName) {
      case "Windows":
        return (
          <ol className="list-decimal ml-5 space-y-2">
            <li>Double-click the downloaded <code className="bg-gray-100 px-1 rounded">testerally_setup.exe</code> file</li>
            <li>Follow the installation wizard instructions</li>
            <li>Once installed, the Testerally.ai application will automatically launch</li>
            <li>The application runs locally on your machine, allowing you to use all automation features</li>
          </ol>
        );
      case "macOS":
        return (
          <ol className="list-decimal ml-5 space-y-2">
            <li>Open the downloaded <code className="bg-gray-100 px-1 rounded">testerally_setup.dmg</code> file</li>
            <li>Drag the Testerally.ai icon to your Applications folder</li>
            <li>The application will automatically launch after installation</li>
            <li>The application runs locally on your machine, providing full access to all automation features</li>
          </ol>
        );
      case "Ubuntu":
      case "Linux":
        return (
          <ol className="list-decimal ml-5 space-y-2">
            <li>Open Terminal and navigate to your downloads folder</li>
            <li>Run: <code className="bg-gray-100 px-1 rounded">sudo dpkg -i testerally_setup.deb</code></li>
            <li>The application will automatically launch after installation</li>
            <li>The application runs locally on your machine with full automation capabilities</li>
          </ol>
        );
      default:
        return <p>Please select your operating system from the options above.</p>;
    }
  }

  render() {
    const { 
      osName, 
      osIcon, 
      osVersion,
      processorInfo,
      browserInfo,
      screenResolution,
      isDetecting, 
      downloadStarted, 
      downloadCompleted,
      downloadCancelled,
      userId,
      downloadCount,
      activeInstallations,
      uninstallCount,
      statsLoaded
    } = this.state;
    
    const downloadInfo = this.getDownloadInfo();
    
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 transition-all duration-300">
          <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-purple-600 mb-6">Testerally Agent</h1>
            
            {/* User authentication warning */}
            {!userId && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Please log in to download the application. User tracking requires authentication.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* User download statistics */}
            {userId && statsLoaded && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-purple-600">{downloadCount}</div>
                  <div className="text-gray-500 text-sm">Downloads</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-green-600">{activeInstallations}</div>
                  <div className="text-gray-500 text-sm">Active Installations</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-red-600">{uninstallCount}</div>
                  <div className="text-gray-500 text-sm">Uninstallations</div>
                </div>
              </div>
            )}
            
            {/* Main content area */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-medium text-gray-800 mb-4">System Detection</h2>
              
              {/* Loading state while detecting system */}
              {isDetecting ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-lg text-gray-600">Detecting your system...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Enhanced detected system information */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center mb-4">
                      <span className="text-4xl mr-4">{osIcon}</span>
                      <div>
                        <h3 className="text-xl font-medium text-gray-800">System Detected</h3>
                        <p className="text-gray-600">We've detected the following system information</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-purple-600">Operating System</h4>
                        <p className="text-gray-700">{osName} ({osVersion})</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-purple-600">Processor</h4>
                        <p className="text-gray-700">{processorInfo}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-purple-600">Browser</h4>
                        <p className="text-gray-700">{browserInfo}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-purple-600">Screen Resolution</h4>
                        <p className="text-gray-700">{screenResolution}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Download section */}
                  {!downloadCompleted && !downloadCancelled && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-xl font-medium text-gray-800 mb-4">Download Testerally Agent</h3>
                      <p className="text-gray-600 mb-4">
                        Get started with our automation tool by downloading the installer for your {osName} system.
                      </p>
                      
                      {/* Download buttons */}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button 
                          onClick={this.handleDownload}
                          className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors shadow-sm disabled:bg-purple-300 disabled:cursor-not-allowed"
                          disabled={!userId || downloadStarted || osName === "Unknown"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {downloadStarted ? "Downloading..." : downloadInfo.buttonText}
                        </button>
                        
                        {/* Skip download option */}
                        {!downloadStarted && (
                          <button 
                            onClick={this.handleSkipDownload}
                            className="inline-flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors shadow-sm"
                          >
                            Skip Download
                          </button>
                        )}
                      </div>
                      
                      {/* Download confirmation message */}
                      {downloadStarted && (
                        <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
                          <p className="flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Your download has started. Once installed, the application will automatically connect to your account.
                          </p>
                        </div>
                      )}
                      
                      {/* Alternative OS options only if system is unknown */}
                      {osName === "Unknown" && (
                        <div className="mt-6">
                          <p className="text-gray-600 mb-3">We couldn't detect your operating system. Please select from the options below:</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button 
                              onClick={() => {
                                this.setState({ 
                                  osName: "Windows", 
                                  osIcon: "🪟", 
                                  osVersion: "Windows (manual selection)" 
                                }, () => {
                                  this.handleDownload();
                                });
                              }}
                              className="flex items-center justify-center p-4 border border-purple-200 rounded-md hover:bg-purple-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                              disabled={!userId}
                            >
                              <span className="mr-2">🪟</span>
                              <span>Windows</span>
                            </button>
                            <button 
                              onClick={() => {
                                this.setState({ 
                                  osName: "macOS", 
                                  osIcon: "🍎", 
                                  osVersion: "macOS (manual selection)" 
                                }, () => {
                                  this.handleDownload();
                                });
                              }}
                              className="flex items-center justify-center p-4 border border-purple-200 rounded-md hover:bg-purple-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                              disabled={!userId}
                            >
                              <span className="mr-2">🍎</span>
                              <span>macOS</span>
                            </button>
                            <button 
                              onClick={() => {
                                this.setState({ 
                                  osName: "Linux", 
                                  osIcon: "🐧",
                                  osVersion: "Linux (manual selection)" 
                                }, () => {
                                  this.handleDownload();
                                });
                              }}
                              className="flex items-center justify-center p-4 border border-purple-200 rounded-md hover:bg-purple-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                              disabled={!userId}
                            >
                              <span className="mr-2">🐧</span>
                              <span>Linux</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Download completed message */}
                  {downloadCompleted && (
                    <div className="border-t border-gray-200 pt-6">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-medium text-green-800">Download Complete</h3>
                            <p className="text-green-700 mt-1">
                              Thank you for downloading Testerally Agent! Please follow the installation instructions below.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Download skipped message */}
                  {downloadCancelled && !downloadCompleted && (
                    <div className="border-t border-gray-200 pt-6">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-gray-100 rounded-full p-2">
                            <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-medium text-gray-800">Download Skipped</h3>
                            <p className="text-gray-700 mt-1">
                              You've chosen to skip the download. You can download Testerally Agent later from your account dashboard.
                            </p>
                            <button 
                              onClick={this.handleDownload}
                              className="mt-3 inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors shadow-sm text-sm"
                            >
                              Download Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Installation instructions section */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-medium text-gray-800 mb-2">Installation & Usage Instructions</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {this.getInstallationInstructions()}
                    </div>
                  </div>
                  
                  {/* System requirements section */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-medium text-gray-800 mb-2">System Requirements</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium text-gray-800 mb-2">Minimum Requirements:</h4>
                      <ul className="list-disc ml-5 space-y-1 text-gray-700">
                        <li>Windows 10/11, macOS 11 (Big Sur) or later, Ubuntu 20.04 or later</li>
                        <li>4GB RAM minimum (8GB recommended)</li>
                        <li>1GB free disk space</li>
                        <li>Intel/AMD 64-bit processor or Apple Silicon</li>
                        <li>Internet connection for account verification and updates</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Agent;