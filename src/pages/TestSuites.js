import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { AiOutlinePlus } from "react-icons/ai";
import { Save, X, Edit2, Trash2 } from 'lucide-react';

const TestSuites = () => {
  const navigate = useNavigate();
  const [testSuites, setTestSuites] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedLabels, setEditedLabels] = useState([]);
  const [editedPreRequisite, setEditedPreRequisite] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
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
    const fetchTestSuites = async (projectId) => {
      setLoading(true);
      if (!selectedProject?.project_name) {
        setLoading(false);
        return;
      }
      const userId = localStorage.getItem("userId");

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/integrate/testsuite/?user_id=${userId}&project_name=${projectId}`,
          {
            headers: {
              "Content-Type": "application/json",
            }
          }
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch test suites");
        }

        const data = await response.json();
        console.log("testsuite data :", data);
        setTestSuites(Array.isArray(data.testsuites) ? data.testsuites : []);
        
      } catch (error) {
        console.error("Error fetching test suites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestSuites(selectedProject?.project_name);
  }, [selectedProject]);

  
  const handleViewTestSuite = (testSuite) => {
    navigate("/testsuite", {
      state: {
        testSuiteName: testSuite.title,
        projectId: selectedProject?.project_name,
        testSuite: testSuite,
        ProjectType: selectedProject?.project_type
      }
    });
  };

  const filteredTestSuites = (Array.isArray(testSuites) ? testSuites : []).filter((testSuite) =>
    testSuite.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (testSuiteTitle) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this test suite?");
    if (!confirmDelete) return;

    setLoading(true);
    const userId = localStorage.getItem("userId");
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/integrate/testsuite/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            project_name: selectedProject.project_name,
            title: testSuiteTitle
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete test suite");
      }

      setTestSuites((prevTestSuites) => 
        prevTestSuites.filter((testSuite) => testSuite.title !== testSuiteTitle)
      );
      
      alert("Test suite deleted successfully!");
    } catch (error) {
      console.error("Error deleting test suite:", error);
      alert("Failed to delete test suite");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (testSuite) => {
    setEditingId(testSuite.title); // Use title as ID since that's what the backend expects
    setEditedTitle(testSuite.title);
    setEditedDescription(testSuite.description);
    setEditedLabels(testSuite.labels || []);
    setEditedPreRequisite(testSuite.pre_requisite || "");
  };

  const handleSave = async (testSuiteTitle) => {
    console.log('Saving test suite with title:', testSuiteTitle);
    console.log('Edited data:', {
      title: editedTitle,
      description: editedDescription,
      labels: editedLabels,
      pre_requisite: editedPreRequisite,
    });

    const formattedLabels = Array.isArray(editedLabels) ? editedLabels : editedLabels.split(',').map(label => label.trim());
  
    if (!editedTitle || !editedDescription || !formattedLabels.length || !editedPreRequisite) {
      alert('All fields are required');
      return;
    }
  
    setLoading(true);
    const userId = localStorage.getItem("userId");
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/integrate/testsuite/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            project_name: selectedProject.project_name,
            title: testSuiteTitle, // Original title for identification
            description: editedDescription,
            labels: formattedLabels, 
            pre_requisite: editedPreRequisite,
          }),
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update test suite: ${errorData.error || response.status}`);
      }
  
      // Update the local state
      const updatedTestSuites = testSuites.map((testSuite) =>
        testSuite.title === testSuiteTitle
          ? { 
              ...testSuite, 
              title: editedTitle, 
              description: editedDescription, 
              labels: formattedLabels, 
              pre_requisite: editedPreRequisite 
            }
          : testSuite
      );
  
      setTestSuites(updatedTestSuites);
      setEditingId(null);
      alert("Test suite updated successfully!");
    } catch (error) {
      console.error("Error saving test suite:", error);
      alert(`Failed to update test suite: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setEditingId(null);
    setEditedTitle("");
    setEditedDescription("");
    setEditedLabels([]);
    setEditedPreRequisite("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-center p-4 border-b">
              <div className="flex space-x-4 mb-4 sm:mb-0">
                <button className="px-4 py-2 text-purple-600 font-medium border-b-2 border-purple-600">
                  Test Suites
                </button>
                <button className="px-4 py-2 text-gray-500 hover:text-purple-600">
                  Step Groups
                </button>
              </div>
              <button
                onClick={() => navigate("/test-suites/create-testsuite")}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 lg:mt-0 sm:mt-3"
              >
                <AiOutlinePlus className="mr-2" />
                Create
              </button>
            </div>

            <div className="p-4 flex flex-col lg:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <h2 className="text-lg font-medium text-gray-700">
                {selectedProject ? `Test Suites` : 'Select a Project'}
              </h2>
              {selectedProject && (
                <div className="relative w-full sm:w-64">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search test suites..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-4 text-center">Loading test suites...</div>
            ) : !selectedProject ? (
              <div className="p-4 text-center text-gray-500">
                Please select a project from the sidebar to view test suites
              </div>
            ) : filteredTestSuites.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No test suites found for this project
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
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Labels
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test Cases
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTestSuites.map((testSuite) => (
                      <tr key={testSuite.title}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span 
                            className="cursor-pointer text-purple-600 hover:text-purple-800"
                            onClick={() => handleViewTestSuite(testSuite)}
                          >
                            {testSuite.title}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {testSuite.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Array.isArray(testSuite.labels) ? testSuite.labels.join(", ") : testSuite.labels}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Array.isArray(testSuite.testcase) && testSuite.testcase.length > 0
                            ? testSuite.testcase.join(', ')
                            : "No Test Cases"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(testSuite)}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(testSuite.title)}
                              className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors duration-200 ml-2"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {editingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white shadow-xl rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Edit Test Suite</h3>
                    <button 
                      onClick={handleCancel}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="grid gap-4">
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
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Labels (comma-separated)</label>
                      <input
                        type="text"
                        value={Array.isArray(editedLabels) ? editedLabels.join(", ") : editedLabels}
                        onChange={(e) => setEditedLabels(e.target.value.split(",").map(label => label.trim()))}
                        placeholder="e.g., smoke, regression, api"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <button
                        onClick={() => handleSave(editingId)}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors duration-200 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors duration-200"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestSuites;