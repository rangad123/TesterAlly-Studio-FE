import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function TestSenario() {
  const [promptText, setPromptText] = useState('');
  const [extractedSteps, setExtractedSteps] = useState([]);
  const [showExtractedSteps, setShowExtractedSteps] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [projectData, setProjectData] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/dashboard-user");
      return;
    }

    const savedProjectKey = `selectedProject_${userId}`;
    const savedProject = localStorage.getItem(savedProjectKey);

    if (savedProject) {
        try {
            const parsedProject = JSON.parse(savedProject);
            setProjectData(parsedProject);
        } catch (err) {
            console.error("Error parsing saved project:", err);
            localStorage.removeItem(savedProjectKey);
        }
    }

    const handleProjectChange = () => {
      navigate("/test-cases");
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, [navigate]);

  const extractStepsFromPrompt = async () => {
    if (!promptText.trim()) {
      alert("Please enter a prompt first.");
      return;
    }

    setIsExtracting(true);
    try {
        console.log("📦 Sending Request Payload:", {
            prompt: promptText,
            project_type: projectData?.project_type,
            platform:projectData?.platform,
        });

      const response = await fetch('http://127.0.0.1:8000/api/extract-steps/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: promptText,
            project_type: projectData?.project_type,
            platform:projectData?.platform,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to extract steps');
      }

      const data = await response.json();
      console.log("✅ Extracted steps response:", data);

      setExtractedSteps(data.steps || []);
      setShowExtractedSteps(true);
    } catch (error) {
      console.error('Error extracting steps:', error);
      alert('Failed to extract steps. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

const handleAddSteps = () => {
  if (extractedSteps.length === 0) {
    alert("No steps to add. Please create steps first.");
    return;
  }

  const { project_type, platform } = projectData || {};

  console.log("🚀 Navigating based on project:", project_type, "and platform:", platform);

  const navigationState = {
    generatedSteps: extractedSteps,
    autoExecuteFirst: true
  };

  // Navigation Logic:
  if (project_type === "Web Application" && platform === "Laptop/PC") {
    navigate("/prompt-adding", { state: navigationState });
  } 
  else if (project_type === "Web Application" && platform === "Mobile") {
    navigate("/mobile-prompt", { state: navigationState });
  } 
  else if (project_type === "Mobile Application" && platform === "Android") {
    navigate("/android-prompt", { state: navigationState });
  } 
  else {
    alert("Unsupported combination of project type and platform.");
  }
};


  const handleClearSteps = () => {
    setExtractedSteps([]);
    setShowExtractedSteps(false);
    setPromptText('');
  };

  return (
    <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full ">
      <div className="p-6">
        <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        AI-Powered Test Scenario Creation
                    </h1>
                    <p className="text-gray-600 text-sm md:text-base">
                        Enter your test requirements and let AI generate detailed test steps for you
                    </p>
                    </div>
                    
                    {/* Project Info - Top Right */}
                    {projectData && (
                    <div className="text-right bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                        {/* <div className="text-sm text-gray-700 mb-1">
                        <span className="text-gray-500">Project:</span> 
                        <span className="font-semibold text-purple-700 ml-1">{projectData.name}</span>
                        </div> */}
                        <div className="text-sm text-gray-700 mb-1">
                        <span className="text-gray-500">Type:</span> 
                        <span className="font-medium text-blue-700 ml-1">{projectData.project_type}</span>
                        </div>
                        <div className="text-sm text-gray-700">
                        <span className="text-gray-500">Platform:</span> 
                        <span className="font-medium text-green-700 ml-1">{projectData.platform}</span>
                        </div>
                    </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-2 gap-6">
            {/* Left Side - Prompt Input */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                {/* Action Buttons at Top */}
                <div className="flex justify-end gap-3 mb-4">
                <button
                    onClick={extractStepsFromPrompt}
                    disabled={isExtracting || !promptText.trim()}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm md:text-base font-medium"
                >
                    {isExtracting ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Steps...
                    </span>
                    ) : (
                    'Create Steps'
                    )}
                </button>

                {showExtractedSteps && (
                    <button
                    onClick={handleClearSteps}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm md:text-base font-medium"
                    >
                    Clear
                    </button>
                )}
                </div>

                <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Scenario Prompt
                </label>
                <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Enter your test scenario requirements here...

    Example: 
    - Test user login functionality
    - Verify password reset feature
    - Test shopping cart checkout process
    - Validate form submission with different inputs"
                    className="w-full h-40 md:h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none text-sm md:text-base"
                    disabled={isExtracting}
                />
                </div>
            </div>

            {/* Right Side - Generated Steps */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    Generated Test Steps
                </h2>
                <div className="flex items-center gap-3">
                    {showExtractedSteps && extractedSteps.length > 0 && (
                    <>
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                        {extractedSteps.length} steps
                        </span>
                        <button
                        onClick={handleAddSteps}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                        >
                        Add Steps
                        </button>
                    </>
                    )}
                </div>
                </div>

                {!showExtractedSteps ? (
                <div className="text-center py-8 md:py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    </div>
                    <p className="text-gray-500 text-sm md:text-base">
                    Enter a prompt and click "Create Steps" to generate your test steps
                    </p>
                </div>
                ) : (
                <div className="space-y-3">
                    {extractedSteps.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 text-sm md:text-base">
                        No steps generated. Please try a different prompt.
                        </p>
                    </div>
                    ) : (
                    <div className="max-h-64 md:max-h-80 overflow-y-auto space-y-3">
                        {extractedSteps.map((step, index) => (
                        <div
                            key={index}
                            className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                        >
                            <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {typeof step === 'object' ? step.step : index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                            <p className="text-sm md:text-base text-gray-800 break-words">
                                {typeof step === 'object' ? step.command : step}
                            </p>
                            {typeof step === 'object' && step.action && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {step.action}
                                </span>
                                {step.target && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Target: {step.target}
                                    </span>
                                )}
                                {step.value && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Value: {step.value}
                                    </span>
                                )}
                                </div>
                            )}
                            </div>
                        </div>
                        ))}
                    </div>
                    )}
                </div>
                )}
            </div>
            </div>

            {/* Helper Text */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                </div>
                <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                    How to use Test Scenario Creation
                </h3>
                <ul className="list-decimal pl-5 text-sm text-blue-700 space-y-1">
                    <li>Enter your test requirements in natural language</li>
                    <li>Click "Create Steps" to generate detailed test steps using AI</li>
                    <li>Review the generated steps and click "Add Steps" to include them in your test case</li>
                </ul>
                </div>
            </div>
            </div>
        </div>
        </div>
    </div>
    </div>
  );
}

export default TestSenario;