import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MemberSidebar from "./MemberSidebar";
import {
  Calendar,
  Clock,
  Tag,
} from "lucide-react";

const MemberProjectDetails = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ projects: [], test_cases: [], test_suites: [], requirements: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://testerally-be-ylpr.onrender.com/api/user-projects/${userId}/`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchData();
  }, [userId]);

  const handleProjectClick = (project) => {
    const projectData = {
      ...project,
      test_cases: data.test_cases.filter(tc => tc.project_id === project.id),
      test_suites: data.test_suites.filter(ts => ts.project_id === project.id),
      requirements: data.requirements.filter(req => req.project_id === project.id),
    };

    localStorage.setItem(`selectedProject_${userId}`, JSON.stringify(projectData));
    localStorage.setItem("selectedProject", JSON.stringify(projectData));
    
    window.dispatchEvent(new CustomEvent("projectChanged", { detail: projectData }));
    window.dispatchEvent(new CustomEvent("showProjectSidebar", { detail: true }));
    
    navigate("/member-project-details");
  };

  const handleAddNew = (type) => {
    navigate("/member-create-testcase");
  };

  return (
    <div>
      <MemberSidebar />
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
          <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Project Details</h1>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex -mb-px">
              {['projects', 'test-cases', 'test-suites', 'requirements'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.replace('-', ' ').toUpperCase()}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="mt-6">
            {loading ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">Loading data...</p>
              </div>
            ) : (
              <>
                {/* Projects Tab */}
                {activeTab === "projects" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {data.projects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => handleProjectClick(project)}
                        className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
                      >
                        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
                          {project.name}
                        </h1>
                        <div className="flex items-center text-gray-600 mt-2">
                          <Tag className="w-5 h-5 mr-2" />
                          <span className="font-medium mr-2">Type:</span>
                          <span>{project.project_type || "Not specified"}</span>
                        </div>

                        <div className="flex items-center text-gray-600 mt-3">
                          <Calendar className="w-5 h-5 mr-2" />
                          <span className="font-medium mr-2">Created:</span>
                          <span>
                          {project.created_at
                            ? new Date(project.created_at)
                              .toISOString()
                              .replace("T", ", ")
                              .slice(0, 20)
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600 mt-3">
                          <Clock className="w-5 h-5 mr-2" />
                          <span className="font-medium mr-2">Last updated:</span>
                            <span>
                              {project.updated_at
                                ? new Date(project.updated_at)
                                  .toISOString()
                                  .replace("T", ", ")
                                  .slice(0, 20)
                                  : "N/A"}
                              </span>
                          </div>
                        <div className="bg-gray-50 p-4 rounded-lg mt-4">
                          <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                          <p className="text-gray-600">
                            {project.description || "No description provided"}
                          </p>
                        </div>

                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Test Cases:</span>
                            <span className="font-medium">{data.test_cases.filter(tc => tc.project_id === project.id).length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Test Suites:</span>
                            <span className="font-medium">{data.test_suites.filter(ts => ts.project_id === project.id).length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Requirements:</span>
                            <span className="font-medium">{data.requirements.filter(req => req.project_id === project.id).length}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Test Cases Tab */}
                {activeTab === "test-cases" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Test Cases</h2>
                      <button
                        onClick={() => handleAddNew('test-case')}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                      >
                        <span className="text-lg">+</span> Add Test Case
                      </button>
                    </div>
                    <div className="space-y-4">
                      {data.test_cases.map((tc) => (
                        <div key={tc.id} className="bg-white rounded-lg shadow p-6">
                          <h3 className="text-lg font-semibold mb-2">{tc.name}</h3>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <span className="text-gray-500">Type:</span>
                              <span className="ml-2">{tc.testcase_type}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Priority:</span>
                              <span className="ml-2">{tc.testcase_priority}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {tc.steps.map((step, index) => (
                              <div key={step.id} className="flex gap-2">
                                <span className="text-gray-500">{index + 1}.</span>
                                <p>{step.step_description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Suites Tab */}
                {activeTab === "test-suites" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Test Suites</h2>
                      <button
                        onClick={() => handleAddNew('test-suite')}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                      >
                        <span className="text-lg">+</span> Add Test Suite
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {data.test_suites.map((ts) => (
                        <div key={ts.id} className="bg-white rounded-lg shadow p-6">
                          <h3 className="text-lg font-semibold mb-2">{ts.title}</h3>
                          <p className="text-gray-600 mb-2">{ts.description}</p>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Pre-requisite:</span> {ts.pre_requisite}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements Tab */}
                {activeTab === "requirements" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Requirements</h2>
                      <button
                        onClick={() => handleAddNew('requirement')}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                      >
                        <span className="text-lg">+</span> Add Requirement
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {data.requirements.map((req) => (
                        <div key={req.id} className="bg-white rounded-lg shadow p-6">
                          <h3 className="text-lg font-semibold mb-2">{req.title}</h3>
                          <p className="text-gray-600 mb-2">{req.description}</p>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Type:</span> {req.type}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div></div></div>
  );
};

export default MemberProjectDetails;