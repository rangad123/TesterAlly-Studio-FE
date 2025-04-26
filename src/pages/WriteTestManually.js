import React, { useState, useEffect, useRef } from "react";
import { X, Trash2, Plus, Camera, Check, Info } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";

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

  const [commandSuggestions, setCommandSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [commandType, setCommandType] = useState("");
  const [ , setTempStepValue] = useState("");
  const [originalStepValues, setOriginalStepValues] = useState({});
  
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

        let coordinates = { click_x: 0, click_y: 0 };

        if (capturedSteps[stepId]) {
          if (step.selectedElement) {
            // First try to use click_point if available
            if (step.selectedElement.click_point && Array.isArray(step.selectedElement.click_point)) {
              console.log("Using click_point from selected element:", step.selectedElement.click_point);
              coordinates = {
                click_x: step.selectedElement.click_point[0] || 0,
                click_y: step.selectedElement.click_point[1] || 0
              };
            } 
            // Fall back to coordinates array if click_point isn't available
            else if (step.selectedElement.coordinates && Array.isArray(step.selectedElement.coordinates)) {
              console.log("Using coordinates from selected element:", step.selectedElement.coordinates);
              coordinates = {
                click_x: step.selectedElement.coordinates[0] || 0,
                click_y: step.selectedElement.coordinates[1] || 0
              };
            }
          } else if (capturedSteps[stepId].coordinates) {
            console.log("Using coordinates from captured step:", capturedSteps[stepId].coordinates);
            coordinates = capturedSteps[stepId].coordinates;
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
    
    updatedSteps.forEach((step, idx) => {
      step.stepNumber = idx + 1;
    });
    
    setTestSteps(updatedSteps);
    setTempStepValue("");
    setEditingStep(afterIndex !== null ? afterIndex + 1 : updatedSteps.length - 1);
  };

  const handleSaveStep = (index) => {
    if (testSteps[index].choice.trim() === "") {
      alert("Please provide a step description before saving.");
      return;
    }

    const updatedSteps = [...testSteps];
    updatedSteps[index].isSaved = true;
    setTestSteps(updatedSteps);
    setEditingStep(null);
  };

  const handleCancelEdit = (index) => {
    const updatedSteps = [...testSteps];

    if (!updatedSteps[index].isSaved && !originalStepValues[index]) {
      handleDeleteStep(index);
      return;
    }

    if (originalStepValues[index]) {
      updatedSteps[index].choice = originalStepValues[index];
      updatedSteps[index].isSaved = true; 
      setTestSteps(updatedSteps);

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

  const handleDeleteStep = (index) => {
    const updatedSteps = testSteps.filter((_, idx) => idx !== index);
    updatedSteps.forEach((step, idx) => {
      step.stepNumber = idx + 1;
    });
    setTestSteps(updatedSteps);
    setEditingStep(null);
  };

  const handleDoubleClick = (index) => {
    if (testSteps[index].isSaved) {
      setOriginalStepValues(prev => ({
        ...prev,
        [index]: testSteps[index].choice
      }));
      
      const updatedSteps = [...testSteps];
      updatedSteps[index].isSaved = false;
      setTestSteps(updatedSteps);
      setEditingStep(index);
      setTempStepValue(testSteps[index].choice);
    }
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
      alert("Failed to capture element. Please try again.");
    } finally {
      setCaptureLoading(prev => ({ ...prev, [stepId]: false }));
    }
  };


  const handleCommandInputChange = (e, index) => {
    const input = e.target.value;
    const updatedSteps = [...testSteps];
    updatedSteps[index].choice = input;
    setTestSteps(updatedSteps);

    const words = input.trim().split(' ');
    const command = words[0].toLowerCase();
    
    if (['click', 'type', 'verify', 'get'].includes(command)) {
      setCommandType(command);
      const stepId = testSteps[index].id;
      
      if (capturedSteps[stepId]) {
        fetchElementSuggestions(command, input, words, stepId);
        setShowSuggestions(index);
      } else {
        setShowSuggestions(false);
      }
    } else if (['scrollup', 'scrolldown', 'open'].includes(command)) {
      setCommandType(command);
      setShowSuggestions(false);
    } else {
      setCommandType("");
      setShowSuggestions(false);
    }
  };
  
  const fetchElementSuggestions = (command, inputValue, words, stepId) => {
    if (!stepId || !capturedSteps[stepId]) return;
  
    const elements = capturedSteps[stepId]?.elements || [];
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

  const handleSuggestionClick = (suggestion, index) => {
    const updatedSteps = [...testSteps];
    let step = updatedSteps[index];
    let updatedStepValue = '';

    console.log("Selected suggestion:", suggestion);
  console.log("Step ID:", step.id);
  console.log("Captured steps data:", capturedSteps[step.id]);
    
    if (commandType === 'click') {
      updatedStepValue = `click ${suggestion.name || suggestion.text || 'element'}`;
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

    if (suggestion.coordinates) {
      setCapturedSteps(prev => ({
        ...prev,
        [step.id]: {
          ...prev[step.id],
          coordinates: {
            click_x: suggestion.coordinates.x || 0,
            click_y: suggestion.coordinates.y || 0
          }
        }
      }));
    }
    
    console.log("Updated step:", step);

    setTestSteps(updatedSteps);
    setShowSuggestions(false);
    
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

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Write Test Manually</h2>
              <div className="flex items-center gap-3">
                {/* Instructions button moved to top */}
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
              <div 
                key={index}
                className="relative flex items-center gap-4 bg-white p-4 mb-4 rounded-lg border border-gray-200"
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
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      ref={showSuggestions === index ? inputRef : null}
                      type="text"
                      className="w-full border border-gray-300 rounded-md p-2"
                      value={step.choice}
                      onChange={(e) => handleCommandInputChange(e, index)}
                      placeholder="Enter test step description"
                      autoFocus={editingStep === index}
                    />
                  </div>
                )}

                {step.isSaved ? (
                  <div className="flex gap-2">
                    {capturedSteps[step.id] && (
                      <button
                        onClick={() => handleExpandScreenshot(capturedSteps[step.id].screenshot)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                        title="View Screenshot"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Add new step button that inserts after this step */}
                    <button
                      className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100"
                      onClick={() => handleAddStep(index)}
                      title="Add Step After This"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    
                    {/* Delete button */}
                    <button
                      className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                      onClick={() => handleDeleteStep(index)}
                      title="Delete Step"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {/* Save button */}
                    <button
                      className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                      onClick={() => handleSaveStep(index)}
                      title="Save Step"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    
                    {/* Camera button */}
                    <button
                      onClick={() => capturedSteps[step.id] 
                        ? handleExpandScreenshot(capturedSteps[step.id].screenshot)
                        : handleCaptureElement(step.id)
                      }
                      className={`inline-flex items-center px-3 py-1.5 ${capturedSteps[step.id] 
                        ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} 
                        rounded-md transition-colors`}
                      title={capturedSteps[step.id] ? "Show Screenshot" : "Capture Element"}
                      disabled={captureLoading[step.id]}
                    >
                      {captureLoading[step.id] ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        capturedSteps[step.id] ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )
                      )}
                    </button>
                    
                    {/* Cancel button - only shown during edit */}
                    <button
                      className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100"
                      onClick={() => handleCancelEdit(index)}
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* Capture loading message */}
                {captureLoading[step.id] && (
                  <div className="absolute left-0 -bottom-8 w-full text-sm p-2 bg-blue-50 rounded text-blue-700 z-10">
                    Capture is loading... Please open your test page.
                  </div>
                )}
              </div>
            ))}
            
            {/* Element suggestions dropdown */}
            {showSuggestions !== false && commandSuggestions.length > 0 && (
              <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-lg z-20 relative">
                {commandSuggestions.map((element, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleSuggestionClick(element, showSuggestions)}
                    className="p-2 hover:bg-purple-50 cursor-pointer flex items-center gap-2"
                  >
                    <div className={`w-4 h-4 rounded-full ${
                      commandType === 'click' ? 'bg-blue-100' : 
                      commandType === 'type' ? 'bg-green-100' : 
                      commandType === 'verify' ? 'bg-yellow-100' : 'bg-purple-100'
                    }`}></div>
                    <span>{element.name || element.text || element.id || 'Element ' + (idx + 1)}</span>
                    {element.text && (
                      <span className="text-xs text-gray-500 truncate max-w-xs">
                        "{element.text.substring(0, 50)}{element.text.length > 50 ? '...' : ''}"
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {testSteps.length === 0 && (
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
      <ScreenshotModal />
      <InstructionsModal />
    </div>
  );
};

export default WriteTestManually;