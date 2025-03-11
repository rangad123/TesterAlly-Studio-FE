/*
import React, { useState, useEffect } from "react";
import { Save, X, Edit2, Trash2, Plus } from 'lucide-react';
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
      fetchTestData(info.projectId);
    }, [location, navigate]);
    

    const fetchTestData = async (projectId) => {
      if (!projectId) return;
    
      try {
        const response = await fetch(`https://api.testerally.ai/api/testdata/${projectId}/`);
        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            setTestSteps([
              {
                stepNumber: 1,
                choice: `${data.url}`,
                isSaved: true,
                isSelected: true
              }
            ]);
          } else {
            setTestSteps([]);
          }
        } else {
          setTestSteps([]);
        }
      } catch (error) {
        console.error("Error fetching test data:", error);
        setTestSteps([]);
      }
    };
    

  const handleCreateTestCase = async () => {

    setIsLoading(true);

    try {

      const testCaseResponse = await fetch("https://api.testerally.ai/api/testcases/", {
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
          const stepResponse = await fetch("https://api.testerally.ai/api/teststeps/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              testcase: testCaseId,
              step_number: index + 1,
              step_description: step.choice
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
    }
    finally {
      setIsLoading(false);
    }
  };


  const handleAddStep = () => {
    const newStep = {
      stepNumber: testSteps.length + 1,
      choice: "",
      isSaved: false,
      isSelected: true
    };
    
    setTestSteps([...testSteps, newStep]);
  };

  const handleSaveStep = (index) => {
    if (testSteps[index].choice.trim() === "") {
      alert("Please provide a step description before saving.");
      return;
    }

    const updatedSteps = [...testSteps];
    updatedSteps[index].isSaved = true;
    setTestSteps(updatedSteps);
  };

  const handleDeleteStep = (index) => {
    
    const updatedSteps = testSteps.filter((_, idx) => idx !== index);
    updatedSteps.forEach((step, idx) => {
      step.stepNumber = idx + 1;
    });
    setTestSteps(updatedSteps);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Write Test Manually</h2>
              <button
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                onClick={handleCreateTestCase}
              >
                {isLoading ? "Creating..." : "Create Test Case"}
              </button>
            </div>

            {testSteps.map((step, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 bg-white p-4 mb-4 rounded-lg border border-gray-200"
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
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-md p-2"
                    value={step.choice}
                    onChange={(e) => {
                      const updatedSteps = [...testSteps];
                      updatedSteps[index].choice = e.target.value;
                      setTestSteps(updatedSteps);
                    }}
                    placeholder="Enter test step description"
                  />
                )}

                <div className="flex gap-2">
                  {!step.isSaved ? (
                    <>
                      <button
                        className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                        onClick={() => handleSaveStep(index)}
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100"
                        onClick={() => handleDeleteStep(index)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                        onClick={() => {
                          const updatedSteps = [...testSteps];
                          updatedSteps[index].isSaved = false;
                          setTestSteps(updatedSteps);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {testSteps.length > 1 && (
                        <button
                          className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                          onClick={() => handleDeleteStep(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

{(testSteps.length === 0 || testSteps[testSteps.length - 1].isSaved) && (


              <button
                onClick={handleAddStep}
                className="inline-flex items-center px-4 py-2 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteTestManually;


import React, { useState, useEffect } from "react";
import { Save, X, Edit2, Trash2, Plus } from 'lucide-react';
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
      const testCaseResponse = await fetch("https://api.testerally.ai/api/testcases/", {
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
          const stepResponse = await fetch("https://api.testerally.ai/api/teststeps/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              testcase: testCaseId,
              step_number: index + 1,
              step_description: step.choice
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

  const handleAddStep = () => {
    const newStep = {
      stepNumber: testSteps.length + 1,
      choice: "",
      isSaved: false,
      isSelected: true
    };
    
    setTestSteps([...testSteps, newStep]);
  };

  const handleSaveStep = (index) => {
    if (testSteps[index].choice.trim() === "") {
      alert("Please provide a step description before saving.");
      return;
    }

    const updatedSteps = [...testSteps];
    updatedSteps[index].isSaved = true;
    setTestSteps(updatedSteps);
  };

  const handleDeleteStep = (index) => {
    const updatedSteps = testSteps.filter((_, idx) => idx !== index);
    updatedSteps.forEach((step, idx) => {
      step.stepNumber = idx + 1;
    });
    setTestSteps(updatedSteps);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Write Test Manually</h2>
              <button
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                onClick={handleCreateTestCase}
              >
                {isLoading ? "Creating..." : "Create Test Case"}
              </button>
            </div>

            {testSteps.map((step, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 bg-white p-4 mb-4 rounded-lg border border-gray-200"
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
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-md p-2"
                    value={step.choice}
                    onChange={(e) => {
                      const updatedSteps = [...testSteps];
                      updatedSteps[index].choice = e.target.value;
                      setTestSteps(updatedSteps);
                    }}
                    placeholder="Enter test step description"
                  />
                )}

                <div className="flex gap-2">
                  {!step.isSaved ? (
                    <>
                      <button
                        className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                        onClick={() => handleSaveStep(index)}
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100"
                        onClick={() => handleDeleteStep(index)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                        onClick={() => {
                          const updatedSteps = [...testSteps];
                          updatedSteps[index].isSaved = false;
                          setTestSteps(updatedSteps);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {testSteps.length > 1 && (
                        <button
                          className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                          onClick={() => handleDeleteStep(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {(testSteps.length === 0 || testSteps[testSteps.length - 1].isSaved) && (
              <button
                onClick={handleAddStep}
                className="inline-flex items-center px-4 py-2 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteTestManually;
*/












import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Plus, Clock, MousePointer, X } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";

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
  
  const previewRef = useRef(null);
  const stepsRef = useRef(null);

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

  const fetchTestData = async (projectId) => {
    if (!projectId) return;
  
    try {
      const response = await fetch(`https://api.testerally.ai/api/testdata/${projectId}/`);
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          setNewStep(`open ${data.url}`);
        }
      }
    } catch (error) {
      console.error("Error fetching test data:", error);
    }
  };


  const findBestMatchingElement = (text) => {
    if (!elementData || !elementData.elements || elementData.elements.length === 0) {
      return null;
    }

    const normalizedText = text.toLowerCase().trim();

    let bestMatch = elementData.elements.find(element => 
      element.name && element.name.toLowerCase() === normalizedText
    );

    if (!bestMatch) {
      const matches = elementData.elements
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

  const executeStep = async (stepDescription) => {
    setIsProcessing(true);
  
    try {

      if (stepDescription.toLowerCase().startsWith('open ') || stepDescription.toLowerCase().includes('go to ')) {
    
        const response = await fetch('https://api.testerally.ai/automation/handle_command/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ command: stepDescription }),
        });

        console.log("open url:", stepDescription);
  
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

      else if (stepDescription.toLowerCase().includes('click') || stepDescription.toLowerCase().includes('type')) {

        /*const commandWords = stepDescription.toLowerCase().split(' ');
        const actionType = commandWords[0]; 
        const userText = commandWords.slice(1).join(' '); 
      
        const element = findBestMatchingElement(userText);*/

        const words = stepDescription.trim().split(' ');
        const actionType = words[0].toLowerCase(); 
        
        let elementName = '';
        //let inputText = '';
        if (actionType === 'type') {

        const inIndex = words.findIndex(word => word.toLowerCase() === 'in');
        
        if (inIndex > 1 && inIndex < words.length - 1) {
          
          //inputText = words.slice(1, inIndex).join(' ');
          
          elementName = words.slice(inIndex + 1).join(' ');
        } else {
          
          throw new Error("Invalid type command format. Expected: 'type [text] in [element]'");
        }
      } else if (actionType === 'click') {
       
        elementName = words.slice(1).join(' ');
      }
      
      const element = findBestMatchingElement(elementName);
      
        if (element) {
          const requestBody = {
            command: stepDescription,
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
        screenshot: `/api/placeholder/800/300?text=Error_Screenshot`,
        error: error.message
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const addTestStep = async () => {
    if (!newStep.trim() || isProcessing) return;
    
    const newStepObj = {
      id: Date.now(),
      description: newStep,
      status: 'pending',
      duration: '00:00',
      screenshot: null
    };

    setTestSteps(prev => [...prev, newStepObj]);
    setNewStep('');

    const executionResult = await executeStep(newStep);

    setTestSteps(prev => prev.map(step => 
      step.id === newStepObj.id ? {
        ...step,
        ...executionResult
      } : step
    ));


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

  const createTestCase = async () => {
    if (testSteps.length === 0) {
      alert('Please add at least one test step before creating a test case.');
      return;
    }

    try {
      const testCaseResponse = await fetch("https://api.testerally.ai/api/testcases/", {
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


      const stepPromises = testSteps.map(async (step, index) => {
        const stepResponse = await fetch("https://api.testerally.ai/api/teststeps/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testcase: testCaseId,
            step_number: index + 1,
            step_description: step.description
          })
        });

        if (!stepResponse.ok) {
          throw new Error(`Failed to create step ${index + 1}`);
        }

        return stepResponse.json();
      });

      await Promise.all(stepPromises);
      
      alert('Test case created successfully!');
      navigate("/test-cases");
    } catch (error) {
      console.error('Error creating test case:', error);
      alert(`Error creating test case: ${error.message}`);
    }
  };

  const clearSession = () => {
    sessionStorage.removeItem('latestElementData');
    setElementData(null);
    setTestSteps([]);
    alert('Session data cleared!');
  };

  const CoordinatesTable = ({ response, stepId }) => {
    const [selectedElement, setSelectedElement] = useState(null);
    
    if (!response?.elements || response.elements.length === 0) return null;
  
    return (
      <div className="mt-4 bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Detected Elements</h4>
          <p className="text-sm text-gray-500 mt-1">Select an element to view details</p>
        </div>
        
        <div className="p-4">
          {/* Element Dropdown */}
          <select 
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
            value={selectedElement ? selectedElement.id : ""}
            onChange={(e) => {
              const selected = response.elements.find(el => el.id.toString() === e.target.value);
              setSelectedElement(selected || null);
            }}
          >
            <option value="">-- Select an element --</option>
            {response.elements.map((element) => (
              <option key={element.id} value={element.id}>
                {element.name || `Element ${element.id}`}
              </option>
            ))}
          </select>
          
          {/* Selected Element Details */}
          {selectedElement && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Element ID:</span>
                  <span className="ml-2 text-gray-800">{selectedElement.id}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Element Type:</span>
                  <span className="ml-2 text-gray-800">{selectedElement.type || "N/A"}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Click Point:</span>
                  <span className="ml-2 text-gray-800">
                    x: {selectedElement.click_point[0]}, y: {selectedElement.click_point[1]}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Coordinates:</span>
                  <span className="ml-2 text-gray-800">
                    [{selectedElement.coordinates[0]}, {selectedElement.coordinates[1]}, 
                    {selectedElement.coordinates[2]}, {selectedElement.coordinates[3]}]
                  </span>
                </div>
              </div>
              
              <div className="mt-3 flex justify-end">
                <button
                  className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                  onClick={() => {
                    setNewStep(`Click ${selectedElement.name}`);
                  }}
                >
                  <MousePointer className="w-4 h-4 mr-1" />
                  Click Element
                </button>
              </div>
            </div>
          )}
        </div>
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
          
          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Panel - Test Steps */}
            <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Test Steps</h2>
                <div className="flex gap-2">
                  <button
                    onClick={clearSession}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                  <button
                    onClick={createTestCase}
                    disabled={testSteps.length === 0}
                    className="flex items-center gap-1 px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                </div>
              </div>

              <div ref={stepsRef} className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 280px)" }}>
                <div className="space-y-3">
                  {testSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`p-3 bg-white rounded-lg shadow-sm border-l-4 ${
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
                        <p className="text-red-500 text-xs mt-1">{step.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStep}
                    onChange={(e) => setNewStep(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTestStep()}
                    placeholder="Enter URL or command (e.g., 'Open https://example.com' or 'Click login')"
                    disabled={isProcessing}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50 text-sm"
                  />
                  <button
                    onClick={addTestStep}
                    disabled={isProcessing || !newStep.trim()}
                    className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
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
                        {step.screenshot && (
                          <div className="relative">
                            <img
                              src={step.screenshot}
                              alt={`Step ${index + 1}`}
                              className="w-full rounded-lg border border-gray-200"
                            />
                            <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                              Screenshot {index + 1}
                            </div>
                          </div>
                        )}
                        {step.coordinates && (
                          <CoordinatesTable response={step.coordinates} stepId={step.id} />
                        )}
                        {step.error && (
                          <p className="text-red-500 text-xs mt-2">{step.error}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteTestManually;