import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Plus, Clock, X, Loader } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";
import { getSuggestedElements } from './elementSuggestionUtils';


const WriteTestManually = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [testSteps, setTestSteps] = useState([]);
  const [newStep, setNewStep] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [elementData, setElementData] = useState(null);
  const [testCaseInfo, setTestCaseInfo] = useState({
    name: '',
    testcase_type: '',
    testcase_priority: '',
    projectId: ''
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [commandType, setCommandType] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [createTestCaseLoading, setCreateTestCaseLoading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [previouslySelectedElements, setPreviouslySelectedElements] = useState({});
  const [lastClickCoordinates, setLastClickCoordinates] = useState(null);
  
  const previewRef = useRef(null);
  const stepsRef = useRef(null);
  const inputRef = useRef(null);

  const user_id = localStorage.getItem("user_id");

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
    
    if (info && info.name && info.testcase_type && info.testcase_priority) {
      setTestCaseInfo(info);
      if (info.projectId) {
        fetchTestData(info.projectId);
      }
    } else {
      setTestCaseInfo({
        name: 'New Test Case',
        testcase_type: 'Functional',
        testcase_priority: 'Medium',
        projectId: ''
      });
    }
  }, [location]);

  useEffect(() => {
    if (elementData) {
      sessionStorage.setItem('latestElementData', JSON.stringify(elementData));
    }
  }, [elementData]);

  useEffect(() => {
    const storedData = sessionStorage.getItem('latestElementData');
    if (storedData) {
      try {
        setElementData(JSON.parse(storedData));
      } catch (error) {
        console.error('Error parsing stored element data:', error);
      }
    }
  }, []);


  useEffect(() => {
    if (!newStep) {
        setShowSuggestions(false);
        return;
    }

    const inputText = newStep.trim().toLowerCase();
    const words = inputText.split(' ');
    const firstWord = words[0];
    
    // Check if the command is a click or type command
    if (['click', 'type'].includes(firstWord)) {
        setCommandType(firstWord);
        
        if (!elementData || !elementData.elements || elementData.elements.length === 0) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        
        let searchTerm = '';
        
        // Extract search term based on command type
        if (firstWord === 'click' && words.length > 1) {
            // For click commands, everything after "click" is the search term
            searchTerm = words.slice(1).join(' ').toLowerCase();
        } else if (firstWord === 'type') {
            // For type commands, extract what comes after "in "
            const inIndex = inputText.indexOf(' in ');
            if (inIndex !== -1) {
                searchTerm = inputText.substring(inIndex + 4).trim();
            }
        }
        
        // Get last click coordinates from executed steps
        const lastClickCoordinates = testSteps.length > 0 ? 
            getLastClickCoordinates(testSteps) : null;
        
        // Use our enhanced algorithm to get suggestions with proper state
        const suggestedElements = getSuggestedElements(
            elementData.elements,
            searchTerm,
            firstWord,
            { 
                previouslySelectedElements, 
                lastClickCoordinates 
            }
        );
        
        setSuggestions(suggestedElements);
        setShowSuggestions(suggestedElements.length > 0);
    } else if (firstWord === 'open' || (words.includes('go') && words.includes('to'))) { 
        setCommandType('open');
        setShowSuggestions(false);
    } else {
        setCommandType('');
        setShowSuggestions(false);
    }
}, [newStep, elementData, previouslySelectedElements, testSteps]);


const getLastClickCoordinates = (steps) => {
  // Loop backwards through steps to find the last successful click action
  for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i];
      if (step.status === 'complete' && 
          step.description.toLowerCase().startsWith('click') && 
          step.selectedElement && 
          step.selectedElement.click_point) {
          return step.selectedElement.click_point;
      }
  }
  return null;
};

  const fetchTestData = async (projectId) => {
    if (!projectId) return;
  
    try {
      setLoadingMessage('Fetching test data...');
      const response = await fetch(`http://127.0.0.1:8000/api/testdata/${projectId}/`);
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          setNewStep(`open ${data.url}`);
        }
      }
    } catch (error) {
      console.error("Error fetching test data:", error);
    } finally {
      setLoadingMessage('');
    }
  };

const executeStep = async (stepObj) => {
  setIsProcessing(true);

  try {
      const stepDescription = stepObj.description;
      const words = stepDescription.trim().split(' ');
      
      const actionType = words[0].toLowerCase();
      words[0] = actionType;

      const updatedStepDescription = words.join(' ');
  
      console.log("Updated Step Description:", updatedStepDescription); 
  
    
      const stepIndex = testSteps.length;
      if (actionType === 'open' || stepDescription.toLowerCase().includes('go to ')) {
          setLoadingMessage(`Step ${stepIndex + 1}: Opening page, please wait...`);
      } else if (actionType === 'click') {
          setLoadingMessage(`Step ${stepIndex + 1}: Executing click, please wait...`);
      } else if (actionType === 'type') {
          setLoadingMessage(`Step ${stepIndex + 1}: Typing text, please wait...`);
      } else {
          setLoadingMessage(`Step ${stepIndex + 1}: Executing command, please wait...`);
      }

      if (actionType === 'open' || stepDescription.toLowerCase().includes('go to ')) {
          const response = await fetch('http://127.0.0.1:8000/automation/handle_command/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ command: updatedStepDescription, user_id: user_id }), 
          });

          console.log("Open URL:", updatedStepDescription);
          console.log("User_Id:", user_id);

          if (!response.ok) {
              throw new Error('Failed to execute navigation command');
          }

          const data = await response.json();
          console.log("Response:", data);

          if (data.omniparser_data && data.omniparser_data.elements) {
              setElementData(data.omniparser_data);
              sessionStorage.setItem('latestElementData', JSON.stringify(data.omniparser_data));
          }

          const screenshotUrl = data.screenshot
              ? `http://127.0.0.1:8000${data.screenshot}`
              : `/api/placeholder/800/300?text=No_Screenshot`;

          console.log("Screenshot URL:", screenshotUrl);
          
          return {
              status: 'complete',
              duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
              message: data.status || "Page loaded successfully",
              screenshot: screenshotUrl,
              coordinates: data.omniparser_data,
          };

      } else if (actionType === 'click' || actionType === 'type') {
          
          const selectedElement = stepObj.selectedElement;
          
          if (!selectedElement) {
              throw new Error(`No element selected for this action. Please select an element from the suggestions.`);
          }

          let requestBody = {
              command: stepDescription, 
              user_id: user_id,
              click_x: selectedElement.click_point[0],
              click_y: selectedElement.click_point[1],
          };

          if (actionType === 'type') {
              const inIndex = stepDescription.toLowerCase().indexOf(' in ');
              if (inIndex !== -1) {
                  const textToType = stepDescription.substring(5, inIndex);
                  requestBody.input_text = textToType;
              }
          }

          console.log(`Sending coordinates for ${actionType} step:`, {
              click_x: selectedElement.click_point[0],
              click_y: selectedElement.click_point[1],
              requestBody
          });

          const response = await fetch('http://127.0.0.1:8000/automation/handle_command/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
          });

          console.log(actionType, stepDescription, selectedElement.click_point);

          if (!response.ok) {
              throw new Error(`Failed to execute ${actionType} command`);
          }

          const data = await response.json();
          console.log(`${actionType} response:`, data);

          if (data.coordinates && data.coordinates.elements) {
              setElementData(data.coordinates);
              sessionStorage.setItem('latestElementData', JSON.stringify(data.coordinates));
          }

          const screenshotUrl = data.screenshot
              ? `http://127.0.0.1:8000${data.screenshot}`
              : `/api/placeholder/800/300?text=No_Screenshot`;


          return {
              status: 'complete',
              duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
              message: data.message || `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} action executed successfully`,
              screenshot: screenshotUrl,
              coordinates: data.coordinates || elementData,
              elementAction: selectedElement,
              requestBody,
          };
      } else {
          const response = await fetch('http://127.0.0.1:8000/automation/handle_command/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ command: stepDescription }), 
          });

          if (!response.ok) {
              throw new Error('Failed to execute command');
          }

          const data = await response.json();

          if (data.omniparser_data && data.omniparser_data.elements) {
              setElementData(data.omniparser_data);
              sessionStorage.setItem('latestElementData', JSON.stringify(data.omniparser_data));
          }

          const screenshotUrl = data.screenshot
              ? `http://127.0.0.1:8000${data.screenshot}`
              : `/api/placeholder/800/300?text=No_Screenshot`;

          return {
              status: 'complete',
              duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
              message: data.status || "Command executed successfully",
              screenshot: screenshotUrl,
              coordinates: data.coordinates,
          };
      }
  } catch (error) {
      console.error('Step execution error:', error);
      return {
          status: 'error',
          duration: '00:00',
          error: error.message
      };
  } finally {
      setIsProcessing(false);
      setLoadingMessage('');
  }
};


const addTestStep = async () => {
  if (!newStep.trim() || isProcessing) return;
  
  setShowSuggestions(false);
  
  const words = newStep.trim().split(' ');
  const actionType = words[0].toLowerCase();
  
  if ((actionType === 'click' || actionType === 'type') && !selectedElement) {
    alert("Please select an element from the suggestions before adding this step.");
    return;
  }
  
  const newStepObj = {
    id: Date.now(),
    description: newStep,
    status: 'pending',
    duration: '00:00',
    screenshot: null,
    selectedElement: selectedElement 
  };
  
  setSelectedElement(null);
  
  setTestSteps(prev => [...prev, newStepObj]);
  setNewStep('');
  
  const executionResult = await executeStep(newStepObj);
  
  // After successful execution, update the previouslySelectedElements
  if (executionResult.status === 'complete' && newStepObj.selectedElement?.click_point) {
    setLastClickCoordinates(newStepObj.selectedElement.click_point);
    const element = newStepObj.selectedElement;

    // Make sure click_point exists before accessing
    if (element.click_point) {
      const x = Math.round(element.click_point[0]);
      const y = Math.round(element.click_point[1]);
      const exactCoordinateKey = `${element.name.toLowerCase()}_${x}_${y}`;
      
      setPreviouslySelectedElements(prev => {
        // Create a new object with all previous elements, but remove lastExecutedElement flag
        const updatedPrev = {};
        Object.keys(prev).forEach(key => {
          updatedPrev[key] = {
            ...prev[key],
            lastExecutedElement: false 
          };
        });
        
        return {
          ...updatedPrev,
          [exactCoordinateKey]: {
            lastSelected: Date.now(),
            count: (prev[exactCoordinateKey]?.count || 0) + 1,
            element: element,
            lastExecutedElement: true,
            coordinates: [x, y] // Store exact coordinates for proximity checking
          }
        };
      });
    }
  }
  
  setTestSteps(prev => prev.map(step => 
    step.id === newStepObj.id ? {
      ...step,
      ...executionResult,
      elementClicked: actionType === 'click' ? newStepObj.selectedElement : undefined
    } : step
  ));
  
  setNewStep('');
  
  setTimeout(() => {
    if (previewRef.current) {
      previewRef.current.scrollTo({
        top: previewRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    if (stepsRef.current) {
      stepsRef.current.scrollTo({
        top: stepsRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, 100);
};


const handleSuggestionClick = (suggestion) => {
  let updatedStep = '';
  if (commandType === 'click') {
    updatedStep = `click ${suggestion.displayName || suggestion.name}`;
  } else if (commandType === 'type') {
    const inIndex = newStep.toLowerCase().indexOf(' in ');
    if (inIndex !== -1) {
      const textToType = newStep.substring(5, inIndex).trim();
      // Keep any text the user was already typing
      if (textToType) {
        updatedStep = `type ${textToType} in ${suggestion.displayName || suggestion.name}`;
      } else {
        // Position cursor after "type " for user to enter text
        updatedStep = `type  in ${suggestion.displayName || suggestion.name}`;
      }
    } else {
      updatedStep = `type  in ${suggestion.displayName || suggestion.name}`;
    }
  }
  
  setNewStep(updatedStep);
  setSelectedElement(suggestion);
  setShowSuggestions(false);
  
  if (inputRef.current) {
    inputRef.current.focus();
    if (commandType === 'type' && updatedStep.includes(' in ')) {
      // Position cursor between "type " and " in" for user to enter text
      const typeIndex = updatedStep.indexOf('type ') + 5;
      const inIndex = updatedStep.indexOf(' in ');
      inputRef.current.setSelectionRange(typeIndex, inIndex);
    } else {
      // Position cursor at the end
      const length = updatedStep.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }
};

const createTestCase = async () => {
  if (testSteps.length === 0) {
    alert('Please add at least one test step before creating a test case.');
    return;
  }

  try {
    setCreateTestCaseLoading(true);
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

    const stepsData = testSteps.map((step, index) => {
      
      let teststep_result = "not_executed";
      if (step.status === "complete") {
        teststep_result = "passed";
      } else if (step.status === "error") {
        teststep_result = "failed";
      }
      
      const stepCoordinates = step.requestBody || {};
      
      return {
        testcase: testCaseId,
        step_number: index + 1,
        step_description: step.description,
        teststep_result: teststep_result,
        step_coordinates: stepCoordinates
      };
    });

    console.log("Sending bulk test steps:", { steps: stepsData });

    const requestPayload = { steps: stepsData };
    console.log("Request payload for bulk create:", JSON.stringify(requestPayload));

    const bulkStepResponse = await fetch("http://127.0.0.1:8000/api/teststeps/bulk-create/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload)
    });

    if (!bulkStepResponse.ok) {

      const errorText = await bulkStepResponse.text();
      console.error("API Error Response:", errorText);
      throw new Error(`Failed to create test steps: ${bulkStepResponse.status} ${errorText}`);
    }

    alert('Test case created successfully!');
    navigate("/test-cases");
  } catch (error) {
    console.error('Error creating test case:', error);
    alert(`Error creating test case: ${error.message}`);
  } finally {
    setCreateTestCaseLoading(false);
  }
};


  const clearSession = () => {
    sessionStorage.removeItem('latestElementData');
    setElementData(null);
    setTestSteps([]);
    alert('Session data cleared!');
  };


const LoadingIndicator = ({ message }) => (
  <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-md border-l-4 border-purple-500 mb-4 transition-all duration-300">
    <div className="mr-3 relative">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
      </div>
    </div>
    <span className="text-gray-700 font-medium text-lg">{message}</span>
  </div>
);

const ImageModal = () => {
  if (!fullScreenImage) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={() => setFullScreenImage(null)}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        <button 
          className="absolute top-2 right-2 bg-white rounded-full p-1"
          onClick={() => setFullScreenImage(null)}
        >
          <X className="w-6 h-6" />
        </button>
        <img 
          src={fullScreenImage} 
          alt="Full screen preview" 
          className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
};

/*
const SuggestionsDropdown = () => {
  if (!showSuggestions || suggestions.length === 0) return null;
  
  return (
      <div className="absolute z-10 w-full bg-white shadow-xl rounded-md border border-gray-200 mt-12 max-h-72 overflow-y-auto animate-fadeIn">
          <div className="sticky top-0 bg-purple-50 p-3 border-b border-purple-100">
              <h4 className="font-medium text-purple-800 flex items-center">
                  {commandType === 'click' ? (
                      <>
                          <span className="mr-2">🖱️</span> Click on an element:
                      </>
                  ) : (
                      <>
                          <span className="mr-2">⌨️</span> Select where to type:
                      </>
                  )}
              </h4>
              <p className="text-xs text-gray-600">
                Found {suggestions.length} matching elements
                {suggestions.some(s => s.isDuplicate) && 
                  " (highlighted items have duplicate names)"}
              </p>
          </div>
          <ul className="divide-y divide-gray-100">
              {suggestions.map((suggestion, index) => (
                  <li 
                    key={`${suggestion.id}-${index}`}
                    className={`suggestion-item p-3 hover:bg-purple-50 cursor-pointer focus:bg-purple-100 focus:outline-none transition-colors duration-150 ${
                      suggestion.usageInfo === 'Last executed element' ? 'bg-green-100 border-l-4 border-green-500' : 
                      suggestion.usageInfo === 'Likely last executed element' ? 'bg-green-50 border-l-4 border-green-400' :
                      suggestion.usageInfo ? 'bg-green-50 border-l-4 border-green-300' : 
                      suggestion.isDuplicate ? 'border-l-4 border-yellow-400' : ''
                    }`}
                    tabIndex={0}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                              handleSuggestionClick(suggestion);
                          } else if (e.key === 'ArrowDown' && index < suggestions.length - 1) {
                              e.preventDefault();
                              document.querySelectorAll('.suggestion-item')[index + 1].focus();
                          } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              if (index > 0) {
                                  document.querySelectorAll('.suggestion-item')[index - 1].focus();
                              } else {
                                  inputRef.current.focus();
                              }
                          } else if (e.key === 'Escape') {
                              setShowSuggestions(false);
                              inputRef.current.focus();
                          }
                      }}
                  >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {suggestion.displayName || suggestion.name}
                          {suggestion.usageInfo && (
                            <span className={`ml-2 text-xs font-semibold ${
                              suggestion.usageInfo === 'Last executed element' ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded-full' :
                              suggestion.usageInfo === 'Likely last executed element' ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded-full' :
                              'text-green-600'
                            }`}>
                              ({suggestion.usageInfo})
                            </span>
                          )}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          suggestion.type === 'button' || suggestion.tag === 'button' 
                              ? 'bg-blue-100 text-blue-700' 
                              : suggestion.type === 'input' || suggestion.tag === 'input'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}>
                          {suggestion.type || suggestion.tag || "Element"}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 mt-2 flex items-center gap-3">
                          <span>Position: x:{Math.round(suggestion.click_point[0])}, y:{Math.round(suggestion.click_point[1])}</span>
                          {suggestion.isDuplicate && !suggestion.usageInfo && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                  Multiple matches
                              </span>
                          )}
                      </div>
                      
                      {suggestion.text && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                              Text: "{suggestion.text.substring(0, 30)}{suggestion.text.length > 30 ? '...' : ''}"
                          </div>
                      )}
                  </li>
              ))}
          </ul>
      </div>
  );
};
*/

const SuggestionsDropdown = () => {
  if (!showSuggestions || suggestions.length === 0) return null;
  
  return (
      <div className="absolute z-10 w-full bg-white shadow-xl rounded-md border border-gray-200 mt-12 max-h-72 overflow-y-auto animate-fadeIn">
          <div className="sticky top-0 bg-purple-50 p-3 border-b border-purple-100">
              <h4 className="font-medium text-purple-800 flex items-center">
                  {commandType === 'click' ? (
                      <>
                          <span className="mr-2">🖱️</span> Click on an element:
                      </>
                  ) : (
                      <>
                          <span className="mr-2">⌨️</span> Select where to type:
                      </>
                  )}
              </h4>
              <p className="text-xs text-gray-600">
                Found {suggestions.length} matching elements
                {suggestions.some(s => s.isDuplicate) && 
                  " (highlighted items have duplicate names)"}
                {lastClickCoordinates && " (ordered by proximity to last click)"}
              </p>
          </div>
          <ul className="divide-y divide-gray-100">
              {suggestions.map((suggestion, index) => (
                  <li 
                    key={`${suggestion.id}-${index}`}
                    className={`suggestion-item p-3 hover:bg-purple-50 cursor-pointer focus:bg-purple-100 focus:outline-none transition-colors duration-150 ${
                      suggestion.usageInfo === 'Last executed element' ? 'bg-green-100 border-l-4 border-green-500' : 
                      suggestion.usageInfo === 'Likely last executed element' ? 'bg-green-50 border-l-4 border-green-400' :
                      suggestion.usageInfo === 'Near last click' ? 'bg-blue-50 border-l-4 border-blue-300' :
                      suggestion.usageInfo ? 'bg-green-50 border-l-4 border-green-300' : 
                      suggestion.proximityToLastClick === 'very-close' ? 'bg-blue-50 border-l-2 border-blue-300' :
                      suggestion.proximityToLastClick === 'close' ? 'bg-blue-50 border-l-1 border-blue-200' :
                      suggestion.isDuplicate ? 'border-l-4 border-yellow-400' : ''
                    }`}
                    tabIndex={0}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                              handleSuggestionClick(suggestion);
                          } else if (e.key === 'ArrowDown' && index < suggestions.length - 1) {
                              e.preventDefault();
                              document.querySelectorAll('.suggestion-item')[index + 1].focus();
                          } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              if (index > 0) {
                                  document.querySelectorAll('.suggestion-item')[index - 1].focus();
                              } else {
                                  inputRef.current.focus();
                              }
                          } else if (e.key === 'Escape') {
                              setShowSuggestions(false);
                              inputRef.current.focus();
                          }
                      }}
                  >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {suggestion.displayName || suggestion.name}
                          {suggestion.usageInfo && (
                            <span className={`ml-2 text-xs font-semibold ${
                              suggestion.usageInfo === 'Last executed element' ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded-full' :
                              suggestion.usageInfo === 'Likely last executed element' ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded-full' :
                              suggestion.usageInfo === 'Near last click' ? 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full' :
                              'text-green-600'
                            }`}>
                              ({suggestion.usageInfo})
                            </span>
                          )}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          suggestion.type === 'button' || suggestion.tag === 'button' 
                              ? 'bg-blue-100 text-blue-700' 
                              : suggestion.type === 'input' || suggestion.tag === 'input'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}>
                          {suggestion.type || suggestion.tag || "Element"}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 mt-2 flex items-center gap-3">
                          <span>Position: x:{Math.round(suggestion.click_point[0])}, y:{Math.round(suggestion.click_point[1])}</span>
                          {suggestion.isDuplicate && !suggestion.usageInfo && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                  Multiple matches
                              </span>
                          )}
                          {suggestion.proximityToLastClick === 'very-close' && !suggestion.usageInfo && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  Near last click
                              </span>
                          )}
                      </div>
                      
                      {/* Extra details to help distinguish elements */}
                      {suggestion.text && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                              Text: "{suggestion.text.substring(0, 30)}{suggestion.text.length > 30 ? '...' : ''}"
                          </div>
                      )}
                  </li>
              ))}
          </ul>
      </div>
  );
};

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-4 md:p-6">
          {/* Test Case Info Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-purple-700">{testCaseInfo.name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs">
                    Type: {testCaseInfo.testcase_type}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                    Priority: {testCaseInfo.testcase_priority}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {loadingMessage && <LoadingIndicator message={loadingMessage} />}
          
          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Panel - Test Steps */}
            <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Test Steps</h2>
                <div className="flex gap-2">
                  <button
                    onClick={clearSession}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                  <button
                    onClick={createTestCase}
                    disabled={testSteps.length === 0 || createTestCaseLoading}
                    className="flex items-center gap-1 px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm transition-colors duration-200"
                  >
                    {createTestCaseLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {createTestCaseLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>

              <div ref={stepsRef} className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 280px)" }}>
                <div className="space-y-3">
                  {testSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`p-3 bg-white rounded-lg shadow-sm border-l-4 transition-all duration-300 ${
                        step.status === 'complete' ? 'border-green-500' :
                        step.status === 'error' ? 'border-red-500' :
                        'border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-medium">Step {index + 1}</h3>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-600">{step.duration}</span>
                          {step.status === 'complete' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {step.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{step.description}</p>
                      {step.elementClicked && (
                        <div className="mt-1 text-xs text-blue-600">
                          Clicked element: {step.elementClicked.name} at x:{step.elementClicked.click_point[0]}, y:{step.elementClicked.click_point[1]}
                        </div>
                      )}
                      {step.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs animate-appear">
                          <div className="font-medium">Error:</div>
                          <div>{step.error}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {testSteps.length === 0 && !isProcessing && (
                    <div className="text-center p-8 text-gray-400">
                      No steps added yet. Enter a command below to begin.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex flex-col gap-2 relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      ref={inputRef}
                      value={newStep}
                      onChange={(e) => setNewStep(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTestStep();
                        } else if (e.key === 'Escape') {
                          setShowSuggestions(false);
                        } else if (e.key === 'ArrowDown' && showSuggestions && suggestions.length > 0) {
                          e.preventDefault();
                          document.querySelector('.suggestion-item').focus();
                        }
                      }}
                      placeholder="Enter command (e.g., 'open https://example.com' or 'Click login')"
                      disabled={isProcessing}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50 text-sm transition-all duration-200"
                    />
                    <button
                      onClick={addTestStep}
                      disabled={isProcessing || !newStep.trim()}
                      className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors duration-200"
                    >
                      {isProcessing ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Suggestions dropdown with animation */}
                  <SuggestionsDropdown />
                  
                  {/* Command type indicator */}
                  {commandType && (
                    <div className="text-xs text-gray-500 mt-1">
                      {commandType === 'click' && "Click command - type element name or select from suggestions"}
                      {commandType === 'type' && "Type command - format: 'type [text] in [element]'"}
                      {commandType === 'open' && "Navigation command - enter a URL"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Test Execution Timeline */}
            <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Test Execution Timeline</h2>
              </div>
              
              <div ref={previewRef} className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
                <div className="space-y-5">
                  {testSteps.length === 0 ? (
                    <div className="text-center text-gray-500 py-16">
                      Enter a URL to begin testing.
                    </div>
                  ) : (
                    testSteps.map((step, index) => (
                      <div key={step.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">

                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">Step {index + 1}</h3>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600">{step.duration}</span>
                            {step.status === 'complete' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {step.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3 text-sm">{step.description}</p>
                        {step.status === 'complete' && step.screenshot && (
                          <div className="relative">
                            <img
                              src={step.screenshot}
                              alt={`Step ${index + 1}`}
                              className="w-full rounded-lg border border-gray-200 cursor-pointer"
                              onClick={() => setFullScreenImage(step.screenshot)}
                            />
                            <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                              Screenshot {index + 1}
                            </div>
                          </div>
                        )}
                        {step.message && (
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Status:</span> {step.message}
                          </p>
                        )}
                        
                        {step.status === 'error' && (
                          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center text-red-600 mb-2">
                              <XCircle className="w-5 h-5 mr-2" />
                              <span className="font-medium">Error occurred</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{step.error || "Failed to execute command. Please try again."}</p>
                            
                            <div className="mt-3 text-xs text-gray-500">
                              <p className="font-medium">Troubleshooting tips:</p>
                              <ul className="list-disc pl-4 mt-1 space-y-1">
                                <li>Check your internet connection</li>
                                <li>Verify the URL is correct and accessible</li>
                                <li>Try using a different command</li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {step.elementClicked && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                              <p className="text-xs text-blue-700 font-medium">
                                  Element details: {step.elementClicked.displayName || step.elementClicked.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                  Position: x:{step.elementClicked.click_point[0]}, y:{step.elementClicked.click_point[1]}
                              </p>
                              {previouslySelectedElements[step.elementClicked.name?.toLowerCase()] && (
                                  <p className="text-xs text-green-600 mt-1">
                                      Used {previouslySelectedElements[step.elementClicked.name.toLowerCase()].count} time(s)
                                  </p>
                              )}
                          </div>
                        )}

                      </div>
                    ))
                  )}
                </div>
                <ImageModal />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteTestManually;