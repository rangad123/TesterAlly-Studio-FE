import React, { Component } from 'react';
import axios from 'axios';

export class Agent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      osName: '',
      osIcon: '',
      isDetecting: true,
      userId: null,
      downloadStarted: false,
      downloadCount: 0,
      activeInstallations: 0,
      uninstallCount: 0,
      statsLoaded: false,
      statsError: false
    };
  }

  componentDidMount() {
    this.detectOperatingSystem();
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

  detectOperatingSystem = () => {
    const userAgent = window.navigator.userAgent;
    let osName = '';
    let osIcon = '';
    
    if (userAgent.indexOf("Win") !== -1) {
      osName = "Windows";
      osIcon = "🪟";
    } else if (userAgent.indexOf("Mac") !== -1) {
      osName = "macOS";
      osIcon = "🍎";
    } else if (userAgent.indexOf("Linux") !== -1) {
      if (userAgent.indexOf("Ubuntu") !== -1) {
        osName = "Ubuntu";
        osIcon = "🐧";
      } else {
        osName = "Linux";
        osIcon = "🐧";
      }
    } else {
      osName = "Unknown";
      osIcon = "❓";
    }

    // Simulate loading for better UX
    setTimeout(() => {
      this.setState({ 
        osName,
        osIcon,
        isDetecting: false
      });
    }, 1000);
  }

  getDownloadLink = () => {
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

  trackDownload = async (osType) => {
    const { userId } = this.state;
    if (!userId) {
      console.warn("Cannot track download: No userId available");
      return;
    }

    this.setState({ downloadStarted: true });

    try {
      // Generate a unique installation ID
      const installationId = `${userId}-${Date.now()}`;
      
      const response = await axios.post('/api/track-download/', {
        user_id: userId,
        os_type: osType,
        installation_id: installationId,
        event_type: 'download_started'
      });

      console.log('Download tracked successfully:', response.data);
      
      localStorage.setItem('installationId', installationId);
      
      this.setState(prevState => ({
        downloadCount: prevState.downloadCount + 1
      }));
      
      return true;
    } catch (error) {
      console.error('Error tracking download:', error);
      return false;
    }
  }

  handleDownload = async (osType) => {
    
    const tracked = await this.trackDownload(osType);
    
    if (tracked) {
      
      const link = document.createElement('a');
      link.href = `/static/downloads/${this.getFileNameByOS(osType)}`;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
  
  getFileNameByOS = (osType) => {
    switch (osType) {
      case "Windows":
        return "testerally_setup.exe";
      case "macOS":
        return "testerally_setup.dmg";
      case "Ubuntu":
      case "Linux":
        return "testerally_setup.deb";
      default:
        return "";
    }
  }

  render() {
    const { 
      osName, 
      osIcon, 
      isDetecting, 
      downloadStarted, 
      userId,
      downloadCount,
      activeInstallations,
      uninstallCount,
      statsLoaded
    } = this.state;
    
    const downloadInfo = this.getDownloadLink();
    
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 transition-all duration-300 sm:ml-[60px] sm:max-w-full">
          <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-purple-600 mb-6">Agent Installation</h1>
            
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
            
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-medium text-gray-800 mb-4">System Detection</h2>
              
              {isDetecting ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-lg text-gray-600">Detecting your system...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <span className="text-4xl mr-4">{osIcon}</span>
                    <div>
                      <h3 className="text-xl font-medium text-gray-800">System Detected</h3>
                      <p className="text-gray-600">Your system is running <span className="font-semibold">{osName}</span></p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Download Testerally.ai Agent</h3>
                    <p className="text-gray-600 mb-4">
                      Get started with our automation tool by downloading the appropriate installer for your system.
                    </p>
                    
                    <div className="mt-4">
                      <button 
                        onClick={() => this.handleDownload(osName)}
                        className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors shadow-sm"
                        disabled={!userId || downloadStarted}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {downloadStarted ? "Downloading..." : downloadInfo.buttonText}
                      </button>
                    </div>
                    
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
                    
                    {osName === "Unknown" && (
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button 
                          onClick={() => this.handleDownload("Windows")}
                          className="flex items-center justify-center p-4 border border-purple-200 rounded-md hover:bg-purple-50"
                          disabled={!userId}
                        >
                          <span className="mr-2">🪟</span>
                          <span>Windows</span>
                        </button>
                        <button 
                          onClick={() => this.handleDownload("macOS")}
                          className="flex items-center justify-center p-4 border border-purple-200 rounded-md hover:bg-purple-50"
                          disabled={!userId}
                        >
                          <span className="mr-2">🍎</span>
                          <span>macOS</span>
                        </button>
                        <button 
                          onClick={() => this.handleDownload("Linux")}
                          className="flex items-center justify-center p-4 border border-purple-200 rounded-md hover:bg-purple-50"
                          disabled={!userId}
                        >
                          <span className="mr-2">🐧</span>
                          <span>Linux</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-medium text-gray-800 mb-2">Installation & Usage Instructions</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {osName === "Windows" && (
                        <ol className="list-decimal ml-5 space-y-2">
                          <li>Double-click the downloaded <code className="bg-gray-100 px-1 rounded">testerally_setup.exe</code> file</li>
                          <li>Follow the installation wizard instructions</li>
                          <li>Once installed, the Testerally.ai application will automatically launch</li>
                          <li>The application will automatically connect to your account using your user ID</li>
                          <li>The application runs locally on your machine, allowing you to use all automation features</li>
                          <li>Your usage data helps us improve the product and troubleshoot issues</li>
                        </ol>
                      )}
                      {osName === "macOS" && (
                        <ol className="list-decimal ml-5 space-y-2">
                          <li>Open the downloaded <code className="bg-gray-100 px-1 rounded">testerally_setup.dmg</code> file</li>
                          <li>Drag the Testerally.ai icon to your Applications folder</li>
                          <li>The application will automatically launch after installation</li>
                          <li>The application will automatically connect to your account using your user ID</li>
                          <li>The application runs locally on your machine, providing full access to all automation features</li>
                        </ol>
                      )}
                      {(osName === "Ubuntu" || osName === "Linux") && (
                        <ol className="list-decimal ml-5 space-y-2">
                          <li>Open Terminal and navigate to your downloads folder</li>
                          <li>Run: <code className="bg-gray-100 px-1 rounded">sudo dpkg -i testerally_setup.deb</code></li>
                          <li>The application will automatically launch after installation</li>
                          <li>The application will automatically connect to your account using your user ID</li>
                          <li>The application runs locally on your machine with full automation capabilities</li>
                        </ol>
                      )}
                      {osName === "Unknown" && (
                        <p>Select your operating system from the options above to download.</p>
                      )}
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