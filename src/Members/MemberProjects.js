import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MemberSidebar from "./MemberSidebar";

const MemberProjects = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ projects: [], test_cases: [], test_suites: [], requirements: [] });
  const [loading, setLoading] = useState(true);
  const [isRepoCloned, setIsRepoCloned] = useState(null);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const checkCloneStatusAndFetchData = async () => {
      if (!userId) return;
      
      setLoading(true);
      
      try {
        const cloneResponse = await fetch(`http://127.0.0.1:8000/integrate/clone_status/?user_id=${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (cloneResponse.ok) {
          const cloneData = await cloneResponse.json();
          const isCloned = cloneData.cloned || false;
          setIsRepoCloned(isCloned);

          if (isCloned) {
            const response = await fetch(`http://127.0.0.1:8000/integrate/project/?user_id=${userId}`);
            const result = await response.json();
            console.log("Projects", result);
            setData(result);
          }
        } else {
          console.error("Failed to check clone status");
          setIsRepoCloned(false);
        }
      } catch (err) {
        console.error("Error:", err);
        setIsRepoCloned(false);
      } finally {
        setLoading(false);
      }
    };

    checkCloneStatusAndFetchData();
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
            <h2 className="mb-6 text-2xl font-semibold text-gray-800">My Projects</h2>

            {/* Loading Indicator */}
            {loading ? (
              <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <p className="text-gray-600 text-lg mb-4">Loading...</p>
              </div>
            ) : isRepoCloned === false ? (
              <div className="text-center p-8 bg-red-50 rounded-lg shadow-md border border-red-200">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Repository Not Cloned</h3>
                <p className="text-red-600 mb-4">
                  You need to clone the repository first to access your projects.
                </p>
                <button
                  onClick={() => navigate("/member-github")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clone Repository
                </button>
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
                      key={project.project_name}
                      onClick={() => handleProjectClick(project)}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden"
                    >
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{project.project_name}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {project.description || "No description provided"}
                        </p>
                        <div className="text-sm text-gray-500">
                          <p className="mb-1">Project Type: {project.project_type || "N/A"}</p>
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