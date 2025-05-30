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
        const response = await fetch(`http://127.0.0.1:8000/integrate/project/?user_id=${userId}`);
        const result = await response.json();
        console.log("Projects", result);

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

    const currentUser = localStorage.getItem("userId");
    const savedProjectKey = `selectedProject_${currentUser}`;
    localStorage.setItem(savedProjectKey, JSON.stringify(project));
    localStorage.setItem("selectedProject", JSON.stringify(project));

    
    window.dispatchEvent(new CustomEvent("projectChanged", { detail: project }));
    window.dispatchEvent(new CustomEvent("showProjectSidebar", { detail: true }));
    
    navigate("/member-project-details");
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
                        key={project.project_name}
                        onClick={() => handleProjectClick(project)}
                        className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
                      >
                        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
                          {project.project_name}
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

                      </div>
                    ))}
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