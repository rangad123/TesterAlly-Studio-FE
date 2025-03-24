import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Save, X, Edit2, Trash2, Plus, ArrowLeft, Play, CheckSquare, RefreshCw } from "lucide-react";
//import TestEnvironmentModal from "./TestEnvironmentConfig";

const TestSteps = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { testCaseName, testCaseId } = location.state || {};
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingStep, setEditingStep] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [newStepValue, setNewStepValue] = useState("");
  const [activeTab, setActiveTab] = useState("testSteps");
  const [testCase, setTestCase] = useState(null);
  const [editingTestCase, setEditingTestCase] = useState(null);
  const [testCaseTypes, setTestCaseTypes] = useState([]);
  const [testCasePriorities, setTestCasePriorities] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState({});
  const [elementData, setElementData] = useState(null);
//  const [isEnvironmentModalOpen, setIsEnvironmentModalOpen] = useState(false);

  const apiBaseUrl = "https://api.testerally.ai/api";


  const fetchTestCase = useCallback(async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/testcases/${testCaseId}/?project_id=${location.state.projectId}`
      );
      if (!response.ok) throw new Error("Failed to fetch test case");
      const data = await response.json();
      setTestCase(data);
    } catch (err) {
      console.error("Error fetching test case:", err);
      setError("Failed to fetch test case details");
    }
  }, [testCaseId, location.state.projectId]);

  const fetchTestCaseMetadata = useCallback(async () => {
    try {
      const [typesResponse, prioritiesResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/testcase-types/?project_id=${location.state.projectId}`),
        fetch(`${apiBaseUrl}/testcase-priorities/?project_id=${location.state.projectId}`)
      ]);

      const typesData = await typesResponse.json();
      const prioritiesData = await prioritiesResponse.json();

      setTestCaseTypes(typesData);
      setTestCasePriorities(prioritiesData);
    } catch (err) {
      console.error("Error fetching metadata:", err);
      setError("Failed to fetch test case metadata");
    }
  }, [location.state.projectId]);

  useEffect(() => {
    if (activeTab === "testCaseInfo") {
      fetchTestCase();
      fetchTestCaseMetadata();
    }
  }, [activeTab, fetchTestCase, fetchTestCaseMetadata]);

  const handleEditTestCase = () => {
    setIsEditing(true);
    setEditingTestCase({
      name: testCase.name,
      type: testCase.testcase_type,
      priority: testCase.testcase_priority,
    });
  };

  const handleUpdateTestCase = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/testcases/${testCaseId}/?project_id=${location.state.projectId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingTestCase.name,
            testcase_type: editingTestCase.type,
            testcase_priority: editingTestCase.priority
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update test case");
      
      const updatedTestCase = await response.json();
      setTestCase(updatedTestCase);
      setIsEditing(false);
      setEditingTestCase(null);
    } catch (err) {
      console.error("Error updating test case:", err);
      setError("Failed to update test case");
    }
  };

  const handleDeleteTestCase = async () => {
    if (!window.confirm("Are you sure you want to delete this test case?")) return;

    try {
      const response = await fetch(
        `${apiBaseUrl}/testcases/${testCaseId}/?project_id=${location.state.projectId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error("Failed to delete test case");
      
      navigate("/test-cases");
    } catch (err) {
      console.error("Error deleting test case:", err);
      setError("Failed to delete test case");
    }
  };


  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User ID not found. Please log in again.");
      setLoading(false);
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
    if (!testCaseId) {
      navigate("/test-cases");
    }
  }, [testCaseId, testCaseName, navigate]); 

  const fetchSteps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/teststeps/?testcase_id=${testCaseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch test steps');
      }
      const data = await response.json();
      const sortedData = data.sort((a, b) => a.step_number - b.step_number);
      setSteps(sortedData);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching steps:", err);
    } finally {
      setLoading(false);
    }
  }, [testCaseId]);

  useEffect(() => {
    if (!testCaseId) {
      navigate("/test-cases");
      return;
    }
    fetchSteps();
  }, [testCaseId, navigate, fetchSteps]);

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm("Are you sure you want to delete this step?")) return;
    setError(null);
    
    try {
      const deleteResponse = await fetch(`${apiBaseUrl}/teststeps/${stepId}/?testcase_id=${testCaseId}`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        throw new Error("Failed to delete step");
      }

      const updatedSteps = steps.filter(step => step.id !== stepId);
      const updatePromises = updatedSteps.map(async (step, index) => {
        const response = await fetch(`${apiBaseUrl}/teststeps/${step.id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testcase: testCaseId,
            step_number: index + 1,
            step_description: step.step_description
          })
        });
        if (!response.ok) {
          throw new Error("Failed to update step numbers");
        }
        return response.ok;
      });

      await Promise.all(updatePromises);
      await fetchSteps();
    } catch (err) {
      setError("Error deleting step. Please try again.");
      console.error("Delete operation failed:", err);
    }
  };

  const handleAddStep = async () => {
    if (!newStepValue.trim()) {
      setError("Step description cannot be empty");
      return;
    }

    try {
      const newStepNumber = steps.length + 1;
      const response = await fetch(`${apiBaseUrl}/teststeps/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testcase: parseInt(testCaseId),
          step_number: newStepNumber,
          step_description: newStepValue.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add step");
      }
      
      await fetchSteps();
      setNewStepValue("");
      setError(null);
    } catch (err) {
      setError("Failed to add step. Please try again.");
      console.error("Error adding step:", err);
    }
  };

  const startEditing = (step) => {
    setEditingStep(step.id);
    setEditValue(step.step_description);
  };

  const handleUpdateStep = async (stepId) => {
    if (!editValue.trim()) {
      setError("Step description cannot be empty");
      return;
    }

    try {
      const step = steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error("Step not found");
      }

      const updateData = {
        step_number: step.step_number,
        step_description: editValue.trim()
      };

      const response = await fetch(`${apiBaseUrl}/teststeps/${stepId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update step");
      }

      await fetchSteps();
      setEditingStep(null);
      setEditValue("");
      setError(null);
    } catch (err) {
      setError("Failed to update step. Please try again.");
      console.error("Error updating step:", err);
    }
  };

  const cancelEdit = () => {
    setEditingStep(null);
    setEditValue("");
    setError(null);
  };


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
  

  const handleRunSteps = async () => {
    // If no steps are selected, select all steps
    if (selectedSteps.length === 0) {
      const allStepIds = steps.map(step => step.id);
      setSelectedSteps(allStepIds);
      await executeTestSteps(allStepIds);
    } else {
      await executeTestSteps(selectedSteps);
    }
  };

  const handleResetExecution = () => {
    setExecutionResults({});
  };
    


  const executeTestSteps = async (stepIds) => {
    setIsExecuting(true);
    setExecutionResults({});
    
    const user_id = localStorage.getItem("user_id");
    let currentElementData = elementData || 
    JSON.parse(sessionStorage.getItem('latestElementData') || '{}');
    
    // Execute steps one by one
    for (const stepId of stepIds) {
      const step = steps.find(s => s.id === stepId);
      
      try {
        // Find the step by ID
        if (!step) continue;
  
        setExecutionResults(prev => ({
          ...prev,
          [stepId]: { status: 'running', message: `Executing step ${step.step_number}...` }
        }));

        // Execute the step command with element data
        const result = await executeStep(step.step_description, user_id, currentElementData);

        console.log("result:", result)

      if (result.coordinates) {
        currentElementData = result.coordinates;
        sessionStorage.setItem('latestElementData', JSON.stringify(currentElementData));
      }

        setExecutionResults(prev => ({
          ...prev,
          [stepId]: result
        }));
        
        // If step failed, stop execution
        if (result.status === 'error') {
          break;
        }
      } catch (error) {
        console.error(`Error executing step ${stepId}:`, error);
        setExecutionResults(prev => ({
          ...prev,
          [stepId]: {
            status: 'error',
            error: error.message || 'Execution failed'
          }
        }));
        break;
      }
    }
    
    setIsExecuting(false);
  };


  const findBestMatchingElement = (text, currentElementData) => {
    if (!currentElementData || !currentElementData.elements || currentElementData.elements.length === 0) {
      return null;
    }
  
    const normalizedText = text.toLowerCase().trim();
  
    let bestMatch = currentElementData.elements.find(element => 
      element.name && element.name.toLowerCase() === normalizedText
    );
  
    if (!bestMatch) {
      const matches = currentElementData.elements
        .filter(element => element.name && element.name.toLowerCase().includes(normalizedText))
        .sort((a, b) => {
          const aScore = a.name.toLowerCase().indexOf(normalizedText);
          const bScore = b.name.toLowerCase().indexOf(normalizedText);
          return aScore - bScore;
        });
      
      bestMatch = matches.length > 0 ? matches[0] : null;
    }
  
    return bestMatch;
  };
  
  const executeStep = async (stepDescription, user_id, currentElementData) => {

    try {
      const lowerCaseStep = stepDescription.toLowerCase();

      if (lowerCaseStep.startsWith('open ') || lowerCaseStep.includes('go to ')) {
        const response = await fetch('https://api.testerally.ai/automation/handle_command/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ command: lowerCaseStep, user_id: user_id }),
        });

        console.log("open url:", lowerCaseStep);
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
        
        const screenshotUrl = data.screenshot ? 
          `https://api.testerally.ai${data.screenshot}` : 
          `/api/placeholder/800/300?text=No_Screenshot`;
        
        return {
          status: 'complete',
          duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
          message: data.status || "Page loaded successfully",
          screenshot: screenshotUrl,
          coordinates: data.omniparser_data,
        };
      } 
      else if (lowerCaseStep.includes('click') || lowerCaseStep.includes('type')) {
        const words = stepDescription.trim().split(' ');
        const actionType = words[0].toLowerCase(); 
        
        let elementName = '';
        
        if (actionType === 'type') {
          const inIndex = words.findIndex(word => word.toLowerCase() === 'in');
          
          if (inIndex > 1 && inIndex < words.length - 1) {
            elementName = words.slice(inIndex + 1).join(' ');
          } else {
            throw new Error("Invalid type command format. Expected: 'type [text] in [element]'");
          }
        } else if (actionType === 'click') {
          elementName = words.slice(1).join(' ');
        }

        const element = findBestMatchingElement(elementName, currentElementData);
      
        if (element) {
          const requestBody = {
            command: lowerCaseStep,
            user_id: user_id,
            click_x: element.click_point[0],
            click_y: element.click_point[1],
          };
      
          if (actionType === 'type') {
            requestBody.input_text = elementName;
          }
      
          const response = await fetch('https://api.testerally.ai/automation/handle_command/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
      
          console.log(actionType, stepDescription, element.click_point);
      
          if (!response.ok) {
            throw new Error(`Failed to execute ${actionType} command`);
          }
      
          const data = await response.json();
      
          console.log(`${actionType} response:`, data);
      
          if (data.coordinates && data.coordinates.elements) {
            console.log("Received coordinates data:", data.coordinates);
            console.log("Current elementData before update:", elementData);
            setElementData(data.coordinates);
            console.log("Updated elementData after setElementData:", data.coordinates);
            sessionStorage.setItem('latestElementData', JSON.stringify(data.coordinates));
          }
      
          const screenshotUrl = data.screenshot
            ? `https://api.testerally.ai${data.screenshot}`
            : `/api/placeholder/800/300?text=No_Screenshot`;
      
          return {
            status: 'complete',
            duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
            message: data.message || `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} action executed successfully`,
            screenshot: screenshotUrl,
            coordinates: data.coordinates || elementData,
            elementAction: element,
          };
        } else {
          throw new Error(`Could not find matching element for "${elementName}"`);
        }
      }
      else {
        const response = await fetch('https://api.testerally.ai/automation/handle_command/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ command: lowerCaseStep }),
        });
  
        if (!response.ok) {
          throw new Error('Failed to execute command');
        }
  
        const data = await response.json();
        
        if (data.omniparser_data && data.omniparser_data.elements) {
          setElementData(data.omniparser_data);
          sessionStorage.setItem('latestElementData', JSON.stringify(data.omniparser_data));
        }
        
        const screenshotUrl = data.screenshot ? 
          `https://api.testerally.ai${data.screenshot}` : 
          `/api/placeholder/800/300?text=No_Screenshot`;
        
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
    } 
  };

  

const handleStepSelection = (stepId) => {
  setSelectedSteps(prev => 
    prev.includes(stepId) 
      ? prev.filter(id => id !== stepId)
      : [...prev, stepId]
  );
};


const selectAllSteps = () => {
  if (selectedSteps.length === steps.length) {
    setSelectedSteps([]);
  } else {
    setSelectedSteps(steps.map(step => step.id));
  }
};

const [expandedScreenshot, setExpandedScreenshot] = useState(null);
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

  const renderTestCaseInfo = () => {
    if (!testCase) return <div>Loading test case details...</div>;

    if (isEditing) {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editingTestCase.name}
              onChange={(e) => setEditingTestCase(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Case Type<span className="text-red-500">*</span>
            </label>
            <select
              value={editingTestCase.type}
              onChange={(e) => setEditingTestCase(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Type</option>
              {testCaseTypes.map((type) => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Case Priority<span className="text-red-500">*</span>
            </label>
            <select
              value={editingTestCase.priority}
              onChange={(e) => setEditingTestCase(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Priority</option>
              {testCasePriorities.map((priority) => (
                <option key={priority.id} value={priority.priority_level}>
                  {priority.priority_level}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleUpdateTestCase}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingTestCase(null);
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Test Case Details</h2>
          <div className="space-x-2">
            <button
              onClick={handleEditTestCase}
              className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </button>
            <button
              onClick={handleDeleteTestCase}
              className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Name</label>
            <p className="mt-1 text-lg text-gray-900">{testCase.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Type</label>
            <p className="mt-1 text-lg text-gray-900">{testCase.testcase_type || "Not specified"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Priority</label>
            <p className="mt-1 text-lg text-gray-900">{testCase.testcase_priority || "Not specified"}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 lg:ml-[300px] p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full ">
      <div className="p-6">
        <button
          onClick={() => navigate("/test-cases")}
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Test Cases
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{testCaseName}</h1>

          <div className="flex space-x-2">
            {Object.keys(executionResults).length > 0 && (
              <button
                onClick={handleResetExecution}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </button>
            )}
            <button
              onClick={handleRunSteps}
              disabled={isExecuting || steps.length === 0}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              {isExecuting ? (
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run Test
            </button>
          </div> 
        </div>

        <div className="flex border-b mb-4">
          <button onClick={() => setActiveTab("testSteps")} className={`px-4 py-2 ${activeTab === "testSteps" ? "border-b-2 border-purple-600" : "text-gray-500"}`}>Test Steps</button>
          <button onClick={() => setActiveTab("testCaseInfo")} className={`px-4 py-2 ${activeTab === "testCaseInfo" ? "border-b-2 border-purple-600" : "text-gray-500"}`}>Test Case Info</button>
        </div>

        {activeTab === "testSteps" ? (
          <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="mb-6 flex items-center gap-2 ">
            <input
              type="text"
              value={newStepValue}
              onChange={(e) => setNewStepValue(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              placeholder="Enter new test step"
            />
            <button
              onClick={handleAddStep}
              className="inline-flex items-center px-4 py-2 bg-purple-400 text-white rounded-md hover:bg-purple-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </button>
          </div>

          <div className="flex justify-end mb-2">
            <button
              onClick={selectAllSteps}
              className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600"
              disabled={isExecuting || steps.length === 0}
            >
              <CheckSquare className="w-4 h-4 mr-1" />
              {selectedSteps.length === steps.length && steps.length > 0 ? 'Unselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-3 ">
            {steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-4"
              >
                
                {activeTab === "testSteps" && (
                  <input
                    type="checkbox"
                    checked={selectedSteps.includes(step.id)}
                    onChange={() => handleStepSelection(step.id)}
                    className="w-4 h-4 text-purple-600 rounded"
                    disabled={isExecuting}
                  />
                )}
                <span className="min-w-[60px] font-medium">#{step.step_number}</span>
                
                {editingStep === step.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateStep(step.id);
                        } else if (e.key === 'Escape') {
                          cancelEdit();
                        }
                      }}
                    />
                    <button
                      onClick={() => handleUpdateStep(step.id)}
                      className="p-2 text-green-600 hover:text-green-700"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 text-gray-600 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 text-gray-700 break-words whitespace-pre-wrap overflow-hidden">
                      {step.step_description}
                      {executionResults[step.id] && (
                        <div className={`mt-2 text-sm p-2 rounded ${
                          executionResults[step.id].status === 'running' ? 'bg-yellow-50 text-yellow-700' : 
                          executionResults[step.id].status === 'complete' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {executionResults[step.id].status === 'running' ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 mr-2 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                              Running: {executionResults[step.id].message || 'Executing step...'}
                            </div>
                          ) : executionResults[step.id].status === 'complete' ? (
                            <div className="flex items-center">
                              <span className="mr-2">✓</span> 
                              Executed successfully {executionResults[step.id].duration ? `(${executionResults[step.id].duration})` : ''}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="mr-2">✗</span> 
                              Failed: {executionResults[step.id].error || 'Unknown error'}
                            </div>
                          )}
                        </div>
                      )}
                      {executionResults[step.id]?.screenshot && (
                        <div className="mt-2">
                          <img 
                            src={executionResults[step.id].screenshot} 
                            alt="Execution screenshot" 
                            className="w-full max-h-60 object-contain border border-gray-200 rounded-md cursor-pointer"
                            onClick={() => handleExpandScreenshot(executionResults[step.id].screenshot)}
                          />
                        </div>
                      )}
                    </div>
                    {!isExecuting && !executionResults[step.id] && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(step)}
                          className="p-2 text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStep(step.id)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          </>
          ) : (
            renderTestCaseInfo()
          )}

          <ScreenshotModal />

        </div>
      </div>
    </div>
  );
};

export default TestSteps;
