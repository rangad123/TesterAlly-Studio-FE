import React, { useState, useRef, useEffect } from "react";
import { Plus, X, Camera, Info, Check } from "lucide-react";

const AndroidAddStep = ({  
  testCaseName,        
  projectName, 
  steps, 
  fetchSteps, 
  apiBaseUrl, 
  hoveredStep, 
  isExecuting,
  executionResults,
  resetEditState, 
  updateEditValue,
  installedApps, 
  deviceConnected,
  checkConnectionOnly,
  setHoveredStep 
}) => {
    
  const [capturedSteps, setCapturedSteps] = useState({});
  const [captureLoading, setCaptureLoading] = useState({});
  const [insertingAfterStep, setInsertingAfterStep] = useState(null);
  const [newInsertedStepValue, setNewInsertedStepValue] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [expandedScreenshot, setExpandedScreenshot] = useState(null);
  const [error, setError] = useState(null);
  const [commandSuggestions, setCommandSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [commandType, setCommandType] = useState("");
  const [selectedElement, setSelectedElement] = useState(null);
  const [insertingLoading, setInsertingLoading] = useState(false);
  const [screenshotVisible, setScreenshotVisible] = useState({});
  const [screenshotDirection, setScreenshotDirection] = useState('down');
  const [allCapturedElements, setAllCapturedElements] = useState({});
  const [lastCapturedStepId, setLastCapturedStepId] = useState(null);
  const [originalCaptureIds, setOriginalCaptureIds] = useState({});
  const [editingStepId, setEditingStepId] = useState(null);
  const [showWaitModal, setShowWaitModal] = useState(false);
  const [waitRequestData, setWaitRequestData] = useState(null);

  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpVerificationState, setOtpVerificationState] = useState({
    contactEntered: false,
    enteredContact: ''
  });
  const [contactSelected, setContactSelected] = useState(false);
  const [isTestDataLoading, setIsTestDataLoading] = useState(false);
  const [testData, setTestData] = useState({});
  const [otpPlaceholderUsed, setOtpPlaceholderUsed] = useState(false);

  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [adjustedPosition, setAdjustedPosition] = useState(null);
  const [showPositionControls, setShowPositionControls] = useState(false);
  // Position adjustment increments (in pixels)
  const POSITION_STEP = 10;
  const FINE_STEP = 5;
  const screenshotContainerRef = useRef(null);
  const [currentScreenshot, setCurrentScreenshot] = useState(null);
  const [currentSetEditValue, setCurrentSetEditValue] = useState(null);

  const toggleOtpCheckbox = () => {
    setRequiresOtp(prev => {
      const newValue = !prev;
      if (newValue) {
        // When enabling OTP, show contact options and hide elements
        setContactSelected(true);
      } else {
        // When disabling OTP, reset everything
        setContactSelected(false);
        setOtpVerificationState(prev => ({
          ...prev,
          contactEntered: false,
          waitingForOtp: false,
          enteredContact: '',
          sessionTime: null
        }));
      }
      return newValue;
    });
  };

  useEffect(() => {
    if (requiresOtp) {
      const userId = localStorage.getItem("userId");
      const projectKey = `selectedProject_${userId}`;
      const selectedProject = JSON.parse(localStorage.getItem(projectKey));
      
      if (selectedProject?.id) {
        setIsTestDataLoading(true);
        fetch(`http://127.0.0.1:8000/api/testdata/${selectedProject.id}/`)
          .then((res) => res.json())
          .then((data) => {
            console.log("✅ Test data loaded:", data);
            setTestData(data);
          })
          .catch((err) => {
            console.warn("⚠️ Error fetching test data:", err.message);
            setTestData(null);
          })
          .finally(() => setIsTestDataLoading(false));
      }
    }
  }, [requiresOtp]);
  
  const inputRef = useRef(null);

  useEffect(() => {
    const loadCapturedElements = () => {
      try {
        const storedElements = sessionStorage.getItem(`capturedElements_${projectName}_${testCaseName}`);
        if (storedElements) {
          const parsedElements = JSON.parse(storedElements);
          setAllCapturedElements(parsedElements);
          
          // Also populate capturedSteps with any stored screenshots
          const storedScreenshots = sessionStorage.getItem(`capturedScreenshots_${projectName}_${testCaseName}`);
          if (storedScreenshots) {
            const parsedScreenshots = JSON.parse(storedScreenshots);
            setCapturedSteps(parsedScreenshots);
            
            // Find the last captured step ID
            const stepIds = Object.keys(parsedScreenshots);
            if (stepIds.length > 0) {
              setLastCapturedStepId(stepIds[stepIds.length - 1]);
            }
          }
          
          // Load original capture IDs
          const storedOriginalIds = sessionStorage.getItem(`originalCaptureIds_${projectName}_${testCaseName}`);
          if (storedOriginalIds) {
            setOriginalCaptureIds(JSON.parse(storedOriginalIds));
          }
        }
      } catch (error) {
        console.error("Error loading captured elements from session storage:", error);
      }
    };
    
    loadCapturedElements();
  }, [testCaseName, projectName]);
  
  useEffect(() => {
    if (Object.keys(originalCaptureIds).length > 0) {
      sessionStorage.setItem(`originalCaptureIds_${projectName}_${testCaseName}`, JSON.stringify(originalCaptureIds));
    }
  }, [originalCaptureIds, testCaseName, projectName]);

  useEffect(() => {
    if (Object.keys(capturedSteps).length > 0) {
      sessionStorage.setItem(`capturedScreenshots_${projectName}_${testCaseName}`, JSON.stringify(capturedSteps));
    }
  }, [capturedSteps, testCaseName, projectName]);

const handleCaptureElement = async (stepNumber) => {

  const isConnected = await checkConnectionOnly();
    if (!isConnected) {
      setError("Device is not connected. Please connect and try again.");
      return;
    }
  setCaptureLoading(prev => ({ ...prev, [stepNumber]: true }));
  
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

    const screenshotUrl = data.screenshot_result?.url ? `http://localhost:8000${data.screenshot_result.url}` : null;
    setCurrentScreenshot(screenshotUrl);
    
    // Process the Android response
    const capturedStepData = {
      coordinates: {},
      screenshot: screenshotUrl,
      timestamp: new Date().toISOString(),
      elements: processAndroidElements(data.screen_elements || {}),
      current_app: data.current_app
    };
    
    // Update capturedSteps
    setCapturedSteps(prev => ({
      ...prev,
      [stepNumber]: capturedStepData
    }));
    
    // Update allCapturedElements for suggestions
    setAllCapturedElements(prev => ({
      ...prev,
      [stepNumber]: capturedStepData.elements
    }));
    
    // This is an original capture - set itself as the original
    setOriginalCaptureIds(prev => ({
      ...prev, 
      [stepNumber]: stepNumber
    }));
    
    // Save the data to session storage
    sessionStorage.setItem(`capturedScreenshots_${projectName}_${testCaseName}`, 
      JSON.stringify({...capturedSteps, [stepNumber]: capturedStepData}));
    sessionStorage.setItem(`capturedElements_${projectName}_${testCaseName}`,
      JSON.stringify({...allCapturedElements, [stepNumber]: capturedStepData.elements}));
    
    // Update last captured step ID
    setLastCapturedStepId(stepNumber);
    
  } catch (error) {
    console.error('Android screen capture error:', error);
    setError("Failed to capture Android screen. Please try again.");
  } finally {
    setCaptureLoading(prev => ({ ...prev, [stepNumber]: false }));
  }
};

// const clearCapturedData = () => {
//   console.log("✅ Clearing captured data...");
//   setCapturedSteps({});
//   setAllCapturedElements({});
//   setOriginalCaptureIds({});
  
//   sessionStorage.removeItem(`capturedScreenshots_${projectName}_${testCaseName}`);
//   sessionStorage.removeItem(`capturedElements_${projectName}_${testCaseName}`);
//   sessionStorage.removeItem(`originalCaptureIds_${projectName}_${testCaseName}`);
  
//   console.log("✅ Captured data cleared successfully");
// };

const processAndroidElements = (screenElements) => {
  const allElements = [];
  
  // Process each category of elements
  Object.entries(screenElements).forEach(([category, elements]) => {
    if (Array.isArray(elements)) {
      elements.forEach(element => {
        // Parse bounds to get coordinates
        let coordinates = [0, 0];
        if (element.bounds) {
          // bounds format: "[503,2025][540,2062]"
          const boundsMatch = element.bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
          if (boundsMatch) {
            const x1 = parseInt(boundsMatch[1]);
            const y1 = parseInt(boundsMatch[2]);
            const x2 = parseInt(boundsMatch[3]);
            const y2 = parseInt(boundsMatch[4]);
            
            // Calculate center point
            coordinates = [
              Math.round((x1 + x2) / 2),
              Math.round((y1 + y2) / 2)
            ];
          }
        }
        
        allElements.push({
          name: element.content_desc || element.text || element.description || `${category} element`,
          text: element.text || element.content_desc || element.description || '',
          type: category,
          class: element.class,
          resource_id: element.resource_id,
          bounds: element.bounds,
          click_point: coordinates,
          coordinates: coordinates,
          interactivity: element.clickable || element.focusable || false,
          clickable: element.clickable || false,
          focusable: element.focusable || false,
          scrollable: element.scrollable || false,
          category: category
        });
      });
    }
  });
  
  return allElements;
};

const updateCapturedStepsFromStorage = () => {
  try {
    const storedScreenshots = sessionStorage.getItem(`capturedScreenshots_${projectName}_${testCaseName}`);
    const storedElements = sessionStorage.getItem(`capturedElements_${projectName}_${testCaseName}`);
    const storedOriginalIds = sessionStorage.getItem(`originalCaptureIds_${projectName}_${testCaseName}`);
    
    if (storedScreenshots) {
      setCapturedSteps(JSON.parse(storedScreenshots));
    }
    if (storedElements) {
      setAllCapturedElements(JSON.parse(storedElements));
    }
    if (storedOriginalIds) {
      setOriginalCaptureIds(JSON.parse(storedOriginalIds));
    }
  } catch (error) {
    console.error("Error updating captured steps from storage:", error);
  }
};
  
const handleCommandInputChange = (e) => {
  const input = e.target.value;
  const isEditMode = e.target.hasAttribute('data-step-id');

  if (isEditMode) {
    const stepId = e.target.getAttribute('data-step-id');
    setEditingStepId(stepId);
    console.log(`Editing step: ${stepId} with input: ${input}`);
  } else {
    setNewInsertedStepValue(input);
    console.log(`New step input: ${input}`);
  }

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
    fetchElementSuggestions(command, input, words);
    setShowSuggestions(true);

  } else if (command === 'wait') {
    setCommandType('wait');
    setShowWaitModal(true)
    setShowSuggestions(false);

  } else if (command === 'open') {
    setCommandType('open');
    if (deviceConnected && installedApps && Object.keys(installedApps).length > 0) {
      const appSuggestions = Object.entries(installedApps).map(([appName, packageName]) => ({
        name: appName,  
        displayName: appName, 
        packageName: packageName, 
        type: 'app'
      }));
      console.log("Setting app suggestions:", appSuggestions);
      setCommandSuggestions(appSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  } else if (['scroll up', 'scroll down', 'wait', 'swipe left', 'swipe right', 'swipe long left', 'swipe long right'].includes(fullCommand)) { 
    setCommandType(fullCommand); 
    setShowSuggestions(false);  

  } else {
    setCommandType("");
    setShowSuggestions(false);
  }
};
  
const handleEditCommandInput = (stepNumber, stepDescription, commandType) => {
  setEditingStepId(stepNumber);
  setCommandType(commandType);

  console.log("edit command", commandType, "for step:", stepNumber);

  const step = steps.find(s => s.step_number === stepNumber);
  if (!step) {
    console.log("Step not found:", stepNumber);
    return;
  }

  const words = stepDescription.trim().split(' ');

  if (['click', 'type', 'verify', 'get'].includes(commandType)) {
    console.log("🔥 Should show suggestions - setting showSuggestions to true");
    setShowSuggestions(true);
    fetchElementSuggestions(commandType, stepDescription, words, stepNumber);
  } else if (commandType === 'open') {
    
    if (deviceConnected && installedApps && Object.keys(installedApps).length > 0) {
      console.log("🔥 All conditions met, creating suggestions");
      const appSuggestions = Object.entries(installedApps).map(([appName, packageName]) => ({
        name: appName,  
        displayName: appName, 
        packageName: packageName, 
        type: 'app'
      }));
      console.log("🔥 Setting app suggestions:", appSuggestions);
      setCommandSuggestions(appSuggestions);
      setShowSuggestions(true);
    } else {
      console.log("🔥 Conditions not met for showing suggestions");
      setShowSuggestions(false);
    }
  } else if (commandType === 'wait') {
    setShowWaitModal(true);
  }
};

const fetchElementSuggestions = (command, inputValue, words, currentStepNumber = null) => {
  // Use the passed stepNumber or fall back to editingStepId
  const relevantStepNumber = currentStepNumber || editingStepId || insertingAfterStep;
  
  console.log(`Fetching suggestions for ${command} command, step: ${relevantStepNumber}`);
  
  if (!relevantStepNumber) {
    console.log("No relevant step number found");
    return;
  }
  
  // Step 1: Determine which capture data to use
  let stepIdentifier = null;
  
  if (currentStepNumber || editingStepId) {
    // If editing, use the step number as identifier
    stepIdentifier = currentStepNumber || editingStepId;
    console.log("Editing mode - using step number:", stepIdentifier);
  } else {
    // If inserting after, find the step we're inserting after
    stepIdentifier = insertingAfterStep;
    console.log("Insert mode - using step number:", stepIdentifier);
  }
  
  // Find the relevant capture data
  let relevantCaptureStepId = null;
  let relevantElements = [];
  
  // Since you're using step_number as the identifier, check if this step has capture data
  if (stepIdentifier && capturedSteps[stepIdentifier]) {
    // Case: Step has its own capture
    relevantCaptureStepId = stepIdentifier;
    console.log("Using elements from current step:", relevantCaptureStepId);
  } else if (stepIdentifier) {
    // Case: Step doesn't have its own capture, find its reference
    relevantCaptureStepId = originalCaptureIds[stepIdentifier];
    console.log("Using elements from reference step:", relevantCaptureStepId);
  }
  
  // If we still don't have a relevant capture, find the last captured step before this one
  if (!relevantCaptureStepId) {
    const stepsBeforeInsertion = steps
      .filter(s => s.step_number <= relevantStepNumber)
      .sort((a, b) => b.step_number - a.step_number); // Descending order
      
    for (const step of stepsBeforeInsertion) {
      // Check using step_number as the key since that's your identifier
      if (capturedSteps[step.step_number]) {
        relevantCaptureStepId = step.step_number;
        console.log("Using elements from previous step:", relevantCaptureStepId);
        break;
      }
    }
  }
  
  // If we found a relevant step with captured elements, use those
  if (relevantCaptureStepId && allCapturedElements[relevantCaptureStepId]) {
    relevantElements = allCapturedElements[relevantCaptureStepId];
  } else {
    // Fallback: If no specific step found, use the most recent capture overall
    console.log("No specific capture found, using last captured data");
    if (lastCapturedStepId && allCapturedElements[lastCapturedStepId]) {
      relevantElements = allCapturedElements[lastCapturedStepId];
    }
  }
  
  // Now use only the relevant elements for filtering
  let allElements = Array.isArray(relevantElements) ? [...relevantElements] : [];
  console.log("Using elements for suggestions:", allElements.length);
  
  let filtered = [];

  if (command === "click") {
    filtered = allElements.map(el => {
        // Normalize coordinates
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
  } else if (command === "type") {
    // Include elements that can receive input
    filtered = allElements.map(el => {
      // Normalize coordinates
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
    
    // For "type" command, check for text after "in" if present
    if (inputValue.includes(" in ")) {
      const afterIn = inputValue.split(" in ")[1].trim().toLowerCase();
      if (afterIn) {
        filtered = filtered.filter(el => 
          (el.name && el.name.toLowerCase().includes(afterIn)) || 
          (el.text && el.text.toLowerCase().includes(afterIn))
        );
      }
    }
  } else if (command === "verify" || command === "get") {
    filtered = allElements.filter(el => el.type === "text" || el.type === "textarea" || el.text)
      .map(el => {
        // Normalize coordinates
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
  }
  
  // For commands other than "type", or if "in" is not present in type command
  if (words.length > 1 && (!inputValue.includes(" in ") || command !== "type")) {
    const searchTerm = inputValue.substring(command.length).trim().toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(el => 
        (el.name && el.name.toLowerCase().includes(searchTerm)) || 
        (el.text && el.text.toLowerCase().includes(searchTerm))
      );
    }
  }
  
  // Remove duplicates based on element text or name
  const uniqueElements = [];
  const uniqueKeys = new Set();
  
  filtered.forEach(el => {
    const key = (el.name || '') + (el.text || '');
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      uniqueElements.push(el);
    }
  });
  
  // Limited to 20 results
  const finalResults = uniqueElements.slice(0, 20);
  
  if (finalResults.length === 0 && allElements.length > 0) {
    // If no specific matches, fall back to a few interactive elements
    const fallbackResults = allElements
      .filter(el => el.interactivity === true)
      .map(el => {
        // Normalize coordinates
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
    
    console.log("No specific matches, using fallback elements:", fallbackResults);
    setCommandSuggestions(fallbackResults);
  } else {
    console.log("Filtered elements:", finalResults);
    setCommandSuggestions(finalResults);
  }
};

const containsOtpPlaceholder = (text) => {
  return text && text.toLowerCase().includes('<otp>');
};

const handleInsertStep = async (afterStepNumber, waitCommandOverride = null, waitData = null) => {
  const stepDescription = waitCommandOverride || newInsertedStepValue.trim();

  if (!stepDescription.trim()) {
    setError("Step description cannot be empty");
    return;
  }
  
  setInsertingLoading(true);
  
  try {
    const userId = localStorage.getItem("userId");
    const newStepNumber = afterStepNumber + 1;
    
    let coordinates = { click_x: 0, click_y: 0 };
    
    // Get coordinates from the selected element
    if (selectedElement) {
      if (selectedElement.click_point && Array.isArray(selectedElement.click_point) &&
          selectedElement.click_point.length >= 2) {
        coordinates = {
          click_x: selectedElement.click_point[0],
          click_y: selectedElement.click_point[1]
        };
      } else if (selectedElement.coordinates && Array.isArray(selectedElement.coordinates) && 
                selectedElement.coordinates.length >= 2) {
        coordinates = {
          click_x: selectedElement.coordinates[0],
          click_y: selectedElement.coordinates[1]
        };
      }
    }

    const words = stepDescription.trim().split(' ');
    const actionType = words[0].toLowerCase();
    
    if ((actionType === 'click' || actionType === 'type' || actionType === 'verify' || actionType === 'get') && !selectedElement) {
      setError("Please select an element from the suggestions before adding this step.");
      return;
    }

    // NEW: Check if step contains OTP placeholder
    const hasOtpPlaceholder = containsOtpPlaceholder(stepDescription);
    
    // NEW: If OTP placeholder is used, mark it for future steps to disable OTP
    if (hasOtpPlaceholder) {
      setOtpPlaceholderUsed(true);
    }

    if (requiresOtp && actionType === 'type') {
      const emailInStep = stepDescription.match(/\S+@\S+\.\S+/);
      const selectedContact = otpVerificationState.enteredContact?.trim();

      // Check only if selected contact is an email
      if (emailInStep && selectedContact && /\S+@\S+\.\S+/.test(selectedContact)) {
        const selectedEmail = selectedContact;
        const emailTyped = emailInStep[0].trim();

        if (emailTyped !== selectedEmail) {
          alert(`For OTP verification, please use the selected email: ${selectedEmail}`);
          setInsertingLoading(false);
          return;
        }
      }
    }


    let finalStepDescription = stepDescription;

    if (stepDescription.startsWith('open ') && selectedElement && selectedElement.type === 'app') {
      const displayName = stepDescription.replace('open ', '');
      console.log("displayName:", displayName)
      const packageName = selectedElement.packageName; 
      console.log("packageName:", packageName)
      if (packageName) {
        finalStepDescription = `open ${packageName}`;
      }
    }
    console.log("DEBUG - waitData:", waitData); 

    // Use the new API endpoint with correct payload structure
    const payload = {
      user_id: parseInt(userId),
      project_name: projectName,
      testcase_name: testCaseName,
      steps: [
        {
          step_number: newStepNumber,
          step_description: finalStepDescription,
          teststep_result: "not_executed",
          step_coordinates: coordinates,
          requires_otp: hasOtpPlaceholder ? true : (otpPlaceholderUsed ? false : (requiresOtp || false)),     
          has_otp_placeholder: hasOtpPlaceholder,
          otp_type: requiresOtp && otpVerificationState.enteredContact
            ? (/\S+@\S+\.\S+/.test(otpVerificationState.enteredContact) ? 'email' : 'phone')
            : null,
          ...(stepDescription?.toLowerCase().startsWith("wait") && waitData ? { wait_config: waitData } : {})
        }
      ]
    };
    
    console.log("Insert Step Payload:", payload);    
    
    const response = await fetch("http://127.0.0.1:8000/integrate/teststep/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to add step");
    }
    
    // The new API should handle step number reordering automatically
    // So we don't need to manually update other step numbers
    
    // Refresh the steps to get the updated list
    await fetchSteps(testCaseName, projectName);
    
    // Reset form state
    setNewInsertedStepValue("");
    setInsertingAfterStep(null);
    setShowSuggestions(false);
    setSelectedElement(null);
    setCommandType("");
    setError(null);
    setWaitRequestData(null); 

    console.log("Step inserted successfully");

  } catch (err) {
    setError("Failed to insert step. Please try again.");
    console.error("Error inserting step:", err);
  } finally {
    setInsertingLoading(false);
  }
};
  
  const handleSuggestionClick = (suggestion) => {
    let updatedStep = '';
    
    if (commandType === 'click') {
      updatedStep = `click ${suggestion.name || suggestion.text || 'element'}`;
    } else if (commandType === 'type') {
      const currentText = newInsertedStepValue;
      const inIndex = currentText.toLowerCase().indexOf(' in ');
      if (inIndex !== -1) {
        const textToType = currentText.substring(5, inIndex).trim();
        if (textToType) {
          updatedStep = `type ${textToType} in ${suggestion.name || suggestion.text || 'element'}`;
        } else {
          updatedStep = `type  in ${suggestion.name || suggestion.text || 'element'}`;
        }
      } else {
        updatedStep = `type  in ${suggestion.name || suggestion.text || 'element'}`;
      } 
    } else if (commandType === 'verify') {
      updatedStep = `verify ${suggestion.text || suggestion.name || 'element'}`;
    } else if (commandType === 'get') {
      updatedStep = `get ${suggestion.text || suggestion.name || 'element'}`;
    } else if (commandType === 'open' && suggestion.type === 'app') {
        updatedStep = `open ${suggestion.displayName}`; 
        setSelectedElement({
          ...suggestion,
          displayName: suggestion.displayName || suggestion.name,
          backendValue: suggestion.packageName 
        });
    }

    setNewInsertedStepValue(updatedStep);
    setSelectedElement(suggestion);
    setShowSuggestions(false);
    
    // Generate step ID for the not-yet-created step
    const tempStepId = 'temp-' + new Date().getTime();
    
    // Process coordinates from the suggestion
    let coordinates = null;
    
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
    
    // If this is for a new step being inserted, use last captured data
    if (coordinates && lastCapturedStepId && capturedSteps[lastCapturedStepId]) {
      const lastCapturedData = capturedSteps[lastCapturedStepId];
      const originalCapture = originalCaptureIds[lastCapturedStepId] || lastCapturedStepId;
      
      // Create a new captured step entry with the coordinates from the suggestion
      const newStepData = {
        ...lastCapturedData,
        coordinates: coordinates,
        timestamp: new Date().toISOString()
      };
      
      // Update captured steps and track original
      setCapturedSteps(prev => ({
        ...prev,
        [tempStepId]: newStepData
      }));
      
      // Track that this step is using data from another step's capture
      setOriginalCaptureIds(prev => ({
        ...prev,
        [tempStepId]: originalCapture
      }));
      
      // We'll use this temp ID when creating the actual step
      setSelectedElement({
        ...suggestion,
        tempStepId: tempStepId
      });
    }
    
    if (inputRef.current) {
      inputRef.current.focus();
      if (commandType === 'type' && updatedStep.includes(' in ')) {
        const typeIndex = updatedStep.indexOf('type ') + 5;
        const inIndex = updatedStep.indexOf(' in ');
        inputRef.current.setSelectionRange(typeIndex, inIndex);
      } else {
        const length = updatedStep.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }
  };

  const handleEditSuggestionClick = (element, stepNumber, setEditValue) => {
    if (!element || !setEditValue) return;

    const currentStep = steps.find(s => s.step_number === stepNumber);
    if (!currentStep) return;

    let updatedStep = '';
    if (commandType === 'click') {
      updatedStep = `click ${element.name || element.text || 'element'}`;
    } else if (commandType === 'type') {
      const currentText = document.querySelector(`[data-step-id="${stepNumber}"]`)?.value || '';
      const inIndex = currentText.toLowerCase().indexOf(' in ');
      const typedText = currentText.substring(5, inIndex).trim();
      updatedStep = `type ${typedText || ''} in ${element.name || element.text || 'element'}`;
    } else if (commandType === 'verify') {
      updatedStep = `verify ${element.text || element.name || 'element'}`;
    } else if (commandType === 'get') {
      updatedStep = `get ${element.text || element.name || 'element'}`;
    }

    setEditValue(updatedStep);
    setSelectedElement(element);

    // Set coordinates if available
    let coordinates = null;
    if (element.click_point && Array.isArray(element.click_point)) {
      coordinates = {
        click_x: parseFloat(element.click_point[0]) || 0,
        click_y: parseFloat(element.click_point[1]) || 0
      };
    } else if (element.coordinates) {
      const coords = element.coordinates;
      coordinates = {
        click_x: parseFloat(coords[0] || coords.x || coords.click_x || 0),
        click_y: parseFloat(coords[1] || coords.y || coords.click_y || 0)
      };
    }

    if (coordinates) {
      const stepId = stepNumber;
      const relevantCaptureId = originalCaptureIds[stepId] || stepId;
      if (capturedSteps[relevantCaptureId]) {
        setCapturedSteps(prev => ({
          ...prev,
          [stepId]: {
            ...capturedSteps[relevantCaptureId],
            coordinates
          }
        }));
      }
    }

    setShowSuggestions(false);
  };

  const handleExpandScreenshot = (screenshot) => {
    setExpandedScreenshot(screenshot);
  };

  const ScreenshotModal = () => {
    if (!expandedScreenshot) return null;

    return (
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
    );
  };

  const clearSuggestions = () => {
    console.log("Clearing all suggestions");
    setShowSuggestions(false);
    setCommandSuggestions([]);
    setCommandType("");
    setSelectedElement(null);
    setEditingStepId(null);
  };

const handlePhoneNumberClick = async (contact, setEditValue = null) => { 
  setContactSelected(true);
  
  try {
    const response = await fetch('http://localhost:8000/api/get_time/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      const timeData = {
        ...data,
        phoneNumber: contact,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('otpSessionTime', JSON.stringify(timeData));
      
      setOtpVerificationState(prev => ({
        ...prev,
        contactEntered: true,
        waitingForOtp: true,
        enteredContact: contact,
        enteredContactInboxId: "29f7a099-d305-41d5-8e99-59c347674844",
        sessionTime: timeData
      }));
      
      // Update the input field with the selected contact
      if (commandType === 'type') {
        if (setEditValue) {
          // Edit mode
          const currentText = document.querySelector(`[data-step-id="${editingStepId}"]`)?.value || '';
          const inIndex = currentText.toLowerCase().indexOf(' in ');
          if (inIndex !== -1) {
            const elementPart = currentText.substring(inIndex);
            setEditValue(`type ${contact} ${elementPart}`);
          } else {
            setEditValue(`type ${contact} in `);
          }
        } else {
          // Insert mode
          const currentText = newInsertedStepValue;
          const inIndex = currentText.toLowerCase().indexOf(' in ');
          if (inIndex !== -1) {
            const elementPart = currentText.substring(inIndex);
            setNewInsertedStepValue(`type ${contact} ${elementPart}`);
          } else {
            setNewInsertedStepValue(`type ${contact} in `);
          }
        }
      }
            
      console.log('OTP Session Time stored:', timeData);
    }
  } catch (error) {
    console.error('Error calling get_time API:', error);
  }

  setContactSelected(false);
};

const handleOtpPlaceholderClick = (setEditValue = null) => {
  if (commandType === 'type') {
    if (setEditValue) {
      // Edit mode
      const currentText = document.querySelector(`[data-step-id="${editingStepId}"]`)?.value || '';
      const inIndex = currentText.toLowerCase().indexOf(' in ');
      if (inIndex !== -1) {
        const elementPart = currentText.substring(inIndex);
        setEditValue(`type <otp> ${elementPart}`);
      } else {
        setEditValue(`type <otp> in `);
      }
    } else {
      // Insert mode
      const currentText = newInsertedStepValue;
      const inIndex = currentText.toLowerCase().indexOf(' in ');
      if (inIndex !== -1) {
        const elementPart = currentText.substring(inIndex);
        setNewInsertedStepValue(`type <otp> ${elementPart}`);
      } else {
        setNewInsertedStepValue(`type <otp> in `);
      }
    }
    
    // 🔥 CORRECTED: Mark placeholder for future steps, but don't disable current step's OTP
    setOtpPlaceholderUsed(true);
    // Don't reset requiresOtp - this step still needs OTP verification
  }
};

const handlePositionAdjustment = (direction, step = POSITION_STEP) => {
  if (!selectedSuggestion) return;
  
  const currentPos = adjustedPosition || selectedSuggestion.click_point;
  let newPos = [...currentPos];
  
  switch (direction) {
    case 'up':
      newPos[1] -= step;
      break;
    case 'down':
      newPos[1] += step;
      break;
    case 'left':
      newPos[0] -= step;
      break;
    case 'right':
      newPos[0] += step;
      break;
    default:
      return;
  }
  
  // Ensure position doesn't go negative
  newPos[0] = Math.max(0, newPos[0]);
  newPos[1] = Math.max(0, newPos[1]);
  
  setAdjustedPosition(newPos);
  
  // Scroll the container to keep the crosshair visible
  setTimeout(() => {
    if (screenshotContainerRef.current) {
      const container = screenshotContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Calculate if we need to scroll to keep the crosshair visible
      const targetX = newPos[0] - containerRect.width / 2;
      const targetY = newPos[1] - containerRect.height / 2;
      
      container.scrollTo({
        left: Math.max(0, targetX),
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });
    }
  }, 0);
};

const handleSuggestionSelect = (suggestion) => {
  setSelectedSuggestion(suggestion);
  setAdjustedPosition(null);
  setShowPositionControls(true);
};

const handleConfirmSelection = (index) => {
  if (selectedSuggestion) {
    const finalPosition = adjustedPosition || selectedSuggestion.click_point;
    const updatedSuggestion = {
      ...selectedSuggestion,
      click_point: finalPosition
    };
    
    if (editingStepId !== null && currentSetEditValue) {
      handleEditSuggestionClick(updatedSuggestion, editingStepId, currentSetEditValue);
      setCurrentSetEditValue(null); 
    } else {
      handleSuggestionClick(updatedSuggestion, index);
    }
    
    setShowPositionControls(false);
    setSelectedSuggestion(null);
    setAdjustedPosition(null);
  }
};

const handleCancelSelection = () => {
  setShowPositionControls(false);
  setSelectedSuggestion(null);
  setAdjustedPosition(null);
};

const resetPosition = () => {
  setAdjustedPosition(null);
};

const PositionControls = ({ 
  index, 
  currentScreenshot, 
  selectedSuggestion, 
  adjustedPosition,
}) => {

  useEffect(() => {
    if (selectedSuggestion && screenshotContainerRef.current && currentScreenshot) {
      const container = screenshotContainerRef.current;
      const currentPos = adjustedPosition || selectedSuggestion.click_point;
      
      // Center the view on the selected suggestion's position
      setTimeout(() => {
        const containerRect = container.getBoundingClientRect();
        const targetX = currentPos[0] - containerRect.width / 2;
        const targetY = currentPos[1] - containerRect.height / 2;
        
        container.scrollTo({
          left: Math.max(0, targetX),
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [selectedSuggestion, adjustedPosition, currentScreenshot]);

  if (!selectedSuggestion) return null;
  
  const currentPos = adjustedPosition || selectedSuggestion.click_point;
  const originalPos = selectedSuggestion.click_point;
  const hasAdjustment = adjustedPosition && 
    (adjustedPosition[0] !== originalPos[0] || adjustedPosition[1] !== originalPos[1]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-2xl w-[900px] h-[600px] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                🎯
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Fine-tune Click Position</h3>
                <p className="text-sm text-blue-600">
                  Element: {selectedSuggestion.displayName || selectedSuggestion.name}
                </p>
              </div>
            </div>
            <button 
              onClick={handleCancelSelection}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex h-[calc(600px-140px)]">
          {/* Screenshot Panel */}
          
          <div ref={screenshotContainerRef} className="flex-1 relative bg-gray-100 overflow-auto">
            <div className="relative inline-block min-w-full min-h-full">
              {currentScreenshot ? (
                <img 
                  src={currentScreenshot} 
                  alt="Page Screenshot" 
                  className="max-w-none"
                  style={{ cursor: 'crosshair' }}
                  onClick={(e) => {
                    const rect = e.target.getBoundingClientRect();
                    const scaleX = e.target.naturalWidth / rect.width;
                    const scaleY = e.target.naturalHeight / rect.height;
                    const x = (e.clientX - rect.left) * scaleX;
                    const y = (e.clientY - rect.top) * scaleY;
                    setAdjustedPosition([Math.round(x), Math.round(y)]);
                  }}
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📸</div>
                    <p>Screenshot not available</p>
                    <p className="text-sm">Use the controls to adjust position</p>
                  </div>
                </div>
              )}
              
              {/* Original Position Indicator */}
              <div 
                className="absolute w-6 h-6 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  left: `${originalPos[0]}px`, 
                  top: `${originalPos[1]}px` 
                }}
              >
                <div className="w-full h-full bg-red-500 bg-opacity-70 rounded-full border-2 border-red-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Original Position
                </div>
              </div>
              
              {/* Current/Adjusted Position Indicator */}
              <div 
                className="absolute w-8 h-8 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ 
                  left: `${currentPos[0]}px`, 
                  top: `${currentPos[1]}px` 
                }}
              >
                {/* Crosshair */}
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-green-500 transform -translate-y-1/2"></div>
                  <div className="absolute left-1/2 top-0 h-full w-0.5 bg-green-500 transform -translate-x-1/2"></div>
                </div>
                
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
                
                {/* Label */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Click Here ({Math.round(currentPos[0])}, {Math.round(currentPos[1])})
                </div>
                
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto flex-shrink-0">
            <div className="space-y-6">
              {/* Position Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Position Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current:</span>
                    <span className="font-mono">x:{Math.round(currentPos[0])}, y:{Math.round(currentPos[1])}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original:</span>
                    <span className="font-mono text-red-600">x:{Math.round(originalPos[0])}, y:{Math.round(originalPos[1])}</span>
                  </div>
                  {hasAdjustment && (
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Offset:</span>
                      <span className="font-mono text-green-600">
                        x:{adjustedPosition[0] - originalPos[0]}, y:{adjustedPosition[1] - originalPos[1]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Directional Controls */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-4 text-center">Directional Controls</h4>
                
                <div className="flex flex-col items-center gap-2">
                  {/* Up Arrow */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handlePositionAdjustment('up', FINE_STEP)}
                      className="w-8 h-6 bg-white hover:bg-blue-100 border border-blue-300 rounded text-blue-600 flex items-center justify-center transition-colors text-xs"
                      title="Move up (fine)"
                    >
                      ⬆
                    </button>
                    <button
                      onClick={() => handlePositionAdjustment('up')}
                      className="w-8 h-6 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-blue-700 flex items-center justify-center transition-colors font-bold"
                      title="Move up"
                    >
                      ⬆
                    </button>
                  </div>
                  
                  {/* Left and Right Arrows */}
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handlePositionAdjustment('left', FINE_STEP)}
                        className="w-6 h-8 bg-white hover:bg-blue-100 border border-blue-300 rounded text-blue-600 flex items-center justify-center transition-colors text-xs"
                        title="Move left (fine)"
                      >
                        ⬅
                      </button>
                      <button
                        onClick={() => handlePositionAdjustment('left')}
                        className="w-6 h-8 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-blue-700 flex items-center justify-center transition-colors font-bold"
                        title="Move left"
                      >
                        ⬅
                      </button>
                    </div>
                    
                    <div className="mx-2 text-center">
                      <div className="w-12 h-12 bg-blue-200 border-2 border-blue-400 rounded-full flex items-center justify-center text-blue-800">
                        🎯
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Target</div>
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => handlePositionAdjustment('right')}
                        className="w-6 h-8 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-blue-700 flex items-center justify-center transition-colors font-bold"
                        title="Move right"
                      >
                        ➡
                      </button>
                      <button
                        onClick={() => handlePositionAdjustment('right', FINE_STEP)}
                        className="w-6 h-8 bg-white hover:bg-blue-100 border border-blue-300 rounded text-blue-600 flex items-center justify-center transition-colors text-xs"
                        title="Move right (fine)"
                      >
                        ➡
                      </button>
                    </div>
                  </div>
                  
                  {/* Down Arrow */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handlePositionAdjustment('down')}
                      className="w-8 h-6 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-blue-700 flex items-center justify-center transition-colors font-bold"
                      title="Move down"
                    >
                      ⬇
                    </button>
                    <button
                      onClick={() => handlePositionAdjustment('down', FINE_STEP)}
                      className="w-8 h-6 bg-white hover:bg-blue-100 border border-blue-300 rounded text-blue-600 flex items-center justify-center transition-colors text-xs"
                      title="Move down (fine)"
                    >
                      ⬇
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {hasAdjustment && (
                  <button
                    onClick={resetPosition}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors font-medium"
                  >
                    🔄 Reset to Original
                  </button>
                )}
                
                <button
                  onClick={() => handleConfirmSelection(index)}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors font-medium"
                >
                  ✓ Use This Position
                </button>
                
                <button
                  onClick={handleCancelSelection}
                  className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>

              {/* Quick Instructions */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">How to Adjust</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Click directly on the screenshot</li>
                  <li>• Use arrow buttons for precise control</li>
                  <li>• Bold arrows: {POSITION_STEP}px steps</li>
                  <li>• Light arrows: {FINE_STEP}px fine steps</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const renderEditSuggestions = (stepNumber, setEditValue) => {
  const currentStep = steps.find(s => s.step_number === stepNumber);
  // Fixed: Compare with stepNumber instead of currentStep.id
  if (!currentStep || !showSuggestions || editingStepId !== stepNumber) return null;
  
  console.log(`Rendering suggestions for step ${stepNumber}, found ${commandSuggestions.length} suggestions`);
  
  return (
    <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-lg z-50">

      {/* ✅ OTP Verification UI (below suggestions) */}
      {commandType === 'type' && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          
          {/* 🔥 NEW: Show OTP placeholder option prominently */}
          {requiresOtp && !containsOtpPlaceholder(document.querySelector(`[data-step-id="${stepNumber}"]`)?.value || '') && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-800">
                  🔑 Use OTP Placeholder
                </span>
                <button
                  onClick={() => handleOtpPlaceholderClick(setEditValue)}
                  className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 rounded-md text-yellow-800 text-sm font-medium"
                >
                  Use &lt;otp&gt;
                </button>
              </div>
              <div className="text-xs text-yellow-700">
                Use this placeholder when you need to enter OTP. This step will require OTP verification, but subsequent steps won't.
              </div>
            </div>
          )}

          {/* 🔥 MODIFIED: Show OTP verification UI based on step content and global state */}
          {!containsOtpPlaceholder(document.querySelector(`[data-step-id="${stepNumber}"]`)?.value || '') && !otpPlaceholderUsed && (
            <>
              <label className="flex items-center gap-2 text-sm text-blue-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresOtp}
                  onChange={toggleOtpCheckbox}
                  className="accent-blue-500"
                />
                Get Real OTP Now
              </label>

              {/* Contact Method Options */}
              {requiresOtp && !otpVerificationState.contactEntered && (
                <div className="mt-3 p-3 bg-white border border-blue-300 rounded-md">
                  <span className="text-sm font-medium text-gray-700 block mb-2">
                    Select Contact Method:
                  </span>

                  {isTestDataLoading ? (
                    <div className="text-blue-500 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                                stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      Loading test data...
                    </div>
                  ) : testData?.phone_number || testData?.email ? (
                    <div className="flex gap-2 flex-wrap">
                      {testData.phone_number && (
                        <button
                          onClick={() => handlePhoneNumberClick(testData.phone_number, setEditValue)}
                          className="px-3 py-2 bg-green-50 hover:bg-green-100 border border-green-300 rounded-md text-green-700"
                        >
                          📱 Phone: {testData.phone_number}
                        </button>
                      )}
                      {testData.email && (
                        <button
                          onClick={() => handlePhoneNumberClick(testData.email, setEditValue)}
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-md text-blue-700"
                        >
                          📧 Email: {testData.email}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      ⚠ No contact method found. Please add test data first.
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-600">
                    Click on a contact method to get real OTP now
                  </div>
                </div>
              )}

              {/* Contact Selected */}
              {requiresOtp && contactSelected && otpVerificationState.contactEntered && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-green-700">
                      ✅ Selected: {otpVerificationState.enteredContact}
                    </div>
                    <button
                      onClick={() => {
                        setContactSelected(false);
                        setOtpVerificationState(prev => ({
                          ...prev,
                          contactEntered: false,
                          enteredContact: ''
                        }));
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Change Contact
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 🔥 NEW: Show different messages based on step content */}
          {containsOtpPlaceholder(document.querySelector(`[data-step-id="${stepNumber}"]`)?.value || '') && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="text-sm text-green-700 flex items-center gap-2">
                ✅ <span className="font-medium">OTP Placeholder in This Step</span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                This step uses &lt;otp&gt; placeholder and will require OTP verification. Future steps won't need OTP.
              </div>
            </div>
          )}

          {!containsOtpPlaceholder(document.querySelector(`[data-step-id="${stepNumber}"]`)?.value || '') && otpPlaceholderUsed && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm text-blue-700 flex items-center gap-2">
                ℹ️ <span className="font-medium">OTP Verification Completed</span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                OTP verification was completed in a previous step. This step doesn't require OTP.
              </div>
              <button
                onClick={() => {
                  setOtpPlaceholderUsed(false);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline mt-2"
              >
                Reset OTP state
              </button>
            </div>
          )}
        </div>
      )}

      {commandSuggestions.length === 0 ? (
        <div className="p-2 text-gray-500 text-center">No suggestions available</div>
      ) : (
        commandSuggestions.map((element, index) => (
          <div 
            key={index}
            onClick={() => handleEditSuggestionClick(element, stepNumber, setEditValue)}
            className="p-2 hover:bg-purple-50 cursor-pointer flex items-center gap-2"
          >
            <div className={`w-4 h-4 rounded-full ${
              commandType === 'click' ? 'bg-blue-100' : 
              commandType === 'type' ? 'bg-green-100' : 
              commandType === 'verify' ? 'bg-yellow-100' : 'bg-purple-100'
            }`}></div>
            
            <div className="flex flex-col flex-grow">
              <span className="font-medium">
                {element.name || element.text || element.id || 'Element ' + (index + 1)}
              </span>

              {/* <div className="flex items-center gap-2 text-xs">
                {coordinatesDisplay && (
                  <span className="text-blue-600 bg-blue-50 px-1 rounded">
                    {coordinatesDisplay}
                  </span>
                )}
              </div> */}
                
              {/* {element.text && (
                <span className="text-gray-500 truncate max-w-xs">
                  "{element.text.substring(0, 50)}{element.text.length > 50 ? '...' : ''}"
                </span>
              )} */}
            </div>

            {/* Add the adjust button and direct click option */}
            <div className="flex items-center gap-2">
              {(commandType === 'click' || commandType === 'type') && (
                <span 
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full cursor-pointer hover:bg-blue-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSetEditValue(() => setEditValue); 
                    handleSuggestionSelect(element);
                  }}
                >
                  🎯 Adjust
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded-full ${
                element.type === 'button' ? 'bg-blue-100 text-blue-700' : 
                element.type === 'input' ? 'bg-green-100 text-green-700' :
                element.type === 'text' ? 'bg-gray-100 text-gray-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {element.type || 'Element'}
              </span>
            </div>

            {/* {element.text && (
              <span className="text-xs text-gray-500 truncate max-w-xs">
                "{element.text.substring(0, 50)}{element.text.length > 50 ? '...' : ''}"
              </span>
            )} */}
          </div>
        ))
      )}

      {showPositionControls && (
        <PositionControls 
          // index={index}
          currentScreenshot={currentScreenshot} 
          selectedSuggestion={selectedSuggestion}
          adjustedPosition={adjustedPosition}
        />
      )}
    </div>
  );
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
            <li>When you try to add a new step or edit an existing step, please capture the test page first.</li>
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

  const renderStepActions = (step) => {
    if (isExecuting || executionResults[step.step_number]) {
      return null;
    }
  
    const hasCapture = !!capturedSteps[step.step_number];
    const originalCaptureId = originalCaptureIds[step.step_number];
    const isOriginalCapture = !originalCaptureId || originalCaptureId === step.step_number;
  
    return (
      <>
        {hoveredStep === step.step_number && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
            
            {/* Show Camera icon only before original capture */}
            {(!hasCapture || !isOriginalCapture) && (
              <button
                onClick={() => handleCaptureElement(step.step_number)}
                className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full transition-colors"
                title="Capture Element"
                disabled={captureLoading[step.step_number]}
              >
                {captureLoading[step.step_number] ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera size={16} />
                )}
              </button>
            )}
  
            {/* Show Refresh icon only if original capture exists */}
            {hasCapture && isOriginalCapture && (
              <button
                onClick={() => handleCaptureElement(step.step_number)}
                className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded-full transition-colors"
                title="Recapture Element"
                disabled={captureLoading[step.step_number]}
              >
                {captureLoading[step.step_number] ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                )}
              </button>
            )}
  
            {/* Note/Info Button */}
            <button
              onClick={() => setShowNoteModal(true)}
              className="p-1.5 bg-yellow-100 rounded-full text-yellow-600 hover:bg-yellow-200 transition-colors"
              title="Show Instructions"
            >
              <Info size={16} />
            </button>
          </div>
        )}
      </>
    );
  };  

  const handleWaitConfirm = async (waitCommand, requestData) => {

    setWaitRequestData(requestData);
    
    if (insertingAfterStep !== null) {

      setNewInsertedStepValue(waitCommand);
      handleInsertStep(insertingAfterStep, waitCommand, requestData);

    } else if (editingStepId) {
      updateEditValue(waitCommand);

      // try {
      //   // Find the step being edited
      //   const stepToEdit = steps.find(s => s.step_number === editingStepId);
      //   if (!stepToEdit) {
      //     throw new Error("Step not found");
      //   }
        
      //   // Prepare the update payload
      //   const payload = {
      //     testcase: testCaseName,
      //     step_number: stepToEdit.step_number,
      //     step_description: waitCommand
      //   };
        
      //   // Make API call to update the step
      //   const response = await fetch(`${apiBaseUrl}/teststeps/${editingStepId}/`, {
      //     method: "PUT",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify(payload),
      //   });

      //   if (!response.ok) {
      //     const errorData = await response.json();
      //     throw new Error(errorData.message || "Failed to update step");
      //   }
        
      //   // Refresh steps list
      //   await fetchSteps();
        
      //   setEditingStepId(null);
      //   setError(null);
      //   resetEditState();
        
      // } catch (err) {
      //   setError("Failed to update step. Please try again.");
      //   console.error("Error updating step:", err);
      // }
    }

    setShowWaitModal(false);
  };

  const WaitModalWrapper = () => (
    <WaitModal 
      isOpen={showWaitModal}
      onClose={() => setShowWaitModal(false)}
      onConfirm={handleWaitConfirm}
    />
  );

  const WaitModal = ({ isOpen, onClose, onConfirm }) => {
    const [waitCondition, setWaitCondition] = useState('static_wait');
    const [waitTimeout, setWaitTimeout] = useState(5);
    const [waitText, setWaitText] = useState('');
    const [pollInterval, setPollInterval] = useState(500);
    
    useEffect(() => {
      if (isOpen) {
      
        const parseExistingCommand = () => {
          if (editingStepId) {
            // Find the step from outside the effect
            const currentSteps = steps || [];
            const step = currentSteps.find(s => s.id === editingStepId);
            
            if (step && step.step_description) {
              const description = step.step_description.toLowerCase();
              
              if (description.includes('wait until text')) {
                setWaitCondition('text_match');
                const textMatch = description.match(/wait until text "([^"]+)"/);
                if (textMatch && textMatch[1]) {
                  setWaitText(textMatch[1]);
                }
                
                // Try to parse timeout if present
                const timeoutMatch = description.match(/timeout (\d+)/);
                if (timeoutMatch && timeoutMatch[1]) {
                  setWaitTimeout(parseInt(timeoutMatch[1]) / 1000);
                }
              } else if (description.includes('wait until url')) {
                setWaitCondition('url_match');
                const urlMatch = description.match(/wait until url contains "([^"]+)"/);
                if (urlMatch && urlMatch[1]) {
                  setWaitText(urlMatch[1]);
                }
                
                // Try to parse timeout if present
                const timeoutMatch = description.match(/timeout (\d+)/);
                if (timeoutMatch && timeoutMatch[1]) {
                  setWaitTimeout(parseInt(timeoutMatch[1]) / 1000);
                }
              } else {
                // Default to static wait
                setWaitCondition('static_wait');
                const secondsMatch = description.match(/wait (\d+) seconds/);
                if (secondsMatch && secondsMatch[1]) {
                  setWaitTimeout(parseInt(secondsMatch[1]));
                }
              }
            }
          } else {
            // Reset for new step
            setWaitCondition('static_wait');
            setWaitTimeout(5);
            setWaitText('');
            setPollInterval(500);
          }
        };
        
        parseExistingCommand();
      }
    }, [isOpen]); 


    const handleConfirm = () => {
      // const userid = localStorage.getItem("user_id");
      if (!waitTimeout || waitTimeout <= 0) {
        alert('Please enter a valid wait time greater than 0.');
        return;
      }
      const timeoutMs = waitTimeout * 1000;
      
      let waitCommand = '';
      let requestData = {};
      
      if (waitCondition === 'static_wait') {
        waitCommand = `wait ${waitTimeout} seconds`;
        requestData = {
          // user_id: userid,
          timeout: timeoutMs,
          debug: true
        };
      } else if (waitCondition === 'text_match') {
        waitCommand = `wait until text "${waitText}" appears`;
        requestData = {
          // user_id: userid,
          // condition: "text_match",
          expected_text: waitText,
          timeout: timeoutMs,
          poll_interval: pollInterval,
          debug: true
        };
      } 
      // else if (waitCondition === 'url_match') {
      //   waitCommand = `wait until URL contains "${waitText}"`;
      //   requestData = {
      //     user_id: userid,
      //     condition: "url_match",
      //     expected_text: waitText,
      //     timeout: timeoutMs,
      //     poll_interval: pollInterval,
      //     debug: true
      //   };
      // }
      
      // Close the modal first
      onClose();
      
      onConfirm(waitCommand, requestData);
    };

    const handleClose = () => {;
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
              onChange={(e) => {
                const val = e.target.value;
                setWaitTimeout(val === '' ? '' : Number(val));
              }}
              placeholder="Default is 5 seconds if not specified"
              step="1"
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

  const renderStepContent = (step) => {
    // Get the original capture ID for this step (if any)
    const originalCaptureId = originalCaptureIds[step.step_number];
    const isOriginalCapture = !originalCaptureId || originalCaptureId === step.step_number;
  
    return (
      <>
        {/* Capture loading message */}
        {captureLoading[step.step_number] && (
          <div className="mt-3 ml-12 text-sm p-3 rounded text-blue-700">
            Capture is loading... Please open your test page.
          </div>
        )}
  
        {/* Screenshot capture notification */}
        {capturedSteps[step.step_number] && !captureLoading[step.step_number] && (
          <div className="mt-3 ml-12 mb-3">
            <div className="flex items-center justify-between bg-green-50 border border-green-200 p-2 rounded">
              <div className="flex items-center">
                <Check size={16} className="text-green-600 mr-2" />
                <span className="text-sm text-green-700">
                  {isOriginalCapture 
                    ? "Screenshot captured successfully!" 
                    : "Using coordinates from previous capture"}
                </span>
              </div>
              
              {/* Only show screenshot controls for original captures */}
              {isOriginalCapture && (
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      setScreenshotVisible(prev => ({...prev, [step.step_number]: !prev[step.step_number]}));
                      setScreenshotDirection(screenshotVisible[step.step_number] ? 'down' : 'up');
                    }}
                    className="text-green-600 hover:text-green-800 p-1 rounded"
                    title={screenshotVisible[step.step_number] ? "Hide screenshot" : "Show screenshot"}
                  >
                    {screenshotVisible[step.step_number] ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleExpandScreenshot(capturedSteps[step.step_number].screenshot)}
                    className="text-green-600 hover:text-green-800 p-1 rounded ml-1"
                    title="Expand screenshot"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h6v6"></path>
                      <path d="M9 21H3v-6"></path>
                      <path d="M21 3l-7 7"></path>
                      <path d="M3 21l7-7"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleCaptureElement( step.step_number)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded ml-1"
                    title="Recapture screenshot"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            {/* Only show screenshot preview for original captures */}
            {isOriginalCapture && screenshotVisible[step.step_number] && (
              <div className={`mt-2 flex justify-center transition-all duration-300 ${
                screenshotDirection === 'down' ? 'animate-slideInDown' : 'animate-slideInUp'
              }`}>
                <img 
                  src={capturedSteps[step.step_number].screenshot}
                  alt="Captured screenshot"
                  className="max-h-64 object-contain border border-gray-200 rounded cursor-pointer"
                  onClick={() => handleExpandScreenshot(capturedSteps[step.step_number].screenshot)}
                />
              </div>
            )}
          </div>
        )}
  
        {/* Insert step input - appears when a user clicks the + button */}
        {insertingAfterStep === step.step_number && (
          <div className="mt-3 ml-12 mb-3 flex flex-col animate-fadeIn">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newInsertedStepValue}
                onChange={handleCommandInputChange}
                className="flex-1 p-2 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Enter new test step (e.g., click, type, verify)"
                autoFocus
              />
              {insertingLoading ? (
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-600 rounded-md">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l4-4-4-4v4a8 8 0 100 16v-4l-4 4 4 4v-4a8 8 0 01-8-8z" />
                  </svg>
                  Adding step...
                </div>
              ) : (
                <button
                  onClick={() => handleInsertStep(step.step_number)}
                  className="inline-flex items-center px-4 py-2 bg-purple-400 text-white rounded-md hover:bg-purple-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </button>
              )}
              <button
                onClick={() => {
                  setInsertingAfterStep(null);
                  setSelectedElement(null);
                  setNewInsertedStepValue("");
                  setShowSuggestions(false);
                }}
                className="p-2 text-gray-600 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Display error if any */}
            {error && (
              <div className="mt-1 text-sm text-red-600">
                {error}
              </div>
            )}
            
            {/* Element suggestions dropdown */}
            {showSuggestions && commandSuggestions.length > 0 && (
              <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-lg">

                {/* ✅ OTP Verification UI (below suggestions) */}
                {commandType === 'type' && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">

                    {/* 🔥 NEW: Show OTP placeholder option prominently */}
                    {requiresOtp && !containsOtpPlaceholder(newInsertedStepValue) && (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-yellow-800">
                            🔑 Use OTP Placeholder
                          </span>
                          <button
                            onClick={() => handleOtpPlaceholderClick()}
                            className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 rounded-md text-yellow-800 text-sm font-medium"
                          >
                            Use &lt;otp&gt;
                          </button>
                        </div>
                        <div className="text-xs text-yellow-700">
                          Use this placeholder when you need to enter OTP. This step will require OTP verification, but subsequent steps won't.
                        </div>
                      </div>
                    )}

                    {!containsOtpPlaceholder(newInsertedStepValue) && !otpPlaceholderUsed && (
                      <>
                        <label className="flex items-center gap-2 text-sm text-blue-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={requiresOtp}
                            onChange={toggleOtpCheckbox}
                            className="accent-blue-500"
                          />
                          Get Real OTP Now
                        </label>

                      {/* Contact Method Options */}
                      {requiresOtp && !otpVerificationState.contactEntered && (
                        <div className="mt-3 p-3 bg-white border border-blue-300 rounded-md">
                          <span className="text-sm font-medium text-gray-700 block mb-2">
                            Select Contact Method:
                          </span>

                          {isTestDataLoading ? (
                            <div className="text-blue-500 text-sm flex items-center gap-2">
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10"
                                        stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor"
                                      d="M4 12a8 8 0 018-8v8H4z"></path>
                              </svg>
                              Loading test data...
                            </div>
                          ) : testData?.phone_number || testData?.email ? (
                            <div className="flex gap-2 flex-wrap">
                              {testData.phone_number && (
                                <button
                                  onClick={() => handlePhoneNumberClick(testData.phone_number)}
                                  className="px-3 py-2 bg-green-50 hover:bg-green-100 border border-green-300 rounded-md text-green-700"
                                >
                                  📱 Phone: {testData.phone_number}
                                </button>
                              )}
                              {testData.email && (
                                <button
                                  onClick={() => handlePhoneNumberClick(testData.email)}
                                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-md text-blue-700"
                                >
                                  📧 Email: {testData.email}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-red-600">
                              ⚠ No contact method found. Please add test data first.
                            </div>
                          )}

                          <div className="mt-2 text-xs text-gray-600">
                            Click on a contact method to proceed
                          </div>
                        </div>
                      )}

                      {/* Contact Selected */}
                      {requiresOtp && contactSelected && otpVerificationState.contactEntered && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-green-700">
                              ✅ Selected: {otpVerificationState.enteredContact}
                            </div>
                            <button
                              onClick={() => {
                                setContactSelected(false);
                                setOtpVerificationState(prev => ({
                                  ...prev,
                                  contactEntered: false,
                                  enteredContact: ''
                                }));
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Change Contact
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                    )}

                    {/* Show message when OTP verification is complete */}
                    {!containsOtpPlaceholder(newInsertedStepValue) && otpPlaceholderUsed && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="text-sm text-green-700 flex items-center gap-2">
                          ✅ <span className="font-medium">OTP Verification Complete</span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          OTP was verified in a previous step. This step doesn't need OTP verification.
                        </div>
                        <button
                          onClick={() => {
                            setOtpPlaceholderUsed(false);
                            setRequiresOtp(false);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline mt-2"
                        >
                          Enable OTP for new steps
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {commandSuggestions.length === 0 ? (
                  <div className="p-2 text-gray-500 text-center">
                    No suggestions available. Please capture the screenshot and fetch elements.
                  </div>
                ) : (
                  commandSuggestions.map((element, index) => (
                    <div 
                      key={index}
                      onClick={() => handleSuggestionClick(element)}
                      className="p-2 hover:bg-purple-50 cursor-pointer flex items-center gap-2"
                    >
                      <div className={`w-4 h-4 rounded-full ${
                        commandType === 'click' ? 'bg-blue-100' : 
                        commandType === 'type' ? 'bg-green-100' : 
                        commandType === 'verify' ? 'bg-yellow-100' :
                        commandType === 'open' ? 'bg-orange-100' : 'bg-purple-100'
                      }`}></div>

                      <div className="flex flex-col flex-grow">
                        <span className="font-medium">
                          {element.name || element.text || element.id || 'Element ' + (index + 1)}
                        </span>
                        {/* <div className="flex items-center gap-2 text-xs">
                          {coordinatesDisplay && (
                            <span className="text-blue-600 bg-blue-50 px-1 rounded">
                              {coordinatesDisplay}
                            </span>
                          )}
                        </div> */}
                        
                        {/* {element.text && (
                          <span className="text-gray-500 truncate max-w-xs">
                            "{element.text.substring(0, 50)}{element.text.length > 50 ? '...' : ''}"
                          </span>
                        )} */}
                      </div>


                      {element.packageName && (
                        <span className="text-xs text-gray-500 truncate max-w-xs">
                          {element.packageName}
                        </span>
                      )}
                      {element.text && !element.packageName && (
                        <span className="text-xs text-gray-500 truncate max-w-xs">
                          "{element.text.substring(0, 50)}{element.text.length > 50 ? '...' : ''}"
                        </span>
                      )}

                      {/* Add the adjust button and direct click option */}
                      <div className="flex items-center gap-2">
                        {(commandType === 'click' || commandType === 'type') && (
                          <span 
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full cursor-pointer hover:bg-blue-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSuggestionSelect(element);
                            }}
                          >
                            🎯 Adjust
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          element.type === 'button' ? 'bg-blue-100 text-blue-700' : 
                          element.type === 'input' ? 'bg-green-100 text-green-700' :
                          element.type === 'text' ? 'bg-gray-100 text-gray-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {element.type || 'Element'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {showPositionControls && (
              <PositionControls 
                // index={index}
                currentScreenshot={currentScreenshot} 
                selectedSuggestion={selectedSuggestion}
                adjustedPosition={adjustedPosition}
              />
            )}
            
            {/* Command guidance based on selected command type */}
            {commandType && !showSuggestions && (
              <div className="mt-1 text-xs text-gray-600">
                {commandType === 'click' && "Select an element to click from the suggestions."}
                {commandType === 'type' && "Enter text to type, then select an input element."}
                {commandType === 'verify' && "Select an element to verify from the suggestions."}
                {commandType === 'get' && "Select an element to retrieve text from."}
                {commandType === 'scrollup' && "This will scroll the page up."}
                {commandType === 'scrolldown' && "This will scroll the page down."}
                {commandType === 'open' && "Enter the URL to open (e.g., open App Name."}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  const getOtpState = () => {
    return {
      requiresOtp: requiresOtp,
      enteredContact: otpVerificationState.enteredContact,
      contactEntered: otpVerificationState.contactEntered,
      otpPlaceholderUsed: otpPlaceholderUsed,

      stepRequiresOtp: (stepDescription) => {
        // If step contains <otp>, it requires OTP verification
        if (containsOtpPlaceholder(stepDescription)) {
          return true;
        }
        // If previous step had <otp>, this step doesn't need OTP
        if (otpPlaceholderUsed) {
          return false;
        }
        // Otherwise, depends on checkbox state
        return requiresOtp;
      }
    };
  };

  return {
    capturedSteps,
    // clearCapturedData,
    updateCapturedStepsFromStorage,
    renderStepActions,
    renderStepContent,
    ScreenshotModal,
    InstructionsModal,
    handleExpandScreenshot,
    showNoteModal,
    expandedScreenshot,
    error,
    setInsertingAfterStep,
    insertingAfterStep,
    screenshotVisible,
    setScreenshotVisible,
    screenshotDirection,
    setScreenshotDirection,
    allCapturedElements,
    handleEditCommandInput,
    clearSuggestions,
    renderEditSuggestions,
    handleCommandInputChange,
    selectedElement,
    handleWaitConfirm,
    WaitModal: WaitModalWrapper, 
    waitRequestData,
    setWaitRequestData,
    showSuggestions,        
    commandSuggestions,    
    commandType,           
    setShowSuggestions,    
    setCommandSuggestions, 
    setCommandType,
    getOtpState,
  };

};

export default AndroidAddStep;

