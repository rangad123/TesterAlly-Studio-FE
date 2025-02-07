import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Tag,
} from "lucide-react";

const AdminProjectDetails = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [testCases, setTestCases] = useState([]);
  const [testSuites, setTestSuites] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      return;
    }

    const savedProjectKey = `selectedProject_${userId}`;
    const savedProject = localStorage.getItem(savedProjectKey);

    if (savedProject) {
      try {
        const project = JSON.parse(savedProject);
        setSelectedProject(project);
        fetchTestCases(project.id);
        fetchTestSuites(project.id);
        fetchMembers(project.id);
      } catch (error) {
        console.error("Error parsing saved project:", error);
        navigate("/admin-dashboard");
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
        fetchMembers(newProject.id);
      }
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, [navigate]);

  const fetchMembers = async (projectId) => {
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/projects/${projectId}/members/`
      );
      const data = await response.json();
      if (response.ok) {
        setMembers(data);
        console.log("Members", data);
      }
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

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

  const renderProjectDetails = () => {
    if (!selectedProject) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
              {selectedProject.name}
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <Tag className="w-5 h-5 mr-2" />
                <span className="font-medium mr-2">Type:</span>
                <span>{selectedProject.project_type || "Not specified"}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-2" />
                <span className="font-medium mr-2">Created:</span>
                <span>
                  {selectedProject.created_at
                    ? new Date(selectedProject.created_at).toISOString().replace("T", ", ").slice(0, 20)
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-medium mr-2">Last updated:</span>
                <span>
                  {selectedProject.updated_at
                    ? new Date(selectedProject.updated_at).toISOString().replace("T", ", ").slice(0, 20)
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
              {["test-cases", "test-suites", "members"].map((tab) => (
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
                          Test Cases: {suite.test_cases_count || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "members" && (
              <div className="bg-white rounded-lg">
                {members.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No members available</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {member.name}
                            </h4>
                            <p className="text-gray-600 mt-1">
                              {member.email}
                            </p>
                            <div className="mt-2 space-y-1">
                              <div className="text-sm text-gray-500">
                                <span className="font-medium">Phone:</span> {member.phone || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                <span className="font-medium">Country:</span> {member.country || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                <span className="font-medium">Added:</span> {new Date(member.added_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            member.invitation_status === "Accepted" 
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {member.invitation_status}
                          </span>
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
      <div className="flex-1 transition-all duration-300 sm:ml-[60px] sm:max-w-full">
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
                onClick={() => navigate("/admin-dashboard")}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProjectDetails;