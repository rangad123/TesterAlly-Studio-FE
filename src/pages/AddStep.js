
import React, { useState, useRef, useEffect } from "react";
import { Plus, X, Camera, Info, Check } from "lucide-react";

const AddStep = ({ 
  testCaseId, 
  steps, 
  fetchSteps, 
  apiBaseUrl, 
  hoveredStep, 
  isExecuting,
  executionResults,
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
  const [browserTabs, setBrowserTabs] = useState([]);
  const [showBrowserTabsModal, setShowBrowserTabsModal] = useState(false);
  const [tabsLoading, setTabsLoading] = useState(false);
  const [currentStepId, setCurrentStepId] = useState(null);
  const [ , setCurrentStepNumber] = useState(null);
  
  const inputRef = useRef(null);

  useEffect(() => {
    const loadCapturedElements = () => {
      try {
        const storedElements = sessionStorage.getItem(`capturedElements_${testCaseId}`);
        if (storedElements) {
          const parsedElements = JSON.parse(storedElements);
          setAllCapturedElements(parsedElements);
          
          // Also populate capturedSteps with any stored screenshots
          const storedScreenshots = sessionStorage.getItem(`capturedScreenshots_${testCaseId}`);
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
          const storedOriginalIds = sessionStorage.getItem(`originalCaptureIds_${testCaseId}`);
          if (storedOriginalIds) {
            setOriginalCaptureIds(JSON.parse(storedOriginalIds));
          }
        }
      } catch (error) {
        console.error("Error loading captured elements from session storage:", error);
      }
    };
    
    loadCapturedElements();
  }, [testCaseId]);
  
  useEffect(() => {
    if (Object.keys(originalCaptureIds).length > 0) {
      sessionStorage.setItem(`originalCaptureIds_${testCaseId}`, JSON.stringify(originalCaptureIds));
    }
  }, [originalCaptureIds, testCaseId]);

  useEffect(() => {
    if (Object.keys(capturedSteps).length > 0) {
      sessionStorage.setItem(`capturedScreenshots_${testCaseId}`, JSON.stringify(capturedSteps));
    }
  }, [capturedSteps, testCaseId]);

  const handleCaptureElement = async (stepId, stepNumber) => {
    setTabsLoading(true);
    setCurrentStepId(stepId);
    setCurrentStepNumber(stepNumber);
    
    try {
      
      // Fetch browser tabs instead of immediately capturing
      const response = await fetch('http://127.0.0.1:8000/automation/get_browser_tabs/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to get browser tabs');
      }
  
      const data = await response.json();
      console.log("Browser tabs response:", data);
      
      // Set browser tabs and show modal
      setBrowserTabs(data.browser_tabs || []);
      setShowBrowserTabsModal(true);
    } catch (error) {
      console.error('Browser tabs fetch error:', error);
      setError("Failed to fetch browser tabs. Please try again.");
    } finally {
      setTabsLoading(false);
    }
  };
  
  const handleTabSelection = async (tab) => {
    setCaptureLoading(prev => ({ ...prev, [currentStepId]: true }));
    setShowBrowserTabsModal(false);
    
    try {
      const user_id = localStorage.getItem("userId");
      
      const requestBody = {
        tab_title: tab.title,
        hwnd: tab.hwnd,
        browser_name: tab.browser_name,
        user_id: user_id,
      };
      
      console.log("Request body for /process_browser_tabs/:", requestBody);
      
      const response = await fetch('http://127.0.0.1:8000/automation/process_browser_tab/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process browser tab');
      }
      
      const data = await response.json();
      console.log("Process tab response:", data);
      
      // Update captured steps with screenshot (similar to your original function)
      const capturedStepData = {
        coordinates: data.coordinates || {},
        screenshot: data.screenshot ? `http://127.0.0.1:8000${data.screenshot}` : null,
        timestamp: new Date().toISOString(),
        elements: data.omniparser_data?.elements || []
      };
      
      // Update capturedSteps
      setCapturedSteps(prev => ({
        ...prev,
        [currentStepId]: capturedStepData
      }));
      
      // Update allCapturedElements for suggestions
      setAllCapturedElements(prev => ({
        ...prev,
        [currentStepId]: capturedStepData.elements
      }));
      
      // This is an original capture - set itself as the original
      setOriginalCaptureIds(prev => ({
        ...prev, 
        [currentStepId]: currentStepId
      }));
      
      // Save the data to session storage
      sessionStorage.setItem(`capturedScreenshots_${testCaseId}`, 
        JSON.stringify({...capturedSteps, [currentStepId]: capturedStepData}));
      sessionStorage.setItem(`capturedElements_${testCaseId}`,
        JSON.stringify({...allCapturedElements, [currentStepId]: capturedStepData.elements}));
      
      // Update last captured step ID
      setLastCapturedStepId(currentStepId);
    } catch (error) {
      console.error('Tab processing error:', error);
      setError("Failed to process browser tab. Please try again.");
    } finally {
      setCaptureLoading(prev => ({ ...prev, [currentStepId]: false }));
    }
  };
  
  const handleCommandInputChange = (e) => {
    const input = e.target.value;
    
    // Check if this is for edit mode
    if (e.target.hasAttribute('data-step-id')) {
      const stepId = e.target.getAttribute('data-step-id');
      setEditingStepId(stepId);
      console.log(`Editing step: ${stepId} with input: ${input}`);
    } else {
      setNewInsertedStepValue(input);
      console.log(`New step input: ${input}`);
    }
  
    const words = input.trim().split(' ');
    const command = words[0].toLowerCase();
    
    // Set command type based on first word
    if (['click', 'type', 'verify', 'get'].includes(command)) {
      setCommandType(command);
      console.log(`Command type set to: ${command}`);
      
      // Always fetch suggestions regardless of whether it's edit or insert mode
      fetchElementSuggestions(command, input, words);
      setShowSuggestions(true);
    } else if (['scrollup', 'scrolldown', 'open'].includes(command)) {
      setCommandType(command);
      setShowSuggestions(false);
    } else {
      setCommandType("");
      setShowSuggestions(false);
    }
  };
  
  const handleEditCommandInput = (stepId, stepDescription, commandType) => {
    console.log(`Setting up edit suggestions for step ${stepId}`);
    console.log(`Command: ${commandType}, Full text: ${stepDescription}`);
    
    // Set the editing step ID and command type explicitly
    setEditingStepId(stepId);
    setCommandType(commandType);
    setShowSuggestions(true); // Force show suggestions
    
    // Find the step data
    const step = steps.find(s => s.id === stepId);
    if (!step) {
      console.log(`Step ${stepId} not found`);
      return;
    }
    
    // Process the step description to extract the command
    const words = stepDescription.trim().split(' ');
    
    if (['click', 'type', 'verify', 'get'].includes(commandType)) {
      // This important - force show suggestions
      setShowSuggestions(true);
      console.log("Show suggestions set to TRUE");
      
      // Fetch element suggestions immediately
      fetchElementSuggestions(commandType, stepDescription, words);
      console.log(`Fetching suggestions for edit step ${stepId} with command ${commandType}`);
    }
  };  

  const fetchElementSuggestions = (command, inputValue, words) => {

    console.log(`Current editing step ID: ${editingStepId}`);

    const relevantStepNumber = editingStepId 
      ? steps.find(s => s.id === editingStepId)?.step_number
      : insertingAfterStep;
      
    if (!relevantStepNumber) return;
    
    console.log(`Fetching suggestions for ${command} command, step: ${relevantStepNumber}`);
    
    // Step 1: Determine which capture data to use
    let stepId = null;
    
    if (editingStepId) {
      // If editing, try to use the step's own capture data first
      stepId = editingStepId;
      console.log("Editing mode - using step ID:", stepId);
    } else {
      // If inserting after, find the step we're inserting after
      const insertAfterStep = steps.find(s => s.step_number === insertingAfterStep);
      if (insertAfterStep) {
        stepId = insertAfterStep.id;
        console.log("Insert mode - using step ID:", stepId);
      }
    }
    
    // Find the relevant capture data
    let relevantCaptureStepId = null;
    let relevantElements = [];
    
    if (stepId && capturedSteps[stepId]) {
      // Case: Step has its own capture
      relevantCaptureStepId = stepId;
      console.log("Using elements from current step:", relevantCaptureStepId);
    } else if (stepId) {
      // Case: Step doesn't have its own capture, find its reference
      relevantCaptureStepId = originalCaptureIds[stepId];
      console.log("Using elements from reference step:", relevantCaptureStepId);
    }
/*
       // If we still don't have a relevant capture
      if (!relevantCaptureStepId) {
        const allSteps = [...steps].sort((a, b) => {
          // First try to find steps with captures
          const aHasCapture = capturedSteps[a.id] ? 1 : 0;
          const bHasCapture = capturedSteps[b.id] ? 1 : 0;
          
          if (aHasCapture !== bHasCapture) {
            return bHasCapture - aHasCapture; // Prioritize steps with captures
          }
          
          // Then apply proximity logic - steps closest to the relevant step
          // (either before or after) are prioritized 
          return Math.abs(a.step_number - relevantStepNumber) - Math.abs(b.step_number - relevantStepNumber);
        });
        
        // Find the closest step with a capture
        for (const step of allSteps) {
          if (capturedSteps[step.id]) {
            relevantCaptureStepId = step.id;
            console.log("Using elements from closest step:", relevantCaptureStepId, "step number:", step.step_number);
            break;
          }
        }

        // If that fails, fall back to last captured step
        if (!relevantCaptureStepId && lastCapturedStepId) {
          relevantCaptureStepId = lastCapturedStepId;
          console.log("Fallback: Using last captured step:", relevantCaptureStepId);  
        }
      }
      
      // Now use only the relevant elements for filtering
      if (relevantCaptureStepId && allCapturedElements[relevantCaptureStepId]) {
        relevantElements = allCapturedElements[relevantCaptureStepId];
      }   
*/    
    // If we still don't have a relevant capture, find the last captured step before this one
    if (!relevantCaptureStepId) {
      const stepsBeforeInsertion = steps
        .filter(s => s.step_number <= relevantStepNumber)
        .sort((a, b) => b.step_number - a.step_number); // Descending order
        
      for (const step of stepsBeforeInsertion) {
        if (capturedSteps[step.id]) {
          relevantCaptureStepId = step.id;
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
      filtered = allElements.filter(el => el.interactivity === true)
        .map(el => {
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
      // Fix: Include elements that can receive input, not just text and icon
      filtered = allElements.filter(el => 
        el.type === "text" ||
        el.interactivity === true
      ).map(el => {
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
      
      // For "type" command, we need to check for text after "in" if present
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

const handleInsertStep = async (afterStepNumber) => {
  if (!newInsertedStepValue.trim()) {
    setError("Step description cannot be empty");
    return;
  }
  setInsertingLoading(true);
  
  try {
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

    const words = newInsertedStepValue.trim().split(' ');
    const actionType = words[0].toLowerCase();
    
    if ((actionType === 'click' || actionType === 'type' || actionType === 'verify' || actionType === 'get') && !selectedElement) {
      setError("Please select an element from the suggestions before adding this step.");
      return;
    }

    const payload = {
      testcase_id: parseInt(testCaseId),
      step_number: newStepNumber,
      step_description: newInsertedStepValue.trim(),
      step_coordinates: coordinates,
      teststep_result: "not_executed"
    };
    
    console.log("Insert Step Payload:", payload);    
    
    const response = await fetch(`${apiBaseUrl}/teststeps/insert-step/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to add step");
    }
    
    // Get the created step ID from the response
    const responseData = await response.json();
    const newStepId = responseData.id || null;
    
    // Handle reference capture data if needed
    if (newStepId) {
      // Find the appropriate reference step ID - the previous step with capture data
      const afterStepId = steps.find(s => s.step_number === afterStepNumber)?.id;
      let referenceCaptureStepId = null;
      
      if (afterStepId && capturedSteps[afterStepId]) {
        // Use the capture from the step we're inserting after
        referenceCaptureStepId = afterStepId;
      } else if (afterStepId && originalCaptureIds[afterStepId]) {
        // Use the original capture the previous step references
        referenceCaptureStepId = originalCaptureIds[afterStepId];
      } else {
        // Find the last step with a capture before this position
        const stepsBeforeInsertion = steps
          .filter(s => s.step_number <= afterStepNumber)
          .sort((a, b) => b.step_number - a.step_number);
          
        for (const step of stepsBeforeInsertion) {
          if (capturedSteps[step.id]) {
            referenceCaptureStepId = step.id;
            break;
          }
        }
      }
      
      // If we have a reference step with capture data
      if (referenceCaptureStepId && capturedSteps[referenceCaptureStepId]) {
        const referenceData = capturedSteps[referenceCaptureStepId];
        
        // Create a new entry for this step using the reference data
        const newStepCaptureData = {
          ...referenceData,
          coordinates: coordinates,
          timestamp: new Date().toISOString()
        };
        
        // Update captured steps with reference to the original
        setCapturedSteps(prev => ({
          ...prev,
          [newStepId]: newStepCaptureData
        }));
        
        // Track the original capture ID this step is using
        const originalId = originalCaptureIds[referenceCaptureStepId] || referenceCaptureStepId;
        setOriginalCaptureIds(prev => ({
          ...prev,
          [newStepId]: originalId
        }));
        
        // Also update allCapturedElements to include this reference
        if (allCapturedElements[referenceCaptureStepId]) {
          setAllCapturedElements(prev => ({
            ...prev,
            [newStepId]: allCapturedElements[referenceCaptureStepId]
          }));
        }
      }
      
      // Handle the temporary step ID case from handleSuggestionClick
      if (selectedElement && selectedElement.tempStepId) {
        const tempStepId = selectedElement.tempStepId;
        if (capturedSteps[tempStepId]) {
          // Update captured steps with the real ID
          const capturedData = capturedSteps[tempStepId];
          setCapturedSteps(prev => {
            const updated = {...prev};
            delete updated[tempStepId];
            updated[newStepId] = capturedData;
            return updated;
          });
          
          // Update original capture IDs
          const originalId = originalCaptureIds[tempStepId];
          if (originalId) {
            setOriginalCaptureIds(prev => {
              const updated = {...prev};
              delete updated[tempStepId];
              updated[newStepId] = originalId;
              return updated;
            });
          }
          
          // Also update all captured elements
          if (allCapturedElements[tempStepId]) {
            setAllCapturedElements(prev => {
              const updated = {...prev};
              delete updated[tempStepId];
              updated[newStepId] = allCapturedElements[tempStepId];
              return updated;
            });
          }
        }
      }
    }
    
    // Update step numbers for all subsequent steps
    const stepsToUpdate = steps.filter(step => step.step_number >= newStepNumber);
    const updatePromises = stepsToUpdate.map(async (step) => {
      const response = await fetch(`${apiBaseUrl}/teststeps/${step.id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testcase: testCaseId,
          step_number: step.step_number + 1,
          step_description: step.step_description
        })
      });
      return response.ok;
    });

    await Promise.all(updatePromises);
    await fetchSteps();
    setNewInsertedStepValue("");
    setInsertingAfterStep(null);
    setShowSuggestions(false);
    setSelectedElement(null);
    setCommandType("");
    setError(null);

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

const renderEditSuggestions = (stepId, setEditValue) => {
  // Check if we're in edit mode for this specific step and suggestions should be shown
  if (!showSuggestions || editingStepId !== stepId) return null;
  
  console.log(`Rendering suggestions for step ${stepId}, found ${commandSuggestions.length} suggestions`);
  
  return (
    <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-lg z-50">
      {commandSuggestions.length === 0 ? (
        <div className="p-2 text-gray-500 text-center">No suggestions available</div>
      ) : (
        commandSuggestions.map((element, index) => (
          <div 
            key={index}
            onClick={() => {
              // Similar to handleSuggestionClick but for edit mode
              let updatedStep = '';
              
              if (commandType === 'click') {
                updatedStep = `click ${element.name || element.text || 'element'}`;
              } else if (commandType === 'type') {
                const currentText = document.querySelector(`[data-step-id="${stepId}"]`)?.value || '';
                const inIndex = currentText.toLowerCase().indexOf(' in ');
                if (inIndex !== -1) {
                  const textToType = currentText.substring(5, inIndex).trim();
                  if (textToType) {
                    updatedStep = `type ${textToType} in ${element.name || element.text || 'element'}`;
                  } else {
                    updatedStep = `type  in ${element.name || element.text || 'element'}`;
                  }
                } else {
                  updatedStep = `type  in ${element.name || element.text || 'element'}`;
                } 
              } else if (commandType === 'verify') {
                updatedStep = `verify ${element.text || element.name || 'element'}`;
              } else if (commandType === 'get') {
                updatedStep = `get ${element.text || element.name || 'element'}`;
              }
              
              // Update the edit input value
              setEditValue(updatedStep);
              
              // Save the selected element coordinates for this step
              setSelectedElement(element);
              
              // Process coordinates from the suggestion (similar to handleSuggestionClick)
              let coordinates = null;
              
              if (element.click_point && Array.isArray(element.click_point)) {
                coordinates = {
                  click_x: parseFloat(element.click_point[0]) || 0,
                  click_y: parseFloat(element.click_point[1]) || 0
                };
              } else if (element.coordinates) {
                if (Array.isArray(element.coordinates)) {
                  coordinates = {
                    click_x: parseFloat(element.coordinates[0]) || 0,
                    click_y: parseFloat(element.coordinates[1]) || 0
                  };
                } else {
                  coordinates = {
                    click_x: parseFloat(element.coordinates.x || element.coordinates.click_x || 0),
                    click_y: parseFloat(element.coordinates.y || element.coordinates.click_y || 0)
                  };
                }
              }
              
              // If we have coordinates and a valid captured step, update with new coordinates
              if (coordinates) {
                const relevantCaptureId = originalCaptureIds[stepId] || stepId;
                if (capturedSteps[relevantCaptureId]) {
                  const updatedCaptureData = {
                    ...capturedSteps[relevantCaptureId],
                    coordinates: coordinates
                  };
                  
                  setCapturedSteps(prev => ({
                    ...prev,
                    [stepId]: updatedCaptureData
                  }));
                }
              }
              
              // Hide suggestions after selection
              setShowSuggestions(false);
            }}
            className="p-2 hover:bg-purple-50 cursor-pointer flex items-center gap-2"
          >
            <div className={`w-4 h-4 rounded-full ${
              commandType === 'click' ? 'bg-blue-100' : 
              commandType === 'type' ? 'bg-green-100' : 
              commandType === 'verify' ? 'bg-yellow-100' : 'bg-purple-100'
            }`}></div>
            <span>{element.name || element.text || element.id || 'Element ' + (index + 1)}</span>
            {element.text && (
              <span className="text-xs text-gray-500 truncate max-w-xs">
                "{element.text.substring(0, 50)}{element.text.length > 50 ? '...' : ''}"
              </span>
            )}
          </div>
        ))
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
            <li>Open Testing Project and TesterAlly in separate browsers for better results.</li>
            <li>Manually complete the previous step.</li>
            <li>After clicking the camera, manually open your test page. If not opened.</li>
            <li>Wait a few seconds for the system to respond.</li>
            <li>Ensure the element is fully visible on the screen.</li>  
          </ul>
        </div>
      </div>
    );
  };

  const renderStepActions = (step) => {
    if (isExecuting || executionResults[step.id]) {
      return null;
    }
  
    const hasCapture = !!capturedSteps[step.id];
    const originalCaptureId = originalCaptureIds[step.id];
    const isOriginalCapture = !originalCaptureId || originalCaptureId === step.id;
  
    return (
      <>
        {hoveredStep === step.id && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
            
            {/* Show Camera icon only before original capture */}
            {(!hasCapture || !isOriginalCapture) && (
              <button
                onClick={() => handleCaptureElement(step.id, step.step_number)}
                className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full transition-colors"
                title="Capture Element"
                disabled={captureLoading[step.id]}
              >
                {captureLoading[step.id] ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera size={16} />
                )}
              </button>
            )}
  
            {/* Show Refresh icon only if original capture exists */}
            {hasCapture && isOriginalCapture && (
              <button
                onClick={() => handleCaptureElement(step.id, step.step_number)}
                className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded-full transition-colors"
                title="Recapture Element"
                disabled={captureLoading[step.id]}
              >
                {captureLoading[step.id] ? (
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

  const BrowserTabsModal = () => {
    if (!showBrowserTabsModal) return null;
    
    const formatTabTitle = (title) => {
      // Extract only the main part of the title, removing the browser name
      const mainTitle = title.split(' - ')[0];
      return mainTitle.length > 30 ? mainTitle.substring(0, 27) + '...' : mainTitle;
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Select Browser Tab</h2>
            <button 
              onClick={() => setShowBrowserTabsModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          {tabsLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Loading browser tabs...</span>
            </div>
          ) : (
            <>
              {browserTabs.length === 0 ? (
                <p className="text-center text-gray-600 py-4">No browser tabs found</p>
              ) : (
                <ul className="space-y-2">
                  {browserTabs.map((tab, index) => (
                    <li 
                      key={index}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-blue-50 transition-colors ${tab.active ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}
                      onClick={() => handleTabSelection(tab)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{formatTabTitle(tab.title)}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {tab.active ? 'Active tab' : 'Inactive tab'} • {tab.width}×{tab.height}
                          </p>
                        </div>
                        {tab.active && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderStepContent = (step) => {
    // Get the original capture ID for this step (if any)
    const originalCaptureId = originalCaptureIds[step.id];
    const isOriginalCapture = !originalCaptureId || originalCaptureId === step.id;
  
    return (
      <>
        {/* Capture loading message */}
        {captureLoading[step.id] && (
          <div className="mt-3 ml-12 text-sm p-3 rounded text-blue-700">
            Capture is loading... Please open your test page.
          </div>
        )}
  
        {/* Screenshot capture notification */}
        {capturedSteps[step.id] && !captureLoading[step.id] && (
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
                      setScreenshotVisible(prev => ({...prev, [step.id]: !prev[step.id]}));
                      setScreenshotDirection(screenshotVisible[step.id] ? 'down' : 'up');
                    }}
                    className="text-green-600 hover:text-green-800 p-1 rounded"
                    title={screenshotVisible[step.id] ? "Hide screenshot" : "Show screenshot"}
                  >
                    {screenshotVisible[step.id] ? (
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
                    onClick={() => handleExpandScreenshot(capturedSteps[step.id].screenshot)}
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
                    onClick={() => handleCaptureElement(step.id, step.step_number)}
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
            {isOriginalCapture && screenshotVisible[step.id] && (
              <div className={`mt-2 flex justify-center transition-all duration-300 ${
                screenshotDirection === 'down' ? 'animate-slideInDown' : 'animate-slideInUp'
              }`}>
                <img 
                  src={capturedSteps[step.id].screenshot}
                  alt="Captured screenshot"
                  className="max-h-64 object-contain border border-gray-200 rounded cursor-pointer"
                  onClick={() => handleExpandScreenshot(capturedSteps[step.id].screenshot)}
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
                {commandSuggestions.map((element, index) => (
                  <div 
                    key={index}
                    onClick={() => handleSuggestionClick(element)}
                    className="p-2 hover:bg-purple-50 cursor-pointer flex items-center gap-2"
                  >
                    <div className={`w-4 h-4 rounded-full ${
                      commandType === 'click' ? 'bg-blue-100' : 
                      commandType === 'type' ? 'bg-green-100' : 
                      commandType === 'verify' ? 'bg-yellow-100' : 'bg-purple-100'
                    }`}></div>
                    <span>{element.name || element.text || element.id || 'Element ' + (index + 1)}</span>
                    {element.text && (
                      <span className="text-xs text-gray-500 truncate max-w-xs">
                        "{element.text.substring(0, 50)}{element.text.length > 50 ? '...' : ''}"
                      </span>
                    )}
                  </div>
                ))}
              </div>
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
                {commandType === 'open' && "Enter the URL to open (e.g., open https://example.com)."}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return {
    capturedSteps,
    renderStepActions,
    renderStepContent,
    ScreenshotModal,
    InstructionsModal,
    BrowserTabsModal,
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
  };

};

export default AddStep;