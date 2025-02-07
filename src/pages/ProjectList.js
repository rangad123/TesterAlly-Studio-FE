import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


const ProjectList = () => {
  const navigate = useNavigate();
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");
  

  useEffect(() => {
    const fetchAllProjects = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.testerally.ai/api/projects/?user_id=${userId}`
        );
        const data = await response.json();

        console.log("Projects", data);

        if (response.ok) {
          setAllProjects(data.reverse());
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAllProjects();
    }
  }, [userId]);

  const handleProjectClick = (project) => {

    const currentUser = localStorage.getItem("userId");
    const savedProjectKey = `selectedProject_${currentUser}`;
    localStorage.setItem(savedProjectKey, JSON.stringify(project));
    localStorage.setItem("selectedProject", JSON.stringify(project));


    window.dispatchEvent(new CustomEvent("projectChanged", { 
      detail: project 
    }));


    window.dispatchEvent(new CustomEvent("showProjectSidebar", { 
      detail: true 
    }));

    navigate("/test-cases")

  };

  const renderProjectRow = (project) => {
    return (
      <tr
        key={project.id} 
        className="group hover:bg-gray-50 transition-colors duration-200 border-b cursor-pointer"
        onClick={() => handleProjectClick(project)}
      >
        <td className="px-6 py-4 text-sm text-gray-900">
          <span className="font-medium">{project.name}</span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
          {project.description || "N/A"}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
          {project.project_type || "N/A"}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
          {project.created_at ? new Date(project.created_at).toLocaleDateString() : "N/A"}
        </td>

      </tr>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <h2 className="mb-6 text-2xl font-semibold text-gray-800">Projects List</h2>

          {loading ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-600 text-lg mb-4">Loading projects...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {allProjects.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                  <p className="text-gray-600 text-lg mb-4">You have no projects yet.</p>
                  <p className="text-gray-500">Please create a project to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                  <table className="min-w-full table-auto">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          created At
                        </th>

                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allProjects.map((project) => renderProjectRow(project))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectList;