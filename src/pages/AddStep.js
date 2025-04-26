import React, { useState, useRef } from "react";
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
  
  const inputRef = useRef(null);

  const handleCaptureElement = async (stepId, stepNumber) => {
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

      setCapturedSteps(prev => ({
        ...prev,
        [stepId]: {
          coordinates: data.coordinates || {},
          screenshot: data.screenshot ? `http://127.0.0.1:8000${data.screenshot}` : null,
          timestamp: new Date().toISOString(),
          elements: data.omniparser_data?.elements || []
        }
      }));
      
  
    } catch (error) {
      console.error('Element capture error:', error);
      setError("Failed to capture element. Please try again.");
    } finally {
      setCaptureLoading(prev => ({ ...prev, [stepId]: false }));
    }
  }

  const handleInsertStep = async (afterStepNumber) => {
    if (!newInsertedStepValue.trim()) {
      setError("Step description cannot be empty");
      return;
    }
    setInsertingLoading(true);
    
    try {
      const newStepNumber = afterStepNumber + 1;
      
      const parentStepId = steps.find(s => s.step_number === afterStepNumber)?.id;

      let coordinates = { click_x: 0, click_y: 0 };

        if (selectedElement && selectedElement.click_point && Array.isArray(selectedElement.click_point) &&
            selectedElement.click_point.length >= 2) {
        coordinates = {
            click_x: selectedElement.click_point[0],
            click_y: selectedElement.click_point[1]
        };
        } else if (Array.isArray(selectedElement.coordinates) && selectedElement.coordinates.length >= 2) {
        coordinates = {
            click_x: selectedElement.coordinates[0],
            click_y: selectedElement.coordinates[1]
        };
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
      
      setCapturedSteps(prev => {
        const newState = {...prev};
        delete newState[parentStepId];
        return newState;
      });

    } catch (err) {
      setError("Failed to insert step. Please try again.");
      console.error("Error inserting step:", err);
    } finally {
      setInsertingLoading(false);
    }
  };


  const handleCommandInputChange = (e) => {
    const input = e.target.value;
    setNewInsertedStepValue(input);

    const words = input.trim().split(' ');
    const command = words[0].toLowerCase();
    
    if (['click', 'type', 'verify', 'get'].includes(command)) {
      setCommandType(command);
      
      if (insertingAfterStep !== null) {
        fetchElementSuggestions(command, input, words);
        setShowSuggestions(true);
      }
    } else if (['scrollup', 'scrolldown', 'open'].includes(command)) {

      setCommandType(command);
      setShowSuggestions(false);
    } else {
      setCommandType("");
      setShowSuggestions(false);
    }
  };
  
  const fetchElementSuggestions = (command, inputValue, words) => {
    if (!insertingAfterStep) return;
  
    const parentStepId = steps.find(s => s.step_number === insertingAfterStep)?.id;
    const elements = capturedSteps[parentStepId]?.elements || [];
    
    console.log("Available elements:", elements);
    console.log("Current command:", command);
  
    let filtered = [];

    if (command === "click") {
      filtered = elements.filter(el => el.interactivity === true);
    } else if (command === "type") {
      filtered = elements.filter(el => el.type === "icon" || el.type === "textarea");
    } else if (command === "verify") {
      filtered = elements.filter(el => el.type === "text" || el.type === "textarea" || el.text);
    } else if (command === "get") {
      filtered = elements.filter(el => el.text || el.type === "text" || el.type === "textarea");
    }
    
    if (words.length > 1) {
      const searchTerm = inputValue.substring(command.length).trim().toLowerCase();
      if (searchTerm) {
        filtered = filtered.filter(el => 
          (el.name && el.name.toLowerCase().includes(searchTerm)) || 
          (el.text && el.text.toLowerCase().includes(searchTerm))
        );
      }
    }
    
    filtered = filtered.slice(0, 20);
    
    if (filtered.length === 0 && elements.length > 0) {
      filtered = elements
        .filter(el => el.interactivity === true)
        .slice(0, 5);
    }
    
    console.log("Filtered elements:", filtered);
    setCommandSuggestions(filtered);
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
            <li>Please execute the previous step manually.</li>
            <li>After clicking the camera, manually open your test page.</li>
            <li>Please wait a few seconds for the system to respond.</li>
            <li>Make sure the element is fully visible on screen.</li>
          </ul>
        </div>
      </div>
    );
  };

const renderStepActions = (step) => {
  if (isExecuting || executionResults[step.id]) {
    return null;
  }

  return (
    <>
      {hoveredStep === step.id && (
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
          {/* Camera Button - Show different states based on capture */}
          <button
            onClick={() => capturedSteps[step.id] 
              ? handleExpandScreenshot(capturedSteps[step.id].screenshot)
              : handleCaptureElement(step.id, step.step_number)
            }
            onDoubleClick={() => capturedSteps[step.id] && handleExpandScreenshot(capturedSteps[step.id].screenshot)}
            className={`p-1.5 ${capturedSteps[step.id] 
              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'} 
              rounded-full transition-colors`}
            title={capturedSteps[step.id] ? "Screenshot captured" : "Capture Element"}
            disabled={captureLoading[step.id]}
          >
            {captureLoading[step.id] ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              capturedSteps[step.id] ? (
                <Check size={16} />
              ) : (
                <Camera size={16} />
              )
            )}
          </button>

          {/* Note Button */}
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

  const renderStepContent = (step) => {
    return (
      <>
        {/* Capture loading message */}
        {captureLoading[step.id] && (
          <div className="mt-3 ml-12 text-sm p-3 rounded text-blue-700">
            Capture is loading... Please open your test page.
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
    handleExpandScreenshot,
    showNoteModal,
    expandedScreenshot,
    error,
    setInsertingAfterStep,
    insertingAfterStep
  };
};

export default AddStep;