import React, { useState, useEffect, useRef } from "react";
import { X, Camera, Check } from 'lucide-react';

const StepEditor = ({
  step,
  index,
  capturedSteps,
  setCapturedSteps,
  captureLoading,
  testSteps,
  setTestSteps,
  lastCapturedStepId,
  handleSaveStep,
  handleCancelEdit,
  handleCaptureElement,
  getDataFromSession,
  saveCoordinatesToSession
}) => {
  const [commandSuggestions, setCommandSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [commandType, setCommandType] = useState("");
  const inputRef = useRef(null);

  const fetchElementSuggestions = (command, inputValue, words) => {
    const stepId = step.id;
    
    // First try to use the current step's captured data
    let elementData = null;
    
    // If this step has captured data, use it
    if (capturedSteps[stepId] && capturedSteps[stepId].elements) {
      console.log("Using captured data for this step:", capturedSteps[stepId]);
      elementData = capturedSteps[stepId];
    } 
    // Otherwise, use the last captured step's data if available
    else if (lastCapturedStepId && capturedSteps[lastCapturedStepId] && capturedSteps[lastCapturedStepId].elements) {
      console.log("Using data from last captured step:", capturedSteps[lastCapturedStepId]);
      elementData = capturedSteps[lastCapturedStepId];
    }
    
    if (!elementData || !elementData.elements) {
      console.log("No element data available");
      setCommandSuggestions([]);
      return;
    }
    
    const elements = elementData.elements;
    console.log("Available elements:", elements);

    let filtered = [];

    if (command === "click") {
      filtered = elements.filter(el => el.interactivity === true);
      if (words.length > 1) {
        const searchTerm = inputValue.substring(command.length).trim().toLowerCase();
        if (searchTerm) {
          filtered = filtered.filter(el => 
            (el.name && el.name.toLowerCase().includes(searchTerm)) || 
            (el.text && el.text.toLowerCase().includes(searchTerm))
          );
        }
      }
    } else if (command === "type") {
      filtered = elements.filter(el => el.type === "text");

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
    } else if (command === "verify") {
      // For "verify" we might want all elements with text
      filtered = elements.filter(el => el.text && el.text.trim() !== "");
      
      if (words.length > 1) {
        const searchTerm = inputValue.substring(command.length).trim().toLowerCase();
        if (searchTerm) {
          filtered = filtered.filter(el => 
            (el.text && el.text.toLowerCase().includes(searchTerm))
          );
        }
      }
    } else if (command === "get") {
      // For "get" we might want all elements with attributes
      filtered = elements;
      
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

    // Sort by relevance (elements with matching text first)
    filtered.sort((a, b) => {
      // If both have text, compare them
      if (a.text && b.text) {
        return a.text.localeCompare(b.text);
      }
      // If only one has text, prioritize it
      if (a.text) return -1;
      if (b.text) return 1;
      // Otherwise use name
      if (a.name && b.name) {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    // Limit suggestions to prevent overwhelming UI
    filtered = filtered.slice(0, 5);
    setCommandSuggestions(filtered);
  };

  const loadCoordinatesData = () => {
    const stepId = step.id;
    
    // First check if we have coordinates in the step's selectedElement
    if (step.selectedElement) {
      const element = step.selectedElement;
      
      // Create explicit coordinates object from the selected element
      let coords = {};
      
      // First check click_point
      if (element.click_point && Array.isArray(element.click_point) && element.click_point.length >= 2) {
        coords = {
          click_x: element.click_point[0],
          click_y: element.click_point[1]
        };
        console.log("Using click_point coordinates:", coords);
      } 
      // Then try coordinates array
      else if (element.coordinates && Array.isArray(element.coordinates) && element.coordinates.length >= 2) {
        coords = {
          click_x: element.coordinates[0],
          click_y: element.coordinates[1]
        };
        console.log("Using array coordinates:", coords);
      }
      
      // If we have coordinates, ensure they're properly stored
      if (coords.click_x !== undefined && coords.click_y !== undefined) {
        // Update captured steps with explicit coordinates
        setCapturedSteps(prev => ({
          ...prev,
          [stepId]: {
            ...(prev[stepId] || {}),
            coordinates: coords,
            selectedElement: element
          }
        }));
        
        // Also update session storage right away
        const existingData = getDataFromSession(stepId) || {};
        saveCoordinatesToSession(stepId, {
          ...existingData,
          coordinates: coords,
          selectedElement: element
        });
      }
    }
    
    // Check if we need to load session data
    if (!capturedSteps[stepId]) {
      const sessionData = getDataFromSession(stepId);
      if (sessionData) {
        console.log("Loaded data from session storage:", sessionData);
        
        // Ensure coordinates are in correct format
        let storedCoords = sessionData.coordinates || {};
        if (typeof storedCoords.click_x === 'undefined' || typeof storedCoords.click_y === 'undefined') {
          // Try to extract from selectedElement if available
          if (sessionData.selectedElement) {
            const element = sessionData.selectedElement;
            if (element.click_point && Array.isArray(element.click_point)) {
              storedCoords = {
                click_x: element.click_point[0],
                click_y: element.click_point[1]
              };
            } else if (element.coordinates && Array.isArray(element.coordinates)) {
              storedCoords = {
                click_x: element.coordinates[0],
                click_y: element.coordinates[1]
              };
            }
          }
          
          // Ensure we have something
          if (typeof storedCoords.click_x === 'undefined') {
            storedCoords.click_x = 0;
          }
          if (typeof storedCoords.click_y === 'undefined') {
            storedCoords.click_y = 0;
          }
          
          // Update sessionData
          sessionData.coordinates = storedCoords;
          saveCoordinatesToSession(stepId, sessionData);
        }
        
        setCapturedSteps(prev => ({
          ...prev,
          [stepId]: sessionData
        }));
      }
    }
  };

  // Store original value when component mounts for cancellation
  useEffect(() => {
    // Save original value for cancellation
    if (step.isSaved && !step.originalValue) {
      const updatedSteps = [...testSteps];
      updatedSteps[index].originalValue = step.choice;
      setTestSteps(updatedSteps);
    }
    
    // Load any existing coordinates data
    loadCoordinatesData();
    
    // Try to show suggestions based on initial input
    const input = step.choice;
    const words = input.trim().split(' ');
    const command = words[0].toLowerCase();
    
    if (['click', 'type', 'verify', 'get'].includes(command)) {
      setCommandType(command);
      fetchElementSuggestions(command, input, words);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleCommandInputChange = (e) => {
    const input = e.target.value;
    const updatedSteps = [...testSteps];
    updatedSteps[index].choice = input;
    setTestSteps(updatedSteps);

    const words = input.trim().split(' ');
    const command = words[0].toLowerCase();
    
    if (['click', 'type', 'verify', 'get'].includes(command)) {
      setCommandType(command);
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

  const handleSelectSuggestion = (element) => {
    const stepId = step.id;
    let newCommand = "";
    
    if (commandType === "click") {
      newCommand = `click ${element.text || element.name || "element"}`;
    } else if (commandType === "type") {
      newCommand = `type "your text" in ${element.name || element.text || "input field"}`;
    } else if (commandType === "verify") {
      newCommand = `verify "${element.text || "element exists"}"`;
    } else if (commandType === "get") {
      newCommand = `get ${element.name || element.text || "element property"}`;
    }
    
    // Update step with selected element
    const updatedSteps = [...testSteps];
    updatedSteps[index].choice = newCommand;
    updatedSteps[index].selectedElement = element;
    setTestSteps(updatedSteps);
    
    // Update captured data with this element
    if (capturedSteps[stepId]) {
      const updatedData = {
        ...capturedSteps[stepId],
        selectedElement: element
      };
      
      // Make sure we have valid coordinates
      if (!updatedData.coordinates || typeof updatedData.coordinates.click_x === 'undefined') {
        if (element.click_point && Array.isArray(element.click_point)) {
          updatedData.coordinates = {
            click_x: element.click_point[0],
            click_y: element.click_point[1]
          };
        } else if (element.coordinates && Array.isArray(element.coordinates)) {
          updatedData.coordinates = {
            click_x: element.coordinates[0],
            click_y: element.coordinates[1]
          };
        } else {
          updatedData.coordinates = { click_x: 0, click_y: 0 };
        }
      }
      
      // Update state and session storage
      setCapturedSteps(prev => ({
        ...prev,
        [stepId]: updatedData
      }));
      
      saveCoordinatesToSession(stepId, updatedData);
    }
    
    setShowSuggestions(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <span className="font-medium min-w-[60px]">#{step.stepNumber}</span>
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={step.choice}
            onChange={handleCommandInputChange}
            placeholder="Enter step (e.g., click button, type text in field, verify text)"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            autoFocus
          />
          
          {/* Command suggestions */}
          {showSuggestions && commandSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {commandSuggestions.map((element, idx) => (
                <div 
                  key={idx}
                  className="p-2 hover:bg-purple-50 cursor-pointer border-b border-gray-100"
                  onClick={() => handleSelectSuggestion(element)}
                >
                  <div className="font-medium text-purple-700">
                    {element.text || element.name || "Element"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {element.type} {element.name ? `- ${element.name}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => handleCaptureElement(step.id)}
            disabled={captureLoading[step.id]}
            className={`inline-flex items-center px-3 py-2 ${
              captureLoading[step.id] 
                ? "bg-gray-100 text-gray-400" 
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            } rounded-md`}
            title="Capture Element"
          >
            <Camera className="w-4 h-4 mr-1" />
            {captureLoading[step.id] ? "Capturing..." : "Capture"}
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleCancelEdit(index)}
            className="inline-flex items-center px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </button>
          
          <button
            onClick={() => handleSaveStep(index)}
            className="inline-flex items-center px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
          >
            <Check className="w-4 h-4 mr-1" />
            Save
          </button>
        </div>
      </div>
      
      {/* Display coordinates if available */}
      {capturedSteps[step.id] && capturedSteps[step.id].coordinates && (
        <div className="mt-3 text-xs text-gray-500">
          Coordinates: X: {capturedSteps[step.id].coordinates.click_x}, 
          Y: {capturedSteps[step.id].coordinates.click_y}
        </div>
      )}
    </div>
  );
};

export default StepEditor;


/*


import React, { useState, useEffect } from "react";
import { Plus, Info } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";
import StepEditor from "./StepEditor";

const WriteTestManually = () => {
  const [testSteps, setTestSteps] = useState([]);
  const [testCaseInfo, setTestCaseInfo] = useState({
    name: '',
    type: '',
    priority: ''
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  
  const [capturedSteps, setCapturedSteps] = useState({});
  const [captureLoading, setCaptureLoading] = useState({});
  const [expandedScreenshot, setExpandedScreenshot] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [lastCapturedStepId, setLastCapturedStepId] = useState(null);

  // Load saved data from session storage
  const saveCoordinatesToSession = (stepId, data) => {
    if (!stepId) return;
    
    // Ensure we have valid coordinate data
    if (data && !data.coordinates) {
      data.coordinates = { click_x: 0, click_y: 0 };
    }
    
    console.log(`Saving to session for step ${stepId}:`, data);
    sessionStorage.setItem(`step_data_${stepId}`, JSON.stringify(data));
  };

  const getDataFromSession = (stepId) => {
    if (!stepId) return null;
    
    const stored = sessionStorage.getItem(`step_data_${stepId}`);
    return stored ? JSON.parse(stored) : null;
  };

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

  useEffect(() => {
    const info = location.state?.testCaseInfo;
  
    if (!info || !info.name || !info.testcase_type || !info.testcase_priority) {
      alert("Test case data is incomplete or missing.");
      navigate("/test-cases/create-testcases");
      return;
    }
  
    setTestCaseInfo(info);
  }, [location, navigate]);

  useEffect(() => {
    const storedLastCapturedStep = sessionStorage.getItem('lastCapturedStepId');
    if (storedLastCapturedStep) {
      setLastCapturedStepId(storedLastCapturedStep);
    }
  }, []);
  
  useEffect(() => {
    // Load session data for any steps
    const loadedStepsData = {};
    
    testSteps.forEach(step => {
      const sessionData = getDataFromSession(step.id);
      if (sessionData) {
        loadedStepsData[step.id] = sessionData;
        
        // If this step already has selected element from storage, update the step
        if (sessionData.selectedElement && !step.selectedElement) {
          const updatedSteps = [...testSteps];
          const stepIndex = updatedSteps.findIndex(s => s.id === step.id);
          if (stepIndex !== -1) {
            updatedSteps[stepIndex].selectedElement = sessionData.selectedElement;
            setTestSteps(updatedSteps);
          }
        }
      }
    });
    
    // Merge with current captured steps
    if (Object.keys(loadedStepsData).length > 0) {
      setCapturedSteps(prev => ({...prev, ...loadedStepsData}));
    }
  }, [testSteps]);

  const handleCreateTestCase = async () => {
    setIsLoading(true);

    try {
      const testCaseResponse = await fetch("http://127.0.0.1:8000/api/testcases/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: testCaseInfo.projectId,
          name: testCaseInfo.name,
          testcase_type: testCaseInfo.testcase_type,
          testcase_priority: testCaseInfo.testcase_priority
        })
      });

      if (!testCaseResponse.ok) {
        throw new Error("Failed to create test case");
      }

      const testCaseData = await testCaseResponse.json();
      const testCaseId = testCaseData.id;

      const stepPromises = testSteps
        .filter(step => step.isSelected && step.isSaved)
        .map(async (step, index) => {
          
        const stepId = step.id;
        console.log("Processing step:", step);
        console.log("Step ID:", stepId);
        console.log("Available captured steps:", capturedSteps);
        console.log("Captured data for this step:", capturedSteps[stepId]);

        // First check in-memory state
        let coordinates = { click_x: 0, click_y: 0 };
        let coordinatesFound = false;

        // Check if we have the step in memory
        if (capturedSteps[stepId]) {
          if (step.selectedElement) {
            // First try to use click_point if available
            if (step.selectedElement.click_point && Array.isArray(step.selectedElement.click_point)) {
              console.log("Using click_point from selected element:", step.selectedElement.click_point);
              coordinates = {
                click_x: step.selectedElement.click_point[0] || 0,
                click_y: step.selectedElement.click_point[1] || 0
              };
              coordinatesFound = true;
            } 
            // Fall back to coordinates array if click_point isn't available
            else if (step.selectedElement.coordinates && Array.isArray(step.selectedElement.coordinates)) {
              console.log("Using coordinates from selected element:", step.selectedElement.coordinates);
              coordinates = {
                click_x: step.selectedElement.coordinates[0] || 0,
                click_y: step.selectedElement.coordinates[1] || 0
              };
              coordinatesFound = true;
            }
          } else if (capturedSteps[stepId].coordinates) {
            console.log("Using coordinates from captured step:", capturedSteps[stepId].coordinates);
            coordinates = capturedSteps[stepId].coordinates;
            coordinatesFound = true;
          }
        }

        // If not found in memory, try session storage
        if (!coordinatesFound) {
          const sessionData = getDataFromSession(stepId);
          if (sessionData && sessionData.coordinates) {
            console.log("Using coordinates from session storage:", sessionData.coordinates);
            coordinates = sessionData.coordinates;
            coordinatesFound = true;
          }
        }

        console.log("Final coordinates being sent:", coordinates);
          
          const stepResponse = await fetch("http://127.0.0.1:8000/api/teststeps/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              testcase: testCaseId,
              step_number: index + 1,
              step_description: step.choice,
              step_coordinates: coordinates,
              teststep_result: "not_executed"
            })
          });

          if (!stepResponse.ok) {
            throw new Error(`Failed to create step ${index + 1}`);
          }

          return stepResponse.json();
        });

      await Promise.all(stepPromises);
      alert("Test Case and Steps Created Successfully");
      navigate("/test-cases");
    } catch (error) {
      console.error("Error creating test case and steps:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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
    
    // Set this new step as the one being edited
    const newEditingIndex = afterIndex !== null ? afterIndex + 1 : updatedSteps.length - 1;
    setEditingStep(newEditingIndex);
  };

  const handleCaptureElement = async (stepId) => {
    setCaptureLoading(prev => ({ ...prev, [stepId]: true }));
    
    try {
      const user_id = localStorage.getItem("userId");
  
      const requestBody = {
        user_id: user_id,
      };
  
      console.log("Request body for /insert_screen/:", requestBody);
      
      const response = await fetch('http://127.0.0.1:8000/automation/insert_screen/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        throw new Error('Failed to capture element');
      }
  
      const data = await response.json();
      console.log("Capture response:", data);

      // Ensure coordinates are in the correct format
      const coordinatesData = data.coordinates || {};
      // Make sure we have default coordinates even if the API returns empty
      if (Object.keys(coordinatesData).length === 0) {
        coordinatesData.click_x = 0;
        coordinatesData.click_y = 0;
      }
      
      // Store capture data
      const captureData = {
        coordinates: coordinatesData,
        screenshot: data.screenshot ? `http://127.0.0.1:8000${data.screenshot}` : null,
        timestamp: new Date().toISOString(),
        elements: data.omniparser_data?.elements || []
      };
      
      console.log("Storing capture data with coordinates:", captureData.coordinates);
      
      // Update state
      setCapturedSteps(prev => ({
        ...prev,
        [stepId]: captureData
      }));
      
      // Save to session storage
      saveCoordinatesToSession(stepId, captureData);
      
      // Update lastCapturedStepId in both state and session storage
      setLastCapturedStepId(stepId);
      sessionStorage.setItem('lastCapturedStepId', stepId);
  
    } catch (error) {
      console.error('Element capture error:', error);
      alert("Failed to capture element. Please try again.");
    } finally {
      setCaptureLoading(prev => ({ ...prev, [stepId]: false }));
    }
  };

  const handleDeleteStep = (index) => {
    const stepId = testSteps[index].id;
    
    // Remove from session storage first
    sessionStorage.removeItem(`step_data_${stepId}`);
    
    const updatedSteps = testSteps.filter((_, idx) => idx !== index);
    
    // Renumber steps
    updatedSteps.forEach((step, idx) => {
      step.stepNumber = idx + 1;
    });
    
    setTestSteps(updatedSteps);
    setEditingStep(null);
    
    // Also update the captured steps state
    setCapturedSteps(prev => {
      const newCaptured = {...prev};
      delete newCaptured[stepId];
      return newCaptured;
    });
  };

  const handleDoubleClick = (index) => {
    if (testSteps[index].isSaved) {
      // Cancel any existing editing first
      if (editingStep !== null && editingStep !== index) {
        handleCancelEdit(editingStep);
      }
      
      const updatedSteps = [...testSteps];
      updatedSteps[index].isSaved = false;
      setTestSteps(updatedSteps);
      setEditingStep(index);
    }
  };

  const handleCancelEdit = (index) => {
    if (index === null || index >= testSteps.length) return;
    
    const updatedSteps = [...testSteps];

    // If it's a new step with no saved data, delete it
    if (!updatedSteps[index].isSaved && !updatedSteps[index].originalValue) {
      handleDeleteStep(index);
      return;
    }

    // If it's an edited existing step, restore original value
    if (updatedSteps[index].originalValue) {
      updatedSteps[index].choice = updatedSteps[index].originalValue;
      updatedSteps[index].isSaved = true;
      // Remove the temporary original value field
      delete updatedSteps[index].originalValue;
      setTestSteps(updatedSteps);
    }
    
    setEditingStep(null);
  };

  const handleSaveStep = (index) => {
    if (!testSteps[index] || testSteps[index].choice.trim() === "") {
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
    delete updatedSteps[index].originalValue;
    
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
            X
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

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Write Test Manually</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="inline-flex items-center px-3 py-2 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100"
                  title="Instructions"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  onClick={handleCreateTestCase}
                >
                  {isLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>

            {testSteps.map((step, index) => (
              <div key={index} className="relative mb-6">
                {editingStep === index ? (
                  <StepEditor 
                    step={step}
                    index={index}
                    capturedSteps={capturedSteps}
                    setCapturedSteps={setCapturedSteps}
                    captureLoading={captureLoading}
                    testSteps={testSteps}
                    setTestSteps={setTestSteps}
                    lastCapturedStepId={lastCapturedStepId}
                    handleSaveStep={handleSaveStep}
                    handleCancelEdit={handleCancelEdit}
                    handleCaptureElement={handleCaptureElement}
                    getDataFromSession={getDataFromSession}
                    saveCoordinatesToSession={saveCoordinatesToSession}
                  />
                ) : (
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
                    
                    <div className="flex-1 text-gray-700 break-words whitespace-pre-wrap overflow-hidden">
                      {step.choice}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                        onClick={() => handleDeleteStep(index)}
                        title="Delete Step"
                      >
                        X
                      </button>
                    </div>
                  </div>
                )}
                
                {capturedSteps[step.id] && capturedSteps[step.id].screenshot && (
                  <div className="mt-2 w-full flex justify-center">
                    <div className="max-w-md w-full">
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Screenshot</span>
                          <div className="flex gap-2">
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                              ✓ Captured
                            </span>
                          </div>
                        </div>
                        <img 
                          src={capturedSteps[step.id].screenshot} 
                          alt={`Screenshot for step ${step.stepNumber}`}
                          className="w-full h-auto max-h-40 object-cover cursor-pointer"
                          onClick={() => setExpandedScreenshot(capturedSteps[step.id].screenshot)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

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
              X
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
    </div>
  );
};

export default WriteTestManually;


*/