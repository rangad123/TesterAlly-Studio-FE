import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateTestCases.css";

const TestData = () => {
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState({ url: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);
  const [hasCheckedInitialData, setHasCheckedInitialData] = useState(false);
  const navigate = useNavigate();

  const fetchTestData = async (projectId) => {
    if (!projectId) return;
    
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://api.testerally.ai/api/testdata/${projectId}/`
      );
      
      if (response.ok) {
        const data = await response.json();
        setUploadedData(data);
        
      } else if (response.status === 404) {
         setUploadedData(null);

      } else {
        throw new Error(`Error fetching test data: ${response.status}`);
      }
    } catch (error) {
      if (error.message.includes('404')) {
        console.error("Error fetching test data:", error);
      } else {
        console.error("Error fetching test data:", error);
      }
    } finally {
      setIsLoading(false);
      setHasCheckedInitialData(true);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/dashboard/login");
      return;
    }

    const savedProjectKey = `selectedProject_${userId}`;
    const savedProject = localStorage.getItem(savedProjectKey);

    if (savedProject) {
      try {
        const parsedProject = JSON.parse(savedProject);
        if (parsedProject && parsedProject.id) {
          setSelectedProject(parsedProject);
          fetchTestData(parsedProject.id);
          setHasCheckedInitialData(true);
        }
      } catch (error) {
        console.error("Error parsing saved project:", error);
        localStorage.removeItem(savedProjectKey);
      }
    }

    const handleProjectChange = (event) => {
      const newProject = event.detail;
      setSelectedProject(newProject);
      setUrl("");
      setErrors({ url: "" });
      setHasCheckedInitialData(false);
      if (newProject?.id) {
       
        fetchTestData(newProject.id);
        window.dispatchEvent(new CustomEvent('testDataProjectChanged', {
          detail: { projectId: newProject.id }
        }));
      } else {
        setUploadedData(null);
      }
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, [navigate]);

  const validateFields = () => {
    const newErrors = {};
    let isValid = true;

    if (!url.trim()) {
      newErrors.url = "URL is required!";
      isValid = false;
    } else {
      try {
        new URL(url.startsWith("http") ? url : `https://${url}`);
      } catch (error) {
        newErrors.url = "Invalid URL format!";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreateTestCase = async () => {
    if (!validateFields()) return;
    if (!selectedProject?.id) {
      alert("Please select a project first.");
      return;
    }

    const finalUrl = url.startsWith("http") ? url : `https://${url}`;
    const payload = { url: finalUrl };

    setIsUploading(true);
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/testdata/${selectedProject.id}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upload test data: ${response.status}`);
      }

      const data = await response.json();
      setUploadedData(data);
      alert("Test Data Uploaded Successfully");
    } catch (error) {
      console.error("Error during upload:", error);
      alert(`Error uploading test data: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = () => {
    if (uploadedData) {
      setUrl(uploadedData.url);
      setUploadedData(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject?.id) return;
    if (!window.confirm("Are you sure you want to delete this test data?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://api.testerally.ai/api/testdata/${selectedProject.id}/`,
        {
          method: "DELETE",
        }
      );

      if (response.ok || response.status === 404) {
        setUploadedData(null);
        setUrl("");
        alert("Test Data Deleted Successfully");
      } else {
        throw new Error(`Failed to delete test data: ${response.status}`);
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard-user");
  };

  const renderContent = () => {
    if (!hasCheckedInitialData || isLoading) {
      return <div className="p-4 text-gray-600">Loading...</div>;
    }

    if (!selectedProject) {
      return (
        <div className="p-4 text-gray-600">
          Please select a project to manage test data.
        </div>
      );
    }

    if (uploadedData) {
      return (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <p>
            Uploaded URL: <strong>{uploadedData.url}</strong>
          </p>
          <div className="mt-2 flex space-x-4">
            <button 
              onClick={handleEdit} 
              className="edit-btn"
              disabled={isDeleting}
            >
              Edit
            </button>
            <button 
              onClick={handleDelete} 
              className="delete-btn" 
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="create-test-cases-input-container">
        <label className="block text-sm font-medium mb-2">
          URL<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setErrors((prev) => ({ ...prev, url: "" }));
          }}
          placeholder="Enter URL"
          className={`create-project-input ${
            errors.url ? "border-red-500" : "border-gray-300"
          } focus:outline-none focus:ring-2 focus:ring-purple-500`}
          disabled={isUploading}
        />
        {errors.url && (
          <span className="text-red-500 text-sm mt-1">{errors.url}</span>
        )}

        <div className="mt-4">
          <button
            onClick={handleCreateTestCase}
            className="create-btn"
            disabled={isUploading}
          >
            {isUploading ? "saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="lg:p-6 sm:p-0">
          <div className="create-test-cases-page-container">
            <div className="create-test-cases-wrapper">
              <div className="create-test-cases-container">
                <div className="create-test-cases-header">
                  <div className="flex flex-col">
                    <h2 className="create-test-cases-title">Test Data</h2>
                    {selectedProject && (
                      <span className="project-name text-sm text-gray-600 mt-1">
                        Project: {selectedProject.name}
                      </span>
                    )}
                  </div>
                  <div className="create-test-cases-button-group-right">
                    <button onClick={handleCancel} className="cancel-btn">
                      Cancel
                    </button>
                  </div>
                </div>
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestData;