import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Save, X, Edit2, ArrowLeft, Play, RefreshCw, WifiOff } from "lucide-react";
// CheckSquare

const TestSuite = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { testSuiteName, projectId, testSuite: passedTestSuite, ProjectType, Platform } = location.state || {};

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
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [showConnectionMessage, setShowConnectionMessage] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(false);

  const [isTestDataLoading, setIsTestDataLoading] = useState(false);
  const [apiKey, setApiKey] = useState(null);  
  const [gptVersion, setGptVersion] = useState(null);
  const [projectData, setProjectData] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User ID not found. Please log in again.");
      setLoading(false);
      navigate("/dashboard-user");
      return;
    }

    const savedProjectKey = `selectedProject_${userId}`;
    const savedProject = localStorage.getItem(savedProjectKey);

    if (savedProject) {
        try {
            const parsedProject = JSON.parse(savedProject);
            setProjectData(parsedProject);
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

  useEffect(() => {
    if (projectData?.id) {
      setIsTestDataLoading(true);
      fetch(`http://127.0.0.1:8000/api/testdata/${projectData.id}/`)
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ Test data loaded:", data);
          setApiKey(data?.openai_api_key || null); 
          setGptVersion(data?.gpt_version || null);  
        })
        .catch((err) => {
          console.warn("⚠️ Error fetching test data:", err.message);
        })
        .finally(() => setIsTestDataLoading(false));
    }
  }, [projectData?.id]);

  const fetchTestSuite = useCallback(async () => {
    if (!testSuiteName || !projectId) return;
    const userId = localStorage.getItem("userId");
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/integrate/testsuite/?user_id=${userId}&project_name=${projectId}&title=${testSuiteName}`,
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
  },  [testSuiteName, projectId]);

  const fetchTestCases = useCallback(async () => {
    if (!testSuite?.testcase || !projectId) return;
    
    try {
      const userId = localStorage.getItem("userId");
      const testCasesData = await Promise.all(
        testSuite.testcase.map(async (testCaseObj) => {  
          const response = await fetch(
            `http://127.0.0.1:8000/integrate/testcase/?user_id=${userId}&project_name=${projectId}&testcase_name=${testCaseObj.testcase_name}`
          );
          if (!response.ok) throw new Error(`Failed to fetch test case ${testCaseObj.testcase_name}`);
          const data = await response.json();
          
          return {
            name: data.testcase_name || testCaseObj.testcase_name,
            testcase_type: data.testcase?.testcase_type,
            testcase_priority: data.testcase?.testcase_priority,
            testfile_name: testCaseObj.testfile_name,      
            testfile_path: testCaseObj.testfile_path,      
            steps: data.testcase?.steps || [],
            ...data
          };
        })
      );
      setTestCases(testCasesData);
      console.log("Processed test cases:", testCasesData);

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

const checkConnectionOnly = async () => {
    setConnectionLoading(true);
    try {
        const response = await fetch("http://localhost:8000/android/connection/", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Connection API Data:", data);
            
            if (data.status === "success" && data.device_info) {
                setDeviceConnected(true);
                setShowConnectModal(false);
                setShowConnectionMessage(true);
                setTimeout(() => {
                    setShowConnectionMessage(false);
                }, 5000);
                return true;
            } else {
                setDeviceConnected(false);
                setShowConnectModal(true);
                setShowConnectionMessage(false);
                return false;
            }
        } else {
            setDeviceConnected(false);
            setShowConnectModal(true);
            setShowConnectionMessage(false);
            return false;
        }
    } catch (error) {
        console.error("Error checking device connection:", error);
        setDeviceConnected(false);
        setShowConnectModal(true);
        setShowConnectionMessage(false);
        return false;
    } finally {
        setConnectionLoading(false);
    }
};

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
    const userId = localStorage.getItem("userId");

    setLoading(true);
    try {
      const formattedLabels = Array.isArray(editedLabels) ? editedLabels : editedLabels.split(',').map(label => label.trim());

      const requestBody = {
        user_id: userId,
        project_name: projectId,
        title: passedTestSuite?.title,
        new_title: editedTitle,
        description: editedDescription,
        labels: formattedLabels,
        pre_requisite: editedPreRequisite,
      };

      console.log("PUT Request Body:", requestBody);

      const response = await fetch(
        `http://127.0.0.1:8000/integrate/testsuite/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          // body: JSON.stringify({
          //   user_id: userId,
          //   project_name: projectId,
          //   title: editedTitle,
          //   description: editedDescription,
          //   labels: formattedLabels,
          //   pre_requisite: editedPreRequisite,
          // }),
        }
      );

      if (!response.ok) throw new Error("Failed to update test suite");
      const result = await response.json();
      console.log("edited testsuite:", result);

      setTestSuite(prevTestSuite => ({
        ...prevTestSuite,
        title: editedTitle,
        description: editedDescription,
        labels: formattedLabels,
        pre_requisite: editedPreRequisite,
      }));
      
      setEditingTestSuite(false);
      setError(null);
    } catch (err) {
      console.error("Error updating test suite:", err);
      setError("Failed to update test suite");
    } finally {
      setLoading(false);
    }
  };

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
  
  // const waitStepsMs = parseInt(waitBetweenSteps) || 1000;
  // const waitCasesMs = parseInt(waitBetweenCases) || 3000;
  
  try {
    if (cancellationRequested) {
      setError("Test execution was cancelled");
      setExecutionInProgress(false);
      setIsExecuting(false);
      return;
    }

    if (
      (ProjectType === "Mobile Application" && Platform === "Android") ||
      (ProjectType === "Web Application" && Platform === "Mobile")
    ) {
      const isConnected = await checkConnectionOnly();
      if (!isConnected) {
        alert("Please connect your Android device before running the test case.");
        return;
      }
    }

    // ✅ Extract all test case names and paths 
    const testcaseDetails = testCases.map(tc => ({
      testcase_name: tc.name,
      testfile_name: tc.testfile_name,
      testfile_path: tc.testfile_path
    }));

    const requestBody = {
      testsuite_title: testSuiteName,
      project_name: projectId,
      user_id: userId,
      testcases: testcaseDetails,
      api_key: apiKey,          
      gpt_version: gptVersion 
      // wait_between_steps: waitStepsMs,
      // wait_between_cases: waitCasesMs,
    };

    console.log("Project Type:",ProjectType)
    console.log("Project Platform:",Platform)
    console.log("Executing with payload:", requestBody);

    let apiUrl = "";

    if (ProjectType === "Mobile Application" && Platform === "Android") {
      apiUrl = "http://127.0.0.1:8000/android/run_testsuite/";
    } else if (ProjectType === "Web Application" && Platform === "Mobile") {
      apiUrl = "http://127.0.0.1:8000/android/web_run_testsuite/";
    } else if (ProjectType === "Web Application" && Platform === "Laptop/PC") {
      apiUrl = "http://127.0.0.1:8000/AI/test/run_testsuite/";
    } else {
      setError("Unsupported combination of project type and platform");
      setExecutionInProgress(false);
      setIsExecuting(false);
      return;
    }

    const response = await fetch(apiUrl, {
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

    if (cancellationRequested) {
      setError("Test execution was cancelled");
      setExecutionInProgress(false);
      setIsExecuting(false);
      return;
    }

    const testResults = result.results || [];

    if (testResults.length > 0) {
      const detailedResults = {};

      testResults.forEach((testResult, index) => {
        const testFileName = testResult.test_file || `Test-${index + 1}`;
        const summary = testResult.summary || {};
        const tests = testResult.tests || [];

        detailedResults[testFileName] = {
          status: testResult.status || 'unknown',
          passed: testResult.passed,
          message: testResult.message || '',
          summary: {
            total: summary.total || 0,
            passed: summary.passed || 0,
            failed: summary.failed || 0,
            skipped: summary.skipped || 0,
            duration: summary.duration || '0s'
          },
          tests: tests.map(test => ({
            title: test.title,
            status: test.status,
            duration: test.duration,
            error: test.error || null
          })),
          screenshots: testResult.screenshots || [] 
        };
      });

      setExecutionResults(detailedResults);

      try {
        // ✅ Save Test Suite Result from API response
        const apiSummary = result.summary || {};
        
        const testSuiteResult = {
          id: Date.now(),
          project_name: projectId,
          name: testSuite.title || testSuiteName,
          status: result.passed ? 'passed' : 'failed',
          execution_date: new Date().toISOString(),
          total_testcases: apiSummary.total || 0,
          passed_testcases: apiSummary.passed || 0,
          failed_testcases: apiSummary.failed || 0,
          execution_time: parseFloat(apiSummary.duration?.replace('s', '') || 0)
        };
        
        const testSuiteResults = JSON.parse(localStorage.getItem('testSuiteResults') || '[]');
        testSuiteResults.push(testSuiteResult);
        localStorage.setItem('testSuiteResults', JSON.stringify(testSuiteResults.slice(-50)));
        
        // ✅ Save Individual Test Case Results from API response
        const testResults = result.results || [];
        const testCaseResults = JSON.parse(localStorage.getItem('testCaseResults') || '[]');
        
        testResults.forEach((testResult) => {
          const testFileName = testResult.test_file || 'Unknown Test';
          const testSummary = testResult.summary || {};
          
          const testCaseResult = {
            id: Date.now() + Math.random() * 1000,
            project_name: projectId,
            name: testFileName.replace('.spec.js', ''),
            status: testResult.passed ? 'PASS' : 'FAIL',
            execution_date: new Date().toISOString(),
            total_steps: testSummary.total || 0,
            passed_steps: testSummary.passed || 0,
            failed_steps: testSummary.failed || 0,
            execution_time: parseFloat(testSummary.duration?.replace('s', '') || 0)
          };
          
          testCaseResults.push(testCaseResult);
          console.log('Prepared test case result for storage:', testCaseResult);
        });
        
        localStorage.setItem('testCaseResults', JSON.stringify(testCaseResults.slice(-10)));
        console.log("Saved test suite and test case results to localStorage.");

      } catch (storageError) {
        console.error("Error storing results:", storageError);
      }
    }
    
    const apiSummary = result.summary || {};
    console.log("API Summary received:", apiSummary);

    const totalCases = apiSummary.total || 0;
    const passedCases = apiSummary.passed || 0;
    const failedCases = apiSummary.failed || 0;

    console.log("Parsed values:", { totalCases, passedCases, failedCases });

    setTestSuiteSummary({
      status: result.passed ? 'passed' : 'failed',
      passed: passedCases,
      failed: failedCases,
      total: totalCases,
      skipped: apiSummary.skipped || 0,
      duration: apiSummary.duration || '0s'
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
                disabled={isTestDataLoading || !apiKey || !gptVersion}
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

  const TestCaseCard = ({ testCase, executionResult }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
      <div className={`bg-white border rounded-lg overflow-hidden transition-all duration-200 ${
        executionResult?.status === 'passed' ? 'border-green-400 bg-green-50' : 
        executionResult?.status === 'failed' ? 'border-red-400 bg-red-50' : 
        'border-gray-200'
      }`}>
        {/* Test Case Header */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-gray-900">{testCase.name}</h3>
                {executionResult?.status && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    executionResult.status === 'passed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {executionResult.status === 'passed' ? '✅ Passed' : '❌ Failed'}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                <div className="flex items-center gap-3">
                  <span>Type: {testCase.testcase_type}</span>
                  <span>|</span>
                  <span>Priority: {testCase.testcase_priority}</span>
                </div>
                {testCase.testfile_name && (
                  <span className="text-xs text-purple-600 font-medium">
                    📄 {testCase.testfile_name}
                  </span>
                )}
              </div>
              
              {/* Execution Summary */}
              {executionResult?.summary && (
                <div className="flex gap-4 text-xs text-gray-600 mt-2">
                  <span>Steps: {executionResult.summary.total_steps || 0}</span>
                  <span>Passed: {executionResult.summary.passed_steps || 0}</span>
                  <span>Failed: {(executionResult.summary.total_steps || 0) - (executionResult.summary.passed_steps || 0)}</span>
                  {executionResult.summary.execution_time && (
                    <span>Time: {executionResult.summary.execution_time}s</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Expand/Collapse Button */}
            {(testCase.steps?.length > 0 || executionResult?.steps?.length > 0) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              >
                <svg 
                  className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Steps Section */}
        {isExpanded && (
          <div className="border-t bg-gray-50">
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Test Steps</h4>
              <div className="space-y-2">
                {(executionResult?.steps || testCase.steps || []).map((step, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-md border-l-4 ${
                      step.teststep_result === "passed" || step.status === "passed"
                        ? "border-green-400 bg-green-50" 
                        : step.teststep_result === "failed" || step.status === "failed"
                        ? "border-red-400 bg-red-50" 
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {(step.teststep_result === "passed" || step.status === "passed") ? (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (step.teststep_result === "failed" || step.status === "failed") ? (
                          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-600">{index + 1}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {step.step_description || step.description || `Step ${index + 1}`}
                        </div>
                        
                        {step.step_action && (
                          <div className="text-xs text-gray-600 mt-1">
                            Action: {step.step_action}
                          </div>
                        )}
                        
                        {step.step_locator && (
                          <div className="text-xs text-gray-600 mt-1">
                            Locator: {step.step_locator}
                          </div>
                        )}
                        
                        {step.error && (
                          <div className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded">
                            Error: {step.error}
                          </div>
                        )}
                        
                        {step.execution_time && (
                          <div className="text-xs text-gray-500 mt-1">
                            Execution time: {step.execution_time}s
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ConnectDeviceModal = () => {
      if (!showConnectModal) return null;
      
      return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
          <div className="text-center">
              <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <WifiOff className="w-8 h-8 text-red-600" />
              </div>
              </div>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Connect Your Android Device</h2>
              <p className="text-gray-600 mb-6">
              Please connect your Android device and enable the required options to continue with testing.
              </p>
              
              <div className="text-left mb-6">
              <h3 className="font-medium text-gray-800 mb-2">Required Steps:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Enable Developer Options on your device</li>
                  <li>Enable USB Debugging</li>
                  <li>Connect your device via USB</li>
                  <li>Allow USB debugging when prompted</li>
              </ul>
              </div>
              
              <div className="flex gap-3">
              <button
                  onClick={checkConnectionOnly}
                  disabled={connectionLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                  {connectionLoading ? (
                  <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Checking...
                  </div>
                  ) : (
                  'Check Connection'
                  )}
              </button>
              <button
                  onClick={() => navigate('/test-suites')}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                  Cancel
              </button>
              </div>
          </div>
          </div>
      </div>
      );
  };

  const TestFileResultAccordion = ({ testFileName, result, setExpandedScreenshot }) => {
    const [isOpen, setIsOpen] = useState(false);

    const actualSummary = {
      total: result.tests?.length || 0,
      passed: result.tests?.filter(t => t.status === 'passed').length || 0,
      failed: result.tests?.filter(t => t.status === 'failed').length || 0,
      duration: result.tests?.reduce((sum, t) => {
        const dur = parseFloat(t.duration?.replace('s', '') || 0);
        return sum + dur;
      }, 0).toFixed(1) + 's'
    };

    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">📄 {testFileName}</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              actualSummary.failed === 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {actualSummary.failed === 0 ? '✅ PASSED' : '❌ FAILED'}
            </span>
            <span className="text-xs text-gray-600">
              {actualSummary.passed}/{actualSummary.total} passed
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{actualSummary.duration}</span>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="p-4 bg-white space-y-4 border-t">
            {/* Test Results */}
            {result.tests && result.tests.length > 0 && (
              <div className="space-y-3">
                {result.tests.map((test, testIndex) => (
                  <div
                    key={testIndex}
                    className={`border-l-4 rounded-lg p-4 ${
                      test.status === 'passed' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-gray-900 flex-1">{test.title}</h5>
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                        test.status === 'passed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {test.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      ⏱️ Duration: {test.duration}
                    </div>

                    {test.error && (
                      <div className="mt-3 bg-white border border-red-200 rounded p-3">
                        <h6 className="text-sm font-semibold text-red-800 mb-2">❌ Error Details</h6>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Message:</span>
                            <p className="text-red-700 mt-1 font-mono text-xs bg-red-50 p-2 rounded break-words">
                              {test.error.message}
                            </p>
                          </div>
                          
                          {test.error.file && (
                            <div>
                              <span className="font-medium text-gray-700">Location:</span>
                              <p className="text-gray-600 mt-1 font-mono text-xs break-all">
                                {test.error.file}{test.error.line && ` (Line ${test.error.line})`}
                              </p>
                            </div>
                          )}
                          
                          {test.error.snippet && test.error.snippet.trim() && (
                            <div>
                              <span className="font-medium text-gray-700">Code Snippet:</span>
                              <pre className="mt-1 bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                                <code>{test.error.snippet}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ✅ Screenshots OUTSIDE the test loop - at test file level */}
            {result.screenshots && result.screenshots.length > 0 && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h6 className="text-sm font-semibold text-blue-800 mb-3">📸 Test Screenshots ({result.screenshots.length})</h6>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {result.screenshots.map((screenshot, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={screenshot.data}
                        alt={screenshot.filename}
                        className="w-full h-32 object-cover border rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setExpandedScreenshot(screenshot.data)}
                      />
                      <p className="text-xs text-gray-600 mt-1 truncate" title={screenshot.filename}>
                        {screenshot.filename}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
            {showConnectionMessage && (
              <div className="mt-2 flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-md">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Device Connected Successfully
              </div>
          )}
          {deviceConnected && !showConnectionMessage && (
              <div className="mt-2 flex items-center text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Device Ready
              </div>
          )}
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
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-gray-600">Loading test cases...</span>
                </div>
              ) : testCases.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <div className="text-lg mb-2">No test cases found</div>
                  <div className="text-sm">This test suite doesn't contain any test cases yet.</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {testCases.map((testCase) => (
                    <TestCaseCard
                      key={testCase.testcase_name || testCase.name}
                      testCase={testCase}
                      executionResult={executionResults[testCase.testcase_name || testCase.name]}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            renderTestSuiteInfo()
          )}
        </div>
      </div>

      {testSuiteSummary && (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border w-full">
            <div className="p-4">
              {/* Overall Summary Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Test Suite Execution Summary</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  testSuiteSummary.status === "passed" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {testSuiteSummary.status === "passed" ? "✅ All Passed" : "❌ Failed"}
                </span>
              </div>
              
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-200">
                  <div className="text-xs text-purple-600 font-medium mb-1">Total Tests</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {testSuiteSummary.total || 0}
                  </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
                  <div className="text-xs text-green-600 font-medium mb-1">Passed</div>
                  <div className="text-2xl font-bold text-green-700">
                    {testSuiteSummary.passed || 0}
                  </div>
                </div>
                
                <div className="bg-red-50 p-3 rounded-lg text-center border border-red-200">
                  <div className="text-xs text-red-600 font-medium mb-1">Failed</div>
                  <div className="text-2xl font-bold text-red-700">
                    {testSuiteSummary.failed || 0}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
                  <div className="text-xs text-gray-600 font-medium mb-1">Skipped</div>
                  <div className="text-2xl font-bold text-gray-700">
                    {testSuiteSummary.skipped || 0}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
                  <div className="text-xs text-blue-600 font-medium mb-1">Duration</div>
                  <div className="text-xl font-bold text-blue-700">
                    {testSuiteSummary.duration}
                  </div>
                </div>
              </div>

              {/* Detailed Test Results - Collapsible by File */}
              {executionResults && Object.keys(executionResults).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Test Results Details</h4>
                  <div className="space-y-3">
                    {Object.entries(executionResults).map(([testFileName, result]) => (
                      <TestFileResultAccordion 
                        key={testFileName} 
                        testFileName={testFileName} 
                        result={result}
                        setExpandedScreenshot={setExpandedScreenshot}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {expandedScreenshot && <ScreenshotModal />}
      <ConnectDeviceModal />
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