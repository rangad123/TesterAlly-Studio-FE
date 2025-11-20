import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Save, X, Edit2, ArrowLeft, Code, FileCode, Play } from "lucide-react";

const TestScript = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { testCaseName, projectName, testFileName, testFilePath } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("testScript");
  const [testCase, setTestCase] = useState(null);
  const [editingTestCase, setEditingTestCase] = useState(null);
  const [testCaseTypes, setTestCaseTypes] = useState([]);
  const [testCasePriorities, setTestCasePriorities] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  
  // Script related states
  const [scriptContent, setScriptContent] = useState("");
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState("");
  const [isSavingScript, setIsSavingScript] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [expandedScreenshot, setExpandedScreenshot] = useState(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const [isTestDataLoading, setIsTestDataLoading] = useState(false);
  const [apiKey, setApiKey] = useState(null);  
  const [gptVersion, setGptVersion] = useState(null);
  const [projectData, setProjectData] = useState(null);

  const apiBaseUrl = "http://127.0.0.1:8000/api";

  const fetchTestCase = useCallback(async (testcaseName, projectName) => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await fetch(
        `http://127.0.0.1:8000/integrate/testcase/?user_id=${userId}&project_name=${projectName}&testcase_name=${testcaseName}`
      );
      if (!response.ok) throw new Error("Failed to fetch test case");
      const data = await response.json();
      console.log("Testcase response:", data);
      setTestCase(data.testcase);
    } catch (err) {
      console.error("Error fetching test case:", err);
      setError("Failed to fetch test case details");
    }
  }, []);

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

  // Fetch test script content
  const fetchTestScript = useCallback(async () => {
    if (!testFileName || !testFilePath) {
      setError("Test file information not available");
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");

      console.log("Fetching test script with:");
        console.log("User ID:", userId);
        console.log("Project Name:", projectName);
        console.log("Test File Name:", testFileName);
        console.log("Test File Path:", testFilePath);
        
      const response = await fetch(
        `http://127.0.0.1:8000/integrate/test_script/?user_id=${userId}&project_name=${projectName}&test_filename=${testFileName}&test_filepath=${testFilePath}`
      );
      
      if (!response.ok) throw new Error("Failed to fetch test script");
      
      const data = await response.json();
      console.log("Test script response:", data);
      setScriptContent(data.script_content);
      setEditedScript(data.script_content);
    } catch (err) {
      console.error("Error fetching test script:", err);
      setError("Failed to fetch test script");
    } finally {
      setLoading(false);
    }
  }, [testFileName, testFilePath, projectName]);

  useEffect(() => {
    if (activeTab === "testCaseInfo" && testCaseName && projectName) {
      fetchTestCase(testCaseName, projectName);
      fetchTestCaseMetadata();
    }
  }, [activeTab, fetchTestCase, fetchTestCaseMetadata, testCaseName, projectName]);

  useEffect(() => {
    if (activeTab === "testScript") {
      fetchTestScript();
    }
  }, [activeTab, fetchTestScript]);

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
            const parsedProject = JSON.parse(savedProject);
            setProjectData(parsedProject);
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

  const handleEditTestCase = () => {
    setIsEditing(true);
    setEditingTestCase({
      name: testCase.testcase_name,
      type: testCase.testcase_type,
      priority: testCase.testcase_priority,
    });
  };

  const handleUpdateTestCase = async () => {
    try {
      const userId = localStorage.getItem("userId");
      
      const response = await fetch(
        `http://127.0.0.1:8000/integrate/testcase/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            project_name: projectName,
            testcase_name: testCaseName,
            new_testcase_name: editingTestCase.name,
            testcase_type: editingTestCase.type,
            testcase_priority: editingTestCase.priority
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        throw new Error(errorData.message || "Failed to update test case");
      }
      
      setTestCase(prev => ({
        ...prev,
        testcase_name: editingTestCase.name,
        testcase_type: editingTestCase.type,
        testcase_priority: editingTestCase.priority
      }));

      const updatedState = {
        ...location.state,
        testCaseName: editingTestCase.name
      };
      navigate(location.pathname, { 
        state: updatedState, 
        replace: true 
      });

      setIsEditing(false);
      setEditingTestCase(null);
      setError(null);

    } catch (err) {
      console.error("Error updating test case:", err);
      setError("Failed to update test case: " + err.message);
    }
  };

  const handleSaveScript = async () => {
    setIsSavingScript(true);
    try {
      const userId = localStorage.getItem("userId");
      const response = await fetch(
        `http://127.0.0.1:8000/integrate/test_script/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            project_name: projectName,
            test_filename: testFileName,
            test_filepath: testFilePath,
            script_content: editedScript
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to save test script");
      
      const data = await response.json();
      console.log("Script saved:", data);
      setScriptContent(editedScript);
      setIsEditingScript(false);
      alert("Test script saved successfully!");
    } catch (err) {
      console.error("Error saving test script:", err);
      alert("Failed to save test script");
    } finally {
      setIsSavingScript(false);
    }
  };

  const handleRunScript = async () => {
    if (!testFilePath) {
        alert("Test file path not available");
        return;
    }

    setIsRunningTest(true); 
    try {
        const requestBody = { 
          test_file: testFilePath,
          api_key: apiKey,          
          gpt_version: gptVersion  
        };
        console.log("Request Body:", requestBody); 

        const response = await fetch('http://127.0.0.1:8000/AI/test/run-existing/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error('Failed to run test');

        const data = await response.json();
        console.log("Response Data:", data);
        
        setTestResults(data);
        // await fetchTestScript();

        // ✅ Save to localStorage for Reports page
        try {
          const testCaseResults = JSON.parse(localStorage.getItem('testCaseResults') || '[]');
          
          const testCaseResult = {
            id: Date.now(),
            project_name: projectName,
            name: testCaseName,
            status: data.passed ? 'PASS' : 'FAIL',
            execution_date: new Date().toISOString(),
            total_steps: data.summary?.total || 0,
            passed_steps: data.summary?.passed || 0,
            failed_steps: data.summary?.failed || 0,
            execution_time: parseFloat(data.summary?.duration?.replace('s', '') || 0)
          };
          
          testCaseResults.push(testCaseResult);
          localStorage.setItem('testCaseResults', JSON.stringify(testCaseResults.slice(-10)));
          console.log('Saved test case result to localStorage:', testCaseResult);

        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
        }

      } catch (error) {
        // ✅ Handle cancellation gracefully
        console.error('Error running test:', error);
        alert('Failed to run test. Please try again.');
    } finally {
        setIsRunningTest(false);
    }
  };

  const handleCancelTest = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/AI/test/run-stop/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Stop signal sent:', data.message);
        // Don't reset state immediately, let the running test API handle it
      } else {
        console.error('Failed to stop test:', data);
        alert('Failed to stop test execution');
      }
    } catch (error) {
      console.error('Error stopping test:', error);
      alert('Failed to stop test execution');
    }
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
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Name</label>
            <p className="mt-1 text-lg text-gray-900">{testCase.testcase_name}</p>
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
        <div>
          <label className="block text-sm font-medium text-gray-500">Test Scenario Description</label>
          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
            <p className="text-gray-800 whitespace-pre-wrap">
              {testCase.test_scenarios_desc || 'No description provided'}
            </p>
          </div>
        </div>

        {/* Test File Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            Test File Information
          </h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700"><span className="font-medium">Filename:</span> {testFileName || 'N/A'}</p>
            <p className="text-gray-700 break-all"><span className="font-medium">Path:</span> {testFilePath || 'N/A'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderTestScript = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!scriptContent && !isEditingScript) {
      return (
        <div className="text-center p-8 text-gray-500">
          No test script available
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Test Script</h3>
          </div>
          <div className="flex gap-2">
            {isEditingScript ? (
              <>
                <button
                  onClick={handleSaveScript}
                  disabled={isSavingScript}
                  className="inline-flex items-center px-4 py-2 bg-purple-400 text-white rounded-md hover:bg-purple-600 disabled:bg-gray-400"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingScript ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditingScript(false);
                    setEditedScript(scriptContent);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </>
            ) : (
                <>
                    {/* ✅ Show Cancel button ONLY when test is running */}
                    {isRunningTest ? ( 
                      <button
                        onClick={handleCancelTest}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Test
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleRunScript}
                          disabled={isTestDataLoading || !testFilePath || !apiKey || !gptVersion}
                          className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-700"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Run
                        </button>
                        {/* <button
                          onClick={() => setIsEditingScript(true)}
                          className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </button> */}
                      </>
                    )}
                </>
            )}
          </div>
        </div>

        {isEditingScript ? (
          <textarea
            value={editedScript}
            onChange={(e) => setEditedScript(e.target.value)}
            className="w-full h-[600px] p-4 font-mono text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
            spellCheck={false}
          />
        ) : (
          <pre className="w-full h-[600px] p-4 bg-gray-900 text-gray-100 rounded-md overflow-auto">
            <code className="font-mono text-sm">{scriptContent}</code>
          </pre>
        )}

        <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
          <p className="text-sm text-purple-700">
            <strong>Note:</strong> This is your Playwright test script. Edit carefully to maintain test functionality.
          </p>
        </div>

        {/* Test Results Section */}
        {testResults && (
          <div className="mt-6 space-y-4">
            <div className="bg-white border rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Test Execution Results</h3>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  testResults.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {testResults.passed ? "✅ PASSED" : "❌ FAILED"}
                </span>
              </div>

              {testResults.message && (
                <div className={`mb-4 p-3 rounded-md ${
                  testResults.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                  {testResults.message}
                </div>
              )}

              {testResults.tests && testResults.tests.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Test Details</h4>
                  {testResults.tests.map((test, index) => (
                    <div 
                      key={index}
                      className={`border-l-4 rounded-lg p-5 ${
                        test.status === 'passed' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-lg">{test.title}</h5>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              test.status === 'passed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {test.status.toUpperCase()}
                            </span>
                            <span className="text-gray-600">⏱️ Duration : {test.duration}</span>
                          </div>
                        </div>
                      </div>

                      {test.error && (
                        <div className="mt-4 bg-white border border-red-200 rounded-md p-4">
                          <h6 className="text-sm font-semibold text-red-800 mb-2">❌ Error Details</h6>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Message:</span>
                              <p className="text-red-700 mt-1 font-mono text-xs bg-red-50 p-2 rounded">
                                {test.error.message}
                              </p>
                            </div>
                            {test.error.file && (
                              <div>
                                <span className="font-medium text-gray-700">File:</span>
                                <p className="text-gray-600 mt-1 font-mono text-xs break-all">
                                  {test.error.file}{test.error.line && ` (Line ${test.error.line})`}
                                </p>
                              </div>
                            )}
                            {test.error.snippet && (
                              <div>
                                <span className="font-medium text-gray-700">Code Snippet:</span>
                                <pre className="mt-1 bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                                  <code>{test.error.snippet}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Screenshot Section - Shows all screenshots from the test run */}
                      {testResults.screenshots && testResults.screenshots.length > 0 && (
                        <div className="mt-4 bg-white border border-blue-200 rounded-md p-4">
                          <h6 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                            📸 Test Screenshots
                            <span className="text-xs font-normal text-gray-600">
                              ({testResults.test_file?.split('\\').pop() || 'Test File'})
                            </span>
                          </h6>
                          <div className="grid grid-cols-2 gap-3">
                            {testResults.screenshots.map((screenshot, screenshotIndex) => (
                              <div key={screenshotIndex} className="relative group">
                                <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50 hover:border-blue-400 transition-colors">
                                  <img
                                    src={screenshot.data}
                                    alt={screenshot.filename}
                                    className="w-full h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setExpandedScreenshot(screenshot.data)}
                                  />
                                </div>
                                <p className="text-xs text-gray-600 mt-1 text-center truncate" title={screenshot.filename}>
                                  {screenshot.filename}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ScreenshotModal = () => {
    if (!expandedScreenshot) return null;
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
        onClick={() => setExpandedScreenshot(null)}
      >
        <div className="relative bg-white p-2 rounded-lg max-w-5xl max-h-[90vh]">
          <button 
            onClick={() => setExpandedScreenshot(null)}
            className="absolute -top-10 right-0 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={expandedScreenshot} 
            alt="Expanded screenshot" 
            className="max-w-full max-h-[85vh] object-contain rounded"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
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
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab("testScript")}
              className={`px-4 py-2 ${
                activeTab === "testScript"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-500"
              }`}
            >
              Test Script
            </button>
            <button
              onClick={() => setActiveTab("testCaseInfo")}
              className={`px-4 py-2 ${
                activeTab === "testCaseInfo"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-500"
              }`}
            >
              Test Case Info
            </button>
          </div>

          {activeTab === "testScript" ? renderTestScript() : renderTestCaseInfo()}
        </div>
      </div>
      <ScreenshotModal />
    </div>
  );
};

export default TestScript;