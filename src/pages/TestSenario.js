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
  const [insertingStepIndex, setInsertingStepIndex] = useState(null);
  const [insertingStepText, setInsertingStepText] = useState('');

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

const [scenarioName, setScenarioName] = useState('');
const [scenarioType, setScenarioType] = useState('');
const [scenarioPriority, setScenarioPriority] = useState('');
const [scenarioErrors, setScenarioErrors] = useState({ name: "", type: "", priority: "" });

const [scenarioTypes, setScenarioTypes] = useState([]);
const [scenarioPriorities, setScenarioPriorities] = useState([]);

const [promptHistory, setPromptHistory] = useState([]);
const [showHistory, setShowHistory] = useState(false);

const [testUrl, setTestUrl] = useState('');
const [isEditingUrl, setIsEditingUrl] = useState(false);
const [tempUrl, setTempUrl] = useState('');
const [isSavingUrl, setIsSavingUrl] = useState(false);

const [isEnhancing, setIsEnhancing] = useState(false);

const [testResults, setTestResults] = useState(null);
const [showTestResults, setShowTestResults] = useState(false);

const [screenshotModal, setScreenshotModal] = useState({ isOpen: false, src: '', alt: '' });

const saveTestUrl = async () => {
  if (!projectData?.id || !tempUrl.trim()) return;
  
  setIsSavingUrl(true);
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/testdata/${projectData.id}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: tempUrl.trim()
      })
    });
    
    if (response.ok) {
      setTestUrl(tempUrl.trim());
      setIsEditingUrl(false);
      setTempUrl('');
      console.log('URL saved successfully');
    }
  } catch (error) {
    console.error('Error saving URL:', error);
    alert('Failed to save URL');
  } finally {
    setIsSavingUrl(false);
  }
};

const enhancePrompt = async () => {
  if (!promptText.trim()) {
    alert("Please enter a prompt first to enhance.");
    return;
  }

  setIsEnhancing(true);
  try {
    const response = await fetch('http://127.0.0.1:8000/AIPrompt/enhance/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: promptText
      })
    });

    if (!response.ok) {
      throw new Error('Failed to enhance prompt');
    }

    const data = await response.json();

    console.log("Enhanced_Prompt:", data)
    
    if (data.data && data.data.enhanced_prompt) {
      setPromptText(data.data.enhanced_prompt);
    } else {
      alert('No enhanced prompt received.');
    }
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    alert('Failed to enhance prompt. Please try again.');
  } finally {
    setIsEnhancing(false);
  }
};

useEffect(() => {
  const fetchScenarioTypes = async () => {
    if (!projectData?.project_name) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/testcase-types/?project_name=${projectData.project_name}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch scenario types");
      }

      const data = await response.json();
      console.log("Fetched Scenario Types:", data);
      setScenarioTypes(data); 
    } catch (error) {
      console.error("Error fetching scenario types:", error);
      setScenarioTypes([]);
    }
  };

  fetchScenarioTypes();
}, [projectData]);

useEffect(() => {
  const fetchScenarioPriorities = async () => {
    if (!projectData?.project_name) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/testcase-priorities/?project_name=${projectData.project_name}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch scenario priorities");
      }

      const data = await response.json();
      console.log("Fetched Scenario Priorities:", data);
      setScenarioPriorities(data); 
    } catch (error) {
      console.error("Error fetching scenario priorities:", error);
      setScenarioPriorities([]);
    }
  };

  fetchScenarioPriorities();
}, [projectData]);

const validateScenarioFields = () => {
  const newErrors = {};
  let isValid = true;

  if (!scenarioName.trim()) {
    newErrors.name = "Scenario name is required!";
    isValid = false;
  }

  if (!scenarioType.trim()) {
    newErrors.type = "Scenario type is required!";
    isValid = false;
  }

  if (!scenarioPriority.trim()) {
    newErrors.priority = "Scenario priority is required!";
    isValid = false;
  }

  setScenarioErrors(newErrors);
  return isValid;
};

const savePromptToHistory = (promptText, steps) => {
  const historyItem = {
    id: Date.now(),
    prompt: promptText,
    steps: steps,
    timestamp: new Date().toLocaleString(),
    scenarioDetails: {
      name: scenarioName,
      type: scenarioType,
      priority: scenarioPriority
    }
  };

  // Get existing history from sessionStorage
  const existingHistory = JSON.parse(sessionStorage.getItem('promptHistory') || '[]');
  
  // Add new item to beginning and keep only last 3
  const updatedHistory = [historyItem, ...existingHistory].slice(0, 3);
  
  // Save to sessionStorage and state
  sessionStorage.setItem('promptHistory', JSON.stringify(updatedHistory));
  setPromptHistory(updatedHistory);
  
  console.log("💾 Prompt saved to history:", historyItem);
};

const loadPromptFromHistory = (historyItem) => {
  setPromptText(historyItem.prompt);
  setExtractedSteps(historyItem.steps);
  setShowExtractedSteps(true);
  
  // Also restore scenario details if they exist
  if (historyItem.scenarioDetails) {
    setScenarioName(historyItem.scenarioDetails.name || '');
    setScenarioType(historyItem.scenarioDetails.type || '');
    setScenarioPriority(historyItem.scenarioDetails.priority || '');
  }
  
  setShowHistory(false);
  console.log("📋 Prompt loaded from history:", historyItem);
};

const clearPromptHistory = () => {
  sessionStorage.removeItem('promptHistory');
  setPromptHistory([]);
  setShowHistory(false);
  console.log("🗑️ Prompt history cleared");
};

const loadHistoryFromStorage = () => {
  const savedHistory = JSON.parse(sessionStorage.getItem('promptHistory') || '[]');
  setPromptHistory(savedHistory);
};

useEffect(() => {
  loadHistoryFromStorage();
}, []);

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
    if (projectData?.id) {
      setIsTestDataLoading(true);
      fetch(`http://127.0.0.1:8000/api/testdata/${projectData.id}/`)
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ Test data loaded:", data);
          setTestData(data);
          setTestUrl(data?.url || '');
        })
        .catch((err) => {
          console.warn("⚠️ Error fetching test data:", err.message);
          setTestData(null);
        })
        .finally(() => setIsTestDataLoading(false));
    }
  }, [projectData?.id]);

  // const extractStepsFromPrompt = async () => {
  //   if (!validateScenarioFields()) {
  //     return;
  //   }

  //   if (!promptText.trim()) {
  //     alert("Please enter a prompt first.");
  //     return;
  //   }

  //   setIsExtracting(true);
  //   try {
  //     console.log("📦 Sending Request Payload:", {
  //       prompt: promptText,
  //       project_type: projectData?.project_type,
  //       platform: projectData?.platform,
  //     });

  //     const response = await fetch('http://127.0.0.1:8000/api/extract-steps/', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         prompt: promptText,
  //         project_type: projectData?.project_type,
  //         platform: projectData?.platform,
  //       })
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to extract steps');
  //     }

  //     const data = await response.json();
  //     console.log("✅ Extracted steps response:", data);

  //     const newSteps = data.steps || [];
  //     setExtractedSteps(newSteps);
  //     setShowExtractedSteps(true);

  //     // ✅ FIX: Use newSteps instead of extractedSteps
  //     if (newSteps.length > 0) {
  //       savePromptToHistory(promptText, newSteps);
  //     }

  //   } catch (error) {
  //     console.error('Error extracting steps:', error);
  //     alert('Failed to extract steps. Please try again.');
  //   } finally {
  //     setIsExtracting(false);
  //   }
  // };

  const extractStepsFromPrompt = async () => {
    const userId = localStorage.getItem("userId");

    if (!validateScenarioFields()) {
      return;
    }

    if (!promptText.trim()) {
      alert("Please enter a prompt first.");
      return;
    }

    setIsExtracting(true);
    try {
      console.log("📦 Sending Request Payload:", {
        url: testUrl,
        user_id: userId, 
        test_prompt: promptText
      });

      const response = await fetch('http://127.0.0.1:8000/automation/agent/run/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testUrl,
          user_id: userId,
          test_prompt: promptText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run automation');
      }

      const data = await response.json();
      console.log("✅ Automation response:", data);

      setTestResults(data);
      setShowTestResults(true);
      
      alert('Automation completed successfully!');

    } catch (error) {
      console.error('Error running automation:', error);
      alert('Failed to start automation. Please try again.');
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
      needsOtpVerification: needsOtpVerification,
      testScenarioInfo: {
        testcase_name: scenarioName.trim(),
        testcase_type: scenarioType,
        testcase_priority: scenarioPriority,
        projectId: projectData?.project_name,
        project_type: projectData?.project_type,
        platform: projectData?.platform
      }
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
    needsOtpVerification: true,
    senderEmail: otpConfirmationModal.contactType === 'email' ? testData?.email : null,
    testScenarioInfo: {
      testcase_name: scenarioName.trim(),
      testcase_type: scenarioType,
      testcase_priority: scenarioPriority,
      projectId: projectData?.project_name,
      project_type: projectData?.project_type,
      platform: projectData?.platform
    }
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

  console.log("🔍 Debug navigation data:", {
    contactType: otpConfirmationModal.contactType,
    testDataEmail: testData?.email,
    senderEmailToPass: otpConfirmationModal.contactType === 'email' ? testData?.email : null
  });

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

  const parseStepText = (stepText) => {
    const lowerText = stepText.toLowerCase().trim();
    
    // Scroll actions
    const scrollOptions = [
      "scroll up", "scroll up a bit", "scroll up a lot", "scroll up fast",
      "scroll down", "scroll down a bit", "scroll down a lot", "scroll down fast",
      "scroll left", "scroll right"
    ];
    
    const swipeOptions = [
      "swipe left", "swipe right", "swipe long left", "swipe long right"
    ];
    
    // Check for scroll actions
    for (const scrollAction of scrollOptions) {
      if (lowerText.startsWith(scrollAction)) {
        const remainingText = stepText.replace(new RegExp(`^${scrollAction}`, 'i'), '').trim();
        return {
          action: scrollAction, 
          target: remainingText || null, 
          value: null
        };
      }
    }
    
    // Check for swipe actions
    for (const swipeAction of swipeOptions) {
      if (lowerText.startsWith(swipeAction)) {
        const remainingText = stepText.replace(new RegExp(`^${swipeAction}`, 'i'), '').trim();
        return {
          action: swipeAction, 
          target: remainingText || null,
          value: null
        };
      }
    }
    
    // Search action - just "search" as action, everything else as target
    if (lowerText.startsWith('search')) {
      return {
        action: 'search',
        target: stepText.replace(/^search\s+/i, '').trim(), // Everything after "search"
        value: null
      };
    }
    
    // Click action
    if (lowerText.startsWith('click')) {
      return {
        action: 'click',
        target: stepText.replace(/^click\s+/i, '').trim(),
        value: null
      };
    }
    
    // Type action
    if (lowerText.startsWith('type')) {
      const match = stepText.match(/type\s+(.+?)\s+in\s+(.+)/i);
      if (match) {
        return {
          action: 'type',
          target: match[2].trim(),
          value: match[1].trim()
        };
      }
      return {
        action: 'type',
        target: null,
        value: stepText.replace(/^type\s+/i, '').trim()
      };
    }
    
    // Open action
    if (lowerText.startsWith('open')) {
      return {
        action: 'open',
        target: stepText.replace(/^open\s+/i, '').trim(),
        value: null
      };
    }
    
    // Get action
    if (lowerText.startsWith('get')) {
      return {
        action: 'get',
        target: stepText.replace(/^get\s+/i, '').trim(),
        value: null
      };
    }
    
    // Verify action
    if (lowerText.startsWith('verify')) {
      return {
        action: 'verify',
        target: stepText.replace(/^verify\s+/i, '').trim(),
        value: null
      };
    }
    
    // Select action
    if (lowerText.startsWith('select')) {
      return {
        action: 'select',
        target: stepText.replace(/^select\s+/i, '').trim(),
        value: null
      };
    }
    
    // Wait action
    if (lowerText.startsWith('wait')) {
      const match = stepText.match(/wait\s+(\d+)\s*(seconds?|mins?|minutes?)?/i);
      if (match) {
        return {
          action: 'wait',
          target: match[2] || 'seconds',
          value: match[1]
        };
      }
      return {
        action: 'wait',
        target: stepText.replace(/^wait\s+/i, '').trim(),
        value: null
      };
    }
    
    // Default case
    return {
      action: null,
      target: null,
      value: null
    };
  };

  const handleInsertStep = (index) => {
    setInsertingStepIndex(index);
    setInsertingStepText('');
  };

  const handleSaveInsert = () => {
    if (insertingStepText.trim()) {
      const updatedSteps = [...extractedSteps];
      
      const isObjectFormat = extractedSteps.some(step => typeof step === 'object' && step.step);
      
      let newStep;
      if (isObjectFormat) {
        const parsedStep = parseStepText(insertingStepText.trim());
        newStep = {
          step: insertingStepIndex + 2,
          ...parsedStep,
          command: insertingStepText.trim(),
          description: insertingStepText.trim()
        };
      }
      
      updatedSteps.splice(insertingStepIndex + 1, 0, newStep);
      
      // Re-index all steps to maintain proper numbering
      const reindexedSteps = updatedSteps.map((step, index) => {
        if (typeof step === 'object') {
          return { ...step, step: index + 1 };
        }
        return step;
      });
      
      setExtractedSteps(reindexedSteps);
    }
    setInsertingStepIndex(null);
    setInsertingStepText('');
  };

  const handleCancelInsert = () => {
    setInsertingStepIndex(null);
    setInsertingStepText('');
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
        command: editingStepText,
        description: editingStepText 
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
    
    // Reindex object-type steps
    const reindexedSteps = updatedSteps.map((step, newIndex) => {
      if (typeof step === 'object') {
        return { ...step, step: newIndex + 1 };
      }
      return step;
    });
    
    setExtractedSteps(reindexedSteps);
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

            {/* Test Scenario Details - ADD THIS NEW SECTION */}
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Scenario Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Scenario Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scenario Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={scenarioName}
                    onChange={(e) => {
                      setScenarioName(e.target.value);
                      setScenarioErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder="Enter scenario name"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                      scenarioErrors.name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {scenarioErrors.name && (
                    <span className="text-red-500 text-xs mt-1">{scenarioErrors.name}</span>
                  )}
                </div>

                {/* Scenario Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={scenarioType}
                    onChange={(e) => {
                      setScenarioType(e.target.value);
                      setScenarioErrors((prev) => ({ ...prev, type: "" }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                      scenarioErrors.type ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Type</option>
                    {scenarioTypes.map((type) => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {scenarioErrors.type && (
                    <span className="text-red-500 text-xs mt-1">{scenarioErrors.type}</span>
                  )}
                </div>

                {/* Scenario Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={scenarioPriority}
                    onChange={(e) => {
                      setScenarioPriority(e.target.value);
                      setScenarioErrors((prev) => ({ ...prev, priority: "" }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                      scenarioErrors.priority ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Priority</option>
                    {scenarioPriorities.map((priority) => (
                      <option key={priority.id} value={priority.priority_level}>
                        {priority.priority_level}
                      </option>
                    ))}
                  </select>
                  {scenarioErrors.priority && (
                    <span className="text-red-500 text-xs mt-1">{scenarioErrors.priority}</span>
                  )}
                </div>
              </div>
            </div>

            {/* URL Section */}
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Test URL</h2>
              
              <div className="flex items-center gap-3">
                {!isEditingUrl ? (
                  <>
                    {testUrl ? (
                      <>
                        <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 font-mono break-all">{testUrl}</span>
                            <button
                              onClick={() => {
                                setIsEditingUrl(true);
                                setTempUrl(testUrl);
                              }}
                              className="ml-3 p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit URL"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1">
                        <button
                          onClick={() => setIsEditingUrl(true)}
                          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                          Add Test URL
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="url"
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="Enter test URL (e.g., https://example.com)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      autoFocus
                    />
                    <button
                      onClick={saveTestUrl}
                      disabled={!tempUrl.trim() || isSavingUrl}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {isSavingUrl ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        'Save'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUrl(false);
                        setTempUrl('');
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6">
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
                        Running Automation...
                    </span>
                    ) : (
                    'Start Automation'
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
                  <div className="flex justify-end items-center gap-3 mt-2">
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
                      {isGeneratingPrompt ? "Generating..." : "Prompt Assistant"}
                    </button>

                    {/* New Enhance Button */}
                    <button
                      onClick={enhancePrompt}
                      disabled={isEnhancing || !promptText.trim()}
                      className="text-green-600 text-sm flex items-center hover:underline disabled:opacity-50"
                    >
                      {isEnhancing ? (
                        <svg
                          className="animate-spin w-4 h-4 mr-2 text-green-500"
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
                          className="w-4 h-4 mr-2 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                          />
                        </svg>
                      )}
                      {isEnhancing ? "Enhancing..." : "Enhance"}
                    </button>

                    {/* ✅ ADD THIS HISTORY DROPDOWN RIGHT HERE */}
                    <div className="relative ml-3">
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        disabled={promptHistory.length === 0}
                        className="text-blue-600 text-sm flex items-center hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        History ({promptHistory.length})
                      </button>

                      {/* History Dropdown */}
                      {showHistory && promptHistory.length > 0 && (
                        <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                          {/* Header */}
                          <div className="flex items-center justify-between p-3 border-b border-gray-100">
                            <span className="font-medium text-gray-900 text-sm">Recent Prompts</span>
                            <button
                              onClick={clearPromptHistory}
                              className="text-red-600 text-xs hover:underline"
                            >
                              Clear All
                            </button>
                          </div>

                          {/* History Items */}
                          <div className="py-2">
                            {promptHistory.map((item, index) => (
                              <div
                                key={item.id}
                                onClick={() => loadPromptFromHistory(item)}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs text-gray-500 mb-1">{item.timestamp}</div>
                                    <div className="text-sm text-gray-900 truncate mb-1">
                                      {item.prompt.substring(0, 60)}...
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                                        {item.steps.length} steps
                                      </span>
                                      {item.scenarioDetails?.name && (
                                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                          {item.scenarioDetails.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            </div>

            {/* Right Side - Generated Steps */}
            {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
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
                        <div key={index}>
                          <div className="group">

                            <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150">
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
                                        className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors"
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
                                      {typeof step === 'object' ? (step.command || step.description) : step}
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
                                <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

                            {insertingStepIndex !== index && (
                              <div className="flex justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={() => handleInsertStep(index)}
                                  className="group flex items-center justify-center w-8 h-8 bg-white border-2 border-dashed border-gray-300 rounded-full hover:border-purple-400 hover:bg-purple-50 transition-all duration-200"
                                  title={`Add step after step ${index + 1}`}
                                >
                                  <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>

                          {insertingStepIndex === index && (
                            <div className="mt-2 p-3 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center text-xs font-medium">
                                  {index + 2}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <textarea
                                    value={insertingStepText}
                                    onChange={(e) => setInsertingStepText(e.target.value)}
                                    placeholder="Enter new step..."
                                    className="w-full px-2 py-1 text-sm border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                    rows="2"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleSaveInsert}
                                      disabled={!insertingStepText.trim()}
                                      className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                      Add Step
                                    </button>
                                    <button
                                      onClick={handleCancelInsert}
                                      className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    )}
                </div>
                )}
            </div> */}
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


        {/* Test Results Section */}
        {showTestResults && testResults && (
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    testResults.success ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {testResults.success ? (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Test Execution Results
                    </h2>
                    <p className="text-sm text-gray-600">
                      {testResults.test_prompt}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTestResults(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-900">
                    {testResults.success_metrics?.total_steps_attempted || 0}
                  </div>
                  <div className="text-sm text-purple-700">Total Steps</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-900">
                    {testResults.success_metrics?.successful_steps || 0}
                  </div>
                  <div className="text-sm text-purple-700">Successful</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-900">
                    {testResults.success_metrics?.total_failures || 0}
                  </div>
                  <div className="text-sm text-purple-700">Failed</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-900">
                    {testResults.success_metrics?.success_rate || '0%'}
                  </div>
                  <div className="text-sm text-purple-700">Success Rate</div>
                </div>
              </div>

              {/* Execution Time */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">Execution Time:</span>
                    <span className="ml-2 text-lg font-semibold text-gray-900">
                      {testResults.success_metrics?.execution_time?.toFixed(2) || 0}s
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                      testResults.result === 'passed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {testResults.result || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action History - Detailed Steps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step-by-Step Execution</h3>
                
                {testResults.action_history?.map((action, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Step Header */}
                    <div className={`p-4 ${
                      action.result === 'executed' || action.result === 'success' 
                        ? 'bg-green-50 border-b border-green-200' 
                        : 'bg-red-50 border-b border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                            action.result === 'executed' || action.result === 'success' 
                              ? 'bg-green-600' 
                              : 'bg-red-600'
                          }`}>
                            {action.step}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              Step {action.step}: {action.action?.action || 'Unknown Action'}
                            </div>
                            <div className="text-sm text-gray-600">
                              Element: {action.action?.element || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          action.result === 'executed' || action.result === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {action.result || 'Unknown'}
                        </div>
                      </div>
                    </div>

                    {/* Step Details */}
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Side - Request & Action Details */}
                        <div className="space-y-4">
                          {/* Request Details */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                              <div className="space-y-1">
                                <div><span className="font-medium">Command:</span> {action.request?.command || 'N/A'}</div>
                                {action.request?.click_x && action.request?.click_y && (
                                  <div><span className="font-medium">Coordinates:</span> ({action.request.click_x}, {action.request.click_y})</div>
                                )}
                                {action.action?.text && (
                                  <div><span className="font-medium">Input Text:</span> {action.action.text}</div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Details */}
                          {action.action && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Action Details</h4>
                              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                                <div className="space-y-1">
                                  <div><span className="font-medium">Action:</span> {action.action.action}</div>
                                  <div><span className="font-medium">Element:</span> {action.action.element}</div>
                                  {action.action.reasoning && (
                                    <div><span className="font-medium">Reasoning:</span> {action.action.reasoning}</div>
                                  )}
                                  {action.action.expected_change && (
                                    <div><span className="font-medium">Expected:</span> {action.action.expected_change}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Element Data */}
                          {/* {action.action?.element_data && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Element Information</h4>
                              <div className="bg-purple-50 rounded-lg p-3 text-sm">
                                <div className="space-y-1">
                                  <div><span className="font-medium">Type:</span> {action.action.element_data.type}</div>
                                  <div><span className="font-medium">ID:</span> {action.action.element_data.id}</div>
                                  {action.action.element_data.coordinates && (
                                    <div><span className="font-medium">Coordinates:</span> [{action.action.element_data.coordinates.join(', ')}]</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )} */}
                        </div>

                        {/* Right Side - Screenshot */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Screenshot</h4>
                          {action.screenshot ? (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <img
                                src={`http://127.0.0.1:8000${action.screenshot}`}
                                alt={`Screenshot for step ${action.step}`}
                                className="w-full h-auto max-h-64 object-contain bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setScreenshotModal({
                                  isOpen: true, 
                                  src: `http://127.0.0.1:8000${action.screenshot}`, 
                                  alt: `Screenshot for step ${action.step}`
                                })}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="hidden items-center justify-center h-32 bg-gray-100 text-gray-500">
                                <div className="text-center">
                                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                  </svg>
                                  <div className="text-sm">Screenshot unavailable</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="border border-gray-200 rounded-lg h-32 flex items-center justify-center bg-gray-50">
                              <div className="text-center text-gray-500">
                                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                <div className="text-sm">No screenshot available</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Final Screenshots */}
              {testResults.screenshots && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">Final Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testResults.screenshots.previous_screenshot && (
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Previous Screenshot</div>
                        <img
                          src={`http://127.0.0.1:8000${testResults.screenshots.previous_screenshot}`}
                          alt="Previous screenshot"
                          className="w-full h-auto max-h-48 object-contain border border-gray-200 rounded bg-white"
                          onClick={() => setScreenshotModal({
                            isOpen: true,
                            src: `http://127.0.0.1:8000${testResults.screenshots.previous_screenshot}`,
                            alt: 'Final screenshot'
                          })}
                        />
                      </div>
                    )}
                    {testResults.screenshots.final_screenshot && (
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Final Screenshot</div>
                        <img
                          src={`http://127.0.0.1:8000${testResults.screenshots.final_screenshot}`}
                          alt="Final screenshot"
                          className="w-full h-auto max-h-48 object-contain border border-gray-200 rounded bg-white"
                          onClick={() => setScreenshotModal({
                            isOpen: true,
                            src: `http://127.0.0.1:8000${testResults.screenshots.final_screenshot}`,
                            alt: 'Final screenshot'
                          })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Screenshot Modal */}
        {screenshotModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-6xl max-h-[90vh] w-full">
              <button
                onClick={() => setScreenshotModal({ isOpen: false, src: '', alt: '' })}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              <img
                src={screenshotModal.src}
                alt={screenshotModal.alt}
                className="w-full h-full object-contain bg-white rounded-lg"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default TestSenario;