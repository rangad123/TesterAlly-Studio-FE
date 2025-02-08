import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  X,
  Edit2,
  Trash2,
  ChevronDown,
  Calendar,
  User,
  Clock,
  Tag,
} from "lucide-react";

const ProjectDetails = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [testCases, setTestCases] = useState([]);
  const [testSuites, setTestSuites] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const userName = localStorage.getItem("userName") || "User Name";
  const userId = localStorage.getItem("userId");
  const projectTypes = [
    "Web Development",
    "Mobile Application",
    "API Development",
    "Data Analysis",
  ];

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      return;
    }

    const savedProjectKey = `selectedProject_${userId}`;
    const savedProject = localStorage.getItem(savedProjectKey);

    console.log("selected project", savedProject);

    if (savedProject) {
      try {
        const project = JSON.parse(savedProject);
        setSelectedProject(project);
        fetchTestCases(project.id);
        fetchTestSuites(project.id);
      } catch (error) {
        console.error("Error parsing saved project:", error);
        navigate("/dashboard-user");
      }
    }

    setLoading(false);

    const handleProjectChange = (event) => {
      const newProject = event.detail;

      if (newProject) {
        setSelectedProject(newProject);
        localStorage.setItem("selectedProject", JSON.stringify(newProject));
        fetchTestCases(newProject.id);
        fetchTestSuites(newProject.id);
      }
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () =>
      window.removeEventListener("projectChanged", handleProjectChange);
  }, [navigate]);

  const fetchTestCases = async (projectId) => {
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/testcases/?project_id=${projectId}`
      );
      const data = await response.json();
      if (response.ok) {
        setTestCases(data);

        console.log("Test cases", data);
      }
    } catch (err) {
      console.error("Error fetching test cases:", err);
    }
  };

  const fetchTestSuites = async (projectId) => {
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/testsuites/?project_id=${projectId}`
      );
      const data = await response.json();
      if (response.ok) {
        setTestSuites(data);

        console.log("Test suites", data);
      }
    } catch (err) {
      console.error("Error fetching test suites:", err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;

    try {
      if (!projectId || !userId) {
        alert(!projectId ? "Invalid project ID." : "Invalid user ID.");
        return;
      }

      const deleteResponse = await fetch(
        `https://api.testerally.ai/api/projects/${projectId}/?user_id=${userId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (deleteResponse.ok) {
        const currentUser = localStorage.getItem("userId");
        localStorage.removeItem(`selectedProject_${currentUser}`);
        localStorage.removeItem("selectedProject");

        window.dispatchEvent(
          new CustomEvent("projectDeleted", {
            detail: { projectId },
          })
        );

        alert("Project deleted successfully.");
        setSelectedProject(null);
        navigate("/dashboard-user");
      } else {
        const errorData = await deleteResponse.json();
        console.error("Delete failed:", errorData);
        alert(errorData.message || "Failed to delete project.");
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      alert("An error occurred while deleting the project. Please try again.");
    }
  };

  const handleEditClick = (project) => {
    setSelectedProject({ ...project, isEditing: true });
    setIsEditModalOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setSelectedProject((prev) => ({ ...prev, isEditing: false }));
  };

  const handleChange = (field, value) => {
    setSelectedProject((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/projects/${selectedProject.id}/?user_id=${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: selectedProject.name,
            description: selectedProject.description,
            project_type: selectedProject.project_type,
          }),
        }
      );

      if (response.ok) {
        const updatedProject = await response.json();

        setSelectedProject(updatedProject);

        const savedProjectKey = `selectedProject_${userId}`;
        localStorage.setItem(savedProjectKey, JSON.stringify(updatedProject));
        localStorage.setItem("selectedProject", JSON.stringify(updatedProject));

        setIsEditModalOpen(false);
        alert("Project updated successfully.");
      }
    } catch (err) {
      console.error("Error updating project:", err);
      alert("An error occurred while updating the project.");
    }
  };

  const renderEditModal = () => {
    if (!isEditModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white shadow-xl rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Edit Project
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={selectedProject.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={selectedProject.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Type
                </label>
                <div className="relative">
                  <select
                    value={selectedProject.project_type || ""}
                    onChange={(e) =>
                      handleChange("project_type", e.target.value)
                    }
                    className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 appearance-none transition-all duration-200 pr-8"
                  >
                    {projectTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                  onClick={handleCancelEdit}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors duration-200"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectDetails = () => {
    if (!selectedProject) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
              {selectedProject.name}
            </h1>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEditClick(selectedProject)}
                className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Project
              </button>
              <button
                onClick={() => handleDeleteProject(selectedProject.id)}
                className="inline-flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Project
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <Tag className="w-5 h-5 mr-2" />
                <span className="font-medium mr-2">Type:</span>
                <span>{selectedProject.project_type || "Not specified"}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <User className="w-5 h-5 mr-2" />
                <span className="font-medium mr-2">Created by:</span>
                <span>{userName}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-2" />
                <span className="font-medium mr-2">Created:</span>
                <span>
                  {selectedProject.created_at
                    ? new Date(selectedProject.created_at)
                        .toISOString()
                        .replace("T", ", ")
                        .slice(0, 20)
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-medium mr-2">Last updated:</span>
                <span>
                  {selectedProject.updated_at
                    ? new Date(selectedProject.updated_at)
                        .toISOString()
                        .replace("T", ", ")
                        .slice(0, 20)
                    : "N/A"}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">
                {selectedProject.description || "No description provided"}
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex space-x-4 mb-6 overflow-x-auto">
              {["test-cases", "test-suites"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    activeTab === tab
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </button>
              ))}
            </div>

            {activeTab === "test-cases" && (
              <div className="bg-white rounded-lg">
                {testCases.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No test cases available</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {testCases.map((testCase) => (
                      <div
                        key={testCase.id}
                        className="p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <h4 className="font-medium text-gray-900">
                          {testCase.name}
                        </h4>
                        <p className="mt-1">
                          <span className="text-gray-900 ">Test Case Type:</span>{" "}
                          <span className="text-gray-600">{testCase.testcase_type || "N/A"}</span>
                        </p>

                        <p className="mt-1">
                          <span className="text-gray-900">Test Case Priority:</span>{" "}
                          <span className="text-gray-600">{testCase.testcase_priority || "N/A"}</span>
                        </p>

                        {testCase.steps && testCase.steps.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-gray-900 font-semibold">Test Steps:</h5>
                            <ul className="list-disc pl-5 text-gray-700 mt-1">
                            {testCase.steps.map((step) => (
                              <li key={step.id}>
                                <span className="font-medium">Step {step.step_number}:</span> {step.step_description}
                              </li>
                            ))}
                            </ul>
                          </div>
                        )}

                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {testCase.status || "Not Started"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "test-suites" && (
              <div className="bg-white rounded-lg">
                {testSuites.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No test suites available</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {testSuites.map((suite) => (
                      <div
                        key={suite.id}
                        className="p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <h4 className="font-medium text-gray-900">
                          {suite.title}
                        </h4>
                        <p className="text-gray-600 mt-1">
                          <span className="text-gray-900">Description:</span>{" "}
                          {suite.description || "N/A"}
                        </p>
                        <p className="text-gray-600 mt-1">
                          <span className="text-gray-900">Pre-Requisite:</span>{" "}
                          {suite.pre_requisite || "N/A"}
                        </p>
                        <div className="mt-2 text-sm text-gray-500">
                          Test Cases: {suite.testcase.length || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-4 md:p-6">
          {loading ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-600 text-lg mb-4">Loading projects...</p>
            </div>
          ) : selectedProject ? (
            renderProjectDetails()
          ) : (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-600 text-lg mb-4">No project selected</p>
              <button
                onClick={() => navigate("/dashboard-user")}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
      {renderEditModal()}
    </div>
  );
};

export default ProjectDetails;
