import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function AndroidSenario() {
  const [promptText, setPromptText] = useState('');
  // const [extractedSteps, setExtractedSteps] = useState([]);
  const [showExtractedSteps, setShowExtractedSteps] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [projectData, setProjectData] = useState(null);
  // const [needsOtpVerification, setNeedsOtpVerification] = useState(false);

  const [complexityLevel, setComplexityLevel] = useState("simple");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

//   const [testData, setTestData] = useState(null);
//   const [isTestDataLoading, setIsTestDataLoading] = useState(false);
  const [selectedOtpStep, setSelectedOtpStep] = useState('none');
  const [otpConfirmationModal, setOtpConfirmationModal] = useState({
    isOpen: false,
    contactStep: null,
    otpStep: null,
    matchedContactData: null,
    contactType: null, 
    detectedSteps: []
  });

const [scenarioName, setScenarioName] = useState('');
const [scenarioType, setScenarioType] = useState('');
const [scenarioPriority, setScenarioPriority] = useState('');

  const location = useLocation();
  const testCaseInfo = location.state?.testCaseInfo;

const [promptHistory, setPromptHistory] = useState([]);
const [showHistory, setShowHistory] = useState(false);

// const [testUrl, setTestUrl] = useState('');

const [isEnhancing, setIsEnhancing] = useState(false);

const [testResults, setTestResults] = useState(null);
const [showTestResults, setShowTestResults] = useState(false);

const [screenshotModal, setScreenshotModal] = useState({ isOpen: false, src: '', alt: '' });

const [isCreatingTestCase, setIsCreatingTestCase] = useState(false);

const [connectionModal, setConnectionModal] = useState({
  isOpen: false,
  isConnecting: false,
  connectionStatus: null,
  errorMessage: null
});

const [installedApps, setInstalledApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [isAppDropdownOpen, setIsAppDropdownOpen] = useState(false);

  // Device connection states
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceConnectionStatus, setDeviceConnectionStatus] = useState('checking');
  const [connectionError, setConnectionError] = useState('');


  const filteredApps = installedApps.filter(app => 
    app.toLowerCase().includes(appSearchQuery.toLowerCase())
  );


  useEffect(() => {
    const initializeDeviceConnection = async () => {
      setIsConnecting(true);
      setDeviceConnectionStatus('checking');
      
      try {
        // First check device connection
        const connectionResponse = await fetch('http://127.0.0.1:8000/android/basic_connect/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });

        if (!connectionResponse.ok) {
          throw new Error('Failed to connect to device');
        }

        const connectionData = await connectionResponse.json();
        
        if (connectionData.status === 'error') {
          throw new Error(connectionData.message || 'Connection failed');
        }

        console.log("✅ Device connected successfully");
        setDeviceConnectionStatus('connected');
        
        // If connection successful, load installed apps
        await loadInstalledApps();

      } catch (error) {
        console.error('❌ Device connection failed:', error);
        setDeviceConnectionStatus('failed');
        setConnectionError(error.message);
      } finally {
        setIsConnecting(false);
      }
    };

    initializeDeviceConnection();
  }, []);

  const loadInstalledApps = async () => {
    setIsLoadingApps(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/android/list_apps/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch installed apps');
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.apps) {
        console.log(`📱 Loaded ${data.count} apps from device`);
        setInstalledApps(data.apps.sort()); // Sort apps alphabetically
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('❌ Error loading apps:', error);
      alert('Failed to load installed apps. Please check device connection.');
    } finally {
      setIsLoadingApps(false);
    }
  };

  const retryConnection = () => {
    setDeviceConnectionStatus('checking');
    setConnectionError('');
    
    // Re-run the connection check
    const initializeDeviceConnection = async () => {
      setIsConnecting(true);
      
      try {
        const connectionResponse = await fetch('http://127.0.0.1:8000/android/basic_connect/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });

        if (!connectionResponse.ok) {
          throw new Error('Failed to connect to device');
        }

        const connectionData = await connectionResponse.json();
        
        if (connectionData.status === 'error') {
          throw new Error(connectionData.message || 'Connection failed');
        }

        setDeviceConnectionStatus('connected');
        await loadInstalledApps();

      } catch (error) {
        console.error('❌ Retry connection failed:', error);
        setDeviceConnectionStatus('failed');
        setConnectionError(error.message);
      } finally {
        setIsConnecting(false);
      }
    };

    initializeDeviceConnection();
  };

  const handleAppSelect = (appPackage) => {
    setSelectedApp(appPackage);
    setIsAppDropdownOpen(false);
    setAppSearchQuery('');
    console.log("📱 Selected app:", appPackage);
  };

  const getAppDisplayName = (packageName) => {
    // Extract meaningful part from package name
    const parts = packageName.split('.');
    const lastPart = parts[parts.length - 1];
    
    // Capitalize and clean up common patterns
    return lastPart
      .replace(/android$/, '')
      .replace(/app$/, '')
      .replace(/client$/, '')
      .replace(/^com/, '')
      .charAt(0).toUpperCase() + lastPart.slice(1);
  };

const enhancePrompt = async () => {
  if (!promptText.trim()) {
    alert("Please enter a prompt first to enhance.");
    return;
  }

  setIsEnhancing(true);
  try {
    const response = await fetch('http://127.0.0.1:8000/AI/prompt-enhance/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: promptText
      })
    });

    if (!response.ok) {
      throw new Error('Failed to enhance prompt');
    }

    const data = await response.json();

    console.log("Enhanced_Prompt:", data)
    
    if (data.data && data.data.enhanced_prompt) {
      setPromptText(data.data.enhanced_prompt);
    } else {
      alert('No enhanced prompt received.');
    }
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    alert('Failed to enhance prompt. Please try again.');
  } finally {
    setIsEnhancing(false);
  }
};

  useEffect(() => {
    if (testCaseInfo) {
      setScenarioName(testCaseInfo.testcase_name || '');
      setScenarioType(testCaseInfo.testcase_type || '');
      setScenarioPriority(testCaseInfo.testcase_priority || '');
    }
  }, [testCaseInfo]);

// const savePromptToHistory = (promptText, steps) => {
//   const historyItem = {
//     id: Date.now(),
//     prompt: promptText,
//     steps: steps,
//     timestamp: new Date().toLocaleString(),
//     scenarioDetails: {
//       name: scenarioName,
//       type: scenarioType,
//       priority: scenarioPriority
//     }
//   };

//   // Get existing history from sessionStorage
//   const existingHistory = JSON.parse(sessionStorage.getItem('promptHistory') || '[]');
  
//   // Add new item to beginning and keep only last 3
//   const updatedHistory = [historyItem, ...existingHistory].slice(0, 3);
  
//   // Save to sessionStorage and state
//   sessionStorage.setItem('promptHistory', JSON.stringify(updatedHistory));
//   setPromptHistory(updatedHistory);
  
//   console.log("💾 Prompt saved to history:", historyItem);
// };

const loadPromptFromHistory = (historyItem) => {
  setPromptText(historyItem.prompt);
  // setExtractedSteps(historyItem.steps);
  setShowExtractedSteps(true);
  
  // Also restore scenario details if they exist
  if (historyItem.scenarioDetails) {
    setScenarioName(historyItem.scenarioDetails.name || '');
    setScenarioType(historyItem.scenarioDetails.type || '');
    setScenarioPriority(historyItem.scenarioDetails.priority || '');
  }
  
  setShowHistory(false);
  console.log("📋 Prompt loaded from history:", historyItem);
};

const clearPromptHistory = () => {
  sessionStorage.removeItem('promptHistory');
  setPromptHistory([]);
  setShowHistory(false);
  console.log("🗑️ Prompt history cleared");
};

const loadHistoryFromStorage = () => {
  const savedHistory = JSON.parse(sessionStorage.getItem('promptHistory') || '[]');
  setPromptHistory(savedHistory);
};

useEffect(() => {
  loadHistoryFromStorage();
}, []);

  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/dashboard-user");
      return;
    }

    const savedProjectKey = `selectedProject_${userId}`;
    const savedProject = localStorage.getItem(savedProjectKey);

    if (savedProject) {
        try {
            const parsedProject = JSON.parse(savedProject);
            setProjectData(parsedProject);
        } catch (err) {
            console.error("Error parsing saved project:", err);
            localStorage.removeItem(savedProjectKey);
        }
    }

    const handleProjectChange = () => {
      navigate("/test-cases");
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, [navigate]);

//   useEffect(() => {
//     if (projectData?.id) {
//       setIsTestDataLoading(true);
//       fetch(`http://127.0.0.1:8000/api/testdata/${projectData.id}/`)
//         .then((res) => res.json())
//         .then((data) => {
//           console.log("✅ Test data loaded:", data);
//           setTestData(data);
//           setTestUrl(data?.url || '');
//         })
//         .catch((err) => {
//           console.warn("⚠️ Error fetching test data:", err.message);
//           setTestData(null);
//         })
//         .finally(() => setIsTestDataLoading(false));
//     }
//   }, [projectData?.id]);

const checkDeviceConnection = async () => {
  setConnectionModal({
    isOpen: true,
    isConnecting: true,
    connectionStatus: null,
    errorMessage: null
  });

  try {
    const response = await fetch('http://127.0.0.1:8000/android/basic_connect/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error('Failed to connect to device');
    }

    const data = await response.json();
    console.log("Device connection response:", data);

    if (data.status === 'error') {
      throw new Error(data.message || 'Connection failed');
    }

    setConnectionModal(prev => ({
      ...prev,
      isConnecting: false,
      connectionStatus: 'connected'
    }));

    // Wait 2 seconds to show success, then proceed
    setTimeout(() => {
      setConnectionModal({
        isOpen: false,
        isConnecting: false,
        connectionStatus: null,
        errorMessage: null
      });
      // Now proceed with automation
      proceedWithAutomation();
    }, 2000);

  } catch (error) {
    console.error('Device connection error:', error);
    setConnectionModal(prev => ({
      ...prev,
      isConnecting: false,
      connectionStatus: 'failed',
      errorMessage: error.message
    }));
  }
};

const proceedWithAutomation = async () => {
    const userId = localStorage.getItem("userId");

    if (!selectedApp) {
      alert("Please select an app first.");
      return;
    }

    setIsExtracting(true);
    try {
      console.log("📦 Sending Request Payload:", {
        app_package: selectedApp,
        user_id: userId, 
        test_prompt: promptText,
        scenarios_name: scenarioName
      });

      const response = await fetch('http://127.0.0.1:8000/android/agent/run/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_package: selectedApp, 
          user_id: userId,
          test_prompt: promptText,
          scenarios_name: scenarioName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run automation');
      }

      const data = await response.json();
      console.log("✅ Automation response:", data);

      setTestResults(data);
      setShowTestResults(true);
      
      alert('Automation completed successfully!');

    } catch (error) {
      console.error('Error running automation:', error);
      alert('Failed to start automation. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const extractStepsFromPrompt = async () => {
    if (!promptText.trim()) {
      alert("Please enter a prompt first.");
      return;
    }

    if (!selectedApp) {
      alert("Please select an app to test.");
      return;
    }

    if (deviceConnectionStatus !== 'connected') {
      alert("Device is not connected. Please check connection.");
      return;
    }

    proceedWithAutomation();
  };

  const generatePromptFromAssistant = async () => {
    setIsGeneratingPrompt(true);

    // Log current request config
    const requestBody = {
      project_type: projectData?.project_type,
      platform: projectData?.platform,
      category: "interaction",
      complexity: complexityLevel,
    };

    console.log("🧠 Sending prompt generation request:", requestBody);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/generate-prompt/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate prompt");
      }

      const data = await response.json();
      console.log("✅ Received generated prompt:", data);

      if (data.prompt) {
        setPromptText(data.prompt);
      } else {
        alert("No prompt received from assistant.");
      }

      // Update complexity level for next click
      setComplexityLevel((prev) => {
        if (prev === "simple") return "medium";
        if (prev === "medium") return "complex";
        return "simple";
      });
    } catch (error) {
      console.error(
        `❌ Error generating ${complexityLevel} prompt:`,
        error.message
      );
      alert(`Error generating ${complexityLevel} prompt: ${error.message}`);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

const isLikelyOtpStep = (step) => {
  const stepText = typeof step === 'object' ? step.command || step.description : step;
  const stepLower = stepText.toLowerCase();
  
  const typePattern = /type\s+([^in]+)\s+in/i;
  const match = stepText.match(typePattern);
  
  if (match) {
    const userInput = match[1].trim().toLowerCase();
    return userInput.includes('otp');
  }
  

  return stepLower.startsWith('type otp') || 
         stepLower.startsWith('enter otp') ||
         stepLower.startsWith('input otp');
};

const handleOtpConfirmation = (userSelectedOtpStep) => {
  const { contactStep, contactType, detectedSteps } = otpConfirmationModal;
  const { project_type, platform } = projectData || {};

  // Parse user selection
  const otpStep = userSelectedOtpStep === 'none' ? null : parseInt(userSelectedOtpStep);

  console.log("🚀 Navigating with user-confirmed OTP:", {
    contactStep: contactStep + 1,
    otpStep: otpStep !== null ? otpStep + 1 : 'User selected: None',
    contactType
  });

  const stepsWithOtpFlags = detectedSteps.map((step, index) => {
    const baseStep = typeof step === 'object' ? step : { command: step };
    
    const isContactStep = index === contactStep;
    const isActualOtpStep = index === otpStep;
    
    if (isContactStep) {
      return {
        ...baseStep,
        requiresOtp: true, 
        otpType: contactType, 
        isOtpRelatedStep: true, 
        isActualOtpStep: false
      };
    }

    if (isActualOtpStep) {
      return {
        ...baseStep,
        requiresOtp: true, 
        otpType: contactType, 
        isOtpRelatedStep: false, 
        isActualOtpStep: true 
      };
    }
    
    if (contactStep !== null && otpStep !== null && index > contactStep && index < otpStep) {
      return {
        ...baseStep,
        requiresOtp: true, 
        otpType: contactType, 
        isOtpRelatedStep: false, 
        isActualOtpStep: false 
      };
    }
    
    return {
      ...baseStep,
      requiresOtp: false,
      otpType: null,
      isOtpRelatedStep: false,
      isActualOtpStep: false
    };
  });

  const navigationState = {
    generatedSteps: stepsWithOtpFlags,
    autoExecuteFirst: true,
    needsOtpVerification: true,
    // senderEmail: otpConfirmationModal.contactType === 'email' ? testData?.email : null,
    testScenarioInfo: {
      testcase_name: scenarioName.trim(),
      testcase_type: scenarioType,
      testcase_priority: scenarioPriority,
      projectId: projectData?.project_name,
      project_type: projectData?.project_type,
      platform: projectData?.platform
    }
  };

  console.log("🎯 Steps with user-confirmed OTP flags:", stepsWithOtpFlags);

  // Close modal and reset selection
  setOtpConfirmationModal({
    isOpen: false,
    contactStep: null,
    otpStep: null,
    matchedContactData: null,
    contactType: null,
    detectedSteps: []
  });
  setSelectedOtpStep('none');

  console.log("🔍 Debug navigation data:", {
    contactType: otpConfirmationModal.contactType,
    // testDataEmail: testData?.email,
    // senderEmailToPass: otpConfirmationModal.contactType === 'email' ? testData?.email : null
  });

  // Navigation logic remains the same...
  if (project_type === "Web Application" && platform === "Laptop/PC") {
    navigate("/prompt-adding", { state: navigationState });
  } 
  else if (project_type === "Web Application" && platform === "Mobile") {
    navigate("/mobile-prompt", { state: navigationState });
  } 
  else if (project_type === "Mobile Application" && platform === "Android") {
    navigate("/android-prompt", { state: navigationState });
  } 
  else {
    alert("Unsupported combination of project type and platform.");
  }
};

  const handleOtpModalCancel = () => {
    setOtpConfirmationModal({
      isOpen: false,
      contactStep: null,
      otpStep: null,
      matchedContactData: null,
      contactType: null,
      detectedSteps: []
    });
  };

  const handleClearSteps = () => {
    // setExtractedSteps([]);
    // setShowExtractedSteps(false);
    setPromptText('');
  };

// const handleOtpCheckboxChange = (e) => {
//   const isChecked = e.target.checked;
//   console.log("☑️ OTP Checkbox changed:", isChecked);
//   setNeedsOtpVerification(isChecked);
  
//   if (isChecked) {
//     console.log("🔐 OTP verification enabled, will fetch test data...");
//   } else {
//     console.log("❌ OTP verification disabled");
//   }
// };

const createTestScenarioFromResults = async () => {
  if (!testResults || !testResults.action_history) {
    alert('No test results available to create scenario.');
    return;
  }

  try {
    setIsCreatingTestCase(true);
    
    // Get the user ID from localStorage
    const userId = localStorage.getItem("userId");

    // Step 1: Create the test case first (with test scenario prompt)
    const testCasePayload = {
      user_id: parseInt(userId),
      project_name: testCaseInfo.projectId,
      testcase_name: scenarioName || `Test Scenario - ${Date.now()}`,
      testcase_type: testCaseInfo.testcase_type || 'Functional',
      testcase_priority: testCaseInfo.testcase_priority || 'Medium',
      test_scenarios_desc: promptText 
    };

    console.log("Creating test case with payload:", testCasePayload);

    const testCaseResponse = await fetch("http://127.0.0.1:8000/integrate/testcase/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testCasePayload)
    });

    if (!testCaseResponse.ok) {
      const errorData = await testCaseResponse.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create test case");
    }

    const testCaseData = await testCaseResponse.json();
    console.log("Test case created:", testCaseData);

    // Step 2: Prepare and add steps from automation results
    const selectedSteps = testResults.action_history.map((actionItem, index) => {
      const { action, request, result, screenshot } = actionItem;
      
      // Get step description from command or create from action
      let stepDescription = request.command || `${action.action} ${action.element || ''}`;

      // Determine test step result based on execution result
      let teststep_result = "not_executed";
      if (result === "executed" || result === "success") {
        teststep_result = "passed";
      } else if (result === "failed" || result === "error") {
        teststep_result = "failed";
      }

      // Get coordinates from action or request
      let coordinates = { click_x: 0, click_y: 0 };
      if (action.coordinates) {
        coordinates = {
          click_x: action.coordinates.x || action.coordinates.click_x || 0,
          click_y: action.coordinates.y || action.coordinates.click_y || 0
        };
      } else if (request.click_x !== undefined && request.click_y !== undefined) {
        coordinates = {
          click_x: request.click_x,
          click_y: request.click_y
        };
      }

      const stepData = {
        step_number: index + 1,
        step_description: stepDescription,
        teststep_result: teststep_result,
        step_coordinates: coordinates,
        actual_result: result === "executed" ? "Step executed successfully" : result,
        self_healing_required: true, 
        scenarios_step_screenshot: screenshot || "",
        step_reason: action.reasoning || `Reason for ${action.action} action on ${action.element || 'element'}`,
        expected_result: action.expected_change || `Expected result for step ${index + 1}`,
        // requires_otp: false,
        // otp_type: null ,
      };

      return stepData;
    });

    // Create steps payload
    const stepsPayload = {
      user_id: parseInt(userId),
      project_name: testCaseInfo.projectId,
      testcase_name: scenarioName || `Test Scenario - ${Date.now()}`,
      steps: selectedSteps
    };

    console.log("Adding steps with payload:", stepsPayload);

    const stepsResponse = await fetch("http://127.0.0.1:8000/integrate/teststep/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stepsPayload)
    });

    if (!stepsResponse.ok) {
      const errorData = await stepsResponse.json().catch(() => ({}));
      // If steps fail, show warning that test case was created but steps failed
      console.warn("Steps creation failed:", errorData);
      alert(`Test Case Created Successfully, but failed to add steps: ${errorData.message || "Unknown error"}`);
      return;
    }

    const stepsData = await stepsResponse.json();
    console.log("Steps added:", stepsData);

    alert(`Test Scenario Created Successfully with ${selectedSteps.length} steps!`);
    
    navigate("/test-cases");

  } catch (error) {
    console.error('Error creating test scenario:', error);
    alert(`Error: ${error.message}`);
  } finally {
    setIsCreatingTestCase(false);
  }
};

  return (
    <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full ">
      <div className="p-6">
        <div className="min-h-screen p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="flex justify-between items-start">
                  <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      AI-Powered Test Scenario Creation
                  </h1>
                  <p className="text-gray-600 text-sm md:text-base">
                      Enter your test requirements and let AI generate detailed test steps for you
                  </p>
                  </div>
                  
                  {/* Project Info - Top Right */}
                  {projectData && (
                  <div className="text-right bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                      <div className="text-sm text-gray-700 mb-1">
                      <span className="text-gray-500">Type:</span> 
                      <span className="font-medium text-blue-700 ml-1">{projectData.project_type}</span>
                      </div>
                      <div className="text-sm text-gray-700">
                      <span className="text-gray-500">Platform:</span> 
                      <span className="font-medium text-green-700 ml-1">{projectData.platform}</span>
                      </div>
                  </div>
                  )}
              </div>
            </div>

            {/* Device Connection Status */}
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h2>
            
            <div className="flex items-center gap-4">
                {/* Connection Status Indicator */}
                <div className="flex items-center gap-2">
                {deviceConnectionStatus === 'checking' && (
                    <>
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-blue-600 font-medium">Checking Connection...</span>
                    </>
                )}
                
                {deviceConnectionStatus === 'connected' && (
                    <>
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                    <span className="text-green-600 font-medium">Device Connected</span>
                    {installedApps.length > 0 && (
                        <span className="text-sm text-gray-500">({installedApps.length} apps found)</span>
                    )}
                    </>
                )}
                
                {deviceConnectionStatus === 'failed' && (
                    <>
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </div>
                    <span className="text-red-600 font-medium">Connection Failed</span>
                    {connectionError && (
                        <span className="text-sm text-gray-500">- {connectionError}</span>
                    )}
                    <button
                        onClick={retryConnection}
                        disabled={isConnecting}
                        className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isConnecting ? 'Connecting...' : 'Retry'}
                    </button>
                    </>
                )}
                </div>
            </div>
            </div>

            {/* Test Details and URL Combined Section */}
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Case Details</h2>
              
              <div className="grid grid-cols-2 gap-8">
                
                {/* Left Half - Test Case Details (Name, Type, Priority) */}
                <div>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 h-11 flex items-center">
                        {testCaseInfo?.testcase_name || 'Not specified'}
                      </div>
                    </div>
                    
                    {/* Type Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 h-11 flex items-center">
                        {testCaseInfo?.testcase_type || 'Not specified'}
                      </div>
                    </div>

                    {/* Priority Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 h-11 flex items-center">
                        {testCaseInfo?.testcase_priority || 'Not specified'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Half - App Selection */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select App to Test</label>
                
                <div className="relative h-11">
                    {deviceConnectionStatus !== 'connected' ? (
                    <div className="w-full h-full px-3 bg-gray-100 border border-gray-200 rounded-lg flex items-center text-gray-400 cursor-not-allowed">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        Device not connected
                    </div>
                    ) : isLoadingApps ? (
                    <div className="w-full h-full px-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center">
                        <svg className="animate-spin h-4 w-4 text-purple-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-500">Loading apps...</span>
                    </div>
                    ) : (
                    <>
                        {/* App Dropdown */}
                        <button
                        onClick={() => setIsAppDropdownOpen(!isAppDropdownOpen)}
                        className="w-full h-full px-3 bg-white border border-gray-300 rounded-lg flex items-center justify-between text-left hover:border-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        >
                        <span className={`text-sm truncate ${selectedApp ? 'text-gray-900' : 'text-gray-400'}`}>
                            {selectedApp ? (
                            <span>
                                <span className="font-medium">{getAppDisplayName(selectedApp)}</span>
                                <span className="text-gray-500 ml-1">({selectedApp})</span>
                            </span>
                            ) : (
                            'Select an app to test'
                            )}
                        </span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {isAppDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
                            {/* Search Input */}
                            <div className="p-3 border-b border-gray-200">
                            <input
                                type="text"
                                placeholder="Search apps..."
                                value={appSearchQuery}
                                onChange={(e) => setAppSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                autoFocus
                            />
                            </div>

                            {/* Apps List */}
                            <div className="max-h-64 overflow-y-auto">
                            {filteredApps.length > 0 ? (
                                filteredApps.map((app, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAppSelect(app)}
                                    className="w-full px-3 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                >
                                    <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">
                                        {getAppDisplayName(app)}
                                    </span>
                                    <span className="text-xs text-gray-500 mt-0.5">
                                        {app}
                                    </span>
                                    </div>
                                </button>
                                ))
                            ) : (
                                <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                No apps found matching "{appSearchQuery}"
                                </div>
                            )}
                            </div>
                        </div>
                        )}
                    </>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6">
            {/* Left Side - Prompt Input */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                {/* Action Buttons at Top */}
                <div className="flex justify-end gap-3 mb-4">
                <button
                    onClick={extractStepsFromPrompt}
                    disabled={isExtracting || !promptText.trim()}
                    className="px-6 py-2 bg-white text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-300 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm md:text-base font-medium"
                >
                    {isExtracting ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Running...
                    </span>
                    ) : (
                    'Start'
                    )}
                </button>

                {/* Add Create Button - Only show after test results are available */}
                {showTestResults && testResults && (
                  <button
                    onClick={createTestScenarioFromResults}
                    disabled={isCreatingTestCase}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm md:text-base font-medium"
                  >
                    {isCreatingTestCase ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      'Create'
                    )}
                  </button>
                )}

                {showExtractedSteps && (
                    <button
                    onClick={handleClearSteps}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm md:text-base font-medium"
                    >
                    Clear
                    </button>
                )}
                </div>

                <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Scenario Prompt
                </label>
                <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Enter your test scenario requirements here...

    Example: 
    - Test user login functionality
    - Verify password reset feature
    - Test shopping cart checkout process
    - Validate form submission with different inputs"
                    className="w-full h-40 md:h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none text-sm md:text-base"
                    disabled={isExtracting}
                />
                  <div className="flex justify-end items-center gap-3 mt-2">
                    <button
                      onClick={generatePromptFromAssistant}
                      disabled={isGeneratingPrompt}
                      className="text-blue-600 text-sm flex items-center hover:underline disabled:opacity-50"
                    >
                      {isGeneratingPrompt ? (
                        <svg
                          className="animate-spin w-4 h-4 mr-2 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4H8v4H4z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 mr-2 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      )}
                      {isGeneratingPrompt ? "Generating..." : "Prompt Assistant"}
                    </button>

                    {/* New Enhance Button */}
                    <button
                      onClick={enhancePrompt}
                      disabled={isEnhancing || !promptText.trim()}
                      className="text-green-600 text-sm flex items-center hover:underline disabled:opacity-50"
                    >
                      {isEnhancing ? (
                        <svg
                          className="animate-spin w-4 h-4 mr-2 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4H8v4H4z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 mr-2 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                          />
                        </svg>
                      )}
                      {isEnhancing ? "Enhancing..." : "Enhance"}
                    </button>

                    {/* ✅ ADD THIS HISTORY DROPDOWN RIGHT HERE */}
                    <div className="relative ml-3">
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        disabled={promptHistory.length === 0}
                        className="text-blue-600 text-sm flex items-center hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        History ({promptHistory.length})
                      </button>

                      {/* History Dropdown */}
                      {showHistory && promptHistory.length > 0 && (
                        <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                          {/* Header */}
                          <div className="flex items-center justify-between p-3 border-b border-gray-100">
                            <span className="font-medium text-gray-900 text-sm">Recent Prompts</span>
                            <button
                              onClick={clearPromptHistory}
                              className="text-red-600 text-xs hover:underline"
                            >
                              Clear All
                            </button>
                          </div>

                          {/* History Items */}
                          <div className="py-2">
                            {promptHistory.map((item, index) => (
                              <div
                                key={item.id}
                                onClick={() => loadPromptFromHistory(item)}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs text-gray-500 mb-1">{item.timestamp}</div>
                                    <div className="text-sm text-gray-900 truncate mb-1">
                                      {item.prompt.substring(0, 60)}...
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                                        {item.steps.length} steps
                                      </span>
                                      {item.scenarioDetails?.name && (
                                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                          {item.scenarioDetails.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            </div>
            </div>

            {/* Helper Text */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                </div>
                <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                    How to use Test Scenario Creation
                </h3>
                <ul className="list-decimal pl-5 text-sm text-blue-700 space-y-1">
                    <li>Enter your test requirements in natural language</li>
                    <li>Click "Create Steps" to generate detailed test steps using AI</li>
                    <li>Review the generated steps and click "Add Steps" to include them in your test case</li>
                </ul>
                </div>
            </div>
            </div>
          </div>
        </div>

        {/* ✅ NEW: OTP Confirmation Modal */}
        {otpConfirmationModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[70vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">OTP Verification Setup</h3>
                    <p className="text-sm text-gray-600">Configure automated OTP handling for your test</p>
                  </div>
                </div>
                <button
                  onClick={handleOtpModalCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {otpConfirmationModal.contactStep + 1}
                      </span>
                    </div>
                    <h4 className="font-semibold text-purple-900">Contact Method Detected</h4>
                  </div>
                  <div className="ml-11">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-700 font-medium">
                        {otpConfirmationModal.contactType === 'email' ? '📧 Email:' : '📱 Phone:'} 
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {otpConfirmationModal.matchedContactData}
                      </span>
                    </div>
                  </div>
                </div>

                {/* OTP Step Selection */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Select OTP Entry Step
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Which step requires entering the OTP/verification code?
                  </p>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {/* No OTP Option */}
                    <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedOtpStep === 'none' 
                        ? 'border-purple-300 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="otpStep"
                        value="none"
                        checked={selectedOtpStep === 'none'}
                        onChange={(e) => setSelectedOtpStep(e.target.value)}
                        className="mt-1 text-purple-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">No manual OTP step</div>
                        <div className="text-sm text-gray-500">System will handle OTP automatically</div>
                      </div>
                    </label>

                    {/* Available Steps */}
                    {otpConfirmationModal.detectedSteps
                      .slice(otpConfirmationModal.contactStep + 1)
                      .map((step, index) => {
                        const actualIndex = otpConfirmationModal.contactStep + 1 + index;
                        const stepText = typeof step === 'object' ? step.command || step.description : step;
                        const isLikely = isLikelyOtpStep(step);
                        const isSelected = selectedOtpStep === actualIndex.toString();
                        
                        return (
                          <label 
                            key={actualIndex} 
                            className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-purple-300 bg-purple-50'
                                : isLikely
                                ? 'border-green-300 bg-green-50 hover:border-green-400'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="otpStep"
                              value={actualIndex.toString()}
                              checked={isSelected}
                              onChange={(e) => setSelectedOtpStep(e.target.value)}
                              className="mt-1 text-purple-600"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">Step {actualIndex + 1}</span>
                                {isLikely && (
                                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                    🎯 Detected OTP
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-700 break-words font-mono bg-gray-50 px-2 py-1 rounded">
                                {stepText}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleOtpModalCancel}
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleOtpConfirmation(selectedOtpStep)}
                  className="px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  Configure & Proceed
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Test Results Section */}
        {showTestResults && testResults && (
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    testResults.success ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {testResults.success ? (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Test Execution Results</h2>
                    <p className="text-sm text-gray-600">{testResults.test_prompt}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTestResults(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-900">
                    {testResults.success_metrics?.total_steps_attempted || 0}
                  </div>
                  <div className="text-sm text-purple-700">Total Steps</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900">
                    {testResults.success_metrics?.successful_steps || 0}
                  </div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-900">
                    {testResults.success_metrics?.total_failures || 0}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-900">
                    {testResults.success_metrics?.success_rate || '0%'}
                  </div>
                  <div className="text-sm text-blue-700">Success Rate</div>
                </div>
              </div>

              {/* Execution Time & Status */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">Execution Time:</span>
                    <span className="ml-2 text-lg font-semibold text-gray-900">
                      {testResults.success_metrics?.execution_time
                        ? testResults.success_metrics.execution_time >= 60
                          ? `${(testResults.success_metrics.execution_time / 60).toFixed(2)}m`
                          : `${testResults.success_metrics.execution_time.toFixed(2)}s`
                        : "0s"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                      testResults.result === 'passed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {testResults.result || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ADD THIS ERROR SECTION HERE */}
              {testResults.error_message && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-900 mb-2">Error Details</h3>
                      
                      {/* Error Message */}
                      <div className="mb-3">
                        <span className="text-sm font-medium text-red-800">Message:</span>
                        <p className="text-sm text-red-700 mt-1 bg-red-100 p-2 rounded border">
                          {testResults.error_message}
                        </p>
                      </div>

                      {/* Error Context */}
                      {testResults.error_context && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-red-800">Context:</span>
                          <div className="text-sm text-red-700 mt-1 bg-red-100 p-3 rounded border">
                            <div className="grid grid-cols-2 gap-4">
                              {testResults.error_context.step_number && (
                                <div>
                                  <span className="font-medium">Step:</span> {testResults.error_context.step_number}
                                </div>
                              )}
                              {testResults.error_context.action && (
                                <div>
                                  <span className="font-medium">Action:</span> {testResults.error_context.action}
                                </div>
                              )}
                              {testResults.error_context.element && (
                                <div>
                                  <span className="font-medium">Element:</span> {testResults.error_context.element}
                                </div>
                              )}
                              {testResults.error_context.error_type && (
                                <div>
                                  <span className="font-medium">Error Type:</span> {testResults.error_context.error_type}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Traceback - Collapsible */}
                      {testResults.error_context?.traceback && (
                        <div className="mb-3">
                          <details className="cursor-pointer">
                            <summary className="text-sm font-medium text-red-800 hover:text-red-900 select-none">
                              Technical Details (Click to expand)
                            </summary>
                            <div className="mt-2 p-3 bg-red-100 rounded border text-xs font-mono text-red-800 max-h-40 overflow-y-auto whitespace-pre-wrap">
                              {testResults.error_context.traceback}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Results Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Step-by-Step Execution</h3>
                
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Step
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Element
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Input
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Screenshot
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {testResults.action_history?.map((action, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                              action.result === 'executed' || action.result === 'success' 
                                ? 'bg-green-600' 
                                : 'bg-red-600'
                            }`}>
                              {action.step + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {action.action?.action || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={action.action?.element || 'N/A'}>
                              {action.action?.element || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {action.action?.text || action.action?.url || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              action.result === 'executed' || action.result === 'success'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {action.result || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {action.screenshot ? (
                              <button
                                onClick={() => setScreenshotModal({
                                  isOpen: true,
                                  src: `http://127.0.0.1:8000${action.screenshot}`,
                                  alt: `Screenshot for step ${action.step + 1}`
                                })}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title={`View screenshot for step ${action.step + 1}`}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"/>
                                </svg>
                              </button>
                            ) : (
                              <span className="text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Final Screenshots */}
                {/* {testResults.screenshots && (
                  <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-4">Final Results</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {testResults.screenshots.previous_screenshot && (
                        <div>
                          <div className="text-sm text-gray-600 mb-2">Previous Screenshot</div>
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={`http://127.0.0.1:8000${testResults.screenshots.previous_screenshot}`}
                              alt="Previous screenshot"
                              className="w-full h-auto max-h-48 object-contain bg-white cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setScreenshotModal({
                                isOpen: true,
                                src: `http://127.0.0.1:8000${testResults.screenshots.previous_screenshot}`,
                                alt: 'Previous screenshot'
                              })}
                            />
                          </div>
                        </div>
                      )}
                      {testResults.screenshots.final_screenshot && (
                        <div>
                          <div className="text-sm text-gray-600 mb-2">Final Screenshot</div>
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={`http://127.0.0.1:8000${testResults.screenshots.final_screenshot}`}
                              alt="Final screenshot"
                              className="w-full h-auto max-h-48 object-contain bg-white cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setScreenshotModal({
                                isOpen: true,
                                src: `http://127.0.0.1:8000${testResults.screenshots.final_screenshot}`,
                                alt: 'Final screenshot'
                              })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )} */}
              </div>
            </div>
          </div>
        )}

        {/* Screenshot Modal */}
        {screenshotModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-6xl max-h-[90vh] w-full">
              <button
                onClick={() => setScreenshotModal({ isOpen: false, src: '', alt: '' })}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              <img
                src={screenshotModal.src}
                alt={screenshotModal.alt}
                className="w-full h-full object-contain bg-white rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Device Connection Modal */}
        {connectionModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
              <div className="text-center">
                {connectionModal.isConnecting && (
                  <>
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Connecting to Device</h3>
                    <p className="text-gray-600">Please wait while we establish connection with your device...</p>
                  </>
                )}
                
                {connectionModal.connectionStatus === 'connected' && (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Device Connected</h3>
                    <p className="text-gray-600">Successfully connected! Starting automation...</p>
                  </>
                )}
                
                {connectionModal.connectionStatus === 'failed' && (
                  <>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Failed</h3>
                    <p className="text-gray-600 mb-4">{connectionModal.errorMessage}</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={checkDeviceConnection}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => setConnectionModal({ isOpen: false, isConnecting: false, connectionStatus: null, errorMessage: null })}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AndroidSenario;