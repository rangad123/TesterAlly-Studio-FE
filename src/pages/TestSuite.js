import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Save, X, Edit2, ArrowLeft, Play, RefreshCw } from "lucide-react";
// CheckSquare

const TestSuite = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { testSuiteId, projectId, testSuite: passedTestSuite } = location.state || {};
  
  const [testSuite, setTestSuite] = useState(passedTestSuite || {});
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
//  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [editingTestSuite, setEditingTestSuite] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedLabels, setEditedLabels] = useState([]);
  const [editedPreRequisite, setEditedPreRequisite] = useState("");
  const [activeTab, setActiveTab] = useState("testCases");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState({});
  const [expandedScreenshot, setExpandedScreenshot] = useState(null);
  const [testSuiteSummary, setTestSuiteSummary] = useState(null);
  const [executionInProgress, setExecutionInProgress] = useState(false);
  const [cancellationRequested, setCancellationRequested] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [waitBetweenSteps, setWaitBetweenSteps] = useState("1000");
  const [waitBetweenCases, setWaitBetweenCases] = useState("3000");

  const apiBaseUrl = "http://127.0.0.1:8000/api";

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
      
      navigate("/test-suites");
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, [navigate]); 
  

  const fetchTestSuite = useCallback(async () => {
    if (!testSuiteId || !projectId) return;
    
    try {
      const response = await fetch(
        `${apiBaseUrl}/testsuites/${testSuiteId}/?project_id=${projectId}`
      );
      if (!response.ok) throw new Error("Failed to fetch test suite");
      const data = await response.json();

      console.log("Test Suites Response:", data)

      setTestSuite(data);
      setEditedTitle(data.title);
      setEditedDescription(data.description);
      setEditedLabels(data.labels || []);
      setEditedPreRequisite(data.pre_requisite || "");
    } catch (err) {
      console.error("Error fetching test suite:", err);
      setError("Failed to fetch test suite details");
    }
  }, [testSuiteId, projectId]);

  const fetchTestCases = useCallback(async () => {
    if (!testSuite?.testcase || !projectId) return;
    
    try {
      const testCasesData = await Promise.all(
        testSuite.testcase.map(async (testCaseId) => {
          const response = await fetch(
            `${apiBaseUrl}/testcases/${testCaseId}/?project_id=${projectId}`
          );
          if (!response.ok) throw new Error(`Failed to fetch test case ${testCaseId}`);
          return await response.json();
        })
      );
      setTestCases(testCasesData);

      console.log("Test case Response:", testCasesData)

    } catch (err) {
      console.error("Error fetching test cases:", err);
      setError("Failed to fetch test cases for this test suite");
    } finally {
      setLoading(false);
    }
  }, [testSuite, projectId]);

  useEffect(() => {
    fetchTestSuite();
  }, [fetchTestSuite]);

  useEffect(() => {
    fetchTestCases();
  }, [fetchTestCases]);

  const handleEditTestSuite = () => {
    setEditingTestSuite(true);
  };

  const handleCancelEdit = () => {
    setEditingTestSuite(false);
    setEditedTitle(testSuite.title);
    setEditedDescription(testSuite.description);
    setEditedLabels(testSuite.labels || []);
    setEditedPreRequisite(testSuite.pre_requisite || "");
  };

  const handleSaveTestSuite = async () => {
    if (!editedTitle || !editedDescription) {
      setError("Title and description are required");
      return;
    }

    setLoading(true);
    try {
      const formattedLabels = Array.isArray(editedLabels) ? editedLabels : editedLabels.split(',').map(label => label.trim());

      const response = await fetch(
        `${apiBaseUrl}/testsuites/${testSuiteId}/?project_id=${projectId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editedTitle,
            description: editedDescription,
            labels: formattedLabels,
            pre_requisite: editedPreRequisite,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update test suite");
      
      const updatedTestSuite = await response.json();
      setTestSuite(updatedTestSuite);
      setEditingTestSuite(false);
      setError(null);
    } catch (err) {
      console.error("Error updating test suite:", err);
      setError("Failed to update test suite");
    } finally {
      setLoading(false);
    }
  };

/*
  const handleTestCaseSelection = (testCaseId) => {
    setSelectedTestCases(prev => 
      prev.includes(testCaseId)
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId]
    );
  };

  const selectAllTestCases = () => {
    if (selectedTestCases.length === testCases.length) {
      setSelectedTestCases([]);
    } else {
      setSelectedTestCases(testCases.map(tc => tc.id));
    }
  };
*/

  const handleOpenExecutionModal = () => {
    setShowExecutionModal(true);
  };

  const handleCloseExecutionModal = () => {
    setShowExecutionModal(false);
  };

  const cancelExecution = () => {
    setCancellationRequested(true);
    setExecutionInProgress(false);
  };

const handleRunTestSuite = async () => {
  handleCloseExecutionModal();
  setIsExecuting(true);
  setExecutionInProgress(true);
  setCancellationRequested(false);  
  setExecutionResults({});
  setError(null);

  const userId = localStorage.getItem("userId");
  if (!userId) {
    setError("User ID not found. Please log in again.");
    setExecutionInProgress(false);
    setIsExecuting(false);
    return;
  }

  const initialResults = {};
  for (const testCase of testCases) {
    try {
      const steps = await fetchTestStepDetails(testCase.id);
      console.log(`Initial steps for test case ${testCase.id}:`, steps);
      
      initialResults[testCase.id] = {
        status: 'pending',
        name: testCase.name,
        steps: steps.map(step => ({
          ...step,
          status: 'pending',
          name: step.name || step.step_name || `Step ${step.order || step.step_number || 0}`,
          description: step.description || step.action || step.details || step.step_description || "",
          error: null
        })),
        total_steps: steps.length,
        passed_steps: 0
      };
    } catch (err) {
      console.error(`Error setting up execution for test case ${testCase.id}:`, err);
    }
  }
  
  setExecutionResults(initialResults);

  const waitStepsMs = parseInt(waitBetweenSteps) || 1000;
  const waitCasesMs = parseInt(waitBetweenCases) || 3000;
  
  try {

    if (cancellationRequested) {
      setError("Test execution was cancelled");
      setExecutionInProgress(false);
      setIsExecuting(false);
      return;
    }

    const requestBody = {
      testsuite_id: testSuiteId,
      user_id: userId,
      wait_between_steps: waitStepsMs,
      wait_between_cases: waitCasesMs,
    };

    console.log("Request Body:", requestBody);

    const response = await fetch("http://127.0.0.1:8000/automation/run_testsuite/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Execution response:", result);

    // Check if cancellation was requested during API call
    if (cancellationRequested) {
      setError("Test execution was cancelled");
      setExecutionInProgress(false);
      setIsExecuting(false);
      return;
    }

    const results = {};

    result.testcases.forEach(testcase => {
    
      console.log(`Testcase ${testcase.testcase_id} data:`, testcase);
      
      const testCaseStatus = testcase.summary.status || "unknown";
      
      results[testcase.testcase_id] = {
        status: testCaseStatus === "passed" ? "complete" : 
                testCaseStatus === "failed" ? "error" : 
                "pending",
        name: testcase.testcase_name,
        duration: `${testcase.summary.execution_time || 0}s`,
        message: testCaseStatus === "passed" ? 'Test completed successfully' : null,
        error: testCaseStatus === "failed" ? (testcase.summary.failure_reason || testcase.summary.error || 'Test execution failed') : null,

        steps: (testcase.steps || []).map(step => {
          console.log("Raw step data from API:", step);

          return {
            ...step,
            
            status: step.status || (step.error ? "failed" : step.is_executed ? "passed" : "pending"),
            
            name: step.command,
            
            description: step.response.status,
           
            error: step.error || step.failure_reason || step.error_message || null
          };
        }) || initialResults[testcase.testcase_id]?.steps || [],
        
        passed_steps: testcase.summary.passed_steps || 0,
        total_steps: testcase.summary.total_steps || initialResults[testcase.testcase_id]?.steps?.length || 0,
        screenshot: testcase.summary.screenshot || null
      };
    });
    
    // Log for debugging
    console.log("Final execution results:", results);
    console.log("Test suite summary:", result.summary);
    console.log("Cancellation flag state:", cancellationRequested);
    
    setExecutionResults(results);

    if (result && result.testcases) {
      const testSuiteResult = {
        id: Date.now(), 
        project_id: projectId,
        testsuite_id: testSuiteId,
        name: testSuite.title,
        status: result.summary.status,
        execution_date: new Date().toISOString(),
        total_testcases: result.summary.total_cases,
        passed_testcases: result.summary.passed_cases,
        failed_testcases: result.summary.total_cases - result.summary.passed_cases,
        execution_time: result.summary.execution_time || 0
      };
      
      // Get existing test suite results from localStorage
      const testSuiteResults = JSON.parse(localStorage.getItem('testSuiteResults') || '[]');
      testSuiteResults.push(testSuiteResult);
      const latestSuiteResults = testSuiteResults.slice(-10);
      localStorage.setItem('testSuiteResults', JSON.stringify(latestSuiteResults));

      const testCaseResults = JSON.parse(localStorage.getItem('testCaseResults') || '[]');

      result.testcases.forEach(testcase => {
        const testCaseResult = {
          id: Date.now() + testcase.testcase_id,
          project_id: projectId,
          testcase_id: testcase.testcase_id,
          name: testcase.testcase_name,
          status: testcase.summary.status === "passed" ? "PASS" : "FAIL",
          execution_date: new Date().toISOString(),
          total_steps: testcase.summary.total_steps || 0,
          passed_steps: testcase.summary.passed_steps || 0,
          failed_steps: testcase.summary.total_steps - testcase.summary.passed_steps || 0,
          execution_time: testcase.summary.execution_time || 0
        };
        testCaseResults.push(testCaseResult);
      });
    
      const latestCaseResults = testCaseResults.slice(-10);
      localStorage.setItem('testCaseResults', JSON.stringify(latestCaseResults));
      
    }
    setTestSuiteSummary({
      status: result.summary.status,
      passed_cases: result.summary.passed_cases,
      total_cases: result.summary.total_cases
    });
    
  } catch (err) {
    console.error("Error executing test suite:", err);
    setError(`Failed to execute test suite: ${err.message || "Unknown error"}`);
  } finally {
    setIsExecuting(false);
    setExecutionInProgress(false);  
  }
};

  const handleResetExecution = () => {
    if (executionInProgress) {
      cancelExecution();
    }
    setExecutionResults({});
    setTestSuiteSummary(null);
  };

const fetchTestStepDetails = async (testCaseId) => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/testcases/${testCaseId}/?project_id=${projectId}`
    );
    if (!response.ok) throw new Error(`Failed to fetch test case details`);
    
    const testCaseData = await response.json();
    return (testCaseData.steps || []).map(step => ({
      ...step,
      name: step.name || step.step_name || `Step ${step.order || step.step_number || 0}`,
      description: step.description || step.action || step.details || step.step_description || "",
    }));
  } catch (err) {
    console.error(`Error fetching steps for test case ${testCaseId}:`, err);
    return [];
  }
};

  const ScreenshotModal = () => {
    if (!expandedScreenshot) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
        <div className="relative bg-white p-2 rounded-lg max-w-4xl max-h-[90vh]">
          <button 
            onClick={() => setExpandedScreenshot(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={expandedScreenshot} 
            alt="Expanded screenshot" 
            className="max-w-full max-h-[80vh] object-contain"
          />
        </div>
      </div>
    );
  };

  const ExecutionModal = ({
    show,
    onClose,
    waitBetweenSteps,
    setWaitBetweenSteps,
    waitBetweenCases,
    setWaitBetweenCases,
  }) => {
    if (!show) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Test Execution Settings</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
  
          <div className="space-y-4">
            <div>
              <label htmlFor="waitSteps" className="block text-sm font-medium text-gray-700 mb-1">
                Wait Time Between Test Steps (milliseconds)
              </label>
              <input
                id="waitSteps"
                type="text"
                value={waitBetweenSteps}
                onChange={(e) => setWaitBetweenSteps(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
  
            <div>
              <label htmlFor="waitCases" className="block text-sm font-medium text-gray-700 mb-1">
                Wait Time Between Test Cases (milliseconds)
              </label>
              <input
                id="waitCases"
                type="text"
                value={waitBetweenCases}
                onChange={(e) => setWaitBetweenCases(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
  
            <div className="flex justify-end pt-4">
              <button
                onClick={handleRunTestSuite}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute Tests
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };  

  const renderTestSuiteInfo = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {editingTestSuite ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pre-Requisite</label>
            <input
              type="text"
              value={editedPreRequisite}
              onChange={(e) => setEditedPreRequisite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
            <input
              type="text"
              value={Array.isArray(editedLabels) ? editedLabels.join(", ") : editedLabels}
              onChange={(e) => setEditedLabels(e.target.value.split(",").map(label => label.trim()))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSaveTestSuite}
              className="inline-flex items-center px-4 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors duration-200"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Test Suite Information</h2>
            <button 
              onClick={handleEditTestSuite}
              className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Title</h3>
              <p className="text-gray-900">{testSuite.title}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Labels</h3>
              <div className="flex flex-wrap gap-2">
                {testSuite.labels?.map((label, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-gray-900">{testSuite.description}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Pre-Requisite</h3>
              <p className="text-gray-900">{testSuite.pre_requisite || "None specified"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full ">
      <div className="p-6">
        <button
          onClick={() => navigate("/test-suites")}
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Test Suites
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{testSuite.title}</h1>

            <div className="flex space-x-2">
              {executionInProgress ? (
                <button
                  onClick={cancelExecution}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              ) : Object.keys(executionResults).length > 0 && (
                <button
                  onClick={handleResetExecution}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </button>
              )}
              <button
                onClick={handleOpenExecutionModal}
                disabled={isExecuting || testCases.length === 0 || executionInProgress}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExecuting ? (
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Run Suite
              </button>
            </div>  
          </div>

          <div className="flex border-b mb-4">
            <button onClick={() => setActiveTab("testCases")} className={`px-4 py-2 ${activeTab === "testCases" ? "border-b-2 border-purple-600 text-purple-600" : "text-gray-500"}`}>Test Cases</button>
            <button onClick={() => setActiveTab("testSuiteInfo")} className={`px-4 py-2 ${activeTab === "testSuiteInfo" ? "border-b-2 border-purple-600 text-purple-600" : "text-gray-500"}`}>Test Suite Info</button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {activeTab === "testCases" ? (
            <div>
              {loading ? (
                <div className="p-4 text-center">Loading test cases...</div>
              ) : testCases.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No test cases in this test suite
                </div>
              ) : (
                <>

                {/*
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={selectAllTestCases}
                      className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600"
                      disabled={isExecuting || testCases.length === 0}
                    >
                      <CheckSquare className="w-4 h-4 mr-1" />
                      {selectedTestCases.length === testCases.length && testCases.length > 0 ? 'Unselect All' : 'Select All'}
                    </button>
                  </div>
                  */}

                  <div className="space-y-3">
                    {testCases.map((testCase) => (
                      <div
                        key={testCase.id}
                        className={`flex items-center gap-4 bg-white border ${
                          executionResults[testCase.id]?.status === 'running' ? 'border-yellow-400' : 
                          executionResults[testCase.id]?.status === 'complete' ? 'border-green-400' : 
                          executionResults[testCase.id]?.status === 'error' ? 'border-red-400' : 'border-gray-200'
                        } rounded-lg p-4`}
                      >
                        {/*
                        <input
                          type="checkbox"
                          checked={selectedTestCases.includes(testCase.id)}
                          onChange={() => handleTestCaseSelection(testCase.id)}
                          className="w-4 h-4 text-purple-600 rounded"
                          disabled={isExecuting || executionInProgress}
                        />
                        */}

                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{testCase.name}</div>
                          <div className="text-sm text-gray-500">{testCase.description}</div>

                          {executionResults[testCase.id]?.status === "complete" && (
                            <div className="mt-2 text-green-600 text-sm font-medium">
                              ✅ Test case passed successfully
                            </div>
                          )}
                          
                          {executionResults[testCase.id]?.status === "error" && (
                            <div className="mt-2 text-red-600 text-sm font-medium">
                              ❌ Test case failed
                            </div>
                          )}
                          
                          {executionResults[testCase.id]?.steps?.map((step, index) => (
                            <div 
                              key={index} 
                              className={`text-xs p-1.5 rounded ${
                                step.status === "passed" ? "bg-green-50 text-green-700" : 
                                step.status === "failed" ? "bg-red-50 text-red-700" : 
                                step.status === "running" ? "bg-yellow-50 text-yellow-700" :
                                "bg-gray-50 text-gray-700"
                              }`}
                            >
                              <div className="flex items-center">
                                {step.status === "passed" ? (
                                  <span className="mr-1">✓</span>
                                ) : step.status === "failed" ? (
                                  <span className="mr-1">✗</span>
                                ) : step.status === "running" ? (
                                  <div className="w-3 h-3 mr-1 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <span className="mr-1">•</span>
                                )}
                                <span className="font-medium">
                                  {step.name || `Step ${index + 1}`}
                                </span>
                              </div>
                              <div className="ml-4 mt-1">
                                {step.description || step.action || step.details || 
                                (step.status === "passed" ? "Step executed successfully" : 
                                  step.status === "failed" ? "Step execution failed" : 
                                  "Awaiting execution")}
                              </div>
                              {step.error && <div className="ml-4 mt-1 text-red-600">{step.error}</div>}
                              {step.execution_time && <div className="ml-4 mt-1 text-gray-500 text-xs">Time: {step.execution_time}s</div>}
                            </div>
                          ))}

                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            renderTestSuiteInfo()
          )}
        </div>
      </div>

      {testSuiteSummary && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-2">Test Suite Execution Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-3 rounded-lg ${testSuiteSummary.status === "passed" ? "bg-green-100" : "bg-red-100"}`}>
              <div className="text-sm text-gray-600">Status</div>
              <div className={`text-lg font-semibold ${testSuiteSummary.status === "passed" ? "text-green-700" : "text-red-700"}`}>
                {testSuiteSummary.status === "passed" ? "Passed" : "Failed"}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <div className="text-sm text-gray-600">Passed Test Cases</div>
              <div className="text-lg font-semibold text-blue-700">
                {testSuiteSummary.passed_cases} / {testSuiteSummary.total_cases}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <div className="text-sm text-gray-600">Pass Rate</div>
              <div className="text-lg font-semibold text-purple-700">
                {Math.round((testSuiteSummary.passed_cases / testSuiteSummary.total_cases) * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}
      
      {expandedScreenshot && <ScreenshotModal />}
      <ExecutionModal
        show={showExecutionModal}
        onClose={handleCloseExecutionModal}
        waitBetweenSteps={waitBetweenSteps}
        setWaitBetweenSteps={setWaitBetweenSteps}
        waitBetweenCases={waitBetweenCases}
        setWaitBetweenCases={setWaitBetweenCases}
      />

    </div>
  );
};

export default TestSuite;