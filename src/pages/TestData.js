import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateTestCases.css";

const TestData = () => {
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState({ url: "", file: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);
  const [hasCheckedInitialData, setHasCheckedInitialData] = useState(false);
  
  // New states for file upload
  const [activeTab, setActiveTab] = useState("url"); // "url" or "file"
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  
  const navigate = useNavigate();

  const fetchTestData = async (projectId) => {
    if (!projectId) return;
    
    setIsLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/testdata/${projectId}/`
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
      setSelectedFile(null);
      setFilePreview(null);
      setErrors({ url: "", file: "" });
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

    if (activeTab === "url") {
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
    } else if (activeTab === "file") {
      if (!selectedFile) {
        newErrors.file = "Please select a file to upload!";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setErrors(prev => ({ ...prev, file: "" }));
      
      // Create preview for text files
      if (file.type.includes('text') || file.name.endsWith('.json') || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          setFilePreview(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
        };
        reader.readAsText(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleCreateTestCase = async () => {
    if (!validateFields()) return;
    if (!selectedProject?.id) {
      alert("Please select a project first.");
      return;
    }

    setIsUploading(true);
    try {
      let response;
      
      if (activeTab === "url") {
        // Existing URL upload logic
        const finalUrl = url.startsWith("http") ? url : `https://${url}`;
        const payload = { url: finalUrl };

        response = await fetch(
          `http://127.0.0.1:8000/api/testdata/${selectedProject.id}/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        // File upload logic
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('type', 'file');

        response = await fetch(
          `http://127.0.0.1:8000/api/testdata/${selectedProject.id}/`,
          {
            method: "POST",
            body: formData,
          }
        );
      }

      if (!response.ok) {
        throw new Error(`Failed to upload test data: ${response.status}`);
      }

      const data = await response.json();
      setUploadedData(data);
      alert("Test Data Uploaded Successfully");
      
      // Reset form
      setUrl("");
      setSelectedFile(null);
      setFilePreview(null);
      
    } catch (error) {
      console.error("Error during upload:", error);
      alert(`Error uploading test data: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = () => {
    if (uploadedData) {
      if (uploadedData.url) {
        setActiveTab("url");
        setUrl(uploadedData.url);
      } else if (uploadedData.filename) {
        setActiveTab("file");
        // For file edit, we might want to show file info but can't restore the actual file
      }
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
        `http://127.0.0.1:8000/api/testdata/${selectedProject.id}/`,
        {
          method: "DELETE",
        }
      );

      if (response.ok || response.status === 404) {
        setUploadedData(null);
        setUrl("");
        setSelectedFile(null);
        setFilePreview(null);
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

  const renderUploadedData = () => {
    if (!uploadedData) return null;

    return (
      <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Test Data Successfully Uploaded
            </h3>
            
            {uploadedData.url && (
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-600">URL:</span>
                <div className="mt-1 p-3 bg-white rounded border border-green-200">
                  <a 
                    href={uploadedData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all"
                  >
                    {uploadedData.url}
                  </a>
                </div>
              </div>
            )}
            
            {uploadedData.filename && (
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-600">File:</span>
                <div className="mt-1 p-3 bg-white rounded border border-green-200 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{uploadedData.filename}</span>
                </div>
              </div>
            )}
            
            {uploadedData.created_at && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Uploaded:</span> {new Date(uploadedData.created_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex space-x-3">
          <button 
            onClick={handleEdit} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
            disabled={isDeleting}
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit
          </button>
          <button 
            onClick={handleDelete} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center" 
            disabled={isDeleting}
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    );
  };

  const renderInputForm = () => {
    return (
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("url")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === "url"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M7.414 15.414a2 2 0 01-2.828-2.828l3-3a2 2 0 012.828 0 1 1 0 001.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5z" clipRule="evenodd" />
                </svg>
                URL Input
              </div>
            </button>
            <button
              onClick={() => setActiveTab("file")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === "file"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                File Upload
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "url" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setErrors((prev) => ({ ...prev, url: "" }));
                    }}
                    placeholder="Enter website URL (e.g., https://example.com)"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                      errors.url ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={isUploading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                {errors.url && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.url}
                  </p>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Enter the URL of the website you want to test. The system will analyze the website and generate appropriate test cases.
                </p>
              </div>
            </div>
          )}

          {activeTab === "file" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Cases File<span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-400 transition-colors duration-200">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileSelect}
                          accept=".csv,.json,.txt,.xlsx,.xls"
                          disabled={isUploading}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, JSON, TXT, Excel files up to 10MB</p>
                  </div>
                </div>
                {errors.file && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.file}
                  </p>
                )}
              </div>

              {selectedFile && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Size: {(selectedFile.size / 1024).toFixed(2)} KB | Type: {selectedFile.type || 'Unknown'}
                  </div>
                  {filePreview && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">File Preview:</h4>
                      <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                        {filePreview}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Supported formats:</strong> Upload test case files in CSV, JSON, TXT, or Excel format. The system will parse and integrate them into your test suite.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleCreateTestCase}
              disabled={isUploading}
              className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Save Test Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!hasCheckedInitialData || isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-purple-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Loading test data...</p>
          </div>
        </div>
      );
    }

    if (!selectedProject) {
      return (
        <div className="text-center p-8">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-600">Please select a project from the dropdown to manage test data.</p>
        </div>
      );
    }

    return (
      <div>
        {uploadedData ? renderUploadedData() : renderInputForm()}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="lg:p-6 sm:p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                      <svg className="w-6 h-6 mr-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      Test Data Management
                    </h1>
                    {selectedProject && (
                      <div className="mt-2 flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Project:</span>
                        <span className="ml-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {selectedProject.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <button 
                      onClick={handleCancel} 
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Info Section */}
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Test Data Options</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Upload test data by providing a website URL for automated analysis or by uploading test case files directly. 
                      Supported file formats include CSV, JSON, TXT, and Excel files.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestData;