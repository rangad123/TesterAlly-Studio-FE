import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateTestCases.css";
import { Database, Info } from "lucide-react";

const TestData = () => {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({ url: "", email: "", phone: "", file: "", general: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);
  const [hasCheckedInitialData, setHasCheckedInitialData] = useState(false);
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordInfoModal, setShowPasswordInfoModal] = useState(false);
  const countries = [
    "United States", 
     "India", "Japan", "Switzerland", "Austria", "Ireland", "Other"
  ];

  const [selectedFile, setSelectedFile] = useState(null);
  
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
      setEmail("");
      setPhone("");
      setSelectedFile(null);
      setErrors({ url: "", email: "", phone: "", file: "", general: "" });
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

    if (url.trim()) {
      try {
        new URL(url.startsWith("http") ? url : `https://${url}`);
      } catch (error) {
        newErrors.url = "Invalid URL format!";
        isValid = false;
      }
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = "Invalid email format!";
        isValid = false;
      }
      // NEW: Check if email is provided but password is missing
      if (!password.trim()) {
        newErrors.password = "Password is required when email is provided!";
        isValid = false;
      }
    }

    if (phone.trim()) {
      const phoneRegex = /^[\d\s\-+()]+$/;
      if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
        newErrors.phone = "Invalid phone number format!";
        isValid = false;
      }
    }

    // Check if at least one field is filled
    if (!url.trim() && !email.trim() && !phone.trim() && !country.trim() && !selectedFile) {
      newErrors.general = "Please fill at least one field or upload a file!";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setErrors(prev => ({ ...prev, file: "", general: "" }));
    }
  };

  const handleCreateTestCase = async (projectId) => {
    if (!validateFields()) return;
    if (!selectedProject?.id) {
      alert("Please select a project first.");
      return;
    }

    setIsUploading(true);
    try {
      let response;

      let finalUrl = url.trim();
      if (finalUrl && !finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        finalUrl = `https://${finalUrl}`;
      }
      
      if (selectedFile) {
        // File upload logic
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('type', 'file');
        console.log("Payload of formData upload:", formData);

        response = await fetch(
          `http://127.0.0.1:8000/api/testdata/${projectId}/`,
          {
            method: "POST",
            body: formData,
          }
        );
      } else {
        // Data upload logic - Updated payload structure
        const payload = {
          url: finalUrl.trim() || null,
          email: email.trim() || null, 
          email_app_password: password.trim() || null, 
          phone_number: phone.trim() || null,  
          region: country.trim() || null       
        };
        console.log("Payload of Data upload:", payload);

        response = await fetch(
          `http://127.0.0.1:8000/api/testdata/${projectId}/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!response.ok) {
        throw new Error(`Failed to upload test data: ${response.status}`);
      }

      const data = await response.json();
      console.log("response of Data:", data);
      setUploadedData(data);
      alert("Test Data Uploaded Successfully");
      
      // Reset form
      setUrl("");
      setEmail("");
      setPhone("");
      setPassword("");
      setCountry("");
      setSelectedFile(null);
      
    } catch (error) {
      console.error("Error during upload:", error);
      alert(`Error uploading test data: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!selectedProject?.id) return;
    if (!window.confirm("Are you sure you want to delete this test data?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/testdata/${projectId}/`,
        {
          method: "DELETE",
        }
      );

      if (response.ok || response.status === 404) {
        setUploadedData(null);
        setUrl("");
        setEmail("");
        setPassword("");  
        setPhone("");
        setSelectedFile(null);
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

  const handleEditField = (fieldType, currentValue) => {
    // Preserve all existing saved data
    if (uploadedData.url) setUrl(uploadedData.url);
    if (uploadedData.email) setEmail(uploadedData.email);
    if (uploadedData.email_app_password) setPassword(uploadedData.email_app_password); 
    if (uploadedData.phone_number) setPhone(uploadedData.phone_number);
    if (uploadedData.region) setCountry(uploadedData.region);
    
    // Then focus on the specific field being edited
    if (fieldType === 'url') {
      setUrl(currentValue);
    } else if (fieldType === 'email') {
      setEmail(currentValue);
    } else if (fieldType === 'password') { 
      setPassword(currentValue);
    } else if (fieldType === 'phone') {
      setPhone(currentValue);
    } else if (fieldType === 'country') {
      setCountry(currentValue);
    }
    
    setUploadedData(null); // Show the form for editing
  };

  const handleAddField = (fieldType) => {
    // Preserve all existing saved data
    if (uploadedData.url) setUrl(uploadedData.url);
    if (uploadedData.email) setEmail(uploadedData.email);
    if (uploadedData.email_app_password) setPassword(uploadedData.email_app_password); 
    if (uploadedData.phone_number) setPhone(uploadedData.phone_number);
    if (uploadedData.region) setCountry(uploadedData.region);
    
    // Set empty value for the field being added
    if (fieldType === 'url') {
      setUrl('');
    } else if (fieldType === 'email') {
      setEmail('');
    } else if (fieldType === 'password') {  
      setPassword('');
    } else if (fieldType === 'phone') {
      setPhone('');
    } else if (fieldType === 'country') {
      setCountry('');
    }
    
    setUploadedData(null); // Show the form for adding
  };

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-green-800 mb-4 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Test Data Successfully Uploaded
          </h3>
          
          {/* Website URL Field */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            {uploadedData.url ? (
              <div className="group relative p-2 bg-white rounded border border-green-200">
                <a 
                  href={uploadedData.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all text-sm pr-8"
                >
                  {uploadedData.url}
                </a>
                <button 
                  onClick={() => handleEditField('url', uploadedData.url)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-600 hover:text-blue-800 p-1"
                  title="Edit URL"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="group relative p-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 transition-colors cursor-pointer">
                <button 
                  onClick={() => handleAddField('url')}
                  className="w-full text-left text-gray-500 text-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Click to add website URL
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              {uploadedData.email ? (
                <div className="group relative p-2 bg-white rounded border border-green-200">
                  <span className="text-gray-700 text-sm pr-8">{uploadedData.email}</span>
                  <button 
                    onClick={() => handleEditField('email', uploadedData.email)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-600 hover:text-blue-800 p-1"
                    title="Edit email"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="group relative p-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 transition-colors cursor-pointer">
                  <button 
                    onClick={() => handleAddField('email')}
                    className="w-full text-left text-gray-500 text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Click to add email
                  </button>
                </div>
              )}
            </div>

            {/* Password Field - NEW */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              {uploadedData.email_app_password ? (
                <div className="group relative p-2 bg-white rounded border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 text-sm pr-8">
                      {showPassword ? uploadedData.email_app_password : '•'.repeat(uploadedData.email_app_password.length)}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <button 
                        onClick={() => handleEditField('password', uploadedData.email_app_password)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-600 hover:text-blue-800 p-1"
                        title="Edit password"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                uploadedData.email && (
                  <div className="group relative p-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 transition-colors cursor-pointer">
                    <button 
                      onClick={() => handleAddField('password')}
                      className="w-full text-left text-gray-500 text-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Click to add password
                    </button>
                  </div>
                )
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              {uploadedData.phone_number ? (
                <div className="group relative p-2 bg-white rounded border border-green-200">
                  <span className="text-gray-700 text-sm pr-8">{uploadedData.phone_number}</span>
                  <button 
                    onClick={() => handleEditField('phone', uploadedData.phone_number)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-600 hover:text-blue-800 p-1"
                    title="Edit phone"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="group relative p-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 transition-colors cursor-pointer">
                  <button 
                    onClick={() => handleAddField('phone')}
                    className="w-full text-left text-gray-500 text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Click to add phone
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Country/Region Field */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Country/Region</label>
            {uploadedData.region ? (
              <div className="group relative p-2 bg-white rounded border border-green-200">
                <span className="text-gray-700 text-sm pr-8">{uploadedData.region}</span>
                <button 
                  onClick={() => handleEditField('country', uploadedData.region)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-600 hover:text-blue-800 p-1"
                  title="Edit country"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="group relative p-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 transition-colors cursor-pointer">
                <button 
                  onClick={() => handleAddField('country')}
                  className="w-full text-left text-gray-500 text-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Click to add country/region
                </button>
              </div>
            )}
          </div>

          {/* File Display */}
          {uploadedData.filename && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Uploaded File</label>
              <div className="p-2 bg-white rounded border border-green-200 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 text-sm">{uploadedData.filename}</span>
              </div>
            </div>
          )}
          
          {/* Upload Timestamp */}
          {uploadedData.created_at && (
            <div className="text-xs text-gray-600 mt-3">
              <span className="font-medium">Uploaded:</span> {new Date(uploadedData.created_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mt-4 flex space-x-2">
        <button 
          onClick={() => handleDelete(selectedProject.id)}
          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center text-sm" 
          disabled={isDeleting}
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M10 5a1 1 0 00-1 1v3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          {isDeleting ? "Deleting..." : "Delete All Data"}
        </button>
      </div>
    </div>
  );
};

  const renderInputForm = () => {
    return (
      <div className="mt-4 bg-white rounded-md shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.general}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Website URL Field */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setErrors((prev) => ({ ...prev, url: "", general: "" }));
              }}
              placeholder="Enter website URL (e.g., https://example.com)"
              className={`w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm ${
                errors.url ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              disabled={isUploading}
            />
            {errors.url && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.url}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: "", general: "" }));
              }}
              placeholder="Enter email address"
              className={`w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm ${
                errors.email ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              disabled={isUploading}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          {email.trim() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                Password <span className="text-red-500 ml-1">*</span>
                <button
                  type="button"
                  onClick={() => setShowPasswordInfoModal(true)}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                  title="More Info"
                >
                  <Info className="w-4 h-4" />
                </button>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: '', general: '' }));
                  }}
                  placeholder="Enter App Password"
                  className={`w-full px-3 py-2.5 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm ${
                    errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isUploading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {/* Eye Icon */}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  {errors.password}
                </p>
              )}
            </div>
          )}

          {showPasswordInfoModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-700 mb-4 text-center">App Password Info</h3>
                <p className="text-sm text-gray-700 mb-4">
                  This is not your usual email password. You must enter a{' '}
                  <span className="font-semibold text-purple-700">Google App Password</span> — a 16-character code like{' '}
                  <span className="font-mono">sjnc ejcj ebhc tigv</span>.
                </p>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-md transition"
                >
                  Generate App Password
                </a>
                <button
                  onClick={() => setShowPasswordInfoModal(false)}
                  className="mt-4 w-full text-purple-600 text-sm hover:underline"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Phone Number Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErrors((prev) => ({ ...prev, phone: "", general: "" }));
              }}
              placeholder="Enter phone number"
              className={`w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm ${
                errors.phone ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              disabled={isUploading}
            />
            {errors.phone && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.phone}
              </p>
            )}
          </div>

          {/* Country/Region Field - NEW */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country/Region
            </label>
            <div className="flex space-x-2">
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setErrors((prev) => ({ ...prev, general: "" }));
                }}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                disabled={isUploading}
              >
                <option value="">Select a country</option>
                {countries.map((countryName, index) => (
                  <option key={index} value={countryName}>
                    {countryName}
                  </option>
                ))}
              </select>
              {country === "Other" && (
                <input
                  type="text"
                  placeholder="Enter country name"
                  value={country === "Other" ? "" : country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setErrors((prev) => ({ ...prev, general: "" }));
                  }}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                  disabled={isUploading}
                />
              )}
            </div>
          </div>
        </div>

          {/* File Upload Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Test File (Optional)
            </label>
            <div className="border-2 border-gray-300 border-dashed rounded-md p-4 hover:border-purple-400 transition-colors duration-200">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-purple-600 hover:text-purple-500 font-medium">Upload a file</span>
                  <span className="text-gray-500"> or drag and drop</span>
                  <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileSelect}
                    accept=".csv,.json,.txt,.xlsx,.xls"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">CSV, JSON, TXT, Excel files up to 10MB</p>
              </div>
            </div>

            {selectedFile && (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setErrors(prev => ({ ...prev, general: "" }));
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove file"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Fill in any combination of the above fields. All fields are optional, but at least one must be provided to save test data.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              onClick={() => handleCreateTestCase(selectedProject.id)}
              disabled={isUploading}
              className="bg-purple-600 text-white py-2.5 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-sm font-medium w-fit mx-auto"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
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
        <div className="flex items-center justify-center p-6">
          <div className="text-center">
            <svg className="animate-spin h-6 w-6 text-purple-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 text-sm">Loading test data...</p>
          </div>
        </div>
      );
    }

    if (!selectedProject) {
      return (
        <div className="text-center p-6">
          <svg className="mx-auto h-10 w-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-base font-medium text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-600 text-sm">Please select a project from the dropdown to manage test data.</p>
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
            <div className="bg-white rounded-md shadow-sm border border-gray-200 mb-4">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h1 className="text-lg font-semibold text-gray-800 flex items-center">
                      {/* Correct Test Data Management Icon - Database/Storage icon */}
                      <Database className="w-5 h-5 mr-2 text-purple-600" />
                      Test Data Management
                    </h1>
                    {selectedProject && (
                      <div className="mt-1 flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Project:</span>
                        <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {selectedProject.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <button 
                      onClick={handleCancel} 
                      className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Info Section */}
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Test Data Options</h3>
                    <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
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