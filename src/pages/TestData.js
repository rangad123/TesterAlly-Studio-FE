import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateTestCases.css";
import { Database, Info } from "lucide-react";
import { 
  Link, 
  Mail, 
  Phone, 
  Globe, 
  Edit2, 
  Plus, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle2, 
  Upload, 
  FileText, 
  X, 
  AlertCircle,
  Calendar,
  Loader2,
  Folder,
  Key,    
  Cpu     
} from "lucide-react";

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
  // const [moduleName, setModuleName] = useState("");

  const [apiKey, setApiKey] = useState("");
  const [gptVersion, setGptVersion] = useState("");
  const [customGptVersion, setCustomGptVersion] = useState("");
  const gptVersions = [
    "gpt-4o-mini",
    "gpt-4o", 
    "gpt-4.1-mini",
    "gpt-4.1",
    "Custom"
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

    // if (!moduleName.trim()) {
    //   newErrors.moduleName = "Module name is required!";
    //   isValid = false;
    // }

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
          region: country.trim() || null,
          // module_name: moduleName.trim() || null    
          openai_api_key: apiKey.trim() || null,  
          gpt_version: gptVersion === "Custom" ? customGptVersion.trim() : gptVersion.trim() || null,    
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
      // setModuleName("");
      setApiKey("");           
      setGptVersion("");     
      setCustomGptVersion("");
      
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
      if (uploadedData.url) setUrl(uploadedData.url);
      if (uploadedData.email) setEmail(uploadedData.email);
      if (uploadedData.email_app_password) setPassword(uploadedData.email_app_password); 
      if (uploadedData.phone_number) setPhone(uploadedData.phone_number);
      if (uploadedData.region) setCountry(uploadedData.region);
      if (uploadedData.openai_api_key) setApiKey(uploadedData.openai_api_key); 
      if (uploadedData.gpt_version) {  
        if (gptVersions.includes(uploadedData.gpt_version)) {
          setGptVersion(uploadedData.gpt_version);
        } else {
          setGptVersion("Custom");
          setCustomGptVersion(uploadedData.gpt_version);
        }
      }
      
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
      } else if (fieldType === 'apiKey') {  
        setApiKey(currentValue);
      } else if (fieldType === 'gptVersion') {  
        if (gptVersions.includes(currentValue)) {
          setGptVersion(currentValue);
        } else {
          setGptVersion("Custom");
          setCustomGptVersion(currentValue);
        }
      }
      
      setUploadedData(null);
    };

    const handleAddField = (fieldType) => {
      if (uploadedData.url) setUrl(uploadedData.url);
      if (uploadedData.email) setEmail(uploadedData.email);
      if (uploadedData.email_app_password) setPassword(uploadedData.email_app_password); 
      if (uploadedData.phone_number) setPhone(uploadedData.phone_number);
      if (uploadedData.region) setCountry(uploadedData.region);
      if (uploadedData.openai_api_key) setApiKey(uploadedData.openai_api_key);  
      if (uploadedData.gpt_version) { 
        if (gptVersions.includes(uploadedData.gpt_version)) {
          setGptVersion(uploadedData.gpt_version);
        } else {
          setGptVersion("Custom");
          setCustomGptVersion(uploadedData.gpt_version);
        }
      }
      
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
      } else if (fieldType === 'apiKey') { 
        setApiKey('');
      } else if (fieldType === 'gptVersion') {  
        setGptVersion('');
        setCustomGptVersion('');
      }
      
      setUploadedData(null);
    };

    return (
      <div className="mt-6 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-xl shadow-sm">
        <div className="p-6">
          {/* Success Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-200">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-900">
                Test Data Successfully Uploaded
              </h3>
              <p className="text-sm text-emerald-700 mt-0.5">
                Your test data has been saved and is ready to use
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Website URL Field */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <Link className="w-4 h-4 text-purple-600" />
                <label className="text-sm font-semibold text-gray-700">Website URL</label>
              </div>
              {uploadedData.url ? (
                <div className="group relative bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <a 
                    href={uploadedData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-700 hover:text-purple-900 font-medium break-all text-sm pr-10 block"
                  >
                    {uploadedData.url}
                  </a>
                  <button 
                    onClick={() => handleEditField('url', uploadedData.url)}
                    className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                    title="Edit URL"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleAddField('url')}
                  className="w-full group bg-gray-50 hover:bg-purple-50 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-lg p-4 transition-all duration-200"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-500 group-hover:text-purple-600">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Website URL</span>
                  </div>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email Field */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <label className="text-sm font-semibold text-gray-700">Email Address</label>
                </div>
                {uploadedData.email ? (
                  <div className="group relative bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <span className="text-purple-700 font-medium text-sm pr-10 block">{uploadedData.email}</span>
                    <button 
                      onClick={() => handleEditField('email', uploadedData.email)}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                      title="Edit email"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleAddField('email')}
                    className="w-full group bg-gray-50 hover:bg-purple-50 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-lg p-3 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-2 text-gray-500 group-hover:text-purple-600">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Add Email</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Password Field */}
              {uploadedData.email && (
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-purple-600" />
                    <label className="text-sm font-semibold text-gray-700">Password</label>
                  </div>
                  {uploadedData.email_app_password ? (
                    <div className="group relative bg-purple-50 rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-purple-700 font-medium text-sm flex-1">
                          {showPassword ? uploadedData.email_app_password : '•'.repeat(uploadedData.email_app_password.length)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
                            title={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleEditField('password', uploadedData.email_app_password)}
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                            title="Edit password"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    uploadedData.email && (
                      <button 
                        onClick={() => handleAddField('password')}
                        className="w-full group bg-gray-50 hover:bg-purple-50 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-lg p-3 transition-all duration-200"
                      >
                        <div className="flex items-center justify-center gap-2 text-gray-500 group-hover:text-purple-600">
                          <Plus className="w-4 h-4" />
                          <span className="text-sm font-medium">Add Password</span>
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Phone Field */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-purple-600" />
                  <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                </div>
                {uploadedData.phone_number ? (
                  <div className="group relative bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <span className="text-purple-700 font-medium text-sm pr-10 block">{uploadedData.phone_number}</span>
                    <button 
                      onClick={() => handleEditField('phone', uploadedData.phone_number)}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                      title="Edit phone"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleAddField('phone')}
                    className="w-full group bg-gray-50 hover:bg-purple-50 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-lg p-3 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-2 text-gray-500 group-hover:text-purple-600">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Add Phone</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Country/Region Field */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <label className="text-sm font-semibold text-gray-700">Country/Region</label>
                </div>
                {uploadedData.region ? (
                  <div className="group relative bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <span className="text-purple-700 font-medium text-sm pr-10 block">{uploadedData.region}</span>
                    <button 
                      onClick={() => handleEditField('country', uploadedData.region)}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                      title="Edit country"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleAddField('country')}
                    className="w-full group bg-gray-50 hover:bg-purple-50 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-lg p-3 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-2 text-gray-500 group-hover:text-purple-600">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Add Country</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Module Name */}
            {/* {uploadedData.module_name && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <label className="text-sm font-semibold text-gray-700">Module Name</label>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <span className="text-purple-700 font-medium text-sm">{uploadedData.module_name}</span>
                </div>
              </div>
            )} */}

            {/* OpenAI API Key Field */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-purple-600" />
                <label className="text-sm font-semibold text-gray-700">OpenAI API Key</label>
              </div>
              {uploadedData.openai_api_key ? (
                <div className="group relative bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-purple-700 font-medium text-sm flex-1">
                      {showPassword ? uploadedData.openai_api_key : '•'.repeat(Math.min(uploadedData.openai_api_key.length, 40))}
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
                        title={showPassword ? "Hide API key" : "Show API key"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleEditField('apiKey', uploadedData.openai_api_key)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                        title="Edit API key"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => handleAddField('apiKey')}
                  className="w-full group bg-gray-50 hover:bg-purple-50 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-lg p-3 transition-all duration-200"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-500 group-hover:text-purple-600">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add API Key</span>
                  </div>
                </button>
              )}
            </div>

            {/* GPT Version Field */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <label className="text-sm font-semibold text-gray-700">GPT Version</label>
              </div>
              {uploadedData.gpt_version ? (
                <div className="group relative bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <span className="text-purple-700 font-medium text-sm pr-10 block">{uploadedData.gpt_version}</span>
                  <button 
                    onClick={() => handleEditField('gptVersion', uploadedData.gpt_version)}
                    className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                    title="Edit GPT version"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleAddField('gptVersion')}
                  className="w-full group bg-gray-50 hover:bg-purple-50 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-lg p-3 transition-all duration-200"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-500 group-hover:text-purple-600">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add GPT Version</span>
                  </div>
                </button>
              )}
            </div>

            {/* Uploaded File */}
            {uploadedData.filename && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <label className="text-sm font-semibold text-gray-700">Uploaded File</label>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-700 font-medium text-sm flex-1">{uploadedData.filename}</span>
                </div>
              </div>
            )}
            
            {/* Timestamp */}
            {uploadedData.created_at && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Uploaded:</span>
                <span>{new Date(uploadedData.created_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Delete Button */}
        <div className="px-6 pb-6">
          <button 
            onClick={() => handleDelete(selectedProject.id)}
            className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md" 
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Delete All Data
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderInputForm = () => {
    return (
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 space-y-6">
          {/* General Error Message */}
          {errors.general && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-800 mb-1">Error</h4>
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Website URL Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Link className="w-4 h-4 text-purple-600" />
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
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                errors.url ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-purple-300"
              }`}
              disabled={isUploading}
            />
            {errors.url && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.url}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-purple-600" />
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
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                  errors.email ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-purple-300"
                }`}
                disabled={isUploading}
              />
              {errors.email && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            {email.trim() && (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Eye className="w-4 h-4 text-purple-600" />
                  Password
                  <span className="text-red-500">*</span>
                  <button
                    type="button"
                    onClick={() => setShowPasswordInfoModal(true)}
                    className="ml-auto text-purple-600 hover:text-purple-800 transition-colors"
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
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                      errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-purple-300'
                    }`}
                    disabled={isUploading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>
            )}

            {/* Password Info Modal */}
            {showPasswordInfoModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-purple-200 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-purple-700 flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      App Password Info
                    </h3>
                    <button
                      onClick={() => setShowPasswordInfoModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                    This is not your usual email password. You must enter a{' '}
                    <span className="font-semibold text-purple-700">Google App Password</span> — a 16-character code like{' '}
                    <span className="font-mono bg-purple-50 px-2 py-1 rounded text-purple-700">sjnc ejcj ebhc tigv</span>.
                  </p>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors mb-3"
                  >
                    Generate App Password
                  </a>
                  <button
                    onClick={() => setShowPasswordInfoModal(false)}
                    className="w-full text-purple-600 text-sm hover:underline font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Phone Number Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 text-purple-600" />
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
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                  errors.phone ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-purple-300"
                }`}
                disabled={isUploading}
              />
              {errors.phone && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.phone}</span>
                </div>
              )}
            </div>

            {/* Country/Region Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Globe className="w-4 h-4 text-purple-600" />
                Country/Region
              </label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setErrors((prev) => ({ ...prev, general: "" }));
                }}
                className="w-full px-4 py-3 border border-gray-300 hover:border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                disabled={isUploading}
              >
                <option value="">Select a country</option>
                {countries.map((countryName, index) => (
                  <option key={index} value={countryName}>
                    {countryName}
                  </option>
                ))}
              </select>
            </div>

            {/* Module Name Field */}
            {/* <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Module Name
              </label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => {
                  setModuleName(e.target.value);
                  setErrors((prev) => ({ ...prev, moduleName: "", general: "" }));
                }}
                placeholder="e.g., Login, Cart, Checkout"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                  errors.moduleName ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-purple-300"
                }`}
                disabled={isUploading}
              />
              {errors.moduleName && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.moduleName}</span>
                </div>
              )}
            </div> */}

            {/* OpenAI API Key Field */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Key className="w-4 h-4 text-purple-600" />
                OpenAI API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setErrors((prev) => ({ ...prev, general: "" }));
                }}
                placeholder="Enter your OpenAI API Key"
                className="w-full px-4 py-3 border border-gray-300 hover:border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                disabled={isUploading}
              />
            </div>

            {/* GPT Version Field */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                GPT Version
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={gptVersion}
                  onChange={(e) => {
                    setGptVersion(e.target.value);
                    if (e.target.value !== "Custom") {
                      setCustomGptVersion("");
                    }
                    setErrors((prev) => ({ ...prev, general: "" }));
                  }}
                  className="w-full px-4 py-3 border border-gray-300 hover:border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  disabled={isUploading}
                >
                  <option value="">Select GPT Version</option>
                  {gptVersions.map((version, index) => (
                    <option key={index} value={version}>
                      {version}
                    </option>
                  ))}
                </select>
                
                {gptVersion === "Custom" && (
                  <input
                    type="text"
                    value={customGptVersion}
                    onChange={(e) => {
                      setCustomGptVersion(e.target.value);
                      setErrors((prev) => ({ ...prev, general: "" }));
                    }}
                    placeholder="Enter custom GPT version"
                    className="w-full px-4 py-3 border border-gray-300 hover:border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    disabled={isUploading}
                  />
                )}
              </div>
            </div>
          </div>

          {/* File Upload Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Upload className="w-4 h-4 text-purple-600" />
              Upload Test File (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-xl p-8 transition-all duration-200 bg-gradient-to-br from-gray-50 to-purple-50">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-purple-600" />
                </div>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-purple-600 hover:text-purple-700 font-semibold">Upload a file</span>
                  <span className="text-gray-600"> or drag and drop</span>
                  <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileSelect}
                    accept=".csv,.json,.txt,.xlsx,.xls"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">CSV, JSON, TXT, Excel files up to 10MB</p>
              </div>
            </div>

            {/* Selected File Display */}
            {selectedFile && (
              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setErrors(prev => ({ ...prev, general: "" }));
                    }}
                    className="ml-3 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Important Note</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Fill in any combination of the above fields. All fields are optional, but at least one must be provided to save test data.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => handleCreateTestCase(selectedProject.id)}
              disabled={isUploading}
              className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
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
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Test Data</h3>
            <p className="text-gray-600">Please wait while we fetch your test data...</p>
          </div>
        </div>
      );
    }

    if (!selectedProject) {
      return (
        <div className="text-center p-12 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <Database className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Please select a project from the dropdown menu above to start managing your test data.
          </p>
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
          <div className="max-w-5xl mx-auto">
            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
              {/* Header Top */}
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Database className="w-6 h-6 text-purple-600" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        Test Data Management
                      </h1>
                    </div>
                    {selectedProject && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 ml-14">
                        <Folder className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">Project:</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                          {selectedProject.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleCancel} 
                    className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2 font-medium"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              </div>
              
              {/* Info Banner */}
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Info className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      Test Data Options
                    </h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
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