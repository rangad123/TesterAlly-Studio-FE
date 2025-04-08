import React, { Component } from 'react';

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
      devicePixelRatio: '',
      colorDepth: '',
      isDetecting: true,
      downloadStarted: false,
      downloadCompleted: false,
      downloadCancelled: false,
      downloadData: null,
      isLoadingDownloadData: false,
      downloadDataError: null,
    };
  }

  componentDidMount() {
    // Detect system info on component mount
    this.detectSystemInfoClient();
    
    // Check if user has previous downloads
    this.checkPreviousDownloads();
  }
  
  // Check for previous downloads on page load
  checkPreviousDownloads = async () => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      try {
        const data = await this.trackDownloadGet();
        if (data) {
          this.setState({ downloadData: data });
        }
      } catch (error) {
        console.error("Failed to check previous downloads:", error);
      }
    }
  }

  // Client-side detection with simplified methods
  detectSystemInfoClient = () => {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    let osName = '';
    let osIcon = '';
    let osVersion = '';
    let processorInfo = '';
    
    // Simplified OS detection
    if (/Windows NT/.test(userAgent)) {
      osName = "Windows";
      osIcon = "🪟";
      
      // Windows version detection
      if (/Windows NT 10.0/.test(userAgent)) {
        osVersion = "Windows 10/11";
      } else if (/Windows NT 6.3/.test(userAgent)) {
        osVersion = "Windows 8.1";
      } else if (/Windows NT 6.2/.test(userAgent)) {
        osVersion = "Windows 8";
      } else if (/Windows NT 6.1/.test(userAgent)) {
        osVersion = "Windows 7";
      } else {
        osVersion = "Windows (unknown version)";
      }
      
      // Architecture detection
      if (/Win64|x64|WOW64|x86_64/.test(userAgent)) {
        processorInfo = "64-bit architecture";
      } else {
        processorInfo = "32-bit architecture";
      }
    } else if (/Macintosh|Mac OS X|MacIntel/.test(userAgent)) {
      osName = "macOS";
      osIcon = "🍎";
      osVersion = "macOS";
      
      // Better Apple Silicon detection
      if (/ARM/.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
        processorInfo = "Apple Silicon";
      } else {
        processorInfo = "Intel processor";
      }
    } else if (/Linux/.test(userAgent)) {
      if (/Ubuntu/.test(userAgent)) {
        osName = "Ubuntu";
      } else if (/Fedora/.test(userAgent)) {
        osName = "Fedora";
      } else if (/Debian/.test(userAgent)) {
        osName = "Debian";
      } else {
        osName = "Linux";
      }
      osIcon = "🐧";
      osVersion = "Linux";
      
      // Architecture detection for Linux
      if (/x86_64|amd64|x64/.test(userAgent)) {
        processorInfo = "64-bit x86 architecture";
      } else if (/i386|i686/.test(userAgent)) {
        processorInfo = "32-bit x86 architecture";
      } else {
        processorInfo = "Architecture unknown";
      }
    } else if (/Android/.test(userAgent)) {
      osName = "Android";
      osIcon = "📱";
      
      const versionMatch = userAgent.match(/Android (\d+(\.\d+)+)/);
      if (versionMatch) {
        osVersion = "Android " + versionMatch[1];
      } else {
        osVersion = "Android";
      }
      
      processorInfo = "Mobile device";
    } else if (/iPhone|iPad|iPod/.test(userAgent)) {
      if (/iPad/.test(userAgent)) {
        osName = "iPadOS";
      } else {
        osName = "iOS";
      }
      osIcon = "📱";
      osVersion = osName;
      processorInfo = "Apple mobile device";
    } else {
      osName = "Unknown";
      osIcon = "❓";
      osVersion = "Unknown operating system";
    }
    
    // Simplified browser detection
    let browserInfo = '';
    if (/Edg/.test(userAgent)) {
      browserInfo = "Microsoft Edge";
    } else if (/Firefox/.test(userAgent)) {
      browserInfo = "Firefox";
    } else if (/OPR|Opera/.test(userAgent)) {
      browserInfo = "Opera";
    } else if (/Chrome/.test(userAgent)) {
      browserInfo = "Chrome";
    } else if (/Safari/.test(userAgent)) {
      browserInfo = "Safari";
    } else {
      browserInfo = "Unknown browser";
    }
    
    // Screen resolution detection
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const devicePixelRatio = `${window.devicePixelRatio || 1}x`;
    const colorDepth = `${window.screen.colorDepth}-bit`;

    // Simulate loading for better UX
    setTimeout(() => {
      this.setState({ 
        osName,
        osIcon,
        osVersion,
        processorInfo,
        browserInfo,
        screenResolution,
        devicePixelRatio,
        colorDepth,
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
      case "Debian":
      case "Fedora":
      case "Linux":
        return {
          fileName: "testerally_setup.deb",
          buttonText: "Download for Linux"
        };
      case "Android":
        return {
          fileName: "testerally.apk",
          buttonText: "Download for Android"
        };
      case "iOS":
      case "iPadOS":
        return {
          fileName: "",
          buttonText: "Get on App Store",
          appStoreLink: "https://apps.apple.com/app/testerally"
        };
      default:
        return {
          fileName: "",
          buttonText: "Choose your download"
        };
    }
  }

  // Track download - POST request
  trackDownloadPost = async () => {
    this.setState({ isLoadingDownloadData: true });
    const userId = localStorage.getItem("userId");
  
    if (!userId) {
        console.log("No userId found, creating new user ID");
        // Generate a random user ID and save it
        const newUserId = `user_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem("userId", newUserId);
        
        try {
            const response = await fetch('http://127.0.0.1:8000/api/track-download/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: newUserId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("POST Response:", data);
            this.setState({ downloadData: data, isLoadingDownloadData: false });
            return data;
        } catch (error) {
            console.error('Failed to track download (POST):', error);
            this.setState({ 
                isLoadingDownloadData: false, 
                downloadDataError: "Failed to track download. Please try again." 
            });
            return null;
        }
    } else {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/track-download/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("POST Response:", data);
            
            // Immediately update state with the POST response data
            this.setState({ downloadData: data, isLoadingDownloadData: false });
            return data;
        } catch (error) {
            console.error('Failed to track download (POST):', error);
            this.setState({ 
                isLoadingDownloadData: false, 
                downloadDataError: "Failed to track download. Please try again." 
            });
            return null;
        }
    }
  };

  // Track download - GET request
  trackDownloadGet = async () => {
    this.setState({ isLoadingDownloadData: true });
    const userId = localStorage.getItem("userId");

    if (!userId) {
        console.log("No userId found, skipping download tracking (GET)");
        this.setState({ isLoadingDownloadData: false });
        return null;
    }

    try {
        const response = await fetch(`http://localhost:8000/api/track-download/?user_id=${userId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("GET Response:", data);
        
        this.setState({ downloadData: data, isLoadingDownloadData: false });
        return data;
    } catch (error) {
        console.error('Failed to track download (GET):', error);
        this.setState({ 
            isLoadingDownloadData: false, 
            downloadDataError: "Failed to retrieve download history. Please try again." 
        });
        return null;
    }
  };

  // Handle download button click
  handleDownload = async () => {
    const downloadInfo = this.getDownloadInfo();
    
    this.setState({ 
        downloadStarted: true, 
        downloadDataError: null 
    });

    // Track the download with POST
    await this.trackDownloadPost();
    
    if (!downloadInfo.fileName) {
      if (downloadInfo.appStoreLink) {
        window.open(downloadInfo.appStoreLink, '_blank');
        this.setState({ downloadCompleted: true });
        return;
      }
      console.error('Unable to determine correct download file');
      return;
    }
    
    const fileMap = {
      "testerally_setup.exe": "/TesterAlly.exe", 
      "testerally_setup.dmg": "/testerally_setup.dmg", 
      "testerally_setup.deb": "/testerally_setup.deb", 
      "testerally_setup.rpm": "/testerally_setup.rpm", 
      "testerally.apk": "/testerally.apk" 
    };
    
    const downloadPath = fileMap[downloadInfo.fileName] || "/TesterAlly.exe";
      
    try {
      const link = document.createElement('a');
      link.href = downloadPath;
      link.setAttribute('download', downloadInfo.fileName);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        this.setState({ downloadCompleted: true });
      }, 2000);
    } catch (error) {
      console.error('Download error:', error);
      this.setState({ downloadCancelled: true });
    }
  }

  // Installation instructions based on OS
  getInstallationInstructions = () => {
    const { osName } = this.state;
    
    switch(osName) {
      case "Windows":
        return (
          <ol className="list-decimal ml-5 space-y-2">
            <li>Double-click the downloaded <code className="bg-gray-100 px-1 rounded">testerally_setup.exe</code> file</li>
            <li>If prompted by User Account Control, click "Yes" to allow installation</li>
            <li>Follow the installation wizard instructions</li>
            <li>Once installed, the Testerally.ai application will automatically launch</li>
          </ol>
        );
      case "macOS":
        return (
          <ol className="list-decimal ml-5 space-y-2">
            <li>Open the downloaded <code className="bg-gray-100 px-1 rounded">testerally_setup.dmg</code> file</li>
            <li>Drag the Testerally.ai icon to your Applications folder</li>
            <li>If you get a warning about unidentified developers, right-click the app and select "Open"</li>
            <li>Click "Open" in the confirmation dialog</li>
            <li>The application will launch after installation</li>
          </ol>
        );
      case "Ubuntu":
      case "Debian":
      case "Linux":
        return (
          <ol className="list-decimal ml-5 space-y-2">
            <li>Open Terminal and navigate to your downloads folder</li>
            <li>Run: <code className="bg-gray-100 px-1 rounded">sudo dpkg -i testerally_setup.deb</code></li>
            <li>If prompted for dependencies, run: <code className="bg-gray-100 px-1 rounded">sudo apt-get install -f</code></li>
            <li>Launch the application from your applications menu or by typing <code className="bg-gray-100 px-1 rounded">testerally</code> in terminal</li>
          </ol>
        );
      case "Fedora":
        return (
          <ol className="list-decimal ml-5 space-y-2">
            <li>Open Terminal and navigate to your downloads folder</li>
            <li>Run: <code className="bg-gray-100 px-1 rounded">sudo dnf install ./testerally_setup.rpm</code></li>
            <li>Launch the application from your applications menu</li>
          </ol>
        );
      case "Android":
        return (
          <ol className="list-decimal ml-5 space-y-2">
            <li>Open the downloaded APK file</li>
            <li>If prompted, enable installation from unknown sources in settings</li>
            <li>Follow the on-screen installation instructions</li>
            <li>Launch Testerally from your app drawer</li>
          </ol>
        );
      case "iOS":
      case "iPadOS":
        return (
          <ol className="list-decimal ml-5 space-y-2">
            <li>Click the "Get on App Store" button to visit the App Store</li>
            <li>Tap "Get" and complete the installation</li>
            <li>Launch Testerally from your home screen</li>
          </ol>
        );
      default:
        return <p>Please select your operating system from the options above.</p>;
    }
  }

  // Render the download history table
  renderDownloadHistory = () => {
    const { downloadData, isLoadingDownloadData, downloadDataError } = this.state;
    
    if (isLoadingDownloadData) {
      return (
        <div className="mt-4 flex justify-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-purple-600">Loading download history...</span>
        </div>
      );
    }
    
    if (downloadDataError) {
      return (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {downloadDataError}
          </p>
        </div>
      );
    }
    
    if (!downloadData) {
      return (
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No download history found. Download the application to start tracking.
          </p>
        </div>
      );
    }
    
    // Check if download data has the expected properties
    if (!downloadData.hasOwnProperty('id') || 
        !downloadData.hasOwnProperty('download_count') || 
        !downloadData.hasOwnProperty('last_downloaded') || 
        !downloadData.hasOwnProperty('ip_address')) {
      console.error("Invalid download data format:", downloadData);
      return (
        <div className="mt-4 p-4 bg-yellow-50 text-yellow-700 rounded-md">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Download data available but in unexpected format.
          </p>
        </div>
      );
    }
    
    return (
      <div className="mt-6">
        <h4 className="text-lg font-medium text-gray-800 mb-2">Your Download History</h4>
        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-purple-50 text-purple-800 border-b border-gray-200">
                <th className="py-3 px-4 text-left font-medium">User ID</th>
                <th className="py-3 px-4 text-left font-medium">Downloads</th>
                <th className="py-3 px-4 text-left font-medium">Last Download</th>
                <th className="py-3 px-4 text-left font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b border-gray-200">{downloadData.id}</td>
                <td className="py-3 px-4 border-b border-gray-200">
                  <span className="bg-purple-100 text-purple-800 font-medium py-1 px-2 rounded-full">
                    {downloadData.download_count} {downloadData.download_count === 1 ? 'time' : 'times'}
                  </span>
                </td>
                <td className="py-3 px-4 border-b border-gray-200">{downloadData.last_downloaded}</td>
                <td className="py-3 px-4 border-b border-gray-200">{downloadData.ip_address || 'Not available'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {downloadData.download_count > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <p className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              We use cookies to track downloads for a better user experience.
            </p>
          </div>
        )}
      </div>
    );
  }

  render() {
    const { 
      osName, 
      osIcon, 
      osVersion,
      processorInfo,
      browserInfo,
      screenResolution,
      devicePixelRatio,
      colorDepth,
      isDetecting, 
      downloadStarted, 
      downloadCompleted,
      downloadCancelled
    } = this.state;
    
    const downloadInfo = this.getDownloadInfo();
    
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 lg:ml-[200px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
          <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-purple-600 mb-6">Testerally Agent</h1>
            
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
                        <h4 className="font-medium text-purple-600">Display</h4>
                        <p className="text-gray-700">
                          {screenResolution}{devicePixelRatio !== '1x' ? ` (${devicePixelRatio} scaling)` : ''}, {colorDepth}
                        </p>
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
                      
                      {/* Download tracking data display */}
                      {this.renderDownloadHistory()}
                      
                      {/* Download buttons */}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button 
                          onClick={this.handleDownload}
                          className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors shadow-sm disabled:bg-purple-300 disabled:cursor-not-allowed"
                          disabled={this.state.isLoadingDownloadData || osName === "Unknown"}
                        >
                          {this.state.isLoadingDownloadData ? (
                            <>
                              <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              {downloadStarted ? "Downloading..." : downloadInfo.buttonText}
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* Download confirmation message */}
                      {downloadStarted && !this.state.isLoadingDownloadData && (
                        <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
                          <p className="flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Your download has started. Once installed, the application will automatically launch.
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
                                });
                              }}
                              className="flex items-center justify-center p-4 border border-purple-200 rounded-md hover:bg-purple-50"
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
                                });
                              }}
                              className="flex items-center justify-center p-4 border border-purple-200 rounded-md hover:bg-purple-50"
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
                                });
                              }}
                              className="flex items-center justify-center p-4 border border-purple-200 rounded-md hover:bg-purple-50"
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
                      
                      {/* Show download history after completing download */}
                      {this.renderDownloadHistory()}
                    </div>
                  )}

                  {/* Show message for non-Windows users if files aren't available yet */}
                  {osName !== "Windows" && !downloadStarted && (
                    <div className="mt-4 p-4 bg-yellow-50 text-yellow-700 rounded-md">
                      <p className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Note: Currently only Windows installer is available. Support for {osName} is coming soon!
                      </p>
                    </div>
                  )}
                                    
                  {/* Installation instructions section */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-medium text-gray-800 mb-2">Installation Instructions</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {this.getInstallationInstructions()}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer with support information */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">Need help? Contact our support team at <a href="mailto:support@testerally.ai" className="text-purple-600 hover:text-purple-800">support@testerally.ai</a></p>
              <p className="text-gray-500 text-sm mt-2">© 2025 Testerally.ai - All rights reserved</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Agent;