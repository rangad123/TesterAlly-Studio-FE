import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function TestSenario() {
  const [promptText, setPromptText] = useState('');
  const [extractedSteps, setExtractedSteps] = useState([]);
  const [showExtractedSteps, setShowExtractedSteps] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [editingStepIndex, setEditingStepIndex] = useState(null);
  const [editingStepText, setEditingStepText] = useState('');
  const [needsOtpVerification, setNeedsOtpVerification] = useState(false);

  const [complexityLevel, setComplexityLevel] = useState("simple");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const [testData, setTestData] = useState(null);
  const [isTestDataLoading, setIsTestDataLoading] = useState(false);
  const [selectedOtpStep, setSelectedOtpStep] = useState('none');
  const [otpConfirmationModal, setOtpConfirmationModal] = useState({
    isOpen: false,
    contactStep: null,
    otpStep: null,
    matchedContactData: null,
    contactType: null, 
    detectedSteps: []
  });

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

  useEffect(() => {
    if (needsOtpVerification && projectData?.id) {
      setIsTestDataLoading(true);
      fetch(`http://127.0.0.1:8000/api/testdata/${projectData.id}/`)
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ Test data loaded:", data);
          setTestData(data);
        })
        .catch((err) => {
          console.warn("⚠️ Error fetching test data:", err.message);
          setTestData(null);
        })
        .finally(() => setIsTestDataLoading(false));
    }
  }, [needsOtpVerification, projectData?.id]);

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

  const generatePromptFromAssistant = async () => {
    setIsGeneratingPrompt(true);

    // Log current request config
    const requestBody = {
      project_type: projectData?.project_type,
      platform: projectData?.platform,
      category: "interaction",
      complexity: complexityLevel,
    };

    console.log("🧠 Sending prompt generation request:", requestBody);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/generate-prompt/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate prompt");
      }

      const data = await response.json();
      console.log("✅ Received generated prompt:", data);

      if (data.prompt) {
        setPromptText(data.prompt);
      } else {
        alert("No prompt received from assistant.");
      }

      // Update complexity level for next click
      setComplexityLevel((prev) => {
        if (prev === "simple") return "medium";
        if (prev === "medium") return "complex";
        return "simple";
      });
    } catch (error) {
      console.error(
        `❌ Error generating ${complexityLevel} prompt:`,
        error.message
      );
      alert(`Error generating ${complexityLevel} prompt: ${error.message}`);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

const detectOtpStepsInGenerated = (steps) => {
  console.log("🔍 Starting OTP detection...");
  console.log("📊 Test Data:", testData);
  console.log("📋 Generated Steps:", steps);
  
  if (!testData) {
    console.log("❌ No test data available");
    return { hasOtpSteps: false };
  }

  let contactStep = null;
  let matchedContactData = null;
  let contactType = null;
  let autoDetectedOtpStep = null; 

  // ✅ STEP 1: Detect contact step (keep this part as is)
  steps.forEach((step, index) => {
    const stepText = typeof step === 'object' ? step.command || step.description : step;
    const stepValue = typeof step === 'object' ? step.value : null;
    
    console.log(`🔍 Checking Step ${index + 1}:`, {
      stepText,
      stepValue,
      fullStep: step
    });

    const stepLower = stepText.toLowerCase();

    if (testData.email) {
      const emailLower = testData.email.toLowerCase();
      if (stepLower.includes(emailLower) || (stepValue && stepValue.toLowerCase().includes(emailLower))) {
        contactStep = index;
        matchedContactData = testData.email;
        contactType = 'email';
        console.log(`✅ Email detected in step ${index + 1}: ${testData.email}`);
      }
    }

    if (testData.phone_number) {
      const phoneStr = testData.phone_number.toString();
      if (stepLower.includes(phoneStr) || (stepValue && stepValue.toString().includes(phoneStr))) {
        contactStep = index;
        matchedContactData = testData.phone_number;
        contactType = 'phone';
        console.log(`✅ Phone detected in step ${index + 1}: ${testData.phone_number}`);
      }
    }
  });

  // ✅ NEW: Auto-detect OTP step after contact step
  if (contactStep !== null) {
    for (let i = contactStep + 1; i < steps.length; i++) {
      if (isLikelyOtpStep(steps[i])) {
        autoDetectedOtpStep = i;
        console.log(`🎯 Auto-detected OTP step at index ${i + 1}`);
        break; // Take the first OTP step found
      }
    }
  }

  // ✅ STEP 2: Return result with auto-detected OTP step
  const result = {
    hasOtpSteps: contactStep !== null,
    contactStep,
    otpStep: autoDetectedOtpStep, 
    matchedContactData,
    contactType,
    detectedSteps: steps,
    potentialOtpSteps: contactStep !== null ? 
      steps.slice(contactStep + 1).map((step, index) => ({
        stepIndex: contactStep + 1 + index,
        stepText: typeof step === 'object' ? step.command || step.description : step,
        isLikelyOtp: isLikelyOtpStep(step)
      })) : []
  };

  console.log("🎯 Final Detection Result:", result);
  return result;
};

const isLikelyOtpStep = (step) => {
  const stepText = typeof step === 'object' ? step.command || step.description : step;
  const stepLower = stepText.toLowerCase();
  
  const typePattern = /type\s+([^in]+)\s+in/i;
  const match = stepText.match(typePattern);
  
  if (match) {
    const userInput = match[1].trim().toLowerCase();
    return userInput.includes('otp');
  }
  

  return stepLower.startsWith('type otp') || 
         stepLower.startsWith('enter otp') ||
         stepLower.startsWith('input otp');
};

  const handleAddSteps = () => {
    console.log("🚀 handleAddSteps called");
    console.log("📋 Current state:", {
      extractedStepsLength: extractedSteps.length,
      needsOtpVerification,
      isTestDataLoading,
      testData: testData ? 'Available' : 'Not Available'
    });

    if (extractedSteps.length === 0) {
      alert("No steps to add. Please create steps first.");
      return;
    }

    const { project_type, platform } = projectData || {};
    console.log("📊 Project Data:", { project_type, platform });

    // ✅ FIXED: Check for OTP verification before navigation
    if (needsOtpVerification) {
      console.log("🔐 OTP verification is enabled, checking requirements...");
      
      if (isTestDataLoading) {
        console.log("⏳ Test data is still loading...");
        alert("Loading test data... Please wait.");
        return;
      }

      if (!testData) {
        console.log("❌ No test data found");
        alert("No test data found. Please add test data first.");
        return;
      }

      console.log("🔍 Starting OTP detection process...");
      const detectedData = detectOtpStepsInGenerated(extractedSteps);
      
      if (detectedData.hasOtpSteps) {
        console.log("✅ OTP steps detected, opening confirmation modal...");
        
        // Set default selected OTP step
        const defaultOtpStep = detectedData.otpStep !== null ? detectedData.otpStep.toString() : 'none';
        setSelectedOtpStep(defaultOtpStep);
        
        setOtpConfirmationModal({
          isOpen: true,
          contactStep: detectedData.contactStep,
          otpStep: detectedData.otpStep,
          matchedContactData: detectedData.matchedContactData,
          contactType: detectedData.contactType,
          detectedSteps: detectedData.detectedSteps
        });
        console.log("🎯 Modal state set with default OTP step:", defaultOtpStep);
        return;
      } else {
        console.log("❌ No OTP steps detected");
        alert("No matching email or phone number found in the generated steps for OTP verification.");
        return;
      }
    }

    console.log("➡️ Proceeding with normal navigation (no OTP verification)");
    // ✅ EXISTING: Normal navigation logic
    const navigationState = {
      generatedSteps: extractedSteps,
      autoExecuteFirst: true,
      needsOtpVerification: needsOtpVerification
    };

    console.log("🎯 Navigation State:", navigationState);

    // Navigation Logic:
    if (project_type === "Web Application" && platform === "Laptop/PC") {
      console.log("🌐 Navigating to /prompt-adding");
      navigate("/prompt-adding", { state: navigationState });
    } 
    else if (project_type === "Web Application" && platform === "Mobile") {
      console.log("📱 Navigating to /mobile-prompt");
      navigate("/mobile-prompt", { state: navigationState });
    } 
    else if (project_type === "Mobile Application" && platform === "Android") {
      console.log("🤖 Navigating to /android-prompt");
      navigate("/android-prompt", { state: navigationState });
    } 
    else {
      console.log("❌ Unsupported combination:", { project_type, platform });
      alert("Unsupported combination of project type and platform.");
    }
  };

const handleOtpConfirmation = (userSelectedOtpStep) => {
  const { contactStep, contactType, detectedSteps } = otpConfirmationModal;
  const { project_type, platform } = projectData || {};

  // Parse user selection
  const otpStep = userSelectedOtpStep === 'none' ? null : parseInt(userSelectedOtpStep);

  console.log("🚀 Navigating with user-confirmed OTP:", {
    contactStep: contactStep + 1,
    otpStep: otpStep !== null ? otpStep + 1 : 'User selected: None',
    contactType
  });

  const stepsWithOtpFlags = detectedSteps.map((step, index) => {
    const baseStep = typeof step === 'object' ? step : { command: step };
    
    const isContactStep = index === contactStep;
    const isActualOtpStep = index === otpStep;
    
    if (isContactStep) {
      return {
        ...baseStep,
        requiresOtp: true, 
        otpType: contactType, 
        isOtpRelatedStep: true, 
        isActualOtpStep: false
      };
    }

    if (isActualOtpStep) {
      return {
        ...baseStep,
        requiresOtp: true, 
        otpType: contactType, 
        isOtpRelatedStep: false, 
        isActualOtpStep: true 
      };
    }
    
    if (contactStep !== null && otpStep !== null && index > contactStep && index < otpStep) {
      return {
        ...baseStep,
        requiresOtp: true, 
        otpType: contactType, 
        isOtpRelatedStep: false, 
        isActualOtpStep: false 
      };
    }
    
    return {
      ...baseStep,
      requiresOtp: false,
      otpType: null,
      isOtpRelatedStep: false,
      isActualOtpStep: false
    };
  });

  const navigationState = {
    generatedSteps: stepsWithOtpFlags,
    autoExecuteFirst: true,
    needsOtpVerification: true
  };

  console.log("🎯 Steps with user-confirmed OTP flags:", stepsWithOtpFlags);

  // Close modal and reset selection
  setOtpConfirmationModal({
    isOpen: false,
    contactStep: null,
    otpStep: null,
    matchedContactData: null,
    contactType: null,
    detectedSteps: []
  });
  setSelectedOtpStep('none');

  // Navigation logic remains the same...
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

  const handleOtpModalCancel = () => {
    setOtpConfirmationModal({
      isOpen: false,
      contactStep: null,
      otpStep: null,
      matchedContactData: null,
      contactType: null,
      detectedSteps: []
    });
  };

  const handleEditStep = (index) => {
    setEditingStepIndex(index);
    const stepText = typeof extractedSteps[index] === 'object' 
      ? extractedSteps[index].command 
      : extractedSteps[index];
    setEditingStepText(stepText);
  };

  const handleSaveEdit = () => {
    const updatedSteps = [...extractedSteps];
    if (typeof updatedSteps[editingStepIndex] === 'object') {
      updatedSteps[editingStepIndex] = {
        ...updatedSteps[editingStepIndex],
        command: editingStepText
      };
    } else {
      updatedSteps[editingStepIndex] = editingStepText;
    }
    setExtractedSteps(updatedSteps);
    setEditingStepIndex(null);
    setEditingStepText('');
  };

  const handleCancelEdit = () => {
    setEditingStepIndex(null);
    setEditingStepText('');
  };

  const handleDeleteStep = (index) => {
    const updatedSteps = extractedSteps.filter((_, i) => i !== index);
    setExtractedSteps(updatedSteps);
  };

  const handleClearSteps = () => {
    setExtractedSteps([]);
    setShowExtractedSteps(false);
    setPromptText('');
  };

const handleOtpCheckboxChange = (e) => {
  const isChecked = e.target.checked;
  console.log("☑️ OTP Checkbox changed:", isChecked);
  setNeedsOtpVerification(isChecked);
  
  if (isChecked) {
    console.log("🔐 OTP verification enabled, will fetch test data...");
  } else {
    console.log("❌ OTP verification disabled");
  }
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
                <div className="flex justify-end mt-2">
                    <button
                      onClick={generatePromptFromAssistant}
                      disabled={isGeneratingPrompt}
                      className="text-blue-600 text-sm flex items-center hover:underline disabled:opacity-50"
                    >
                      {isGeneratingPrompt ? (
                        <svg
                          className="animate-spin w-4 h-4 mr-2 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4H8v4H4z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 mr-2 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      )}
                      {isGeneratingPrompt
                        ? "Generating..."
                        : "Prompt Assistant"}
                    </button>
                  </div>
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
                        disabled={needsOtpVerification && isTestDataLoading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                        >
                        {needsOtpVerification && isTestDataLoading ? 'Loading...' : 'Add Steps'}
                        </button>
                    </>
                    )}
                </div>
              </div>

              {/* ✅ MODIFIED: Add OTP Checkbox with test data status */}
                {showExtractedSteps && extractedSteps.length > 0 && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={needsOtpVerification}
                        onChange={handleOtpCheckboxChange}
                        className="accent-orange-500"
                      />
                      <span className="font-medium">This scenario requires OTP verification</span>
                    </label>
                    <div className="text-xs text-gray-600 mt-1">
                      Check this if your test steps include OTP/verification code steps
                    </div>
                    
                    {/* ✅ NEW: Show test data status */}
                    {needsOtpVerification && (
                      <div className="mt-2 text-xs">
                        {isTestDataLoading ? (
                          <span className="text-blue-600">📱 Loading test data...</span>
                        ) : testData ? (
                          <div className="text-green-600">
                            ✅ Test data found: 
                            {testData.email && <span className="ml-1">📧 {testData.email}</span>}
                            {testData.phone_number && <span className="ml-1">📱 {testData.phone_number}</span>}
                          </div>
                        ) : (
                          <span className="text-red-600">⚠️ No test data found for OTP verification</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

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
                          {editingStepIndex === index ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingStepText}
                                onChange={(e) => setEditingStepText(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent resize-none"
                                rows="2"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveEdit}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>
                        {editingStepIndex !== index && (
                          <div className="flex-shrink-0 flex gap-1">
                            <button
                              onClick={() => handleEditStep(index)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit step"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteStep(index)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete step"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        )}
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

        {/* ✅ NEW: OTP Confirmation Modal */}
        {otpConfirmationModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[70vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">OTP Verification Setup</h3>
                    <p className="text-sm text-gray-600">Configure automated OTP handling for your test</p>
                  </div>
                </div>
                <button
                  onClick={handleOtpModalCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {otpConfirmationModal.contactStep + 1}
                      </span>
                    </div>
                    <h4 className="font-semibold text-purple-900">Contact Method Detected</h4>
                  </div>
                  <div className="ml-11">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-700 font-medium">
                        {otpConfirmationModal.contactType === 'email' ? '📧 Email:' : '📱 Phone:'} 
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {otpConfirmationModal.matchedContactData}
                      </span>
                    </div>
                  </div>
                </div>

                {/* OTP Step Selection */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Select OTP Entry Step
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Which step requires entering the OTP/verification code?
                  </p>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {/* No OTP Option */}
                    <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedOtpStep === 'none' 
                        ? 'border-purple-300 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="otpStep"
                        value="none"
                        checked={selectedOtpStep === 'none'}
                        onChange={(e) => setSelectedOtpStep(e.target.value)}
                        className="mt-1 text-purple-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">No manual OTP step</div>
                        <div className="text-sm text-gray-500">System will handle OTP automatically</div>
                      </div>
                    </label>

                    {/* Available Steps */}
                    {otpConfirmationModal.detectedSteps
                      .slice(otpConfirmationModal.contactStep + 1)
                      .map((step, index) => {
                        const actualIndex = otpConfirmationModal.contactStep + 1 + index;
                        const stepText = typeof step === 'object' ? step.command || step.description : step;
                        const isLikely = isLikelyOtpStep(step);
                        const isSelected = selectedOtpStep === actualIndex.toString();
                        
                        return (
                          <label 
                            key={actualIndex} 
                            className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-purple-300 bg-purple-50'
                                : isLikely
                                ? 'border-green-300 bg-green-50 hover:border-green-400'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="otpStep"
                              value={actualIndex.toString()}
                              checked={isSelected}
                              onChange={(e) => setSelectedOtpStep(e.target.value)}
                              className="mt-1 text-purple-600"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">Step {actualIndex + 1}</span>
                                {isLikely && (
                                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                    🎯 Detected OTP
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-700 break-words font-mono bg-gray-50 px-2 py-1 rounded">
                                {stepText}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleOtpModalCancel}
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleOtpConfirmation(selectedOtpStep)}
                  className="px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  Configure & Proceed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestSenario;