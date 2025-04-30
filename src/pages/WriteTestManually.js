import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Camera , RotateCw, Check, Info, Save, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";

const WriteTestManually = () => {

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
  const [minimizedScreenshots, setMinimizedScreenshots] = useState({});

  const [commandSuggestions, setCommandSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [commandType, setCommandType] = useState("");
  const [ , setTempStepValue] = useState("");
  const [originalStepValues, setOriginalStepValues] = useState({});
  const [lastCapturedStepId, setLastCapturedStepId] = useState(null);
  const [originalCaptureIds, setOriginalCaptureIds] = useState({});
  
  const inputRef = useRef(null);

  // Effect to store capturedSteps in sessionStorage
  useEffect(() => {
    if (Object.keys(capturedSteps).length > 0) {
      sessionStorage.setItem('capturedSteps', JSON.stringify(capturedSteps));
      // Update available captured step IDs
      setAvailableCapturedStepIds(Object.keys(capturedSteps));
    }
  }, [capturedSteps]);

  // Effect to load capturedSteps from sessionStorage on component mount
  useEffect(() => {
    const storedSteps = sessionStorage.getItem('capturedSteps');
    if (storedSteps) {
      try {
        const parsedSteps = JSON.parse(storedSteps);
        setCapturedSteps(parsedSteps);
        // Set available captured step IDs
        setAvailableCapturedStepIds(Object.keys(parsedSteps));
        // Set last captured step ID to the most recent one
        if (Object.keys(parsedSteps).length > 0) {
          setLastCapturedStepId(Object.keys(parsedSteps)[Object.keys(parsedSteps).length - 1]);
        }
      } catch (error) {
        console.error("Error parsing stored steps:", error);
      }
    }
  }, []);

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
          
          let coordinates = { click_x: 0, click_y: 0 };

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
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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
    setCommandSuggestions([]);

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
    setCommandSuggestions([]);
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
    setCommandSuggestions([]);
    
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

  const handleCaptureElement = async (stepId) => {
    setCaptureLoading(prev => ({ ...prev, [stepId]: true }));
    
    try {
      const user_id = localStorage.getItem("userId");
  
      const requestBody = {
        user_id: user_id,
      };
      
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
  
      // Fix for coordinates - ensure they're properly formatted
      const coordinates = {
        click_x: data.coordinates?.x || data.coordinates?.click_x || 0,
        click_y: data.coordinates?.y || data.coordinates?.click_y || 0
      };
  
      const capturedData = {
        coordinates: coordinates,
        screenshot: data.screenshot ? `http://127.0.0.1:8000${data.screenshot}` : null,
        timestamp: new Date().toISOString(),
        elements: data.omniparser_data?.elements || []
      };
  
      // Mark this step as the original capturer of this screenshot
      setOriginalCaptureIds(prev => ({
        ...prev, 
        [stepId]: stepId // This step captured its own screenshot
      }));
  
      // Store in both state and session storage
      setCapturedSteps(prev => ({
        ...prev,
        [stepId]: capturedData
      }));
  
      // Store in session storage with original capture info
      storeInSessionStorage(stepId, {
        ...capturedData,
        originalCaptureId: stepId
      });
  
      setLastCapturedStepId(stepId);
      setAvailableCapturedStepIds(prev => [...prev, stepId]);
      
    } catch (error) {
      alert("Failed to capture element. Please try again.");
    } finally {
      setCaptureLoading(prev => ({ ...prev, [stepId]: false }));
    }
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
      setCommandSuggestions([]);
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
    let filtered = [];
  
    // Process the elements and ensure coordinates are available
    if (command === "click") {
      filtered = elements.filter(el => el.interactivity === true && el.type === "icon")
        .map(el => {
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
      filtered = elements.filter(el => el.type === "text" || el.type === "icon")
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
  
    if (commandType === 'click') {
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
    
    // Update the step's choice and selectedElement
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
                  disabled={isLoading}
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
                      {showSuggestions === index && commandSuggestions.length > 0 && (
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
    </div>
  );
};

export default WriteTestManually;