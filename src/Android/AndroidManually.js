
import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Plus, Camera , RotateCw, Check, Info, Save, ChevronUp, ChevronDown, WifiOff,Smartphone, MonitorSmartphone, Loader } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const AndroidManually = () => {

  const storeInSessionStorage = (stepId, data) => {
    try {
      // Store coordinates and elements for the specific step
      const sessionKey = `captured_step_${stepId}`;
      sessionStorage.setItem(sessionKey, JSON.stringify(data));
      
      // Update the list of all captured step IDs
      const existingStepIds = JSON.parse(sessionStorage.getItem('captured_step_ids') || '[]');
      if (!existingStepIds.includes(stepId)) {
        existingStepIds.push(stepId);
        sessionStorage.setItem('captured_step_ids', JSON.stringify(existingStepIds));
      }
    } catch (err) {
      console.error("Error storing data in session storage:", err);
    } finally{
      setHasSessionData(true);
    }
  };
  
  const getFromSessionStorage = (stepId) => {
    try {
      const sessionKey = `captured_step_${stepId}`;
      const data = sessionStorage.getItem(sessionKey);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error("Error retrieving data from session storage:", err);
      return null;
    }
  };
  
  const [testSteps, setTestSteps] = useState([]);
  const [testCaseInfo, setTestCaseInfo] = useState({
    name: '',
    type: '',
    project_type: '',
    platform:''
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  
  const [capturedSteps, setCapturedSteps] = useState({});
  const [captureLoading, setCaptureLoading] = useState({});
  const [expandedScreenshot, setExpandedScreenshot] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [minimizedScreenshots, setMinimizedScreenshots] = useState({});

  const [commandSuggestions, setCommandSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [commandType, setCommandType] = useState("");
  const [ , setTempStepValue] = useState("");
  const [originalStepValues, setOriginalStepValues] = useState({});
  const [lastCapturedStepId, setLastCapturedStepId] = useState(null);
  const [originalCaptureIds, setOriginalCaptureIds] = useState({});

  const [currentStepId, setCurrentStepId] = useState(null);
  const [ , setCurrentStepNumber] = useState(null);
  const [hasSessionData, setHasSessionData] = useState(false);
  const [showWaitModal, setShowWaitModal] = useState(false);

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [installedApps, setInstalledApps] = useState({});
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [headerLoading, setHeaderLoading] = useState(false);
  const [syncButton, setSyncButton] = useState(false);

  const inputRef = useRef(null);

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
        JSON.parse(savedProject);
      } catch (err) {
        localStorage.removeItem(savedProjectKey);
      }
    }

    const handleProjectChange = () => {
      navigate("/test-cases");
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, [navigate]);

  useEffect(() => {
    const info = location.state?.testCaseInfo;
  
    if (!info || !info.testcase_name || !info.testcase_type || !info.testcase_priority) {
      alert("Test case data is incomplete or missing.");
      navigate("/test-cases/create-testcases");
      return;
    }
  
    setTestCaseInfo(info);
  }, [location, navigate]);

  const checkSessionData = () => {
    try {
      const capturedStepIds = JSON.parse(sessionStorage.getItem('captured_step_ids') || '[]');
      return capturedStepIds.length > 0;
    } catch (err) {
      console.error("Error checking session storage data:", err);
      return false;
    }
  };
  
  const clearAllSessionData = () => {
    try {
      // Get all captured step IDs
      const capturedStepIds = JSON.parse(sessionStorage.getItem('captured_step_ids') || '[]');
      
      // Clear each step's data
      capturedStepIds.forEach(stepId => {
        const sessionKey = `captured_step_${stepId}`;
        sessionStorage.removeItem(sessionKey);
      });
      
      // Clear the list of captured step IDs
      sessionStorage.removeItem('captured_step_ids');
      
      // Reset captured steps in state
      setCapturedSteps({});
      setOriginalCaptureIds({});
      setLastCapturedStepId(null);
      setHasSessionData(false);
      
      alert("All captured data has been cleared");
    } catch (err) {
      console.error("Error clearing session storage data:", err);
      alert("Failed to clear data");
    }
  };
  
  useEffect(() => {
    setHasSessionData(checkSessionData());
  }, []);

  const checkDeviceConnection = async () => {
    console.log("checkDeviceConnection")
    setConnectionLoading(true);
    setHeaderLoading(true); 

    try {

      // First API call - connect-ui
      const connectResponse = await fetch("http://localhost:8000/android/connect-ui/", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!connectResponse.ok) {
        setHeaderLoading(false); 
        setDeviceConnected(false);
        setShowConnectModal(true);
        return;
      }

      const connectData = await connectResponse.json();
      console.log("connect-ui response:", connectData);

      await new Promise(resolve => setTimeout(resolve, 1000));  

      // Second API call - setup-device (ATX check)
      const setupResponse = await fetch("http://localhost:8000/android/setup-device/", {
        method: "POST", 
        headers: { "Content-Type": "application/json" }
      });

      
      if (setupResponse.ok) {
        const setupData = await setupResponse.json();
        console.log("setup-device response:", setupData);

        // Check if both APIs succeeded and device is connected with apps
        if ((connectData["System Apps"] || connectData["User Apps"]) &&
            setupData.status === "success") {
          
          setDeviceConnected(true);
          const combinedApps = {
            ...connectData["System Apps"],
            ...connectData["User Apps"]
          };
          setInstalledApps(combinedApps);
          sessionStorage.setItem('installedApps', JSON.stringify(combinedApps)); 
          setSyncButton(true);

          setTimeout(() => {
            setShowConnectModal(false);
          }, 1000);
        } else {
          setDeviceConnected(false);
          setShowConnectModal(false);
        }
      } else {
        // ATX setup failed
        setDeviceConnected(false);
        setShowConnectModal(false);
        alert("ATX agent installation failed. Please try again.");
      }
      
    } catch (error) {

      console.error("Error checking device connection:", error);
      setDeviceConnected(false);
      setShowConnectModal(true);
    } finally {
      setConnectionLoading(false);
      setHeaderLoading(false);
    }
  };

  // const checkChromeAvailability = async () => {
  //   console.log("checkDeviceConnection");
  //   setConnectionLoading(true);
  //   // setShowConnectionLoadingModal(true); 
  //   setConnectionSteps(prev => ({ ...prev, currentStep: 0, isSuccess: false }));

  //   try {
  //     // Step 1: USB Connection
  //     setConnectionSteps(prev => ({ ...prev, currentStep: 0 }));
  //     await new Promise(resolve => setTimeout(resolve, 2000));

  //     // Step 2: USB Debugging 
  //     setConnectionSteps(prev => ({ ...prev, currentStep: 1 }));
  //     await new Promise(resolve => setTimeout(resolve, 2000));

  //     // Step 3: Actually check device connection
  //     setConnectionSteps(prev => ({ ...prev, currentStep: 2 }));

  //     // First API call - connect-ui
  //     const connectResponse = await fetch("http://localhost:8000/android/connect-ui/", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" }
  //     });

  //     if (!connectResponse.ok) {
  //       setDeviceConnected(false);
  //       setShowConnectionLoadingModal(false);
  //       setShowConnectModal(true);
  //       return;
  //     }

  //     const connectData = await connectResponse.json();
  //     console.log("connect-ui response:", connectData);

  //     // Step 4 (simulate ATX setup delay only)
  //     setConnectionSteps(prev => ({ ...prev, currentStep: 3 }));
  //     await new Promise(resolve => setTimeout(resolve, 2000));  // simulate delay

  //     if ((connectData["System Apps"] || connectData["User Apps"])) {

  //       setDeviceConnected(true);
  //       const combinedApps = {
  //         ...connectData["System Apps"],
  //         ...connectData["User Apps"]
  //       };
  //       console.log("Setting installedApps:", combinedApps);
  //       // setInstalledApps(combinedApps);

  //       console.log("Searching for Chrome in installed apps...");
  //       const chromeEntry = Object.entries(combinedApps).find(
  //         ([appName, packageName]) =>
  //           appName.toLowerCase().includes("chrome") ||
  //           packageName.toLowerCase().includes("chrome")
  //       );

  //       if (chromeEntry) {
  //         console.log("✅ Chrome is installed:", chromeEntry);
  //         setConnectionSteps(prev => ({
  //           ...prev,
  //           isSuccess: true,
  //           successMessage: "Chrome is available!"
  //         }));
  //       } else {
  //         alert("🚫 Chrome is not available on this device.");
  //       }

  //       setTimeout(() => {
  //         setShowConnectionLoadingModal(false);
  //         setShowConnectModal(false);
  //       }, 2000);
  //     } else {
  //       setDeviceConnected(false);
  //       setShowConnectionLoadingModal(false);
  //       setShowConnectModal(false);
  //     }

  //   } catch (error) {
  //     console.error("Error checking device connection:", error);
  //     setDeviceConnected(false);
  //     setShowConnectionLoadingModal(false);
  //     setShowConnectModal(true);
  //   } finally {
  //     setConnectionLoading(false);
  //   }
  // };

  const fetchAppSuggestions = useCallback((searchTerm, index) => {
    // console.log('🔍 fetchAppSuggestions called:', { 
    //   deviceConnected, 
    //   installedAppsCount: Object.keys(installedApps).length,
    //   searchTerm 
    // });

    if (!deviceConnected || !installedApps) {
      setCommandSuggestions([]);
      return;
    }

    let suggestions = Object.entries(installedApps)
      .map(([appName, packageName]) => ({
        name: appName,
        package: packageName,
        type: 'app'
      }));

    if (testCaseInfo.platform === 'Mobile') {
      console.log("Platform is Mobile, filtering for Chrome only");
      suggestions = suggestions.filter(app => 
        app.name.toLowerCase().includes('chrome') ||
        app.package.toLowerCase().includes('chrome')
      );
    } else if (searchTerm) {
      suggestions = suggestions.filter(app => 
        app.name.toLowerCase().includes(searchTerm)
      );
    }

    setCommandSuggestions(suggestions.slice(0, 10));
  }, [deviceConnected, installedApps, testCaseInfo.platform]);

  useEffect(() => {
    // Re-fetch suggestions for the current input when installedApps updates
    if (deviceConnected && Object.keys(installedApps).length > 0 && showSuggestions) {
      const currentInput = inputRef.current?.value || '';
      fetchAppSuggestions(currentInput.toLowerCase(), currentStepId);
    }
  }, [installedApps, deviceConnected, currentStepId, fetchAppSuggestions, showSuggestions]); 

  // useEffect(() => {
  //   if (!testCaseInfo || !testCaseInfo.platform) return;

  //   const platform = testCaseInfo.platform;
  //   console.log("platform-recordpage:", platform)

  //   if (platform === "Android") {
  //     checkDeviceConnection();
  //   } 
  //   // else if (platform === "Mobile") {
  //   //   checkChromeAvailability();
  //   // }
  // }, [testCaseInfo]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/android/connection/", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();
      console.log("Connection API Data:", data);
      
      // Return true if device is connected, false otherwise
      return response.ok && data.status === "success" && data.serial;
    } catch (error) {
      console.error("Error checking connection status:", error);
      return false;
    }
  };

  useEffect(() => {
    if (!testCaseInfo || !testCaseInfo.platform) return;

    const platform = testCaseInfo.platform;
    console.log("platform-recordpage:", platform)

    if (platform === "Android") {
      // Check sessionStorage first
      const storedApps = sessionStorage.getItem('installedApps');
      
      if (storedApps) {
        try {
          const parsedApps = JSON.parse(storedApps);
          if (Object.keys(parsedApps).length > 0) {
            // Apps exist in storage, but verify device is still connected
            checkConnectionStatus().then(isConnected => {
              if (isConnected) {
                // Device still connected, use stored apps
                setInstalledApps(parsedApps);
                setSyncButton(true);
                setDeviceConnected(true);
              } else {
                // Device disconnected, but keep stored apps - just show connect modal
                setInstalledApps(parsedApps); 
                setDeviceConnected(false);
                setSyncButton(false); 
                setShowConnectModal(true);
              }
            });
            return;
          }
        } catch (error) {
          console.error('Error parsing stored apps:', error);
          sessionStorage.removeItem('installedApps');
        }
      }

      checkDeviceConnection();
    } 
  }, [testCaseInfo]);

  const handleSyncApps = async () => {
    setHeaderLoading(true);
    
    // First check if device is still connected
    const isConnected = await checkConnectionStatus();
    
    if (!isConnected) {
      // Device disconnected, show connect modal but keep apps
      setDeviceConnected(false);
      setSyncButton(false);
      setHeaderLoading(false);
      setShowConnectModal(true);
      return;
    }
    
    // Device connected, force refresh apps (user manually requested sync)
    sessionStorage.removeItem('installedApps');
    setInstalledApps({});
    setSyncButton(false);
    await checkDeviceConnection();
  };

const handleCreateTestCase = async () => {
    setIsLoading(true);

    try {
        // Filter only selected and saved steps
        const selectedSteps = testSteps
        .filter(step => step.isSelected && step.isSaved)
        .map((step, index) => {
            const stepId = step.id;
            
            // Initialize default coordinates
            let coordinates = { click_x: 0, click_y: 0 };

            // Extract coordinates from captured step data if available
            if (capturedSteps[stepId]) {
                if (step.selectedElement) {
                    if (step.selectedElement.click_point && Array.isArray(step.selectedElement.click_point)) {
                        coordinates = {
                            click_x: step.selectedElement.click_point[0] || 0,
                            click_y: step.selectedElement.click_point[1] || 0
                        };
                    } else if (step.selectedElement.coordinates && Array.isArray(step.selectedElement.coordinates)) {
                        coordinates = {
                            click_x: step.selectedElement.coordinates[0] || 0,
                            click_y: step.selectedElement.coordinates[1] || 0
                        };
                    }
                } else if (capturedSteps[stepId].coordinates) {
                    coordinates = capturedSteps[stepId].coordinates;
                }
            }
            console.log("Debug - stepId:", stepId);
            console.log("Debug - capturedSteps[stepId]:", capturedSteps[stepId]);
            console.log("Debug - step.selectedElement:", step.selectedElement);
            
            // Format each step for the teststep API
            return {
                step_number: index + 1,
                step_description: step.step_description || step.choice,
                teststep_result: "not_executed",
                step_coordinates: coordinates,
                expected_result: step.expectedResult || "",
                actual_result: ""
            };
        });

        // Get the user ID from localStorage
        const userId = localStorage.getItem("userId");
        
        // Step 1: Create the test case first (without steps)
        const testCasePayload = {
            user_id: parseInt(userId),
            project_name: testCaseInfo.projectId,
            testcase_name: testCaseInfo.testcase_name,
            testcase_type: testCaseInfo.testcase_type,
            testcase_priority: testCaseInfo.testcase_priority
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

        // Step 2: Add steps to the created test case (only if there are steps)
        if (selectedSteps.length > 0) {
            const stepsPayload = {
                user_id: parseInt(userId),
                project_name: testCaseInfo.projectId,
                testcase_name: testCaseInfo.testcase_name,
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
                console.warn("Steps creation failed:", errorData);
                alert(`Test Case Created Successfully, but failed to add steps: ${errorData.message || "Unknown error"}`);
                navigate("/test-cases");
                return;
            }

            const stepsData = await stepsResponse.json();
            console.log("Steps added:", stepsData);
        }

        alert("Test Case and Steps Created Successfully");
        navigate("/test-cases");

    } catch (error) {
        alert(`Error: ${error.message}`);
        console.error("Test case creation error:", error);
    } finally {
        setIsLoading(false);
    }
};

const handleCaptureElement = async (stepId) => {
  setCaptureLoading(prev => ({ ...prev, [stepId]: true }));
  
  try {
    const response = await fetch('http://localhost:8000/android/sync_scr/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to capture Android screen');
    }

    const data = await response.json();
    console.log("Android screen capture response:", data);

    const coordinates = { click_x: 0, click_y: 0 };
    
    const convertedElements = convertAndroidElements(data.screen_elements);
    
    const capturedData = {
      coordinates: coordinates,
      screenshot: data.screenshot_result?.url ? `http://localhost:8000${data.screenshot_result.url}` : null,
      timestamp: new Date().toISOString(),
      elements: convertedElements,
      currentApp: data.current_app
    };

    // Store the captured data
    setOriginalCaptureIds(prev => ({
      ...prev, 
      [stepId]: stepId
    }));

    setCapturedSteps(prev => ({
      ...prev,
      [stepId]: capturedData
    }));

    storeInSessionStorage(stepId, {
      ...capturedData,
      originalCaptureId: stepId
    });

    setLastCapturedStepId(stepId);
    
  } catch (error) {
    alert("Failed to capture Android screen. Please try again.");
    console.error('Android screen capture error:', error);
  } finally {
    setCaptureLoading(prev => ({ ...prev, [stepId]: false }));
  }
};

const convertAndroidElements = (screenElements) => {
  const allElements = [];
  
  // Helper function to parse bounds string like "[503,2025][540,2062]"
  const parseBounds = (boundsStr) => {
    const matches = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (matches) {
      const left = parseInt(matches[1]);
      const top = parseInt(matches[2]);
      const right = parseInt(matches[3]);
      const bottom = parseInt(matches[4]);
      
      // Calculate center point for clicking
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;
      
      return {
        left, top, right, bottom,
        centerX, centerY
      };
    }
    return { left: 0, top: 0, right: 0, bottom: 0, centerX: 0, centerY: 0 };
  };

  // Process each category of elements
  Object.entries(screenElements).forEach(([category, elements]) => {
    if (Array.isArray(elements)) {
      elements.forEach(element => {
        const bounds = parseBounds(element.bounds || "");
        
        const convertedElement = {
          name: element.content_desc || element.text || element.description || '',
          text: element.text || element.content_desc || '',
          type: category === 'buttons' ? 'button' : 
                category === 'text_fields' ? 'text' : 
                category === 'icons' ? 'icon' : 'other',
          interactivity: element.clickable || element.focusable || false,
          click_point: [bounds.centerX, bounds.centerY],
          coordinates: [bounds.centerX, bounds.centerY],
          bounds: element.bounds,
          resource_id: element.resource_id || '',
          class: element.class || '',
          clickable: element.clickable || false,
          focusable: element.focusable || false,
          scrollable: element.scrollable || false,
          category: category
        };
        
        allElements.push(convertedElement);
      });
    }
  });
  
  return allElements;
};

  const handleSaveStep = (index) => {
    if (testSteps[index].choice.trim() === "") {
      alert("Please provide a step description before saving.");
      return;
    }

    // First check if there's an empty step at the end
    const lastStepIndex = testSteps.length - 1;
    const lastStep = testSteps[lastStepIndex];  
    const hasEmptyLastStep = lastStepIndex !== index && 
                            lastStep && 
                            !lastStep.isSaved && 
                            lastStep.choice.trim() === "";

    // Update the current step
    const updatedSteps = [...testSteps];
    updatedSteps[index].isSaved = true;
    
    // Remove empty last step if needed
    const finalSteps = hasEmptyLastStep ? 
      updatedSteps.filter((_, idx) => idx !== lastStepIndex) : 
      updatedSteps;
      
    // Renumber steps if necessary
    finalSteps.forEach((step, idx) => {
      step.stepNumber = idx + 1;
    });
    
    setTestSteps(finalSteps);
    setEditingStep(null);
    setShowSuggestions(false);

    // Clean up original values
    setOriginalStepValues(prev => {
      const newValues = {...prev};
      delete newValues[index];
      return newValues;
    });
  };

  const handleAddStep = (afterIndex = null) => {
    // Cancel any existing editable step first
    if (editingStep !== null) {
      handleCancelEdit(editingStep);
    }
    
    // Create new step
    const newStep = {
      id: `step-${Date.now()}`, 
      stepNumber: testSteps.length + 1,
      choice: "",
      isSaved: false,
      isSelected: true
    };
    
    let updatedSteps;
    if (afterIndex !== null) {
      updatedSteps = [
        ...testSteps.slice(0, afterIndex + 1),
        newStep,
        ...testSteps.slice(afterIndex + 1)
      ];
    } else {
      updatedSteps = [...testSteps, newStep];
    }
    
    // Re-number steps
    updatedSteps.forEach((step, idx) => {
      step.stepNumber = idx + 1;
    });
    
    setTestSteps(updatedSteps);
    setTempStepValue("");
    
    // Set this new step as the one being edited
    const newEditingIndex = afterIndex !== null ? afterIndex + 1 : updatedSteps.length - 1;
    setEditingStep(newEditingIndex);
    
    // Close suggestions
    setShowSuggestions(false);
  };

  const handleSaveAndAddStep = () => {
    const currentEditingIndex = editingStep;
    
    if (currentEditingIndex === null) {
      handleAddStep();
      return;
    }

    if (testSteps[currentEditingIndex].choice.trim() === "") {
      alert("Please provide a step description before adding a new step.");
      return;
    }

    // Save the current step
    const updatedSteps = [...testSteps];
    updatedSteps[currentEditingIndex].isSaved = true;
    setTestSteps(updatedSteps);
    
    // Clear editing state
    setEditingStep(null);
    setShowSuggestions(false);
    
    // Add new step after the current one
    setTimeout(() => {
      handleAddStep(currentEditingIndex);
    }, 0);
  };

  const handleDoubleClick = (index) => {
    if (testSteps[index].isSaved) {
      // If another step is being edited, save that first if it has content
      if (editingStep !== null && editingStep !== index) {
        const editingStepValue = testSteps[editingStep]?.choice || "";
        if (editingStepValue.trim() !== "") {
          handleSaveStep(editingStep);
        } else {
          handleCancelEdit(editingStep);
        }
      }
      
      // Now set up the double-clicked step for editing
      setOriginalStepValues(prev => ({
        ...prev,
        [index]: testSteps[index].choice
      }));
      
      const updatedSteps = [...testSteps];
      updatedSteps[index].isSaved = false;
      setTestSteps(updatedSteps);
      setEditingStep(index);
      setTempStepValue(testSteps[index].choice);
      
      // Show suggestions based on input
      const input = testSteps[index].choice;
      const words = input.trim().split(' ');
      const command = words[0].toLowerCase();
      
      if (['click', 'type', 'verify', 'get'].includes(command)) {
        setCommandType(command);
        
        const stepId = testSteps[index].id;
        
        // First check if this step has its own captured data
        if (capturedSteps[stepId]) {
          console.log("Using captured data for current step:", stepId);
          fetchElementSuggestions(command, input, words, stepId);
          setShowSuggestions(index);
        } 
        // Otherwise, use the last captured step's data
        else if (lastCapturedStepId && capturedSteps[lastCapturedStepId]) {
          console.log("Using last captured step data:", lastCapturedStepId);
          fetchElementSuggestions(command, input, words, lastCapturedStepId);
          setShowSuggestions(index);
        }
      }
      
      // Ensure the step is visible in the viewport
      setTimeout(() => {
        const stepElement = document.getElementById(`step-${testSteps[index].id}`);
        if (stepElement) {
          stepElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 10);
    }
  };  
  
  const handleCancelEdit = (index) => {
    if (index === null || index >= testSteps.length) return;
  
    const updatedSteps = [...testSteps];
  
    // If it's a new step with no saved data, delete it
    if (!updatedSteps[index].isSaved && !originalStepValues[index]) {
      handleDeleteStep(index);
      return;
    }
  
    // If it's an edited existing step, restore original value
    if (originalStepValues[index]) {
      updatedSteps[index].choice = originalStepValues[index];
      updatedSteps[index].isSaved = true; 
  
      // Check and remove empty unsaved last step
      const lastStepIndex = updatedSteps.length - 1;
      const lastStep = updatedSteps[lastStepIndex];
  
      const shouldRemoveLastStep = 
        lastStepIndex !== index &&
        lastStep && 
        !lastStep.isSaved && 
        lastStep.choice.trim() === "";
  
      const finalSteps = shouldRemoveLastStep
        ? updatedSteps.filter((_, idx) => idx !== lastStepIndex)
        : updatedSteps;
  
      // Renumber steps
      finalSteps.forEach((step, idx) => {
        step.stepNumber = idx + 1;
      });
  
      setTestSteps(finalSteps);
  
      // Clean up original values
      setOriginalStepValues(prev => {
        const newValues = {...prev};
        delete newValues[index];
        return newValues;
      });
    }
  
    setEditingStep(null);
    setShowSuggestions(false);
    setCommandSuggestions([]);
  };  
  
  useEffect(() => {
    try {
      // Load all captured step IDs
      const capturedStepIds = JSON.parse(sessionStorage.getItem('captured_step_ids') || '[]');
      
      // Load each captured step data
      const loadedCapturedSteps = {};
      const loadedOriginalIds = {};
      
      capturedStepIds.forEach(stepId => {
        const stepData = getFromSessionStorage(stepId);
        if (stepData) {
          loadedCapturedSteps[stepId] = stepData;
          
          // Track original capture IDs
          if (stepData.originalCaptureId) {
            loadedOriginalIds[stepId] = stepData.originalCaptureId;
          } else {
            loadedOriginalIds[stepId] = stepId; // Default to self if not specified
          }
        }
      });
  
      // If we have data, update the state
      if (Object.keys(loadedCapturedSteps).length > 0) {
        setCapturedSteps(prev => ({
          ...prev,
          ...loadedCapturedSteps
        }));
        
        setOriginalCaptureIds(prev => ({
          ...prev,
          ...loadedOriginalIds
        }));
        
        // Set the last captured step ID to the most recent one
        if (capturedStepIds.length > 0) {
          setLastCapturedStepId(capturedStepIds[capturedStepIds.length - 1]);
        }
      }
    } catch (err) {
      console.error("Error loading captured steps from session storage:", err);
    }
  }, []);

  const handleDeleteStep = (index) => {
    // If this is the step currently being edited, clear editing state
    if (editingStep === index) {
      setEditingStep(null);
      setShowSuggestions(false);
    }
    
    const updatedSteps = testSteps.filter((_, idx) => idx !== index);
    
    // Renumber steps
    updatedSteps.forEach((step, idx) => {
      step.stepNumber = idx + 1;
    });
    
    setTestSteps(updatedSteps);
    
    // Clean up any references in original values
    setOriginalStepValues(prev => {
      const newValues = {...prev};
      delete newValues[index];
      return newValues;
    });
  };

  const handleCommandInputChange = (e, index) => {
    const input = e.target.value;
    const updatedSteps = [...testSteps];
    updatedSteps[index].choice = input;
    setTestSteps(updatedSteps);
  
    const words = input.trim().split(' ');
    const command = words[0].toLowerCase();
    const wordsLowerCase = words.map(word => word.toLowerCase());
    const fullCommand = (command === 'scroll' || command === 'swipe') && words.length > 1
      ? (command === 'swipe' && wordsLowerCase[1] === 'long' && words.length > 2
          ? wordsLowerCase.slice(0, 3).join(' ')
          : wordsLowerCase.slice(0, 2).join(' '))
      : command;
    
    if (['click', 'type', 'verify', 'get'].includes(command)) {
      setCommandType(command);
      
      // First try to use the current step's captured data
      const stepId = testSteps[index].id;
      
      // Check if this step has its own captured data
      if (capturedSteps[stepId]) {
        console.log("Using captured data for current step:", stepId);
        fetchElementSuggestions(command, input, words, stepId);
        setShowSuggestions(index);
      } 
      // Otherwise, use the last captured step's data
      else if (lastCapturedStepId && capturedSteps[lastCapturedStepId]) {
        console.log("Using last captured step data:", lastCapturedStepId);
        fetchElementSuggestions(command, input, words, lastCapturedStepId);
        setShowSuggestions(index);
      } else {
        console.log("No captured data available");
        setShowSuggestions(false);
        setCommandSuggestions([]);
      }
    } else if (['scroll up', 'scroll down', 'wait', 'swipe left', 'swipe right', 'swipe long left', 'swipe long right'].includes(fullCommand)) { 
      setCommandType(fullCommand); 
      setShowSuggestions(false);

      if (command === 'wait' && words.length === 1) {
        
        setCurrentStepId(testSteps[index].id);
        setCurrentStepNumber(index);
        setShowWaitModal(true);
      }
    } else if (command === 'open') {
      setCommandType(command);
      if (words.length > 1) {
        const appName = words.slice(1).join(' ').toLowerCase();
        fetchAppSuggestions(appName, index);
      } else {
        fetchAppSuggestions('', index);  
      }
      setShowSuggestions(index);  
    } else {
      setCommandType("");
      setShowSuggestions(false);
    }
  };

  const handleWaitConfirm = (waitCommand, requestData) => {
  if (!currentStepId) return;
  
  // Find the step index
  const stepIndex = testSteps.findIndex(step => step.id === currentStepId);
  if (stepIndex === -1) return;
  
  // Update the step with the wait command
  const updatedSteps = [...testSteps];
  updatedSteps[stepIndex].choice = waitCommand;
  updatedSteps[stepIndex].waitData = requestData;
  
  // If this is a new step being edited, mark it as saved
  if (editingStep === stepIndex) {
    handleSaveStep(stepIndex);
  } else {
    setTestSteps(updatedSteps);
  }
};
  
  const fetchElementSuggestions = (command, inputValue, words, stepId) => {
    if (!stepId || !capturedSteps[stepId]) return;
  
    const elements = capturedSteps[stepId]?.elements || [];
    let filtered = [];
  
    // Process the elements and ensure coordinates are available
    // if (command === "click") {
    //   (filtered = elements.filter(el => (el.interactivity === true && el.type === "icon") || el.type === "text"))
    //     .map(el => {
    //       // Fix: Ensure coordinates are processed correctly
    //       let coordinates;
          
    //       if (el.click_point && Array.isArray(el.click_point)) {
    //         coordinates = [parseFloat(el.click_point[0]), parseFloat(el.click_point[1])];
    //       } else if (el.coordinates) {
    //         if (Array.isArray(el.coordinates)) {
    //           coordinates = [parseFloat(el.coordinates[0]), parseFloat(el.coordinates[1])];
    //         } else {
    //           coordinates = [
    //             parseFloat(el.coordinates.x || el.coordinates.click_x || 0), 
    //             parseFloat(el.coordinates.y || el.coordinates.click_y || 0)
    //           ];
    //         }
    //       }
          
    //       return {
    //         ...el,
    //         click_point: coordinates || [0, 0]
    //       };
    //     });
        
    //   if (words.length > 1) {
    //     const searchTerm = inputValue.substring(command.length).trim().toLowerCase();
    //     if (searchTerm) {
    //       filtered = filtered.filter(el => 
    //         (el.name && el.name.toLowerCase().includes(searchTerm)) || 
    //         (el.text && el.text.toLowerCase().includes(searchTerm))
    //       );
    //     }
    //   }
    // } 
    // else if (command === "type") {
    //   filtered = elements.filter(el => el.type === "text" || el.type === "icon")
    //     .map(el => {
    //       // Fix: Ensure coordinates are processed correctly
    //       let coordinates;
          
    //       if (el.click_point && Array.isArray(el.click_point)) {
    //         coordinates = [Number(el.click_point[0]), Number(el.click_point[1])];
    //       } else if (el.coordinates) {
    //         if (Array.isArray(el.coordinates)) {
    //           coordinates = [Number(el.coordinates[0]), Number(el.coordinates[1])];
    //         } else {
    //           coordinates = [Number(el.coordinates.x || 0), Number(el.coordinates.y || 0)];
    //         }
    //       }
          
    //       return {
    //         ...el,
    //         click_point: coordinates || [0, 0]
    //       };
    //     });
  
    //   if (words.length > 1 && inputValue.toLowerCase().includes(" in ")) {
    //     const inIndex = inputValue.toLowerCase().indexOf(" in ");
    //     const afterInText = inputValue.substring(inIndex + 4).trim().toLowerCase();
  
    //     if (afterInText) {
    //       filtered = filtered.filter(el => 
    //         (el.name && el.name.toLowerCase().includes(afterInText)) || 
    //         (el.text && el.text.toLowerCase().includes(afterInText))
    //       );
    //     }
    //   }
    // } 

    if (command === "click") {
      // Remove the restrictive filter - show ALL elements
      filtered = elements.map(el => {
        // Fix: Ensure coordinates are processed correctly
        let coordinates;
        
        if (el.click_point && Array.isArray(el.click_point)) {
          coordinates = [parseFloat(el.click_point[0]), parseFloat(el.click_point[1])];
        } else if (el.coordinates) {
          if (Array.isArray(el.coordinates)) {
            coordinates = [parseFloat(el.coordinates[0]), parseFloat(el.coordinates[1])];
          } else {
            coordinates = [
              parseFloat(el.coordinates.x || el.coordinates.click_x || 0), 
              parseFloat(el.coordinates.y || el.coordinates.click_y || 0)
            ];
          }
        }
        
        return {
          ...el,
          click_point: coordinates || [0, 0]
        };
      });
      
      // Keep the search term filtering
      if (words.length > 1) {
        const searchTerm = inputValue.substring(command.length).trim().toLowerCase();
        if (searchTerm) {
          filtered = filtered.filter(el => 
            (el.name && el.name.toLowerCase().includes(searchTerm)) || 
            (el.text && el.text.toLowerCase().includes(searchTerm))
          );
        }
      }
    }
    else if (command === "type") {
      // Remove the restrictive filter - show ALL elements
      filtered = elements.map(el => {
        // Fix: Ensure coordinates are processed correctly
        let coordinates;
        
        if (el.click_point && Array.isArray(el.click_point)) {
          coordinates = [Number(el.click_point[0]), Number(el.click_point[1])];
        } else if (el.coordinates) {
          if (Array.isArray(el.coordinates)) {
            coordinates = [Number(el.coordinates[0]), Number(el.coordinates[1])];
          } else {
            coordinates = [Number(el.coordinates.x || 0), Number(el.coordinates.y || 0)];
          }
        }
        
        return {
          ...el,
          click_point: coordinates || [0, 0]
        };
      });

      // Keep the "in" keyword filtering
      if (words.length > 1 && inputValue.toLowerCase().includes(" in ")) {
        const inIndex = inputValue.toLowerCase().indexOf(" in ");
        const afterInText = inputValue.substring(inIndex + 4).trim().toLowerCase();

        if (afterInText) {
          filtered = filtered.filter(el => 
            (el.name && el.name.toLowerCase().includes(afterInText)) || 
            (el.text && el.text.toLowerCase().includes(afterInText))
          );
        }
      }
    }
    else if (command === "verify") {
      filtered = elements.filter(el => el.type === "text" || el.type === "textarea" || el.text)
        .map(el => {
          // Fix: Ensure coordinates are processed correctly
          let coordinates;
          
          if (el.click_point && Array.isArray(el.click_point)) {
            coordinates = [Number(el.click_point[0]), Number(el.click_point[1])];
          } else if (el.coordinates) {
            if (Array.isArray(el.coordinates)) {
              coordinates = [Number(el.coordinates[0]), Number(el.coordinates[1])];
            } else {
              coordinates = [Number(el.coordinates.x || 0), Number(el.coordinates.y || 0)];
            }
          }
          
          return {
            ...el,
            click_point: coordinates || [0, 0]
          };
        });
        
      if (words.length > 1) {
        const searchTerm = inputValue.substring(command.length).trim().toLowerCase();
        if (searchTerm) {
          filtered = filtered.filter(el => 
            (el.name && el.name.toLowerCase().includes(searchTerm)) || 
            (el.text && el.text.toLowerCase().includes(searchTerm))
          );
        }
      }
    } else if (command === "get") {
      filtered = elements.filter(el => el.text || el.type === "text" || el.type === "textarea")
        .map(el => {
          // Fix: Ensure coordinates are processed correctly
          let coordinates;
          
          if (el.click_point && Array.isArray(el.click_point)) {
            coordinates = [Number(el.click_point[0]), Number(el.click_point[1])];
          } else if (el.coordinates) {
            if (Array.isArray(el.coordinates)) {
              coordinates = [Number(el.coordinates[0]), Number(el.coordinates[1])];
            } else {
              coordinates = [Number(el.coordinates.x || 0), Number(el.coordinates.y || 0)];
            }
          }
          
          return {
            ...el,
            click_point: coordinates || [0, 0]
          };
        });
        
      if (words.length > 1) {
        const searchTerm = inputValue.substring(command.length).trim().toLowerCase();
        if (searchTerm) {
          filtered = filtered.filter(el => 
            (el.name && el.name.toLowerCase().includes(searchTerm)) || 
            (el.text && el.text.toLowerCase().includes(searchTerm))
          );
        }
      }
    }
    
    filtered = filtered.slice(0, 20);
  
    if (filtered.length === 0 && elements.length > 0) {
      filtered = elements
        .filter(el => el.interactivity === true)
        .map(el => {
          // Fix: Ensure coordinates are processed correctly
          let coordinates;
          
          if (el.click_point && Array.isArray(el.click_point)) {
            coordinates = [Number(el.click_point[0]), Number(el.click_point[1])];
          } else if (el.coordinates) {
            if (Array.isArray(el.coordinates)) {
              coordinates = [Number(el.coordinates[0]), Number(el.coordinates[1])];
            } else {
              coordinates = [Number(el.coordinates.x || 0), Number(el.coordinates.y || 0)];
            }
          }
          
          return {
            ...el,
            click_point: coordinates || [0, 0]
          };
        })
        .slice(0, 5);
    }
    
    // Add debugging to display the coordinates
    console.log("Filtered elements with coordinates:", filtered);
    
    setCommandSuggestions(filtered);
  };

  const handleSuggestionClick = (suggestion, index) => {
    const updatedSteps = [...testSteps];
    let step = updatedSteps[index];
    let updatedStepValue = '';
  
    const sameNameElements = commandSuggestions.filter((el, i) => 
      commandSuggestions.indexOf(suggestion) > i && 
      ((el.name && suggestion.name && el.name === suggestion.name) || 
       (el.text && suggestion.text && el.text === suggestion.text))
    );
    const position = sameNameElements.length > 0 ? ` (Position ${sameNameElements.length + 1})` : '';
  
    if (commandType === 'open' && suggestion.type === 'app') {
      updatedStepValue = `open ${suggestion.name}`; 
      step.step_description = `open ${suggestion.package}`; 
      step.packageName = suggestion.package; 

    } else if (commandType === 'click') {
      updatedStepValue = `click ${suggestion.name || suggestion.text || 'element'}${position}`;
    } else if (commandType === 'type') {
      const currentText = step.choice;
      const inIndex = currentText.toLowerCase().indexOf(' in ');
      if (inIndex !== -1) {
        const textToType = currentText.substring(5, inIndex).trim();
        if (textToType) {
          updatedStepValue = `type ${textToType} in ${suggestion.name || suggestion.text || 'element'}`;
        } else {
          updatedStepValue = `type  in ${suggestion.name || suggestion.text || 'element'}`;
        }
      } else {
        updatedStepValue = `type  in ${suggestion.name || suggestion.text || 'element'}`;
      } 
    } else if (commandType === 'verify') {
      updatedStepValue = `verify ${suggestion.text || suggestion.name || 'element'}`;
    } else if (commandType === 'get') {
      updatedStepValue = `get ${suggestion.text || suggestion.name || 'element'}`;
    }
    
    step.choice = updatedStepValue;
    step.selectedElement = suggestion;
  
    // Process coordinates from the suggestion - Fix for NaN values
    let coordinates = null;
    
    // Fix for coordinates - ensure they are properly extracted
    if (suggestion.click_point && Array.isArray(suggestion.click_point)) {
      coordinates = {
        click_x: parseFloat(suggestion.click_point[0]) || 0,
        click_y: parseFloat(suggestion.click_point[1]) || 0
      };
    } else if (suggestion.coordinates) {
      if (Array.isArray(suggestion.coordinates)) {
        coordinates = {
          click_x: parseFloat(suggestion.coordinates[0]) || 0,
          click_y: parseFloat(suggestion.coordinates[1]) || 0
        };
      } else {
        coordinates = {
          click_x: parseFloat(suggestion.coordinates.x || suggestion.coordinates.click_x || 0),
          click_y: parseFloat(suggestion.coordinates.y || suggestion.coordinates.click_y || 0)
        };
      }
    }
  
    // Store coordinates in the step's own capturedSteps entry
    if (coordinates) {
      // If this step doesn't have its own captured data, create one using data from the last captured step
      if (!capturedSteps[step.id] && lastCapturedStepId) {
        const lastCapturedData = capturedSteps[lastCapturedStepId];
        const originalCapture = originalCaptureIds[lastCapturedStepId] || lastCapturedStepId;
        
        setCapturedSteps(prevCapturedSteps => ({
          ...prevCapturedSteps,
          [step.id]: {
            ...lastCapturedData,
            coordinates: coordinates,
            elements: lastCapturedData.elements || [],
            timestamp: new Date().toISOString()
          }
        }));
        
        // Track that this step is using data from another step's capture
        setOriginalCaptureIds(prev => ({
          ...prev,
          [step.id]: originalCapture
        }));
        
        // Also update session storage
        const newStepData = {
          ...lastCapturedData,
          coordinates: coordinates,
          timestamp: new Date().toISOString(),
          originalCaptureId: originalCapture
        };
        storeInSessionStorage(step.id, newStepData);
      } else {
        // Just update the coordinates for this step's existing data
        setCapturedSteps(prevCapturedSteps => ({
          ...prevCapturedSteps,
          [step.id]: {
            ...prevCapturedSteps[step.id] || {},
            coordinates: coordinates
          }
        }));
        
        // Also update session storage
        const currentStepData = capturedSteps[step.id] || {};
        const updatedData = {
          ...currentStepData,
          coordinates: coordinates
        };
        storeInSessionStorage(step.id, updatedData);
      }
    }
  
    setTestSteps(updatedSteps);
    setShowSuggestions(false);
    
    // Add small delay to allow React to update the DOM before focusing
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (commandType === 'type' && updatedStepValue.includes(' in ')) {
          const typeIndex = updatedStepValue.indexOf('type ') + 5;
          const inIndex = updatedStepValue.indexOf(' in ');
          inputRef.current.setSelectionRange(typeIndex, inIndex);
        } else {
          const length = updatedStepValue.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }
    }, 10);
  };  

  const toggleScreenshotMinimize = (stepId) => {
    setMinimizedScreenshots(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const InstructionsModal = () => {
    if (!showNoteModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
            onClick={() => setShowNoteModal(false)}
          >
            <X size={18} />
          </button>
          <h2 className="text-lg font-semibold mb-3">Step Instructions</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
            <li>Before adding action commands like <strong>click</strong>, <strong>type</strong>, or <strong>verify</strong>, please capture the test page. Once captured, you can add multiple steps without needing to recapture—unless you're switching to a different test page.</li>
            <li>Captured screenshots include element data that can be reused in the next steps. If you’ve captured multiple test pages, editing a step will display the data from the most recently captured page.</li>
            <li>Once you click the camera button, the system will show all active browser tab titles. Please choose the correct test page browser window.</li>
            <li>After selecting the browser, it will activate and capture the screen. Please wait a few seconds as the system minimizes.</li>
            <li>During the screenshot capture, avoid switching tabs or opening other pages, as it may cause incorrect capture.</li>
            <li>Open your Testing Project and TesterAlly in separate browser windows for better results.</li>
            <li>Ensure the element you want to interact with is fully visible on the screen before capturing.</li>
          </ul>
        </div>
      </div>
    );
  };

  const ConnectDeviceModal = () => {
    if (!showConnectModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <WifiOff className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Connect Your Android Device</h2>
            <p className="text-gray-600 mb-6">
              Please connect your Android device and enable the required options to continue with testing.
            </p>
            
            <div className="text-left mb-6">
              <h3 className="font-medium text-gray-800 mb-2">Required Steps:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Enable Developer Options on your device</li>
                <li>Enable USB Debugging</li>
                <li>Connect your device via USB</li>
                <li>Allow USB debugging when prompted</li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // If apps are already loaded, only check connection status
                  if (Object.keys(installedApps).length > 0) {
                    setConnectionLoading(true);
                    checkConnectionStatus().then(isConnected => {
                      if (isConnected) {
                        setDeviceConnected(true);
                        setSyncButton(true);
                        setShowConnectModal(false);
                      }
                      setConnectionLoading(false);
                    });
                  } else {
                    // No apps present, do full device connection check
                    checkDeviceConnection();
                  }
                }}
                disabled={connectionLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {connectionLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Checking...
                  </div>
                ) : (
                  'Check Connection'
                )}
              </button>
              <button
                onClick={() => navigate('/test-cases')}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const WaitModal = ({ isOpen, onClose, onConfirm }) => {
    const [waitCondition, setWaitCondition] = useState('static_wait');
    const [waitTimeout, setWaitTimeout] = useState(5);
    const [waitText, setWaitText] = useState('');
    const [pollInterval, setPollInterval] = useState(500);
    
    // Reset form when modal opens
    useEffect(() => {
      if (isOpen) {
        setWaitCondition('static_wait');
        setWaitTimeout(5);
        setWaitText('');
        setPollInterval(500);
      }
    }, [isOpen]);
  
    const handleConfirm = () => {
      const userid = localStorage.getItem("user_id");
      const timeoutMs = waitTimeout * 1000;
      
      let waitCommand = '';
      let requestData = {};
      
      if (waitCondition === 'static_wait') {
        waitCommand = `wait ${waitTimeout} seconds`;
        requestData = {
          user_id: userid,
          timeout: timeoutMs,
          debug: true
        };
      } else if (waitCondition === 'text_match') {
        waitCommand = `wait until text "${waitText}" appears`;
        requestData = {
          user_id: userid,
          condition: "text_match",
          text: waitText,
          timeout: timeoutMs,
          poll_interval: pollInterval,
          debug: true
        };
      } else if (waitCondition === 'url_match') {
        waitCommand = `wait until URL contains "${waitText}"`;
        requestData = {
          user_id: userid,
          condition: "url_match",
          text: waitText,
          timeout: timeoutMs,
          poll_interval: pollInterval,
          debug: true
        };
      }
      
      // Close the modal first
      onClose();
      
      // Then call onConfirm
      onConfirm(waitCommand, requestData);
    };
  
    const handleClose = () => {
      onClose();
    };
  
    // Don't render anything if the modal is not open
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
        <div className="bg-white p-6 rounded-lg w-96" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Configure Wait Command</h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Wait Condition</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={waitCondition}
              onChange={(e) => setWaitCondition(e.target.value)}
            >
              <option value="static_wait">Wait for a specific time</option>
              <option value="text_match">Wait until specific text appears</option>
              <option value="url_match">Wait until URL contains page</option>
            </select>
          </div>
  
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {waitCondition === 'static_wait' ? 'Wait Time (seconds)' : 'Timeout (seconds)'}
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={waitTimeout}
              onChange={(e) => setWaitTimeout(Number(e.target.value))}
              min="1"
            />
          </div>
  
          {waitCondition !== 'static_wait' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {waitCondition === 'text_match' ? 'Text to Wait For' : 'URL Contains Page to Wait For'}
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={waitText}
                onChange={(e) => setWaitText(e.target.value)}
                placeholder={waitCondition === 'text_match' ? 'e.g. Dashboard' : 'e.g. signup page'}
              />
            </div>
          )}
  
          {waitCondition !== 'static_wait' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Poll Interval (ms)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                min="100"
                step="100"
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <button 
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={waitCondition !== 'static_wait' && !waitText.trim()}
            >
              Add Step
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Write Test Manually</h2>
              {/* Right side - Project and Platform info */}
              <div className="flex flex-col items-end gap-2 ml-auto mr-3">
                <span className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium ${
                  testCaseInfo.platform === 'Mobile' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {testCaseInfo.platform === 'Mobile' 
                    ? <>
                        <Smartphone className="w-4 h-4" />
                        Mobile (Chrome Only)
                      </>
                    : <>
                        <MonitorSmartphone className="w-4 h-4" />
                        {testCaseInfo.platform}
                      </>
                  }
                </span>

                {/* Loading status or sync button */}
                {headerLoading ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                    <Loader className="w-4 h-4 animate-spin" />
                    Getting installed apps...
                  </div>
                ) : syncButton ? (
                  <button
                    onClick={handleSyncApps}
                    disabled={connectionLoading}
                    className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-md text-sm hover:bg-purple-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync Apps
                  </button>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="inline-flex items-center px-3 py-2 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100"
                  title="Instructions"
                >
                  <Info className="w-4 h-4" />
                </button>
                {hasSessionData && (
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    onClick={clearAllSessionData}
                    title="Clear all captured data"
                  >
                    Clear
                  </button>
                )}
                <button
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  onClick={handleCreateTestCase}
                  disabled={isLoading || !deviceConnected}
                >
                  {isLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>

            {testSteps.map((step, index) => (
              <div 
              id={`step-${step.id}`}
              key={index}
              className="relative mb-6"
            >
                <div 
                  className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200"
                  onDoubleClick={() => handleDoubleClick(index)}
                >
                  <input
                    type="checkbox"
                    checked={step.isSelected}
                    onChange={() => {
                      const updatedSteps = [...testSteps];
                      updatedSteps[index].isSelected = !updatedSteps[index].isSelected;
                      setTestSteps(updatedSteps);
                    }}
                    className="w-5 h-5 text-purple-600"
                  />
                  
                  <span className="font-medium min-w-[60px]">#{step.stepNumber}</span>
                  
                  {step.isSaved ? (
                    <div className="flex-1 text-gray-700 break-words whitespace-pre-wrap overflow-hidden">
                      {step.choice}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2">
                        <input
                          ref={editingStep === index ? inputRef : null}
                          type="text"
                          className="w-full border border-gray-300 rounded-md p-2"
                          value={step.choice}
                          onChange={(e) => handleCommandInputChange(e, index)}
                          placeholder="Enter test step description"
                          autoFocus={editingStep === index}
                          // disabled={!deviceConnected}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (e.shiftKey) {
                                handleSaveStep(index);
                              } else {
                                handleSaveAndAddStep();
                              }
                            } else if (e.key === 'Escape') {
                              handleCancelEdit(index);
                            }
                          }}
                        />
                      </div>
                      {/* {showSuggestions === index && commandSuggestions.length > 0 && (
                        <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-lg z-20">
                          {commandSuggestions.map((element, idx) => {
                            const sameNameElements = commandSuggestions.filter((el, i) => 
                              i < idx && 
                              ((el.name && element.name && el.name === element.name) || 
                              (el.text && element.text && el.text === element.text))
                            );
                            const position = sameNameElements.length > 0 ? ` (Position ${sameNameElements.length + 1})` : '';
                            
                            // Fix for coordinates display
                            let coordinatesDisplay = "";
                            if (element.click_point && Array.isArray(element.click_point)) {
                              coordinatesDisplay = `(${Math.round(parseFloat(element.click_point[0]) || 0)}, ${Math.round(parseFloat(element.click_point[1]) || 0)})`;
                            } else if (element.coordinates) {
                              if (Array.isArray(element.coordinates)) {
                                coordinatesDisplay = `(${Math.round(parseFloat(element.coordinates[0]) || 0)}, ${Math.round(parseFloat(element.coordinates[1]) || 0)})`;
                              } else {
                                const x = parseFloat(element.coordinates.x || element.coordinates.click_x || 0);
                                const y = parseFloat(element.coordinates.y || element.coordinates.click_y || 0);
                                coordinatesDisplay = `(${Math.round(x)}, ${Math.round(y)})`;
                              }
                            }
                            
                            return (
                              <div 
                                key={idx}
                                onClick={() => handleSuggestionClick(element, index)}
                                className="p-2 hover:bg-purple-50 cursor-pointer flex items-center gap-2"
                              >
                                <div className={`w-4 h-4 rounded-full ${
                                  commandType === 'click' ? 'bg-blue-100' : 
                                  commandType === 'type' ? 'bg-green-100' : 
                                  commandType === 'verify' ? 'bg-yellow-100' : 'bg-purple-100'
                                }`}></div>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {element.name || element.text || element.id || 'Element ' + (idx + 1)}
                                    {position}
                                  </span>
                                  
                                  <div className="flex items-center gap-2 text-xs">
                                    {coordinatesDisplay && (
                                      <span className="text-blue-600 bg-blue-50 px-1 rounded">
                                        {coordinatesDisplay}
                                      </span>
                                    )}
                                    
                                    {element.text && (
                                      <span className="text-gray-500 truncate max-w-xs">
                                        "{element.text.substring(0, 50)}{element.text.length > 50 ? '...' : ''}"
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {showSuggestions === index && commandSuggestions.length === 0 && (
                        <div className="absolute z-10 bg-white shadow-xl rounded-md border border-gray-200 mt-12 animate-fadeIn suggestions-dropdown">
                          <div className="p-4 text-center">
                            <div className="text-red-600 font-medium mb-2 flex items-center justify-center">
                              <AlertCircle className="w-5 h-5 mr-2" />
                              No element data available
                            </div>
                            <p className="text-sm text-gray-700">
                              Please check your network connection and try again. The AgentExtractModel may not be responding or providing coordinate data.
                            </p>
                            <button 
                              onClick={() => setShowSuggestions(false)}
                              className="mt-3 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )} */}

                      {showSuggestions === index && commandSuggestions.length > 0 && (
                        <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-lg z-20">
                          {commandSuggestions.map((suggestion, idx) => (
                            <div 
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion, index)}
                              className="p-2 hover:bg-purple-50 cursor-pointer flex items-center gap-2"
                            >
                              <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                <Smartphone className="w-3 h-3 text-green-600" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium">{suggestion.name}</span>
                                <span className="text-xs text-gray-500">{suggestion.package}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {showSuggestions === index && commandSuggestions.length === 0 && commandType === 'open' && (
                        <div className="absolute z-10 bg-white shadow-xl rounded-md border border-gray-200 mt-12 animate-fadeIn suggestions-dropdown">
                          <div className="p-4 text-center">
                            <div className="text-red-600 font-medium mb-2 flex items-center justify-center">
                              <AlertCircle className="w-5 h-5 mr-2" />
                              App not found
                            </div>
                            <p className="text-sm text-gray-700">
                              The app you're looking for is not installed on the connected device.
                            </p>
                            <button 
                              onClick={() => setShowSuggestions(false)}
                              className="mt-3 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {step.isSaved ? (
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                        onClick={() => handleDeleteStep(index)}
                        title="Delete Step"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {originalStepValues[index] ? (
                        <button
                          className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                          onClick={() => handleSaveStep(index)}
                          title="Save Step"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                          onClick={() => handleSaveAndAddStep()}
                          title="Save & Add New Step"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleCaptureElement(step.id)}
                        className={`inline-flex items-center px-3 py-1.5 ${
                          capturedSteps[step.id] 
                            ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        } rounded-md transition-colors`}
                        title={capturedSteps[step.id] ? "Recapture Element" : "Capture Element"}
                        disabled={captureLoading[step.id]}
                      >
                        {captureLoading[step.id] ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          capturedSteps[step.id] ? (
                            <div className="flex items-center">
                              <RotateCw className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <Camera className="w-4 h-4" />
                          )
                        )}
                      </button>
                      
                      <button
                        className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100"
                        onClick={() => handleCancelEdit(index)}
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                                    
                  {captureLoading[step.id] && (
                    <div className="absolute left-0 -bottom-8 w-full text-sm p-2 bg-blue-50 rounded text-blue-700 z-10">
                      Capture is loading... Please open your test page.
                    </div>
                  )}
                </div>
                
                {capturedSteps[step.id] && capturedSteps[step.id].screenshot && originalCaptureIds[step.id] === step.id && (
                  <div className="mt-2 w-full flex justify-center">
                    <div className="max-w-md w-full">
                      <div className={`border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ${minimizedScreenshots[step.id] ? 'max-h-12' : ''}`}>
                        <div className="px-3 py-2 bg-gray-50 flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Screenshot</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => toggleScreenshotMinimize(step.id)}
                              className="inline-flex items-center text-gray-500 hover:text-gray-700"
                              title={minimizedScreenshots[step.id] ? "Expand Screenshot" : "Minimize Screenshot"}
                            >
                              {minimizedScreenshots[step.id] ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronUp className="w-4 h-4" />
                              )}
                            </button>
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                              <Check className="inline w-3 h-3 mr-1" />Captured
                            </span>
                          </div>
                        </div>
                        {!minimizedScreenshots[step.id] && (
                          <img 
                            src={capturedSteps[step.id].screenshot} 
                            alt={`Screenshot for step ${step.stepNumber}`}
                            className="w-full h-auto max-h-40 object-cover cursor-pointer"
                            onClick={() => setExpandedScreenshot(capturedSteps[step.id].screenshot)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

           {/* Only show Add Step button when there are no steps OR all steps are saved */}
            {(testSteps.length === 0 || !testSteps.some(step => !step.isSaved)) && (
              <button
                onClick={() => handleAddStep()}
                className="inline-flex items-center px-4 py-2 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {expandedScreenshot && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedScreenshot(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button 
              className="absolute top-2 right-2 bg-white rounded-full p-1"
              onClick={() => setExpandedScreenshot(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={expandedScreenshot} 
              alt="Full screen preview" 
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
      <InstructionsModal />
      <ConnectDeviceModal />  
      {/* <ConnectionLoadingModal /> */}
      <WaitModal 
        isOpen={showWaitModal}
        onClose={() => setShowWaitModal(false)}
        onConfirm={handleWaitConfirm}
      />
    </div>
  );
};

export default AndroidManually;


