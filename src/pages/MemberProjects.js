import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MemberSidebar from "./MemberSidebar";

const MemberProjects = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ projects: [], test_cases: [], test_suites: [], requirements: [] });
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://api.testerally.ai/api/user-projects/${userId}/`);
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

  return (
    <div>
      <MemberSidebar />
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
          <div className="p-6">
            <h2 className="mb-6 text-2xl font-semibold text-gray-800">My Projects</h2>

            {/* Loading Indicator */}
            {loading ? (
              <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <p className="text-gray-600 text-lg mb-4">Loading projects...</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {data.projects.length === 0 ? (
                  <div className="col-span-full text-center py-6 text-gray-500 bg-white rounded-lg shadow-md">
                    No projects available.
                  </div>
                ) : (
                  data.projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden"
                    >
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{project.name}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {project.description || "No description provided"}
                        </p>
                        <div className="text-sm text-gray-500">
                          <p className="mb-1">Project Type: {project.project_type || "N/A"}</p>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-blue-600">
                              {data.test_cases.filter(tc => tc.project_id === project.id).length}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Test Cases</div>
                          </div>
                          <div className="text-center border-l border-r border-gray-200">
                            <div className="text-2xl font-semibold text-green-600">
                              {data.test_suites.filter(ts => ts.project_id === project.id).length}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Test Suites</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-purple-600">
                              {data.requirements.filter(req => req.project_id === project.id).length}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Requirements</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProjects;