import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../pages/style.css";
import MemberSidebar from "./MemberSidebar";

const MemberDashBoard = () => {
  const [showCloneWarning, setShowCloneWarning] = useState(false);
  const [gitStatus, setGitStatus] = useState(null); // Will store the complete git status
  const [isRepoCloned, setIsRepoCloned] = useState(null);
  const [clonePath, setClonePath] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkGitHubConnectionAndCloneStatus = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem("userId");

        if (!userId) {
          console.error("User ID not found");
          setLoading(false);
          return;
        }

        await syncProjectsOnLogin();

        const gitResponse = await fetch(`http://127.0.0.1:8000/integrate/git_status/?user_id=${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (gitResponse.ok) {
          const gitData = await gitResponse.json();
          console.log("GitHub response:", gitData);
          setGitStatus(gitData);

          // If admin has connected with GitHub and repository is assigned
          if (gitData.connected && gitData.repository) {
            // Check clone status
            await checkCloneStatus(userId);
          }
        } else {
          console.error("Failed to check GitHub connection");
          setGitStatus({ connected: false });
        }
      } catch (error) {
        console.error("Error checking GitHub connection:", error);
        setGitStatus({ connected: false });
      } finally {
        setLoading(false);
      }
    };

    checkGitHubConnectionAndCloneStatus();
  }, []); 

  const syncProjectsOnLogin = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      // Fetch projects from both APIs
      const [localResponse, dbResponse] = await Promise.all([
        fetch(`http://127.0.0.1:8000/integrate/project/?user_id=${userId}`),
        fetch(`http://127.0.0.1:8000/api/user-projects/${userId}`)
      ]);

      const localData = localResponse.ok ? await localResponse.json() : { projects: [] };
      const dbData = dbResponse.ok ? await dbResponse.json() : {};

      const localProjects = localData.projects || [];
      const dbProjects = dbData.projects || []; // Extract only projects from the response

      console.log("Local projects:", localProjects);
      console.log("DB projects:", dbProjects);

      // If local is empty but DB has projects, sync them to local
      if (localProjects.length === 0 && dbProjects.length > 0) {
        console.log("Syncing projects from DB to local...");
        
        for (const dbProject of dbProjects) {
          const projectData = {
            user_id: parseInt(userId),
            project_name: dbProject.name,
            description: dbProject.description || "No description provided",
            project_type: dbProject.project_type,
          };

          try {
            const syncResponse = await fetch("http://127.0.0.1:8000/integrate/project/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(projectData),
            });

            if (syncResponse.ok) {
              console.log(`Project '${dbProject.name}' synced to local successfully`);
            } else {
              console.error(`Failed to sync project '${dbProject.name}' to local`);
            }
          } catch (error) {
            console.error(`Error syncing project '${dbProject.name}':`, error);
          }
        }
        
        console.log("Project sync completed");
      }

    } catch (error) {
      console.error("Error during project sync:", error);
    }
  };

  const checkCloneStatus = async (userId) => {
    try {
      const cloneResponse = await fetch(`http://127.0.0.1:8000/integrate/clone_status/?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (cloneResponse.ok) {
        const cloneData = await cloneResponse.json();
        console.log("Clone response:", cloneData);
        const isCloned = cloneData.cloned || false;
        const path = cloneData.clone_path || "";
        
        setIsRepoCloned(isCloned);
        setClonePath(path);
        
        if (!isCloned) {
          setShowCloneWarning(true);
        }
      } else {
        console.error("Failed to check clone status");
        setIsRepoCloned(false);
        setShowCloneWarning(true);
      }
    } catch (error) {
      console.error("Error checking clone status:", error);
      setIsRepoCloned(false);
      setShowCloneWarning(true);
    }
  };

  const handleCloneRepository = () => {
    navigate("/member-github");
    setShowCloneWarning(false);
  };

  const handleSkipClone = () => {
    setShowCloneWarning(false);
    toast.info("You can clone the repository later from project settings.");
  };

  const AdminNotConnectedModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Admin Setup Required
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            Your admin has not connected with GitHub yet. Please inform your administrator to set up GitHub integration and assign a repository for you.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 transition-colors font-medium"
            >
              Refresh Status
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Contact your administrator to complete the GitHub setup.
          </p>
        </div>
      </div>
    </div>
  );

  const CloneWarningModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Repository Not Cloned
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            Your assigned repository is not cloned locally yet. You need to clone the repository to start creating and running test automation projects.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleCloneRepository}
              className="w-full py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:ring-4 focus:ring-yellow-300 transition-colors font-medium"
            >
              Clone Repository Now
            </button>
            
            <button
              onClick={handleSkipClone}
              className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 transition-colors"
            >
              Skip for now
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            You can clone the repository later from project settings.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <MemberSidebar />
      <div className="dashboard-container">
        <div className="main-content">
          {loading ? (
          <div className="text-center space-y-5">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-lg text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="text-center space-y-5">
            <h1 className="text-5xl font-bold">Welcome to Member Agent</h1>
            <p className="text-xl text-gray-600">
              AI-based Test Automation Tool to simplify your testing process. Empower your testing with the power of AI.
            </p>
            
            {/* GitHub Connection Status */}
            {gitStatus && (
              <div className="mt-8 space-y-4">
                {gitStatus.connected && gitStatus.repository ? (
                  <>
                    {/* GitHub Connected and Repository Assigned */}
                    <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      GitHub Connected - Repository: {gitStatus.repository}
                    </div>
                    
                    {/* Branch Information */}
                    {gitStatus.branch && (
                      <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a.797.797 0 01-.144-.83L10.427 3H7V2zM4 4a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h8v10H4V6z" clipRule="evenodd" />
                        </svg>
                        Branch: {gitStatus.branch}
                      </div>
                    )}
                    
                    {/* Repository Clone Status */}
                    {isRepoCloned !== null && (
                      <div>
                        {isRepoCloned ? (
                          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                            </svg>
                            Repository Cloned
                            {clonePath && (
                              <span className="ml-2 text-xs bg-green-200 px-2 py-1 rounded">
                                {clonePath.split('\\').pop() || clonePath.split('/').pop()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-lg">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Repository Not Cloned
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Admin Setup Required
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>

        {/* Show modal if admin hasn't connected GitHub or assigned repository */}
        {gitStatus && (!gitStatus.connected || !gitStatus.repository) && <AdminNotConnectedModal />}
        
        {/* Clone Warning Modal */}
        {showCloneWarning && <CloneWarningModal />}
      </div>
    </div>
  );
};

export default MemberDashBoard;