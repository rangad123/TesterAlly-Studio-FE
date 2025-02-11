import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { AiOutlinePlus } from "react-icons/ai";
import { Save, X, Edit2, Trash2, Plus } from 'lucide-react';

const TestCases = () => {
  const navigate = useNavigate();
  const [testCases, setTestCases] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTestCase, setEditingTestCase] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [testSteps, setTestSteps] = useState([]);
  const [newStepValue, setNewStepValue] = useState("");
  const [editingStep, setEditingStep] = useState(null);
  const [editStepValue, setEditStepValue] = useState("");
  const [testCaseTypes, setTestCaseTypes] = useState([]);
  const [testCasePriorities, setTestCasePriorities] = useState([]);

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
        const project = JSON.parse(savedProject);
        setSelectedProject(project);
      } catch (err) {
        console.error("Error parsing saved project:", err);
        localStorage.removeItem(savedProjectKey);
      }
    }

    const handleProjectChange = (event) => {
      const newProject = event.detail;
      setSelectedProject(newProject);
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, []);

  useEffect(() => {
    const fetchTestCaseMetadata = async () => {
      if (!selectedProject?.id) return;

      try {

        const typesResponse = await fetch(
          `https://api.testerally.ai/api/testcase-types/?project_id=${selectedProject.id}`,
          { headers: { "Content-Type": "application/json" } }
        );
        const typesData = await typesResponse.json();
        setTestCaseTypes(typesData);

        const prioritiesResponse = await fetch(
          `https://api.testerally.ai/api/testcase-priorities/?project_id=${selectedProject.id}`,
          { headers: { "Content-Type": "application/json" } }
        );
        const prioritiesData = await prioritiesResponse.json();
        setTestCasePriorities(prioritiesData);
      } catch (error) {
        console.error("Error fetching test case metadata:", error);
        setError("Failed to fetch test case metadata");
      }
    };

    fetchTestCaseMetadata();
  }, [selectedProject]);

  useEffect(() => {
    const fetchTestCases = async () => {
      setLoading(true);
      setError(null);
      setTestCases([]);

      if (!selectedProject?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://api.testerally.ai/api/testcases/?project_id=${selectedProject.id}`,
          {
            headers: {
              "Content-Type": "application/json",
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(Array.isArray(errorData) ? errorData[0] : errorData.message || 'Failed to fetch test cases');
        }

        const data = await response.json();

        console.log("testcases",data)
        setTestCases(data.map(testCase => ({
          ...testCase,
          project_name: selectedProject.name
        })));
      } catch (error) {
        console.error("Error fetching test cases:", error);
        setError(error.message || "Failed to fetch test cases. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTestCases();
  }, [selectedProject]);

  const fetchTestSteps = async (testCaseId) => {
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/teststeps/?testcase_id=${testCaseId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch test steps');
      }
      const data = await response.json();
      const sortedData = data.sort((a, b) => a.step_number - b.step_number);
      setTestSteps(sortedData);
    } catch (error) {
      console.error("Error fetching test steps:", error);
      setError("Failed to fetch test steps");
    }
  };

  const filteredTestCases = testCases.filter((testCase) =>
    testCase.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = async (testCase) => {
    setEditingTestCase({
      id: testCase.id,
      name: testCase.name,
      type: testCase.testcase_type || "",
      priority: testCase.testcase_priority || "",
    });
    await fetchTestSteps(testCase.id);
    setActiveTab('details');
  };

  const handleAddStep = async () => {
    if (!newStepValue.trim()) {
      setError("Step description cannot be empty");
      return;
    }

    try {
      const response = await fetch(`https://api.testerally.ai/api/teststeps/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testcase: editingTestCase.id,
          step_number: testSteps.length + 1,
          step_description: newStepValue.trim()
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add step");
      }

      await fetchTestSteps(editingTestCase.id);
      setNewStepValue("");
    } catch (error) {
      setError("Failed to add step");
      console.error("Error adding step:", error);
    }
  };

  const handleUpdateStep = async (stepId) => {
    if (!editStepValue.trim()) {
      setError("Step description cannot be empty");
      return;
    }

    try {
      const step = testSteps.find(s => s.id === stepId);
      const response = await fetch(`https://api.testerally.ai/api/teststeps/${stepId}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testcase: editingTestCase.id,
          step_number: step.step_number,
          step_description: editStepValue.trim()
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update step");
      }

      await fetchTestSteps(editingTestCase.id);
      setEditingStep(null);
      setEditStepValue("");
    } catch (error) {
      setError("Failed to update step");
      console.error("Error updating step:", error);
    }
  };


  const handleDeleteStep = async (stepId) => {
    if (!window.confirm("Are you sure you want to delete this step?")) return;

    try {
      const response = await fetch(`https://api.testerally.ai/api/teststeps/${stepId}/?testcase_id=${editingTestCase.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete step");
      }

      await fetchTestSteps(editingTestCase.id);
    } catch (error) {
      setError("Failed to delete step");
      console.error("Error deleting step:", error);
    }
  };

  const handleSave = async () => {
    if (!editingTestCase.name || !editingTestCase.type || !editingTestCase.priority) {
      setError("All fields are required");
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/testcases/${editingTestCase.id}/?project_id=${selectedProject.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editingTestCase.name,
            testcase_type: editingTestCase.type,
            testcase_priority: editingTestCase.priority
          }),
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update test case");
      }
  
      const result = await response.json();
  
      setTestCases(prevTestCases => 
        prevTestCases.map(testCase => 
          testCase.id === editingTestCase.id 
            ? { 
                ...testCase, 
                name: result.name, 
                testcase_type: result.testcase_type, 
                testcase_priority: result.testcase_priority 
              } 
            : testCase
        )
      );
  
      setEditingTestCase(null);
      setError(null);
    } catch (error) {
      console.error("Error saving test case:", error);
      setError(error.message || "Failed to update test case");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (testCase) => {
    navigate(`/test-cases/${testCase.id}/steps`, {
      state: {
        testCaseName: testCase.name,
        testCaseId: testCase.id,
        projectId: selectedProject.id
      }
    });
  };


  const handleDelete = async (testCaseId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this test case?");
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/testcases/${testCaseId}/?project_id=${selectedProject.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete test case");
      }

      setTestCases((prevTestCases) => prevTestCases.filter((testCase) => testCase.id !== testCaseId));
    } catch (error) {
      console.error("Error deleting test case:", error);
      setError("Failed to delete test case");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingTestCase(null);
  };


  const renderEditModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white shadow-xl rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Edit Test Case</h3>
            <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
  
          {/* Tab Navigation */}
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('details')}
            >
              Test Case Details
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'steps' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('steps')}
            >
              Test Steps
            </button>
          </div>
  
          {/* Tab Content */}
          {activeTab === 'details' ? (
            <>
              <div className="grid gap-4">
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
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newStepValue}
                  onChange={(e) => setNewStepValue(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                  placeholder="Enter new test step"
                />
                <button
                  onClick={handleAddStep}
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Step
                </button>
              </div>
  
              <div className="space-y-2">
                {testSteps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2 p-2 border rounded-md">
                    <span className="min-w-[40px] text-sm font-medium">#{step.step_number}</span>
                    {editingStep === step.id ? (
                      <>
                        <input
                          type="text"
                          value={editStepValue}
                          onChange={(e) => setEditStepValue(e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded-md"
                        />
                        <button
                          onClick={() => handleUpdateStep(step.id)}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingStep(null);
                            setEditStepValue("");
                          }}
                          className="p-1 text-gray-600 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1">{step.step_description}</span>
                        <button
                          onClick={() => {
                            setEditingStep(step.id);
                            setEditStepValue(step.step_description);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStep(step.id)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-center p-4 border-b">
              <div className="flex space-x-4 mb-4 sm:mb-0">
                <button className="px-4 py-2 text-purple-600 font-medium border-b-2 border-purple-600">
                  Test Cases
                </button>
                <button className="px-4 py-2 text-gray-500 hover:text-purple-600">
                  Step Groups
                </button>
              </div>
              <button
                onClick={() => navigate("/test-cases/create-testcases")}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 lg:mt-0 sm:mt-3"
                disabled={!selectedProject}
              >
                <AiOutlinePlus className="mr-2" />
                Create
              </button>
            </div>

            <div className="p-4 flex flex-col lg:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <h2 className="text-lg font-medium text-gray-700">
                {selectedProject ? `Test Cases  ${/* Commented out selectedProject.name */ ''}` : 'Select a Project'}
              </h2>
              {selectedProject && (
                <div className="relative w-full sm:w-64">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search test cases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            {loading ? (
              <div className="p-4 text-center">Loading test cases...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : !selectedProject ? (
              <div className="p-4 text-center text-gray-500">
                Please select a project from the sidebar to view test cases
              </div>
            ) : filteredTestCases.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No test cases found for this project
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
{/*                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th> */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTestCases.map((testCase) => (
                      <tr key={testCase.id} className="hover:bg-gray-50">
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer hover:text-purple-600" onClick={() => handleRowClick(testCase)} >
                          {testCase.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {testCase.testcase_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {testCase.testcase_priority}
                        </td>
{/*                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {testCase.project_name}
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); 
                              handleEdit(testCase);
                            }}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button

                          onClick={(e) => {
                            e.stopPropagation(); 
                            handleDelete(testCase.id);
                          }}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors duration-200 ml-2"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {editingTestCase && renderEditModal (
 {/* <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
    <div className="bg-white shadow-xl rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Edit Test Case</h3>
          <button 
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editingTestCase.name}
              onChange={(e) => setEditingTestCase(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Case Type<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={editingTestCase.type}
                onChange={(e) => setEditingTestCase(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 appearance-none transition-all duration-200 pr-8"
              >
                <option value="">Select Type</option>
                {testCaseTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
              
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Case Priority<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={editingTestCase.priority}
                onChange={(e) => setEditingTestCase(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 appearance-none transition-all duration-200 pr-8"
              >
                <option value="">Select Priority</option>
                {testCasePriorities.map((priority) => (
                  <option key={priority.id} value={priority.priority_level}>
                    {priority.priority_level}
                  </option>
                ))}
              </select>
              
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors duration-200"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div> */}
)}
        </div>
      </div>
    </div>
  );
};

export default TestCases;