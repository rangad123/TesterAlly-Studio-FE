import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const ProjectList = () => {
  const navigate = useNavigate();
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncScenario, setSyncScenario] = useState(null);
  const [missingProjects, setMissingProjects] = useState([]);

  const fetchAllProjects = useCallback(async () => {
    setLoading(true);
    try {
      const [dbResponse, localResponse] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/projects/?user_id=${userId}`),
        fetch(`http://127.0.0.1:8000/integrate/project/?user_id=${userId}`)
      ]);

      if (dbResponse.ok && localResponse.ok) {
        const dbData = await dbResponse.json();
        const localData = await localResponse.json();

        console.log("project-list:",localData)

        // Only show matching projects
        const matchingProjects = localData.projects.filter(localProject =>
          dbData.some(dbProject => dbProject.name === localProject.project_name)
        );

        setAllProjects(matchingProjects.reverse());
      } else {
        console.error("Error fetching projects from APIs");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAllProjects();
  }, [fetchAllProjects]);

  const checkSyncScenarios = async () => {
    setLoading(true);
    try {
      const [dbResponse, localResponse] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/projects/?user_id=${userId}`),
        fetch(`http://127.0.0.1:8000/integrate/project/?user_id=${userId}`)
      ]);

      if (dbResponse.ok && localResponse.ok) {
        const dbData = await dbResponse.json();
        const localData = await localResponse.json();

        const dbNotInLocal = dbData.filter(dbProject =>
          !localData.projects.some(localProject =>
            localProject.project_name === dbProject.name
          )
        );

        const localNotInDb = localData.projects.filter(localProject =>
          !dbData.some(dbProject =>
            dbProject.name === localProject.project_name
          )
        );

        if (dbNotInLocal.length > 0) {
          setSyncScenario("dbToLocal");
          setMissingProjects(dbNotInLocal);
          setShowSyncModal(true);
        } else if (localNotInDb.length > 0) {
          setSyncScenario("localOnly");
          setMissingProjects(localNotInDb);
          setShowSyncModal(true);
        } else {
          // If no sync issues, just fetch normally
          fetchAllProjects();
        }
      }
    } catch (err) {
      console.error("Error checking sync:", err);
      fetchAllProjects();
    } finally {
      setLoading(false);
    }
  };

  const syncDbToLocal = async () => {
    try {
      const syncedProjects = [];

      for (const project of missingProjects) {
        const projectData = {
          user_id: parseInt(userId),
          project_name: project.name,
          description: project.description || "No description provided",
          project_type: project.project_type
        };

        const response = await fetch("http://127.0.0.1:8000/integrate/project/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData)
        });

        if (response.ok) {
          syncedProjects.push(projectData); 
        }
      }
      setShowSyncModal(false);

      syncedProjects.forEach(project => {
        window.dispatchEvent(new CustomEvent("projectChanged", { detail: project }));
      });

      fetchAllProjects();
      alert("Projects synced successfully!");
    } catch (error) {
      console.error("Error syncing projects:", error);
      alert("Error syncing projects. Please try again.");
    }
  };

  const handleProjectClick = (project) => {
    const currentUser = localStorage.getItem("userId");
    const savedProjectKey = `selectedProject_${currentUser}`;
    localStorage.setItem(savedProjectKey, JSON.stringify(project));
    localStorage.setItem("selectedProject", JSON.stringify(project));

    window.dispatchEvent(new CustomEvent("projectChanged", { detail: project }));
    window.dispatchEvent(new CustomEvent("showProjectSidebar", { detail: true }));

    navigate("/test-cases");
  };


  const renderProjectRow = (project) => (
    <tr
      key={project.project_name}
      className="group hover:bg-gray-50 transition-colors duration-200 border-b cursor-pointer"
      onClick={() => handleProjectClick(project)}
    >
      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{project.project_name}</td>
      <td className="px-6 py-4 text-sm text-gray-500">{project.description || "N/A"}</td>
      <td className="px-6 py-4 text-sm text-gray-500">{project.project_type || "N/A"}</td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {project.created_at ? new Date(project.created_at).toLocaleDateString() : "N/A"}
      </td>
    </tr>
  );

  return (
    <div className="flex justify-center mt-5">
      <div className="w-full max-w-5xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Projects List</h2>
          <button
            onClick={checkSyncScenarios}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
          >
            Refresh Projects
          </button>
        </div>

        {loading ? (
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg mb-4">Loading projects...</p>
          </div>
        ) : allProjects.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg mb-4">You have no projects yet.</p>
            <p className="text-gray-500">Please create a project to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white shadow-md rounded-lg">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">Project Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">Description</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">Project Type</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allProjects.map((project) => renderProjectRow(project))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sync modal */}
        {showSyncModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              {syncScenario === "dbToLocal" ? (
                <>
                  <h3 className="text-lg font-semibold mb-4">Projects Found in Database</h3>
                  <p className="mb-4">
                    You have {missingProjects.length} project(s) in your database that are not in your local storage.
                    Would you like to sync them?
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowSyncModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={syncDbToLocal}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Continue
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-4">Local Projects Not in Database</h3>
                  <p className="mb-4">
                    You have {missingProjects.length} project(s) in local storage that are not present in the database.
                    You can't use these projects.
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowSyncModal(false)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      OK
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
