
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Plus, Clock, X, Loader, WifiOff, Wifi, MonitorSmartphone, Smartphone, Tag } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";
import { getSuggestedElements } from '../pages/elementSuggestionUtils';
import { HelpCircle, Link, MousePointer, Info, AlertCircle } from 'lucide-react';


const MobilePrompt = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [testSteps, setTestSteps] = useState([]);
  const [newStep, setNewStep] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [elementData, setElementData] = useState(null);
  const [testCaseInfo, ] = useState({
    testcase_name: 'test-1',
    testcase_type: 'Non-functional',
    testcase_priority: 'Minor',
    projectId: 'GitHub-3',
    project_type: 'Web Application',
    platform:'Mobile'
  });

  const [verificationModal, setVerificationModal] = useState({
    isOpen: false,
    textToVerify: '',
    matchingElements: [],
    selectedElement: null
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [createTestCaseLoading, setCreateTestCaseLoading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [previouslySelectedElements, setPreviouslySelectedElements] = useState({});
  const [lastClickCoordinates, setLastClickCoordinates] = useState(null);
  const [secondaryVerification, setSecondaryVerification] = useState({
    isOpen: false,
    stepObj: null
  });
  const [instructionModalOpen, setInstructionModalOpen] = useState(false);
  const [waitModalOpen, setWaitModalOpen] = useState(false);

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false)
  const [connectionLoading, setConnectionLoading] = useState(false);

  // const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpVerificationState, setOtpVerificationState] = useState({
    isEnabled: false,
    phoneNumberEntered: false,
    waitingForOtp: false,
    enteredPhoneNumber: '',
    sessionTime: null
  });

  const [testData, setTestData] = useState(null);
  // const [isTestDataLoading, setIsTestDataLoading] = useState(false);
  const [otpCheckLoadingStepId, setOtpCheckLoadingStepId] = useState(null);
  const [senderEmail, setSenderEmail ] = useState('');

  const [stepsProcessed, setStepsProcessed] = useState(false);
  const [generatedSteps, setGeneratedSteps] = useState([]);
  const [currentGeneratedStepIndex, setCurrentGeneratedStepIndex] = useState(0);
  const [showElementModal, setShowElementModal] = useState(false);
  const [modalData, setModalData] = useState({
    matches: [],
    stepDescription: '',
    callback: null
  });
  const connectionAttemptedRef = useRef(false);
    const [isConnected, setIsConnected] = useState(false);
    const [stepsExecuted, setStepsExecuted] = useState(false); 
  
  const [waitStepIndex, setWaitStepIndex] = useState(null);
  const [waitStepData, setWaitStepData] = useState(null);

  const [otpReplacementModal, setOtpReplacementModal] = useState({
    isOpen: false,
    step: null,
    fetchedOtp: '',
    stepIndex: null
  });
  const [editStepModal, setEditStepModal] = useState({
    isOpen: false,
    step: null,
    errorMessage: '',
    currentPageData: null,
    stepIndex: null,
    suggestions: [],
    currentEditText: ''
  });


  const previewRef = useRef(null);
  const stepsRef = useRef(null);
  const inputRef = useRef(null);

  const user_id = localStorage.getItem("user_id");

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
        JSON.parse(savedProject);
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

//   useEffect(() => {
//     const info = location.state?.testCaseInfo;
//     console.log("info:", info);

//     if (!info || !info.testcase_name || !info.testcase_type || !info.testcase_priority) {
//       alert("Test case data is incomplete or missing.");
//       navigate("/test-cases/create-testcases");
//     } else {
//       setTestCaseInfo(info);  
//     }
//   }, [location, navigate]);

  useEffect(() => {
    if (elementData) {
      sessionStorage.setItem('latestElementData', JSON.stringify(elementData));
    }
  }, [elementData]);

  useEffect(() => {
    const storedData = sessionStorage.getItem('latestElementData');
    if (storedData) {
      try {
        setElementData(JSON.parse(storedData));
      } catch (error) {
        console.error('Error parsing stored element data:', error);
      }
    }
  }, []);

  useEffect(() => {
  if (newStep?.trim().toLowerCase() === 'wait') {
    setWaitModalOpen(true);
  }
}, [newStep]);

useEffect(() => {
  if (location.state?.generatedSteps && !stepsProcessed) {
    const steps = location.state.generatedSteps;

    if (location.state?.senderEmail) {
      console.log("🔍 Setting senderEmail:", location.state.senderEmail);
      setSenderEmail(location.state.senderEmail);
    }

    const stepObjects = steps.map((step, index) => ({
      id: `${Date.now()}-${index}-${Math.random()}`, 
      description: step.command,  
      action: step.action,
      target: step.target,
      value: step.value,
      requiresOtp: step.requiresOtp || false,
      otpType: step.otpType || null,
      isOtpRelatedStep: step.isOtpRelatedStep || false,
      isActualOtpStep: step.isActualOtpStep || false,
      step: step.step || index + 1,
      status: 'pending',
      duration: '00:00',
      screenshot: null,
      selectedElement: null
    }));

    setGeneratedSteps(stepObjects);
    setStepsProcessed(true);
      
    console.log("Steps after processing:", stepObjects);
  }
}, [location.state, stepsProcessed]);

  const getLastClickCoordinates = (steps) => {
    // Loop backwards through steps to find the last successful click action
    for (let i = steps.length - 1; i >= 0; i--) {
        const step = steps[i];
        if (step.status === 'complete' && 
            step.description.toLowerCase().startsWith('click') && 
            step.selectedElement && 
            step.selectedElement.click_point) {
            return step.selectedElement.click_point;
        }
    }
    return null;
  };

const checkChromeAvailability = useCallback(async () => {
  // Use ref to prevent multiple calls even in strict mode
  if (connectionAttemptedRef.current) {
    console.log("🛑 Connection already attempted, skipping");
    return;
  }
  
  connectionAttemptedRef.current = true;
  console.log("checkDeviceConnection - STARTING");
  setConnectionLoading(true);

  try {
    const response = await fetch("http://localhost:8000/android/connection/", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await response.json();
    console.log("Connection API Data:", data);

    if (response.ok && data.status === "success" && data.device_info) {
      setDeviceConnected(true);

      await new Promise(resolve => setTimeout(resolve, 1000));  

      const setupResponse = await fetch("http://localhost:8000/android/setup-device/", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const setupData = await setupResponse.json();
      console.log("ATX API Data:", setupData);

      if (setupResponse.ok) {
        setIsConnected(true);
        setTimeout(() => {
          setShowConnectModal(false);
        }, 1000);
        
      } else {
        console.error("ATX setup failed.");
        setDeviceConnected(false);
        setShowConnectModal(true);
        connectionAttemptedRef.current = false; 
      }

    } else {
      console.error("Device connection failed.");
      setDeviceConnected(false);
      setShowConnectModal(true);
      connectionAttemptedRef.current = false; 
    }

  } catch (error) {
    console.error("Error during device connection:", error);
    setDeviceConnected(false);
    setShowConnectModal(true);
    connectionAttemptedRef.current = false;
  } finally {
    setConnectionLoading(false);
  }
}, []); 

useEffect(() => {
  if (!testCaseInfo || !testCaseInfo.platform) return;

  const platform = testCaseInfo.platform;
  console.log("platform-recordpage:", platform);

  if (platform === "Mobile") {
    checkChromeAvailability();
  } 
  
}, [testCaseInfo, checkChromeAvailability]);

useEffect(() => {
  if (isConnected && generatedSteps && generatedSteps.length > 0 && !stepsExecuted) {
    console.log("🚀 Executing steps after successful connection");
    setStepsExecuted(true);
    autoExecuteStepsRef.current(generatedSteps);
  }
}, [isConnected, generatedSteps, stepsExecuted]);

  const executeStep = async (stepObj, stepIndex) => {
    setIsProcessing(true);
  
    try {
        const stepDescription = stepObj.description;
        
        const words = stepDescription.trim().split(' ');
        const actionType = (words[0].toLowerCase() === 'scroll' || words[0].toLowerCase() === 'swipe') && words.length > 1
          ? (words[0].toLowerCase() === 'swipe' && words[1] && words[1].toLowerCase() === 'long' && words.length > 2
              ? words.slice(0, 3).join(' ').toLowerCase()
              : words.slice(0, 2).join(' ').toLowerCase())
          : words[0].toLowerCase();

        words[0] = actionType;
  
        let updatedStepDescription = stepDescription;
    
        if (actionType === 'scroll up') {
          updatedStepDescription = "scroll up";
          console.log("Converting 'scrollup' to 'scroll_up page'");
        } else if (actionType === 'scroll down') {
          updatedStepDescription = "scroll down";
          console.log("Converting 'scrolldown' to 'scroll_down page'");
        } else {
          words[0] = actionType;
          updatedStepDescription = words.join(' ');
        }

        console.log("Updated Step Description:", updatedStepDescription); 
        
        // const stepIndex = testSteps.length;
        if (actionType === 'open') {
          setLoadingMessage(`Step ${stepIndex + 1}: Opening page, please wait...`);
        } else if (actionType === 'search') {
          setLoadingMessage(`Step ${stepIndex + 1}: Executing Search, please wait...`);
        } else if (actionType === 'click') {
          setLoadingMessage(`Step ${stepIndex + 1}: Executing click, please wait...`);
        } else if (actionType === 'type') {
          setLoadingMessage(`Step ${stepIndex + 1}: Typing text, please wait...`);
        } else if (actionType === 'verify') {
          setLoadingMessage(`Step ${stepIndex + 1}: Verifying element, please wait...`);
        } else if (actionType === 'get') {
          setLoadingMessage(`Step ${stepIndex + 1}: Getting element, please wait...`);
        } else if (actionType === 'wait') {
          setLoadingMessage(`Step ${stepIndex + 1}: Waiting, please be patient...`);
        } else if (actionType === 'scroll up') {
          setLoadingMessage(`Step ${stepIndex + 1}: Scrolling up, please wait...`);
        } else if (actionType === 'scroll down') {
          setLoadingMessage(`Step ${stepIndex + 1}: Scrolling down, please wait...`);
        } else if (actionType === 'swipe left') {
          setLoadingMessage(`Step ${stepIndex + 1}: Swiping left, please wait...`);
        } else if (actionType === 'swipe right') {
          setLoadingMessage(`Step ${stepIndex + 1}: Swiping right, please wait...`);
        } else if (actionType === 'swipe long right') {
          setLoadingMessage(`Step ${stepIndex + 1}: Swiping long right, please wait...`);
        } else if (actionType === 'swipe long left') {
          setLoadingMessage(`Step ${stepIndex + 1}: Swiping long left, please wait...`);
        }

        if (actionType === 'wait') {

          const hasElementData = elementData && elementData.elements && elementData.elements.length > 0;
          const hasStoredElementData = sessionStorage.getItem('latestElementData');
          
          if (!hasElementData && !hasStoredElementData) {
            alert("Please open a browser first before using the wait command.");
            setIsProcessing(false);
            setLoadingMessage('');
            // Return undefined explicitly to indicate that execution was aborted
            return undefined;
          }

          const waitRequestData = stepObj.waitRequestData || {
              timeout: 5000, 
              debug: true
          };
          
          const waitPayload = {
            ...waitRequestData,
            command: updatedStepDescription || stepObj.choice || 'wait'
          };

          console.log("🟦 Full Wait Command Payload:", waitPayload);

            
          const response = await fetch('http://127.0.0.1:8000/android/wait/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(waitPayload),
          });
          
          if (!response.ok) {
              throw new Error('Failed to execute wait command');
          }
          
          const data = await response.json();
          console.log("Wait Response:", data);
          
          const screenshotUrl = data.screenshot_url
              ? `http://127.0.0.1:8000${data.screenshot_url}`
              : `/api/placeholder/800/300?text=Wait_Completed`;

            console.log("Screenshot URL:", screenshotUrl);
              
          return {
              status: data.status === 'success' ? 'complete' : 'error',
              duration: waitRequestData.timeout ? `00:${Math.floor(waitRequestData.timeout / 1000).toString().padStart(2, '0')}` : '00:05',
              message: data.message || "Wait completed successfully",
              screenshot: screenshotUrl,
              coordinates: elementData || null,
          };
        }
  
        if (actionType === 'open' || stepDescription.toLowerCase().includes('go to ')) {
            const response = await fetch('http://127.0.0.1:8000/android/parser_check/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: updatedStepDescription }), 
            });
  
            console.log("Open URL:", updatedStepDescription);
            console.log("User_Id:", user_id);
  
            if (!response.ok) {
                throw new Error('Failed to execute navigation command');
            }
  
            const data = await response.json();
            console.log("Response:", data);
  
            if (data.omniparser_response && data.omniparser_response.elements) {
              setElementData(data.omniparser_response);
              console.log("Setting elementData:", data.omniparser_response);
              console.log("First element:", data.omniparser_response.elements[0]);
              sessionStorage.setItem('latestElementData', JSON.stringify(data.omniparser_response));
              setSuggestions(data.omniparser_response.elements); 
            } else {
                setSuggestions([]); 
            }
  
            const screenshotUrl = data.screenshot_result
                ? `http://127.0.0.1:8000${data.screenshot_result}`
                : `/api/placeholder/800/300?text=No_Screenshot`;
  
            console.log("Screenshot URL:", screenshotUrl);
            
            return {
                status: 'complete',
                duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
                message: data.action_result.message || "Page loaded successfully",
                screenshot: screenshotUrl,
                coordinates: data.omniparser_response,
                debug_images: data.omniparser_data?.debug_images || {}, 
            };
  
        } 
        else if (actionType === 'click' || actionType === 'type') {
            
            const selectedElement = stepObj.selectedElement;
            
            if (!selectedElement) {
                throw new Error(`No element selected for this action. Please select an element from the suggestions.`);
            }
  
            let requestBody = {
                command: stepDescription, 
                // user_id: user_id,
                click_x: selectedElement.click_point[0],
                click_y: selectedElement.click_point[1],
            };
  
            if (actionType === 'type') {
                const inIndex = stepDescription.toLowerCase().indexOf(' in ');
                if (inIndex !== -1) {
                    const textToType = stepDescription.substring(5, inIndex);
                    requestBody.input_text = textToType;
                }
            }
  
            console.log(`Sending coordinates for ${actionType} step:`, {
                click_x: selectedElement.click_point[0],
                click_y: selectedElement.click_point[1],
                requestBody
            });
  
            const response = await fetch('http://127.0.0.1:8000/android/parser_check/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
  
            console.log(actionType, stepDescription, selectedElement.click_point);
  
            if (!response.ok) {
                throw new Error(`Failed to execute ${actionType} command`);
            }
  
            const data = await response.json();
            console.log(`${actionType} response:`, data);
  
            if (data.omniparser_response && data.omniparser_response.elements) {
                setElementData(data.omniparser_response);
                sessionStorage.setItem('latestElementData', JSON.stringify(data.omniparser_response));
            }
  
            const screenshotUrl = data.screenshot_result
                ? `http://127.0.0.1:8000${data.screenshot_result}`
                : `/api/placeholder/800/300?text=No_Screenshot`;
  
  
            return {
                status: 'complete',
                duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
                message: data.message || `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} action executed successfully`,
                screenshot: screenshotUrl,
                coordinates: data.omniparser_response || elementData,
                elementAction: selectedElement,
                requestBody,
                debug_images: data.coordinates?.debug_images || {},
            };
        } 
        else if (actionType === 'verify') {
          const selectedElement = stepObj.selectedElement;
            
          if (!selectedElement) {
              throw new Error(`No element selected for verification. Please select an element from the suggestions.`);
          }
          const verificationType = stepObj.verificationType || 'text';
  
          let requestBody = {
              command: stepDescription, 
              user_id: user_id,
              click_x: selectedElement.click_point[0],
              click_y: selectedElement.click_point[1],
              verification_type: verificationType
          };
  
          console.log(`Sending coordinates for verify step:`, requestBody);
  
          const response = await fetch('http://127.0.0.1:8000/android/parser_check/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody), 
          });
  
          if (!response.ok) {
              throw new Error(`Failed to execute verify command`);
          }
  
          const data = await response.json();
          console.log(`Verify response:`, data);
  
            if (data.omniparser_response && data.omniparser_response.elements) {
                setElementData(data.omniparser_response);
                sessionStorage.setItem('latestElementData', JSON.stringify(data.omniparser_response));
            }
  
            const screenshotUrl = data.screenshot_result
                ? `http://127.0.0.1:8000${data.screenshot_result}`
                : `/api/placeholder/800/300?text=No_Screenshot`;

  
//              const verificationPassed = c.verify_result === "pass";
  
          return {
//              status: verificationPassed ? 'complete' : 'error',
              status: 'complete',
              duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
              message: data.status,
              screenshot: screenshotUrl,
              coordinates:  data.omniparser_response || elementData,
              verificationType: verificationType,
//              verificationResult: verificationPassed ? 'passed' : 'failed',
              verifiedText: data.copied_text || "",
              elementVerified: selectedElement,
              requestBody,
              debug_images: data.coordinates?.debug_images || {},
          };
        } 
        else if (actionType === 'scroll up' || actionType === 'scroll down' || actionType === 'swipe left' || actionType === 'swipe right' || actionType === 'swipe long right' || actionType === 'swipe long left') {
        
          let modifiedCommand = actionType;

          let requestBody = {
              command: modifiedCommand
          };

          console.log('Sending scroll/swipe command:', {
              originalCommand: stepDescription,
              modifiedCommand: modifiedCommand,
              requestBody: requestBody
          });

          const response = await fetch('http://127.0.0.1:8000/android/parser_check/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
              throw new Error(`Failed to execute ${actionType} command`);
          }

          const data = await response.json();
          console.log(`${actionType} response:`, data);

          
            if (data.omniparser_response && data.omniparser_response.elements) {
                setElementData(data.omniparser_response);
                sessionStorage.setItem('latestElementData', JSON.stringify(data.omniparser_response));
            }
  
            const screenshotUrl = data.screenshot_result
                ? `http://127.0.0.1:8000${data.screenshot_result}`
                : `/api/placeholder/800/300?text=No_Screenshot`;

          return {
              status: 'complete',
              duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
              message: data.action_result?.message || `${actionType} command executed successfully`,
              screenshot: screenshotUrl,
              coordinates: data.omniparser_response || elementData,
              requestBody,
              debug_images: data.coordinates?.debug_images || {},
          };
        }
        else if (actionType === 'get') {
            const selectedElement = stepObj.selectedElement;
                
            if (!selectedElement) {
              throw new Error(`No element selected for get operation. Please select an element from the suggestions.`);
            }

            let requestBody = {
              command: stepDescription, 
              user_id: user_id,
              click_x: selectedElement.click_point[0],
              click_y: selectedElement.click_point[1],
              action_type: 'get' 
            };

            console.log(`Sending coordinates for get step:`, requestBody);

            const response = await fetch('http://127.0.0.1:8000/android/parser_check/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody), 
            });

            if (!response.ok) {
              throw new Error(`Failed to execute get command`);
            }

            const data = await response.json();
            console.log(`Get response:`, data);

            if (data.omniparser_response && data.omniparser_response.elements) {
                setElementData(data.omniparser_response);
                sessionStorage.setItem('latestElementData', JSON.stringify(data.omniparser_response));
            }
  
            const screenshotUrl = data.screenshot_result
                ? `http://127.0.0.1:8000${data.screenshot_result}`
                : `/api/placeholder/800/300?text=No_Screenshot`;

            return {
              status: 'complete',
              duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
              message: data.status || "Retrieved element text successfully",
              screenshot: screenshotUrl,
              coordinates: data.omniparser_response || elementData,
              retrievedText: data.copied_text || "",
              elementRetrieved: selectedElement,
              requestBody,
              debug_images: data.coordinates?.debug_images || {},
            };
          }

    } catch (error) {
        console.error('Step execution error:', error);
        return {
            status: 'error',
            duration: '00:00',
            error: error.message
        };
    } finally {
        setIsProcessing(false);
        setLoadingMessage('');
    }
  };

const updateOtpSessionTime = async (overrides = {}) => {
  const contactEntered = overrides.contactEntered ?? otpVerificationState.contactEntered;
  const enteredContact = overrides.enteredContact ?? otpVerificationState.enteredContact;

  if (!contactEntered) return;

  try {
    const response = await fetch('http://localhost:8000/api/get_time/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      const timeData = {
        ...data,
        phoneNumber: enteredContact,
        timestamp: Date.now()
      };

      sessionStorage.setItem('otpSessionTime', JSON.stringify(timeData));

      setOtpVerificationState(prev => ({
        ...prev,
        sessionTime: timeData
      }));

      console.log('OTP Session Time updated before step execution:', timeData);
    }
  } catch (error) {
    console.error('Error updating OTP session time:', error);
  }
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    console.log('OTP copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
};

const callGetOtpAfterExecution = async (stepId, isPhoneNumberStep, isEmailStep, forceCall, passedEmail = null) => {
  if ((!otpVerificationState.waitingForOtp && !forceCall) || (!isPhoneNumberStep && !isEmailStep)) {
    console.log('Skipping get_otp call - not an OTP step');
    return;
  }
  setOtpCheckLoadingStepId(stepId);

  try {
    const sessionData = JSON.parse(sessionStorage.getItem('otpSessionTime') || '{}');
    const request_time = sessionData.request_time || new Date().toISOString();  
    const userId = localStorage.getItem("userId");
    const projectKey = `selectedProject_${userId}`;
    const selectedProject = JSON.parse(localStorage.getItem(projectKey));
    const project_id = selectedProject?.id;

    let otpData;
    let otpValue;

    const otpPayload = { request_time, project_id };  
    console.log("📤 Sending to /get_otp/:", JSON.stringify(otpPayload, null, 2));

    if (isPhoneNumberStep) {
      // Phone OTP
      const otpResponse = await fetch('http://localhost:8000/api/get_otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(otpPayload)
      });

      otpData = await otpResponse.json();
      if (otpData.error === "Device not connected") {
        checkChromeAvailability();
        return;
      }

      otpValue = otpData.otp;

    } else if (isEmailStep) {
      // Email OTP
      const emailOtpPayload = { request_time, project_id };

      const emailToUse = passedEmail || senderEmail.trim();
      if (emailToUse) {
        emailOtpPayload.expected_sender = emailToUse;
      }

      console.log("📤 Sending to /get_mail_otp/:", JSON.stringify(emailOtpPayload, null, 2));

      const emailOtpRes = await fetch('http://localhost:8000/api/get_mail_otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailOtpPayload)
      });

      otpData = await emailOtpRes.json();
      otpValue = otpData.otp;
    } else {
      // Neither phone nor email step - shouldn't reach here
      console.log('No OTP API call needed for this step type');
      return;
    }

    console.log('OTP Response after execution:', otpData);

    const isValidOtp = /^\d{4,8}$/.test(otpValue);

    if (otpData?.status === 'waiting') {
      console.warn('Still waiting for OTP...');
      return { status: 'waiting' };
    }

    if (isValidOtp) {
      setOtpVerificationState(prev => ({
        ...prev,
        waitingForOtp: false
      }));

      if (isPhoneNumberStep || isEmailStep) {  
        setTestSteps(prev => prev.map(step => {
          if (step.id === stepId) {
            console.log(`✅ Updating OTP for step id ${stepId}:`, {
              previousStep: step,
              newOtpValue: otpValue,
              otpType: isPhoneNumberStep ? 'phone' : 'email'
            });

            return {
              ...step,
              otpReceived: true,
              otpValue: otpValue,
              otp: otpValue,
              otpType: isPhoneNumberStep ? 'phone' : 'email',
            };
          } else {
            console.log(`❌ Skipping step id ${step.id}, not matching target stepId: ${stepId}`);
          }
          return step;
        }));
      }

      return { 
        status: 'success', 
        otp: otpValue, 
        otpValue: otpValue 
      };
    }

    return { status: 'failed', reason: 'Invalid or no OTP received' };

  } catch (error) {
    console.error('Error getting OTP after execution:', error);
    if (isPhoneNumberStep || !isPhoneNumberStep) {
      alert('OTP not received. Please send OTP to continue.');
    }
  }finally{
    setOtpCheckLoadingStepId(null);
  }
};

const extractKeyTerms = (searchTerm) => {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'button', 'link', 'field', 'input'];
  
  return searchTerm
    .split(' ')
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .map(word => word.trim());
};

useEffect(() => {
  console.log("📊 currentGeneratedStepIndex changed to:", currentGeneratedStepIndex);
}, [currentGeneratedStepIndex]);

const validateStepAgainstResponse = (step, omniparserData) => {
  if (!omniparserData || !omniparserData.elements) return { isValid: false, matches: [] };

  const stepDesc = step.description.toLowerCase();
  const words = stepDesc.split(' ');
  const actionType = words[0];

  if (actionType === 'click' || actionType === 'type') {
    let searchTerm = '';
    let direction = null;
    const OFFSET_PX = 40; 

    if (actionType === 'click') {
      // Check for directional commands
      const directions = ['left', 'right', 'above', 'below', 'bottom'];
      const directionIndex = words.findIndex(word => directions.includes(word));
      
      if (directionIndex !== -1 && directionIndex === 1) {
        // Format: "click left login" or "click above submit button"
        direction = words[1];
        searchTerm = words.slice(2).join(' ');
      } else {
        // Normal click: "click login"
        searchTerm = words.slice(1).join(' ');
      }
    } else if (actionType === 'type' && stepDesc.includes(' in ')) {
      // Handle type commands: "type password in username" or "type password in right username"
      const inIndex = stepDesc.indexOf(' in ');
      const afterIn = stepDesc.substring(inIndex + 4).trim();
      const afterInWords = afterIn.split(' ');
      
      const directions = ['left', 'right', 'above', 'below', 'bottom'];
      if (directions.includes(afterInWords[0])) {
        // Format: "type password in right username"
        direction = afterInWords[0];
        searchTerm = afterInWords.slice(1).join(' ');
      } else {
        // Normal type: "type password in username"
        searchTerm = afterIn;
      }
    }

    if (!searchTerm) return { isValid: false, matches: [] };

    const keyTerms = extractKeyTerms(searchTerm);
    const searchTermWords = searchTerm.split(' ').filter(word => word.length > 0);

    // console.log(`🔍 Validation Debug:`);
    // console.log(`   Search term: "${searchTerm}"`);
    // console.log(`   Key terms:`, keyTerms);
    // console.log(`   Search words:`, searchTermWords);
    // console.log(`   Direction:`, direction);

    const checkElementForMatch = (element) => {
      const elementFields = [
        (element.name || '').toLowerCase(),
        (element.displayName || '').toLowerCase(),
        (element.text || '').toLowerCase()
      ];

      // console.log(`   Checking element ${element.id}:`, {
      //   name: element.name,
      //   displayName: element.displayName,
      //   text: element.text,
      //   fields: elementFields
      // });

      // 1. Exact Match - any field exactly matches any keyTerm
      const exactMatch = keyTerms.some(term => elementFields.some(field => field === term));
      if (exactMatch) {
        console.log(`     ✅ EXACT match found`);
        return { type: 'exact', score: 100 };
      }

      // 2. Partial Match - any field contains any keyTerm as substring
      const partialMatch = keyTerms.some(term => elementFields.some(field => field.includes(term)));
      if (partialMatch) {
        console.log(`     🔍 PARTIAL match found`);
        return { type: 'partial', score: 80 };
      }

      // 3. Word Match - any word in searchTerm exists in any field
      const wordMatch = searchTermWords.some(word => elementFields.some(field => field.includes(word)));
      if (wordMatch) {
        console.log(`     🔎 WORD match found`);
        return { type: 'word', score: 60 };
      }

      // console.log(`     ❌ No match`);
      return null;
    };

    // Collect ALL matches with their scores
    let allMatches = [];

    omniparserData.elements.forEach(element => {
      const matchResult = checkElementForMatch(element);
      if (matchResult) {
        allMatches.push({
          ...element,
          matchType: matchResult.type,
          matchScore: matchResult.score
        });
      }
    });

    console.log(`🎯 All matches found (${allMatches.length}):`, allMatches.map(m => ({
      id: m.id,
      name: m.name,
      matchType: m.matchType,
      score: m.matchScore
    })));

    // Apply directional offset to coordinates if direction is specified
    const applyDirectionalOffset = (matches) => {
      if (!direction) return matches;
      
      return matches.map(element => {
        const originalCoords = element.coordinates || element.click_point;
        if (!originalCoords || !Array.isArray(originalCoords)) return element;
        
        let newCoords = [...originalCoords];
        
        switch (direction) {
          case 'left':
            newCoords[0] = Math.max(0, originalCoords[0] - OFFSET_PX);
            break;
          case 'right':
            newCoords[0] = originalCoords[0] + OFFSET_PX;
            break;
          case 'above':
            newCoords[1] = Math.max(0, originalCoords[1] - OFFSET_PX);
            break;
          case 'below':
          case 'bottom':
            newCoords[1] = originalCoords[1] + OFFSET_PX;
            break;
          default:
            break;
        }
        
        return {
          ...element,
          coordinates: newCoords,
          click_point: newCoords,
          originalCoordinates: originalCoords,
          appliedDirection: direction,
          offsetApplied: OFFSET_PX
        };
      });
    };

    if (allMatches.length === 0) {
      console.log("🚫 No matches found for step:", stepDesc);
      return { isValid: false, matches: [], searchTerm, keyTerms, direction };
    }

    // Sort matches by score (highest first), then by match type priority
    allMatches.sort((a, b) => {
      if (a.matchScore !== b.matchScore) {
        return b.matchScore - a.matchScore; // Higher score first
      }
      // If same score, prioritize by type
      const typeOrder = { 'exact': 0, 'partial': 1, 'word': 2 };
      return typeOrder[a.matchType] - typeOrder[b.matchType];
    });

    const processedMatches = applyDirectionalOffset(allMatches);
    
    console.log(`🎯 Final processed matches (${processedMatches.length}):`, processedMatches.map(m => ({
      id: m.id,
      name: m.name,
      matchType: m.matchType,
      score: m.matchScore
    })));

    if (direction) {
      console.log(`🎯 Applied ${direction} direction with ${OFFSET_PX}px offset`);
    }

    // CRITICAL LOGIC: Always return ALL matches - let caller decide based on COUNT
    // - If processedMatches.length > 1 → Show multiple match dialog (even if all are 100% matches)
    // - If processedMatches.length === 1 → Auto-select single match (even if it's 80% match)
    
    console.log(`📊 Match Decision Logic:`);
    console.log(`   Total matches found: ${processedMatches.length}`);
    
    if (processedMatches.length > 1) {
      console.log(`   🔀 MULTIPLE MATCHES → Will show selection dialog`);
    } else if (processedMatches.length === 1) {
      console.log(`   🎯 SINGLE MATCH → Will auto-select (Score: ${processedMatches[0].matchScore}%)`);
    }

    return { 
      isValid: true, 
      matches: processedMatches, 
      searchTerm, 
      keyTerms, 
      direction,
      totalMatches: processedMatches.length,
      shouldShowMultipleDialog: processedMatches.length > 1,
      shouldAutoSelect: processedMatches.length === 1,
      matchBreakdown: {
        exact: processedMatches.filter(m => m.matchType === 'exact').length,
        partial: processedMatches.filter(m => m.matchType === 'partial').length,
        word: processedMatches.filter(m => m.matchType === 'word').length
      }
    };
  }

  return { isValid: true, matches: [] };
};

const handleNextStep = async (data, index = currentGeneratedStepIndex) => {
  console.log("🔍 handleNextStep called | index:", index, "| currentGeneratedStepIndex (state):", currentGeneratedStepIndex);
  console.log("🧩 generatedSteps length:", generatedSteps.length, "index:", index);

  if (generatedSteps.length > 0 && index < generatedSteps.length) {
    const nextIndex = index + 1;
    console.log("➡️ Current index:", index, "| Next index:", nextIndex);

    if (nextIndex < generatedSteps.length) {
      const nextStep = generatedSteps[nextIndex];
      console.log(`📝 Attempting Step ${nextIndex + 1}:`, nextStep);

      if (nextStep.description.toLowerCase().startsWith("wait")) {
        console.log(`⏳ Executing pre-configured wait command for Step ${nextIndex + 1}`);

        if (!nextStep.waitRequestData) {
          console.log("🔧 Wait command needs configuration, showing modal");
          setWaitModalOpen(true);
          setWaitStepIndex(nextIndex);
          setWaitStepData(nextStep);
          return;
        }
        console.log("⚠️ Wait step already configured and executed");
        return; 
      }

      if (nextStep.action === "type" && 
          nextStep.isActualOtpStep === true && 
          (nextStep.description.toLowerCase().includes('otp'))) {
        
        console.log(`🔐 OTP Step ${nextIndex + 1} detected! Checking for OTP...`);
        
        // Step 1: Look for existing OTP in testSteps
        let fetchedOtp = '';
        
        for (let i = testSteps.length - 1; i >= 0; i--) {
          const step = testSteps[i];
          if (step.otpReceived === true && 
              step.otpValue && 
              step.otpType === nextStep.otpType) {
            fetchedOtp = step.otp || step.otpValue;  
            console.log(`📱 Found existing OTP from step ${i}:`, fetchedOtp);
            break;
          }
        }
        
        // Step 2: If no existing OTP, try to fetch immediately
        if (!fetchedOtp && nextStep.otpType) {
          console.log(`🔄 No existing OTP found, trying to fetch fresh OTP for ${nextStep.otpType}...`);
          
          try {
            const isPhoneNumberStep = nextStep.otpType === 'phone';
            const isEmailStep = nextStep.otpType === 'email';
            
            const otpFetchResult = await callGetOtpAfterExecution(
              nextStep.id,
              isPhoneNumberStep,
              isEmailStep,
              true, 
              isEmailStep ? senderEmail : null
            );
            
            console.log("🔄 Fresh OTP fetch result:", otpFetchResult);
            
            if (otpFetchResult?.status === 'success') {
              fetchedOtp = otpFetchResult.otp || otpFetchResult.otpValue;
              console.log(`✅ Successfully fetched fresh OTP:`, fetchedOtp);
              
              // Update testSteps with the new OTP
              setTestSteps(prev => prev.map(step =>
                step.id === nextStep.id ? {
                  ...step,
                  otp: fetchedOtp,
                  otpValue: fetchedOtp,
                  otpReceived: true,
                  otpType: nextStep.otpType
                } : step
              ));
              
            } else if (otpFetchResult?.status === 'waiting') {
              console.log(`⏳ OTP still waiting for ${nextStep.otpType}`);
              setTestSteps(prev => prev.map(step =>
                step.id === nextStep.id ? {
                  ...step,
                  otpWaiting: true,
                  otpPending: false,
                  otpReceived: false,
                  otpType: nextStep.otpType
                } : step
              ));
              fetchedOtp = ''; 
            } else {
              console.log(`❌ OTP fetch failed:`, otpFetchResult);
              fetchedOtp = '';
            }
            
          } catch (error) {
            console.error('Error fetching OTP:', error);
            fetchedOtp = '';
          }
        }
        
        console.log(`📱 Final OTP for step ${nextIndex + 1}:`, fetchedOtp || 'Not found - will show modal');
        
        // Step 3: Always show modal (with or without OTP)
        setOtpReplacementModal({
          isOpen: true,
          step: nextStep,
          fetchedOtp: fetchedOtp,
          stepIndex: nextIndex,
          currentPageData: data 
        });
        
        return; 
      }

      const validationResult = validateStepAgainstResponse(nextStep, data.omniparser_data || data.coordinates);
      console.log(`🔍 Validation Result for Step ${nextIndex + 1}:`, validationResult);

      if (validationResult.isValid) {
        if (validationResult.matches.length > 1) {
          console.log(`⚠️ Step ${nextIndex + 1} has multiple matches. Awaiting user selection.`);

          handleMultipleMatches(validationResult.matches, nextStep.description, async (selectedElement) => {
            if (selectedElement) {
              const stepWithElement = {
                ...nextStep,
                selectedElement: selectedElement,
                coordinates: selectedElement.coordinates || selectedElement.click_point
              };

              setTestSteps(prev => [...prev, stepWithElement]);

              if (stepWithElement.requiresOtp && stepWithElement.otpType) {
                console.log(`🔐 OTP Required for Step ${nextIndex + 1}:`, stepWithElement.otpType);

                setOtpVerificationState(prev => ({
                  ...prev,
                  waitingForOtp: true,
                  enteredContact: stepWithElement.value,
                  contactEntered: true,
                  stepId: stepWithElement.id
                }));

                await updateOtpSessionTime({
                  contactEntered: true,
                  enteredContact: stepWithElement.value
                });
              }

              const nextExecutionResult = await executeStep(stepWithElement, nextIndex);
              console.log("🚀 Executed Step (Multiple Match):", nextExecutionResult);

              if (nextExecutionResult && nextExecutionResult.status) {
                console.log(`✅ Proceeding to next step after Step ${nextIndex + 1} (multiple match flow)`);
                setTestSteps(prev => prev.map(step => 
                  step.id === nextStep.id ? { ...step, ...nextExecutionResult } : step
                ));
                  // 🔔 OTP Logic start
                if (stepWithElement.requiresOtp && stepWithElement.otpType) {
                  console.log(`🔐 OTP Required after Step ${nextIndex + 1}:`, stepWithElement.otpType);

                  const isPhoneNumberStep = stepWithElement.otpType === 'phone';
                  const isEmailStep = stepWithElement.otpType === 'email';

                  console.log("📧 Debug stepWithElement:", {
                    userEmail: senderEmail,
                    value: stepWithElement.value,
                    otpType: stepWithElement.otpType,
                    requiresOtp: stepWithElement.requiresOtp
                  });

                  setOtpVerificationState(prev => ({
                    ...prev,
                    waitingForOtp: true,
                    enteredContact: stepWithElement.value,
                    contactEntered: true,
                    stepId: stepWithElement.id
                  }));

                  await new Promise(resolve => setTimeout(resolve, 0));
                  console.log("🟩 Before get OTP call - otpVerificationState:", otpVerificationState);

                  const otpFetchResult = await callGetOtpAfterExecution(
                    stepWithElement.id,
                    isPhoneNumberStep,
                    isEmailStep,
                    true,
                    isEmailStep ? senderEmail : null
                  );

                  if (otpFetchResult?.status === 'success') {
                    setTestSteps(prev => prev.map(step =>
                      step.id === stepWithElement.id ? {
                        ...step,
                        otp: otpFetchResult.otp,           
                        otpValue: otpFetchResult.otp, 
                        otpReceived: true
                      } : step
                    ));
                  } else if (otpFetchResult?.status === 'waiting') {
                    setTestSteps(prev => prev.map(step =>
                      step.id === stepWithElement.id ? {
                        ...step,
                        otpWaiting: true,
                        otpPending: false,
                        otpReceived: false
                      } : step
                    ));
                    console.log('OTP still pending, will check again in next execution cycle if needed');
                  } else if (otpFetchResult?.status === 'failed') {
                    console.error('Failed to get OTP. Please resend OTP manually.');
                  } else {
                    console.error('OTP fetch failed due to API error or unexpected response. Halting next step.');
                    return;  
                  }

                }
                setCurrentGeneratedStepIndex(nextIndex);
                handleNextStep(nextExecutionResult, nextIndex);
                } else {
                console.error(`❌ Step ${nextIndex + 1} failed to execute properly.`);
                
                // Open edit modal for execution errors
                openEditModal(
                  stepWithElement,
                  nextExecutionResult?.error || 'Step execution failed',
                  data.omniparser_data || data.coordinates,
                  nextIndex,
                  nextExecutionResult?.screenshot 
                );
              }
            } else {
              console.error(`❌ No element selected for Step ${nextIndex + 1} with multiple matches.`);
            }
          });
        } else {
          console.log(`🎯 Auto-selecting single matching element for Step ${nextIndex + 1}:`, validationResult.matches[0]);

          const stepWithElement = {
            ...nextStep,
            selectedElement: validationResult.matches[0],
            coordinates: validationResult.matches[0].coordinates || validationResult.matches[0].click_point
          };

          setTestSteps(prev => [...prev, stepWithElement]);

          if (stepWithElement.requiresOtp && stepWithElement.otpType) {
            console.log(`🔐 OTP Required for Step ${nextIndex + 1}:`, stepWithElement.otpType);

            setOtpVerificationState(prev => ({
              ...prev,
              waitingForOtp: true,
              enteredContact: stepWithElement.value,
              contactEntered: true,
              stepId: stepWithElement.id
            }));

            await updateOtpSessionTime({
              contactEntered: true,
              enteredContact: stepWithElement.value
            });
          }

          const nextExecutionResult = await executeStep(stepWithElement, nextIndex);
          console.log("🚀 Executed Step (Single Match):", nextExecutionResult);

          if (nextExecutionResult && nextExecutionResult.status) {
            console.log(`✅ Proceeding to next step after Step ${nextIndex + 1}`);
            setTestSteps(prev => prev.map(step => 
              step.id === nextStep.id ? { ...step, ...nextExecutionResult } : step
            ));

              // 🔔 OTP Logic start
              if (stepWithElement.requiresOtp && stepWithElement.otpType) {
                console.log(`🔐 OTP Required after Step ${nextIndex + 1}:`, stepWithElement.otpType);

                const isPhoneNumberStep = stepWithElement.otpType === 'phone';
                const isEmailStep = stepWithElement.otpType === 'email';

                console.log("📧 Debug stepWithElement:", {
                  userEmail: senderEmail,
                  value: stepWithElement.value,
                  otpType: stepWithElement.otpType,
                  requiresOtp: stepWithElement.requiresOtp
                });
                
                setOtpVerificationState(prev => ({
                  ...prev,
                  waitingForOtp: true,
                  enteredContact: stepWithElement.value,
                  contactEntered: true,
                  stepId: stepWithElement.id
                }));

                await new Promise(resolve => setTimeout(resolve, 0));
                console.log("🟩 Before get OTP call - otpVerificationState:", otpVerificationState);

                const otpFetchResult = await callGetOtpAfterExecution(
                  stepWithElement.id,
                  isPhoneNumberStep,
                  isEmailStep,
                  true,
                  isEmailStep ? senderEmail : null
                );

                if (otpFetchResult?.status === 'success') {
                  setTestSteps(prev => prev.map(step =>
                    step.id === stepWithElement.id ? {
                      ...step,
                      otp: otpFetchResult.otp,           
                      otpValue: otpFetchResult.otp,
                      otpReceived: true
                    } : step
                  ));
                } else if (otpFetchResult?.status === 'waiting') {
                  setTestSteps(prev => prev.map(step =>
                    step.id === stepWithElement.id ? {
                      ...step,
                      otpWaiting: true,
                      otpPending: false,
                      otpReceived: false
                    } : step
                  ));
                  console.log('OTP still pending, will check again in next execution cycle if needed');
                } else if (otpFetchResult?.status === 'failed') {
                  console.error('Failed to get OTP. Please resend OTP manually.');
                } else {
                  console.error('OTP fetch failed due to API error or unexpected response. Halting next step.');
                  return;  
                }

              }
            setCurrentGeneratedStepIndex(nextIndex);
            handleNextStep(nextExecutionResult, nextIndex);
          } else {
            console.error(`❌ Step ${nextIndex + 1} failed to execute properly.`);
            
            // Open edit modal for execution errors
            openEditModal(
              stepWithElement,
              nextExecutionResult?.error || 'Step execution failed',
              data.omniparser_data || data.coordinates,
              nextIndex,
              nextExecutionResult?.screenshot
            );
          }
        }
      } else {
        console.error(`🚫 Step ${nextIndex + 1} validation failed. No matching elements found.`);
        
        // Open edit modal instead of alert
        openEditModal(
          nextStep,
          `No matching elements found for "${validationResult.searchTerm}"`,
          data.omniparser_data || data.coordinates,
          nextIndex,
          data.screenshot
        );
      }
    } else {
      console.log("🎉 Automation finished! All steps executed.");
    }
  } else {
    console.warn("⚠️ No steps available to execute or index out of bounds.");
  }
};

const autoExecuteStepsRef = useRef();

autoExecuteStepsRef.current = async (generatedSteps) => {
  const firstStep = generatedSteps[0];
  
  console.log("🚀 Auto-executing first step:", firstStep.description);
  
  // Check if first step is 'open'
  if (!firstStep.description.trim().toLowerCase().startsWith("open")) {
    alert("First step must be an 'open' command");
    return;
  }
  
  // Add step 1 to testSteps (left side)
  setTestSteps([firstStep]);
  
  // Execute step 1 directly (without using input field)
  const executionResult = await executeStep(firstStep, 0);
  
  if (executionResult && executionResult.status === 'complete') {
    // Update step 1 with execution result
    setTestSteps(prev => prev.map(step => 
      step.id === firstStep.id ? { ...step, ...executionResult } : step
    ));
    
    // Move to next step
    setCurrentGeneratedStepIndex(1);
    handleNextStep(executionResult);
    
    console.log("✅ First step executed successfully");
  } else {
    console.error("❌ First step execution failed");
  }
}; 

  const handleWaitConfirm = (waitCommand, waitRequestData) => {
    if (waitStepData && waitStepIndex !== null) {

      const configuredStep = {
        ...waitStepData,
        description: waitCommand,
        waitRequestData: waitRequestData
      };
      
      // Add to test steps
      setTestSteps(prev => [...prev, configuredStep]);
      
      // Execute the configured wait step
      executeStep(configuredStep, waitStepIndex).then(result => {
        console.log("🚀 Executed Configured Wait Step:", result);
        
        if (result && result.status) {
          console.log(`✅ Proceeding to next step after Step ${waitStepIndex + 1} (configured wait)`);
          setTestSteps(prev => prev.map(step =>
            step.id === configuredStep.id ? { ...step, ...result } : step
          ));
          setCurrentGeneratedStepIndex(waitStepIndex);
          handleNextStep(result, waitStepIndex);
        } else {
          console.error(`❌ Configured Wait Step ${waitStepIndex + 1} failed to execute properly.`);
        }
      });
      
      // Reset wait state
      setWaitStepIndex(null);
      setWaitStepData(null);
    }
    
    setWaitModalOpen(false);
  };

  const handleVerificationConfirm = () => {
    const { textToVerify, selectedElement } = verificationModal;
    
    // Create new step object
    const newStepObj = {
      id: Date.now(),
      description: `verify ${textToVerify}`,
      status: 'pending',
      duration: '00:00',
      screenshot: null,
      selectedElement: selectedElement,
      verificationType: 'text'
    };
    
    // Close first modal
    setVerificationModal({
      isOpen: false,
      textToVerify: '',
      matchingElements: [],
      selectedElement: null
    });
    
    // Open second confirmation instead of directly executing
    setSecondaryVerification({
      isOpen: true,
      stepObj: newStepObj
    });
  };

  const handleFinalVerificationConfirm = async () => {
    const newStepObj = secondaryVerification.stepObj;
    
    // Close the secondary confirmation modal
    setSecondaryVerification({
      isOpen: false,
      stepObj: null
    });
    
    // Add step to test steps
    setTestSteps(prev => [...prev, newStepObj]);
    setNewStep('');
    
    // Execute the step (this part stays the same)
    const executionResult = await executeStep(newStepObj);
    
    // Update test step with execution result
    setTestSteps(prev => prev.map(step => 
      step.id === newStepObj.id ? {
        ...step,
        ...executionResult,
        elementVerified: newStepObj.selectedElement
      } : step
    ));
    
    // Auto-scroll to show new step (unchanged)
    setTimeout(() => {
      if (previewRef.current) {
        previewRef.current.scrollTo({
          top: previewRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
      if (stepsRef.current) {
        stepsRef.current.scrollTo({
          top: stepsRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

const createTestCase = async () => {
  if (testSteps.length === 0) {
    alert('Please add at least one test step before creating a test case.');
    return;
  }

  try {
    setCreateTestCaseLoading(true);
    
    // Get the user ID from localStorage
    const userId = localStorage.getItem("userId");
    
    // Step 1: Create the test case first (without steps)
    const testCasePayload = {
      user_id: parseInt(userId),
      project_name: testCaseInfo.projectId,
      testcase_name: testCaseInfo.testcase_name,
      testcase_type: testCaseInfo.testcase_type,
      testcase_priority: testCaseInfo.testcase_priority
    };

    console.log("Creating test case with payload:", testCasePayload);

    const testCaseResponse = await fetch("http://127.0.0.1:8000/integrate/testcase/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testCasePayload)
    });

    if (!testCaseResponse.ok) {
      const errorData = await testCaseResponse.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create test case");
    }

    const testCaseData = await testCaseResponse.json();
    console.log("Test case created:", testCaseData);

    // Step 2: Prepare and add steps to the created test case
    const selectedSteps = testSteps.map((step, index) => {
      let teststep_result = "not_executed";
      if (step.status === "complete") {
        teststep_result = "passed";
      } else if (step.status === "error") {
        teststep_result = "failed";
      }
      
      let stepDescription = step.description;
      if (/(\b\d{4,8}\b)/.test(step.description)) {
        stepDescription = step.description.replace(/\b\d{4,8}\b/, "<otp>");
      }
      
      // Initialize default coordinates
      let coordinates = { click_x: 0, click_y: 0 };
      
      // Extract coordinates from step data if available
      if (step.requestBody) {
        coordinates = step.requestBody;
      }

      // ✅ Check if this step uses OTP
      // const usesOtp = step.description.includes('{{OTP}}');
      
      return {
        step_number: index + 1,
        step_description: stepDescription,
        teststep_result: teststep_result,
        step_coordinates: coordinates,
        expected_result: step.expectedResult || "",
        actual_result: "",
        requires_otp: step.requiresOtp || false,
        otp_type: step.otpType || null,
        ...(stepDescription?.toLowerCase().startsWith("wait") && step.waitRequestData ? { wait_config: step.waitRequestData } : {})
      };
    });

    // Create steps payload matching the working API structure
    const stepsPayload = {
      user_id: parseInt(userId),
      project_name: testCaseInfo.projectId,
      testcase_name: testCaseInfo.testcase_name,
      steps: selectedSteps
    };

    console.log("Adding steps with payload:", stepsPayload);

    const stepsResponse = await fetch("http://127.0.0.1:8000/integrate/teststep/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stepsPayload)
    });

    if (!stepsResponse.ok) {
      const errorData = await stepsResponse.json().catch(() => ({}));
      // If steps fail, show warning that test case was created but steps failed
      console.warn("Steps creation failed:", errorData);
      alert(`Test Case Created Successfully, but failed to add steps: ${errorData.message || "Unknown error"}`);
      navigate("/test-cases");
      return;
    }

    const stepsData = await stepsResponse.json();
    console.log("Steps added:", stepsData);

    alert("Test Case and Steps Created Successfully");
    navigate("/test-cases");

  } catch (error) {
    console.error('Error creating test case:', error);
    alert(`Error: ${error.message}`);
  } finally {
    setCreateTestCaseLoading(false);
  }
};

  const clearSession = () => {
    sessionStorage.removeItem('latestElementData');
    sessionStorage.removeItem('otpSessionTime');  

    // Reset React states
    setElementData(null);
    setTestSteps([]);
    setOtpVerificationState({
      isEnabled: false,
      phoneNumberEntered: false,
      waitingForOtp: false,
      enteredPhoneNumber: '',
      sessionTime: null,
      enteredContact: '',
      enteredContactInboxId: ''
    });
    setTestData(null);
    // setRequiresOtp(false);
    // setContactSelected(false);
    // setEmailConfirmationModal({
    //   isOpen: false,
    //   userEmail: '',
    //   // defaultEmail: '',
    //   isEditing: false
    // });

    alert('Session data cleared!');
  };

const LoadingIndicator = ({ message }) => (
  <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-md border-l-4 border-purple-500 mb-4 transition-all duration-300">
    <div className="mr-3 relative">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
      </div>
    </div>
    <span className="text-gray-700 font-medium text-lg">{message}</span>
  </div>
);

const ImageModal = () => {
  if (!fullScreenImage) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={() => setFullScreenImage(null)}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        <button 
          className="absolute top-2 right-2 bg-white rounded-full p-1"
          onClick={() => setFullScreenImage(null)}
        >
          <X className="w-6 h-6" />
        </button>
        <img 
          src={fullScreenImage} 
          alt="Full screen preview" 
          className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
};

const SecondaryVerificationConfirmation = ({ isOpen, onClose, onConfirm, stepObj }) => {
  if (!isOpen || !stepObj) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Final Verification Confirmation</h3>
        <p className="text-sm text-gray-600 mb-3">
          Are you sure you want to verify "{stepObj.description.substring(7)}" on the page?
        </p>
        <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md mb-4">
          <p className="text-sm text-yellow-700">
            This will execute the verification action on the selected element.
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
          >
            Confirm Verify
          </button>
        </div>
      </div>
    </div>
  );
};

const VerificationConfirmation = ({ isOpen, onClose, onConfirm, textToVerify, matchingElements }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Verification</h3>
        <p className="text-sm text-gray-600 mb-3">
          Found {matchingElements.length} element(s) containing "{textToVerify}".
        </p>
        <div className="max-h-48 overflow-y-auto mb-4 border border-gray-200 rounded-md p-2">
          {matchingElements.map((element, index) => (
            <div key={index} className="p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
              <div className="font-medium text-sm">{element.name || 'Element'}</div>
              {element.text && element.text.trim() !== "" && (
                <div className="text-xs text-gray-600">
                  Content: "{element.text?.substring(0, 50)}{element.text?.length > 50 ? '...' : ''}"
                </div>
              )}
              <div className="text-xs text-gray-600">
                Type: {element.tag === 'a' || element.type === 'link' ? 'Link' : 'Text'}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
};

const InstructionModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Test Execution Instructions</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Link className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Getting Started</h4>
                <p className="text-sm text-gray-600">Enter a URL in the command box (e.g., "open https://example.com") to begin testing.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <MousePointer className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Adding Commands</h4>
                <p className="text-sm text-gray-600">Once a page is loaded, you can add commands like "click login" or "type hello in username".</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Verification</h4>
                <p className="text-sm text-gray-600">Use commands like "verify text welcome" to validate page content.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Info className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Automatic Minimization</h4>
                <p className="text-sm text-gray-600">The test panel will automatically minimize during page loads and expand when ready for new commands.</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="mt-6 w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

  const ConnectDeviceModal = () => {
    if (!showConnectModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <WifiOff className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Connect Your Android Device</h2>
            <p className="text-gray-600 mb-6">
              Please connect your Android device and enable the required options to continue with testing.
            </p>
            
            <div className="text-left mb-6">
              <h3 className="font-medium text-gray-800 mb-2">Required Steps:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Enable Developer Options on your device</li>
                <li>Enable USB Debugging</li>
                <li>Connect your device via USB</li>
                <li>Allow USB debugging when prompted</li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={checkChromeAvailability}
                disabled={connectionLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {connectionLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Checking...
                  </div>
                ) : (
                  'Check Connection'
                )}
              </button>
              <button
                onClick={() => navigate('/test-cases')}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

const WaitModal = ({ isOpen, onClose, onConfirm }) => {
  const [waitCondition, setWaitCondition] = useState('static_wait');
  const [waitTimeout, setWaitTimeout] = useState(5);
  const [waitText, setWaitText] = useState('');
  const [pollInterval, setPollInterval] = useState(500);
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setWaitCondition('static_wait');
      setWaitTimeout(5);
      setWaitText('');
      setPollInterval(500);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    // const userid = localStorage.getItem("user_id");
    if (!waitTimeout || waitTimeout <= 0) {
      alert('Please enter a valid wait time greater than 0.');
      return;
    }
    const timeoutMs = waitTimeout * 1000;
    
    let waitCommand = '';
    let requestData = {};
    
    if (waitCondition === 'static_wait') {
      waitCommand = `wait ${waitTimeout} seconds`;
      requestData = {
        // user_id: userid,
        timeout: timeoutMs,
        is_final_step: true,
        debug: true
      };
    } else if (waitCondition === 'text_match') {
      waitCommand = `wait until text "${waitText}" appears`;
      requestData = {
        // user_id: userid,
        // condition: "text_match",
        expected_text: waitText,
        timeout: timeoutMs,
        poll_interval: pollInterval,
        is_final_step: true,
        debug: true
      };
    } 
    // else if (waitCondition === 'url_match') {
    //   waitCommand = `wait until URL contains "${waitText}"`;
    //   requestData = {
    //     user_id: userid,
    //     condition: "url_match",
    //     expected_text: waitText,
    //     timeout: timeoutMs,
    //     poll_interval: pollInterval,
    //     check_address_bar: true,
    //     is_final_step: true,
    //     debug: true
    //   };
    // }
    
    // Close the modal first
    onClose();
    
    // Then call onConfirm
    onConfirm(waitCommand, requestData);
  };

  const handleClose = () => {
    onClose();
  };

  // Don't render anything if the modal is not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white p-6 rounded-lg w-96" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Configure Wait Command</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Wait Condition</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={waitCondition}
            onChange={(e) => setWaitCondition(e.target.value)}
          >
            <option value="static_wait">Wait for a specific time</option>
            <option value="text_match">Wait until specific text appears</option>
            <option value="url_match">Wait until URL contains page</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {waitCondition === 'static_wait' ? 'Wait Time (seconds)' : 'Timeout (seconds)'}
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={waitTimeout}
            onChange={(e) => {
              const val = e.target.value;
              setWaitTimeout(val === '' ? '' : Number(val));
            }}
            placeholder="Default is 5 seconds if not specified"
            step="1"
          />
        </div>

        {waitCondition !== 'static_wait' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {waitCondition === 'text_match' ? 'Text to Wait For' : 'URL Contains Page to Wait For'}
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={waitText}
              onChange={(e) => setWaitText(e.target.value)}
              placeholder={waitCondition === 'text_match' ? 'e.g. Dashboard' : 'e.g. signup page'}
            />
          </div>
        )}

        {waitCondition !== 'static_wait' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Poll Interval (ms)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={pollInterval}
              onChange={(e) => setPollInterval(Number(e.target.value))}
              min="100"
              step="100"
            />
          </div>
        )}
        
        <div className="flex justify-end space-x-2">
          <button 
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={waitCondition !== 'static_wait' && !waitText.trim()}
          >
            Add Step
          </button>
        </div>
      </div>
    </div>
  );
};

const handleMultipleMatches = (matches, stepDescription, callback) => {
  if (matches.length === 1) {
    // Single match - proceed automatically
    callback(matches[0]);
    return;
  }
  
  // Multiple matches - show modal for user to choose
  const matchOptions = matches.map((match, index) => ({
    index: index,
    display: `${match.displayName || match.name || match.text || 'Unknown Element'}`,
    type: match.type || 'Unknown',
    element: match,
    coordinates: match.coordinates || { x: 0, y: 0, width: 0, height: 0 }
  }));
  
  setModalData({
    matches: matchOptions,
    stepDescription: stepDescription,
    callback: callback
  });
  setShowElementModal(true);
};

const getPositionDescription = (element, allElements) => {
  const clickPoint = element.click_point || element.coordinates || [];
  if (clickPoint.length < 2) return "Unknown position";
  
  const x = clickPoint[0];
  const y = clickPoint[1];
  
  // Screen dimensions (you can adjust these based on your typical screen size)
  const SCREEN_WIDTH = 1920; // or get from window.innerWidth
  const SCREEN_HEIGHT = 1080; // or get from window.innerHeight
  
  // Determine horizontal position
  let horizontalPos = "";
  if (x < SCREEN_WIDTH * 0.25) horizontalPos = "Left side";
  else if (x < SCREEN_WIDTH * 0.75) horizontalPos = "Center";
  else horizontalPos = "Right side";
  
  // Determine vertical position
  let verticalPos = "";
  if (y < SCREEN_HEIGHT * 0.25) verticalPos = "Top";
  else if (y < SCREEN_HEIGHT * 0.75) verticalPos = "Middle";
  else verticalPos = "Bottom";
  
  // Combine positions
  let position = `${verticalPos} ${horizontalPos.toLowerCase()}`;
  
  // Add relative positioning if there are multiple similar elements
  if (allElements && allElements.length > 1) {
    const sameTypeElements = allElements.filter(el => 
      el.element.type === element.type && 
      (el.element.name || el.element.displayName || el.element.text) !== 
      (element.name || element.displayName || element.text)
    );
    
    if (sameTypeElements.length > 0) {
      // Find if this element is above/below others
      const elementsAbove = sameTypeElements.filter(el => {
        const otherY = (el.element.click_point || el.element.coordinates || [])[1];
        return otherY && otherY > y + 50; // 50px tolerance
      });
      
      const elementsBelow = sameTypeElements.filter(el => {
        const otherY = (el.element.click_point || el.element.coordinates || [])[1];
        return otherY && otherY < y - 50; // 50px tolerance
      });
      
      if (elementsAbove.length > 0 && elementsBelow.length === 0) {
        position += " (topmost)";
      } else if (elementsBelow.length > 0 && elementsAbove.length === 0) {
        position += " (bottommost)";
      } else if (elementsAbove.length > 0 && elementsBelow.length > 0) {
        position += " (middle)";
      }
    }
  }
  
  return position;
};

const getSizeDescription = (element) => {
  const coordinates = element.coordinates || [];
  if (coordinates.length !== 4) return "Standard size";
  
  const width = coordinates[2] - coordinates[0];
  const height = coordinates[3] - coordinates[1];
  
  if (width > 200 && height > 50) return "Large element";
  if (width < 100 || height < 30) return "Small element";
  return "Medium size";
};

const getElementContext = (element) => {
  const text = element.text || element.displayName || element.name || '';
  
  // Add context based on surrounding text or attributes
  if (element.attributes) {
    if (element.attributes.placeholder) return `(placeholder: "${element.attributes.placeholder}")`;
    if (element.attributes.value) return `(current value: "${element.attributes.value}")`;
    if (element.attributes.title) return `(tooltip: "${element.attributes.title}")`;
  }
  
  // Provide context based on element type and text
  if (element.type === 'input') {
    if (text.toLowerCase().includes('password')) return "(password field)";
    if (text.toLowerCase().includes('email')) return "(email field)";
    if (text.toLowerCase().includes('username')) return "(username field)";
    if (text.toLowerCase().includes('search')) return "(search box)";
    return "(input field)";
  }
  
  if (element.type === 'button') {
    if (text.toLowerCase().includes('submit')) return "(submit action)";
    if (text.toLowerCase().includes('login')) return "(login action)";
    if (text.toLowerCase().includes('cancel')) return "(cancel action)";
    return "(clickable button)";
  }
  
  return "";
};

const ElementSelectionModal = () => {
  const [selectedElement, setSelectedElement] = useState(null);
  
  const handleElementSelect = (element) => {
    setSelectedElement(element);
  };
  
  const handleConfirm = () => {
    if (selectedElement && modalData.callback) {
      modalData.callback(selectedElement.element);
    }
    handleModalClose();
  };
  
  const handleCancel = () => {
    if (modalData.callback) {
      modalData.callback(null);
    }
    handleModalClose();
  };
  
  const handleModalClose = () => {
    setShowElementModal(false);
    setSelectedElement(null);
    setModalData({
      matches: [],
      stepDescription: '',
      callback: null
    });
  };
  
  if (!showElementModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <h2 className="text-lg font-semibold">Multiple Elements Found</h2>
          <p className="text-blue-100 text-sm mt-1">
            Select the correct element for: "{modalData.stepDescription}"
          </p>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {modalData.matches.map((match, index) => {
              const positionDesc = getPositionDescription(match.element, modalData.matches);
              const sizeDesc = getSizeDescription(match.element);
              const contextDesc = getElementContext(match.element);
              
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedElement?.index === match.index
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => handleElementSelect(match)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Element Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg ${
                      match.type === 'button' ? 'bg-green-500' :
                      match.type === 'input' ? 'bg-blue-500' :
                      match.type === 'link' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}>
                      {match.type === 'button' ? '🔘' :
                       match.type === 'input' ? '📝' :
                       match.type === 'link' ? '🔗' :
                       '🔲'}
                    </div>
                    
                    {/* Element Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate text-base">
                          {match.display}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          match.type === 'button' ? 'bg-green-100 text-green-800' :
                          match.type === 'input' ? 'bg-blue-100 text-blue-800' :
                          match.type === 'link' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {match.type}
                        </span>
                      </div>
                      
                      {/* User-friendly position description */}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">📍 Location:</span>
                          <span className="text-sm text-gray-800">{positionDesc}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">📏 Size:</span>
                          <span className="text-sm text-gray-800">{sizeDesc}</span>
                        </div>
                        
                        {contextDesc && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600">💬 Context:</span>
                            <span className="text-sm text-gray-800">{contextDesc}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Match score indicator if available */}
                      {match.element.matchScore && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Match confidence:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${match.element.matchScore}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{match.element.matchScore}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Selection indicator */}
                    {selectedElement?.index === match.index && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Helpful tip */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600">💡</span>
              <p className="text-sm text-yellow-800">
                <strong>Tip:</strong> Look at the location and context to identify the correct element. 
                Elements are described by their position on the screen and their purpose.
              </p>
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedElement}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              selectedElement
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};

const handleOtpReplaceConfirm = (newOtp, currentPageData) => {
  // console.log("🔧 Starting OTP replacement...");
  // console.log("🔧 Original step description:", otpReplacementModal.step.description);
  // console.log("🔧 New OTP value:", newOtp);
  // console.log("🔧 Original step:", otpReplacementModal.step);
  
  // Step 1: Fix the description replacement
  let updatedDescription = otpReplacementModal.step.description;
  
  // Try multiple replacement strategies
  if (/\d{4,8}/.test(updatedDescription)) {
    // Strategy 1: Replace existing 4-8 digit numbers
    updatedDescription = updatedDescription.replace(/\d{4,8}/, newOtp);
    console.log("✅ Strategy 1: Replaced existing digits");
  } else if (/otp/i.test(updatedDescription)) {
    // Strategy 2: Replace "OTP" word with actual OTP
    updatedDescription = updatedDescription.replace(/otp/i, newOtp);
    console.log("✅ Strategy 2: Replaced 'OTP' word");
  } else if (/number/i.test(updatedDescription)) {
    // Strategy 3: Replace "number" word with OTP
    updatedDescription = updatedDescription.replace(/number/i, newOtp);
    console.log("✅ Strategy 3: Replaced 'number' word");
  } else {
    // Strategy 4: Create completely new description
    updatedDescription = `type ${newOtp}`;
    console.log("✅ Strategy 4: Created new description");
  }
  
  console.log("🔧 Final updated description:", updatedDescription);
  
  // Step 2: Create the updated step with ALL necessary properties
  const updatedStep = {
    ...otpReplacementModal.step,
    value: newOtp,
    description: updatedDescription,
    // CRITICAL: Keep the element selection
    selectedElement: otpReplacementModal.step.selectedElement,
    coordinates: otpReplacementModal.step.coordinates
  };
  
  console.log("🔧 Final updated step:", updatedStep);
  
  // Step 3: Update the testSteps array
  setTestSteps(prev => prev.map(step =>
    step.id === updatedStep.id ? updatedStep : step
  ));
  
  // Step 4: Close the modal
  setOtpReplacementModal({ isOpen: false, step: null, fetchedOtp: '', stepIndex: null });
  
  // Step 5: Execute the current step with proper validation
  const currentIndex = otpReplacementModal.stepIndex;
  console.log("🚀 Executing OTP step at index:", currentIndex);

  const validationResult = validateStepAgainstResponse(updatedStep, otpReplacementModal.currentPageData.omniparser_data || otpReplacementModal.currentPageData.coordinates);

  if (!validationResult.isValid) {
    console.error("❌ OTP step validation failed - element not found on current page");
    
    // Open edit modal instead of alert
    openEditModal(
      updatedStep,
      "OTP input field not found on current page",
      otpReplacementModal.currentPageData,
      currentIndex
    );
    return;
  }

  // Handle multiple matches - same logic as handleNextStep
  if (validationResult.matches.length > 1) {
    console.log(`⚠️ OTP step has multiple matches. Awaiting user selection.`);

    handleMultipleMatches(validationResult.matches, updatedStep.description, async (selectedElement) => {
      if (selectedElement) {
        const stepWithElement = {
          ...updatedStep,
          selectedElement: selectedElement,
          coordinates: selectedElement.coordinates || selectedElement.click_point
        };

        // Update testSteps with selected element
        setTestSteps(prev => prev.map(step => 
          step.id === updatedStep.id ? stepWithElement : step
        ));

        // Execute with selected element
        const executionResult = await executeStep(stepWithElement, currentIndex);
        console.log("✅ OTP Step execution result (Multiple Match):", executionResult);
        
        // Update the step with execution result
        setTestSteps(prev => prev.map(step => 
          step.id === stepWithElement.id ? { ...step, ...executionResult } : step
        ));
        
        // Only proceed if execution was successful
        if (executionResult && executionResult.status === 'complete') {
          console.log("✅ OTP step succeeded, moving to next step");
          setCurrentGeneratedStepIndex(currentIndex);
          handleNextStep(executionResult, currentIndex);
        } else {
          console.error(`❌ OTP Step failed:`, executionResult);
          
          // Open edit modal for OTP execution errors
          openEditModal(
            stepWithElement,
            executionResult?.error || 'OTP step execution failed',
            otpReplacementModal.currentPageData,
            currentIndex
          );
        }
      } else {
        console.error(`❌ No element selected for OTP step with multiple matches.`);
      }
    });
  } else {
    // Single match - auto-select
    console.log(`🎯 Auto-selecting single matching element for OTP step:`, validationResult.matches[0]);
    
    const stepWithElement = {
      ...updatedStep,
      selectedElement: validationResult.matches[0],
      coordinates: validationResult.matches[0].coordinates || validationResult.matches[0].click_point
    };

    // Update testSteps with selected element
    setTestSteps(prev => prev.map(step => 
      step.id === updatedStep.id ? stepWithElement : step
    ));

    // Execute with selected element
    executeStep(stepWithElement, currentIndex).then(result => {
      console.log("✅ OTP Step execution result (Single Match):", result);
      
      // Update the step with execution result
      setTestSteps(prev => prev.map(step => 
        step.id === stepWithElement.id ? { ...step, ...result } : step
      ));
      
      // Only proceed if execution was successful
      if (result && result.status === 'complete') {
        console.log("✅ OTP step succeeded, moving to next step");
        setCurrentGeneratedStepIndex(currentIndex);
        handleNextStep(result, currentIndex);
      } else {
        console.error(`❌ OTP Step failed:`, result);
        
        // Open edit modal for OTP execution errors
        openEditModal(
          stepWithElement,
          result?.error || 'OTP step execution failed',
          otpReplacementModal.currentPageData,
          currentIndex
        );
      }
    }).catch(error => {
      console.error('❌ OTP step execution error:', error);
      alert(`OTP execution failed: ${error.message}`);
    });
  }
};

const OtpReplacementModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  otpStep, 
  fetchedOtp, 
  stepIndex,
  onRetryFetch 
}) => {
  const [editedOtp, setEditedOtp] = useState(fetchedOtp || '');
  const [isOtpNotFound, setIsOtpNotFound] = useState(!fetchedOtp || fetchedOtp.trim() === '');
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    setEditedOtp(fetchedOtp || '');
    setIsOtpNotFound(!fetchedOtp || fetchedOtp.trim() === '');
  }, [fetchedOtp]);

  const handleRetryOtp = async () => {
    setIsRetrying(true);
    try {
      if (onRetryFetch) {
        const retryResult = await onRetryFetch(otpStep);
        if (retryResult?.otpValue) {
          setEditedOtp(retryResult.otpValue);
          setIsOtpNotFound(false);
        }
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleConfirm = () => {
    if (editedOtp && editedOtp.trim()) {
      onConfirm(editedOtp.trim());
    }
  };

  if (!isOpen || !otpStep) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {typeof stepIndex === 'number' ? stepIndex + 1 : '?'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              OTP Step Detected
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Description */}
        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Step {typeof stepIndex === 'number' ? stepIndex + 1 : '?'}:</span>
          </p>
          <p className="text-purple-800 font-medium">
            {otpStep.description}
          </p>
        </div>

        {/* OTP Status */}
        {isOtpNotFound ? (
          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.866 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-700 font-medium">OTP Not Found</span>
            </div>
            <p className="text-red-600 text-sm">
              No OTP received yet. Please enter manually or retry fetching.
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-700 font-medium">OTP Found</span>
            </div>
            <p className="text-green-600 text-sm mb-2">
              <span className="font-medium">Fetched OTP:</span> {fetchedOtp}
            </p>
          </div>
        )}

        {/* OTP Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OTP Value:
          </label>
          <input
            type="text"
            value={editedOtp}
            onChange={(e) => setEditedOtp(e.target.value)}
            placeholder={isOtpNotFound ? "Enter OTP manually" : "Edit OTP if needed"}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            maxLength="8"
          />
        </div>

        {/* OTP Type Info */}
        <div className="mb-6 flex items-center space-x-2 text-sm text-gray-600">
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            otpStep.otpType === 'phone' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-orange-100 text-orange-800'
          }`}>
            {otpStep.otpType === 'phone' ? '📱 Phone OTP' : '📧 Email OTP'}
          </div>
          <span>•</span>
          <span>Step {typeof stepIndex === 'number' ? stepIndex + 1 : '?'} of {otpStep.totalSteps || 'N/A'}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {isOtpNotFound && onRetryFetch && (
            <button
              onClick={handleRetryOtp}
              disabled={isRetrying}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Retrying...</span>
                </span>
              ) : (
                '🔄 Retry Fetch'
              )}
            </button>
          )}
          
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={!editedOtp || editedOtp.trim() === ''}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Replace & Execute
          </button>
        </div>
      </div>
    </div>
  );
};

const isStepWaitingForOtp = (step) => {
  return step.requiresOtp &&
    (step.otpReceived || step.otpPending || step.otpWaiting || otpCheckLoadingStepId === step.id || otpVerificationState.stepId === step.id);
};

const openEditModal = (step, errorMessage, pageData, stepIndex, screenshot) => {
  setEditStepModal({
    isOpen: true,
    step: step,
    errorMessage: errorMessage,
    currentPageData: pageData,
    stepIndex: stepIndex,
    currentScreenshot: screenshot, 
  });
};

const handleEditStep = async (updatedStep) => {
  const { currentPageData, stepIndex } = editStepModal;
    
  // console.log("🔧 handleEditStep called:");
  // console.log("  - Updated step:", updatedStep);
  // console.log("  - Has selectedElement:", !!updatedStep.selectedElement);
  // console.log("  - Has coordinates:", !!updatedStep.coordinates);
  // console.log("  - Step index:", stepIndex);

  // Close modal first
  setEditStepModal({
    isOpen: false,
    step: null,
    errorMessage: '',
    currentPageData: null,
    stepIndex: null,
    suggestions: []
  });
  
  // CHECK: Is this step already in testSteps?
  const stepExists = testSteps.find(s => s.id === updatedStep.id);
  
  if (stepExists) {
    setTestSteps(prev => prev.map(s => s.id === updatedStep.id ? updatedStep : s));
  } else {
    setTestSteps(prev => [...prev, updatedStep]);
  }

  // 🔔 ADD OTP CHECK BEFORE EXECUTION (same logic as handleNextStep)
  if (updatedStep.action === "type" && 
      updatedStep.isActualOtpStep === true && 
      (updatedStep.description.toLowerCase().includes('otp'))) {
    
    console.log(`🔐 Manual OTP Step ${stepIndex + 1} detected! User will enter OTP manually.`);

  }

  // 🔔 ADD OTP LOGIC AFTER SUCCESSFUL EXECUTION
  if (updatedStep.requiresOtp && updatedStep.otpType && !updatedStep.isActualOtpStep) {
    console.log(`🔐 OTP Required for edited step ${stepIndex + 1}:`, updatedStep.otpType);

    setOtpVerificationState(prev => ({
      ...prev,
      waitingForOtp: true,
      enteredContact: updatedStep.value,
      contactEntered: true,
      stepId: updatedStep.id
    }));

    await updateOtpSessionTime({
      contactEntered: true,
      enteredContact: updatedStep.value
    });
  }
  
  // Execute the updated step
  try {
    console.log("🚀 About to execute edited step:", updatedStep);
    const executionResult = await executeStep(updatedStep, stepIndex);
    
    if (executionResult && executionResult.status === 'complete') {
      setTestSteps(prev => prev.map(s => 
        s.id === updatedStep.id ? { ...s, ...executionResult } : s
      ));
      
      // 🔔 ADD OTP LOGIC AFTER SUCCESSFUL EXECUTION
      if (updatedStep.requiresOtp && updatedStep.otpType && !updatedStep.isActualOtpStep) {
        console.log(`🔐 OTP Required after edited Step ${stepIndex + 1}:`, updatedStep.otpType);

        const isPhoneNumberStep = updatedStep.otpType === 'phone';
        const isEmailStep = updatedStep.otpType === 'email';

        setOtpVerificationState(prev => ({
          ...prev,
          waitingForOtp: true,
          enteredContact: updatedStep.value,
          contactEntered: true,
          stepId: updatedStep.id
        }));

        const otpFetchResult = await callGetOtpAfterExecution(
          updatedStep.id,
          isPhoneNumberStep,
          isEmailStep,
          true,
          isEmailStep ? senderEmail : null
        );

        if (otpFetchResult?.status === 'success') {
          setTestSteps(prev => prev.map(step =>
            step.id === updatedStep.id ? {
              ...step,
              otp: otpFetchResult.otp,
              otpValue: otpFetchResult.otp,
              otpReceived: true
            } : step
          ));
        } else if (otpFetchResult?.status === 'waiting') {
          setTestSteps(prev => prev.map(step =>
            step.id === updatedStep.id ? {
              ...step,
              otpWaiting: true,
              otpPending: false,
              otpReceived: false
            } : step
          ));
        }
      }
      
      setCurrentGeneratedStepIndex(stepIndex);
      handleNextStep(executionResult, stepIndex);
    } else {
      console.error("❌ Edited step execution failed:", executionResult);
      openEditModal(
        updatedStep,
        executionResult?.error || 'Step execution failed after edit',
        currentPageData,
        stepIndex
      );
    }
  } catch (error) {
    console.error('❌ Error executing edited step:', error);
    openEditModal(
      updatedStep,
      error.message || 'Unexpected error during step execution',
      currentPageData,
      stepIndex
    );
  }
};

const handleSkipStep = () => {
  const { stepIndex } = editStepModal;
  
  // Close modal
  setEditStepModal({
    isOpen: false,
    step: null,
    errorMessage: '',
    currentPageData: null,
    stepIndex: null,
    suggestions: []
  });
  
  // Continue with next step
  setCurrentGeneratedStepIndex(stepIndex);
  
  // Create dummy successful result to continue flow
  const dummyResult = { status: 'complete', skipped: true };
  handleNextStep(dummyResult, stepIndex);
};

const EditStepModal = ({ 
  isOpen, 
  onClose, 
  onSave,
  onSkip,
  step, 
  errorMessage,
  onEditTextChange,
  elementData,
  testSteps,
  previouslySelectedElements,
  currentScreenshot
}) => {
  const [editableStep, setEditableStep] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [commandType, setCommandType] = useState('');
  const [selectedElement, setSelectedElement] = useState(null);
  // const [showScrollSuggestions, setShowScrollSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [adjustedPosition, setAdjustedPosition] = useState(null);
  const [showPositionControls, setShowPositionControls] = useState(false);
  
  // Position adjustment increments (in pixels)
  const POSITION_STEP = 10;
  const FINE_STEP = 5;
  
  const inputRef = useRef(null);
  const screenshotContainerRef = useRef(null);

  useEffect(() => {
    if (showPositionControls && selectedSuggestion && screenshotContainerRef.current) {
      const container = screenshotContainerRef.current;
      const currentPos = adjustedPosition || selectedSuggestion.click_point;
      
      // Center the view on the current position
      setTimeout(() => {
        const containerRect = container.getBoundingClientRect();
        const targetX = currentPos[0] - containerRect.width / 2;
        const targetY = currentPos[1] - containerRect.height / 2;
        
        container.scrollTo({
          left: Math.max(0, targetX),
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [showPositionControls, selectedSuggestion,adjustedPosition ]);

  // Initialize modal state
  useEffect(() => {
    if (isOpen && step) {
      setEditableStep(step.description);
      // Reset all suggestion states
      setShowSuggestions(false);
      setSuggestions([]);
      setCommandType('');
      setSelectedElement(null);
      // Focus input after modal animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (!editableStep) {
      setShowSuggestions(false);
      return;
    }

    if (selectedElement && editableStep.includes(selectedElement.displayName || selectedElement.name)) {
      return;
    }

    const inputText = editableStep.trim().toLowerCase();
    const words = inputText.split(' ');
    const firstWord = words[0];
    
    // Check if the command is a click or type command
    if (['click', 'type', 'verify', 'get'].includes(firstWord)) {
      setCommandType(firstWord);

      if (firstWord === 'wait') {
        setShowSuggestions(false);
        return;
      }
      
      if (!elementData || !elementData.elements || elementData.elements.length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      let searchTerm = '';
      let direction = null;
      
      // Extract search term based on command type with directional support
      if (firstWord === 'click' && words.length > 1) {
        const directions = ['left', 'right', 'above', 'below', 'bottom'];
        const directionIndex = words.findIndex(word => directions.includes(word));
        
        if (directionIndex !== -1 && directionIndex === 1) {
          // Format: "click left login" or "click above submit button"
          direction = words[1];
          searchTerm = words.slice(2).join(' ').toLowerCase();
        } else {
          // Normal click: "click login"
          searchTerm = words.slice(1).join(' ').toLowerCase();
        }
      } else if (firstWord === 'type') {
        const inIndex = inputText.indexOf(' in ');
        if (inIndex !== -1) {
          const afterIn = inputText.substring(inIndex + 4).trim();
          const afterInWords = afterIn.split(' ');
          
          const directions = ['left', 'right', 'above', 'below', 'bottom'];
          if (directions.includes(afterInWords[0])) {
            // Format: "type password in right username"
            direction = afterInWords[0];
            searchTerm = afterInWords.slice(1).join(' ');
          } else {
            // Normal type: "type password in username"
            searchTerm = afterIn;
          }
        }
      } else if (firstWord === 'verify' && words.length > 1) {
        searchTerm = words.slice(1).join(' ').toLowerCase();
      } else if (firstWord === 'get' && words.length > 1) {
        searchTerm = words.slice(1).join(' ').toLowerCase();
      }
      
      // Get last click coordinates from executed steps
      const lastClickCoordinates = testSteps.length > 0 ? 
        getLastClickCoordinates(testSteps) : null;
      
      // Use your enhanced algorithm to get suggestions
      const suggestedElements = getSuggestedElements(
        elementData.elements,
        searchTerm,
        firstWord,
        { 
          previouslySelectedElements, 
          lastClickCoordinates,
          direction // Pass direction info if needed
        }
      );      
      
      setSuggestions(suggestedElements);
      setShowSuggestions(suggestedElements.length > 0);
      
    } else if (['scrollup', 'scrolldown', 'scroll_up', 'scroll_down'].includes(firstWord)) { 
      setCommandType('scroll');
      setShowSuggestions(false);
    } else if (firstWord === 'open' || (words.includes('go') && words.includes('to'))) { 
      setCommandType('open');
      setShowSuggestions(false);
    } else {
      setCommandType('');
      setShowSuggestions(false);
    }
  }, [editableStep, elementData, previouslySelectedElements, testSteps, selectedElement]);

  const handleInputChange = (value) => {
    setEditableStep(value);
    // onEditTextChange?.(value);
  };

const handleSuggestionClick = (suggestion) => {
  const inputText = editableStep.trim();
  const words = inputText.split(' ');
  const firstWord = words[0];
  
  let newStepText = '';
  let modifiedSuggestion = { ...suggestion }; 
  
  if (firstWord === 'click') {
    // Check if there's a direction word
    const directions = ['left', 'right', 'above', 'below', 'bottom'];
    const directionIndex = words.findIndex(word => directions.includes(word));
    
    if (directionIndex !== -1 && directionIndex === 1) {
      const direction = words[1];
      // Keep the direction: "click left [element]"
      newStepText = `click ${direction} ${suggestion.displayName || suggestion.name}`;
      
      // *** THIS IS THE MISSING PART - CALCULATE OFFSET COORDINATES ***
      const originalCoords = suggestion.click_point || suggestion.coordinates || [0, 0];
      const offsetCoords = calculateDirectionalOffset(originalCoords, direction);
      
      // Update the suggestion object with offset coordinates
      modifiedSuggestion = {
        ...suggestion,
        click_point: offsetCoords,
        coordinates: offsetCoords,
        hasDirectionalOffset: true,
        originalCoordinates: originalCoords,
        direction: direction
      };
    } else {
      // Normal click
      newStepText = `click ${suggestion.displayName || suggestion.name}`;
    }
  } else if (firstWord === 'type') {
    // Keep the existing text part and update the target with direction if present
    const inIndex = inputText.indexOf(' in ');
    if (inIndex !== -1) {
      const beforeIn = inputText.substring(0, inIndex + 4);
      const afterIn = inputText.substring(inIndex + 4).trim();
      const afterInWords = afterIn.split(' ');
      
      const directions = ['left', 'right', 'above', 'below', 'bottom'];
      if (directions.includes(afterInWords[0])) {
        const direction = afterInWords[0];
        // Keep the direction: "type password in right [element]"
        newStepText = `${beforeIn}${direction} ${suggestion.displayName || suggestion.name}`;
        
        // *** APPLY OFFSET FOR TYPE COMMANDS TOO ***
        const originalCoords = suggestion.click_point || suggestion.coordinates || [0, 0];
        const offsetCoords = calculateDirectionalOffset(originalCoords, direction);
        
        modifiedSuggestion = {
          ...suggestion,
          click_point: offsetCoords,
          coordinates: offsetCoords,
          hasDirectionalOffset: true,
          originalCoordinates: originalCoords,
          direction: direction
        };
      } else {
        // Normal type
        newStepText = `${beforeIn}${suggestion.displayName || suggestion.name}`;
      }
    } else {
      newStepText = `type in ${suggestion.displayName || suggestion.name}`;
    }
  } else if (firstWord === 'verify') {
    newStepText = `verify ${suggestion.displayName || suggestion.name}`;
  } else if (firstWord === 'get') {
    newStepText = `get ${suggestion.displayName || suggestion.name}`;
  }
  
  setEditableStep(newStepText);
  setSelectedElement(modifiedSuggestion); 
  setShowSuggestions(false);
};

const calculateDirectionalOffset = (coordinates, direction) => {
  const [x, y] = coordinates;
  const offset = 40; 
  
  switch (direction.toLowerCase()) {
    case 'above':
      return [x, y - offset];
    case 'below':
    case 'bottom':
      return [x, y + offset];
    case 'left':
      return [x - offset, y];
    case 'right':
      return [x + offset, y];
    default:
      return [x, y];
  }
};

  // const handleScrollOptionClick = (option) => {
  //   setEditableStep(option);
  //   setShowScrollSuggestions(false);
  //   onEditTextChange?.(option);
  // };

  const handleSave = () => {
    if (editableStep.trim()) {
      onEditTextChange?.(editableStep.trim());
      onSave(editableStep.trim(), selectedElement);
    }
  };

  if (!isOpen) return null;

  // const scrollOptions = [
  //   'scroll down',
  //   'scroll up',
  //   'scroll to bottom',
  //   'scroll to top'
  // ];

  // const swipeOptions = [
  //   'swipe left',
  //   'swipe right',
  //   'swipe up', 
  //   'swipe down'
  // ];

  // const filteredScrollOptions = scrollOptions
  //   .filter(option => option.toLowerCase().includes(editableStep.toLowerCase()))
  //   .concat(scrollOptions.filter(option => !option.toLowerCase().includes(editableStep.toLowerCase())));

  // const filteredSwipeOptions = swipeOptions
  //   .filter(option => option.toLowerCase().includes(editableStep.toLowerCase()))
  //   .concat(swipeOptions.filter(option => !option.toLowerCase().includes(editableStep.toLowerCase())));

  const shouldShowNoDataMessage =
    suggestions.length === 0 &&
    newStep?.trim() !== '' &&
    ['click', 'type', 'verify', 'get'].some(cmd => newStep.startsWith(cmd));

  if (shouldShowNoDataMessage) {
    return (
      <div className="absolute z-10 w-full bg-white shadow-xl rounded-md border border-gray-200 mt-12 animate-fadeIn suggestions-dropdown">
        <div className="p-4 text-center">
          <div className="text-red-600 font-medium mb-2 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            No element data available
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Please check your network connection and try again. The AgentExtractModel may not be responding or providing coordinate data.
          </p>
          <p className="text-xs text-gray-600 mb-3">
            💡 Tip: If elements aren't detected properly, you can use the position adjustment controls to fine-tune the click location.
          </p>
          <button 
            onClick={() => setShowSuggestions(false)}
            className="mt-3 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  const handlePositionAdjustment = (direction, step = POSITION_STEP) => {
    if (!selectedSuggestion) return;
    
    const currentPos = adjustedPosition || selectedSuggestion.click_point;
    let newPos = [...currentPos];
    
    switch (direction) {
      case 'up':
        newPos[1] -= step;
        break;
      case 'down':
        newPos[1] += step;
        break;
      case 'left':
        newPos[0] -= step;
        break;
      case 'right':
        newPos[0] += step;
        break;
      default:
        return;
    }
    
    // Ensure position doesn't go negative
    newPos[0] = Math.max(0, newPos[0]);
    newPos[1] = Math.max(0, newPos[1]);
    
    setAdjustedPosition(newPos);
    
    // Scroll the container to keep the crosshair visible
    setTimeout(() => {
      if (screenshotContainerRef.current) {
        const container = screenshotContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        
        // Calculate if we need to scroll to keep the crosshair visible
        const targetX = newPos[0] - containerRect.width / 2;
        const targetY = newPos[1] - containerRect.height / 2;
        
        container.scrollTo({
          left: Math.max(0, targetX),
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
      }
    }, 0);
  };

  const handleSuggestionSelect = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setAdjustedPosition(null);
    setShowPositionControls(true);
  };

  const handleConfirmSelection = () => {
    if (selectedSuggestion) {
      const finalPosition = adjustedPosition || selectedSuggestion.click_point;
      const updatedSuggestion = {
        ...selectedSuggestion,
        click_point: finalPosition
      };
      handleSuggestionClick(updatedSuggestion);
      setShowPositionControls(false);
      setSelectedSuggestion(null);
      setAdjustedPosition(null);
    }
  };

  const handleCancelSelection = () => {
    setShowPositionControls(false);
    setSelectedSuggestion(null);
    setAdjustedPosition(null);
  };

  const resetPosition = () => {
    setAdjustedPosition(null);
  };

  const PositionControls = () => {
    if (!selectedSuggestion) return null;
    
    const currentPos = adjustedPosition || selectedSuggestion.click_point;
    const originalPos = selectedSuggestion.click_point;
    const hasAdjustment = adjustedPosition && 
      (adjustedPosition[0] !== originalPos[0] || adjustedPosition[1] !== originalPos[1]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]">
        <div className="bg-white rounded-lg shadow-2xl w-[900px] h-[600px] overflow-hidden">
          {/* Header */}
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  🎯
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">Fine-tune Click Position</h3>
                  <p className="text-sm text-blue-600">
                    Element: {selectedSuggestion.displayName || selectedSuggestion.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleCancelSelection}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <div className="flex h-[calc(600px-140px)]">
            {/* Screenshot Panel */}
            
            <div ref={screenshotContainerRef} className="flex-1 relative bg-gray-100 overflow-auto">
              <div className="relative inline-block min-w-full min-h-full">
                {currentScreenshot ? (
                  <img 
                    src={currentScreenshot} 
                    alt="Page Screenshot" 
                    className="max-w-none"
                    style={{ cursor: 'crosshair' }}
                    onClick={(e) => {
                      const rect = e.target.getBoundingClientRect();
                      const scaleX = e.target.naturalWidth / rect.width;
                      const scaleY = e.target.naturalHeight / rect.height;
                      const x = (e.clientX - rect.left) * scaleX;
                      const y = (e.clientY - rect.top) * scaleY;
                      setAdjustedPosition([Math.round(x), Math.round(y)]);
                    }}
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📸</div>
                      <p>Screenshot not available</p>
                      <p className="text-sm">Use the controls to adjust position</p>
                    </div>
                  </div>
                )}
                
                {/* Original Position Indicator */}
                <div 
                  className="absolute w-6 h-6 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    left: `${originalPos[0]}px`, 
                    top: `${originalPos[1]}px` 
                  }}
                >
                  <div className="w-full h-full bg-red-500 bg-opacity-70 rounded-full border-2 border-red-600 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Original Position
                  </div>
                </div>
                
                {/* Current/Adjusted Position Indicator */}
                <div 
                  className="absolute w-8 h-8 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ 
                    left: `${currentPos[0]}px`, 
                    top: `${currentPos[1]}px` 
                  }}
                >
                  {/* Crosshair */}
                  <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-green-500 transform -translate-y-1/2"></div>
                    <div className="absolute left-1/2 top-0 h-full w-0.5 bg-green-500 transform -translate-x-1/2"></div>
                  </div>
                  
                  {/* Center dot */}
                  <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
                  
                  {/* Label */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Click Here ({Math.round(currentPos[0])}, {Math.round(currentPos[1])})
                  </div>
                  
                  {/* Connection line to original if adjusted */}
                  {/* {hasAdjustment && (
                    <svg className="absolute pointer-events-none" style={{
                      left: `${originalPos[0] - currentPos[0]}px`,
                      top: `${originalPos[1] - currentPos[1]}px`,
                      width: `${Math.abs(currentPos[0] - originalPos[0]) + 20}px`,
                      height: `${Math.abs(currentPos[1] - originalPos[1]) + 20}px`
                    }}>
                      <line
                        x1={currentPos[0] > originalPos[0] ? 10 : Math.abs(currentPos[0] - originalPos[0]) + 10}
                        y1={currentPos[1] > originalPos[1] ? 10 : Math.abs(currentPos[1] - originalPos[1]) + 10}
                        x2={currentPos[0] > originalPos[0] ? Math.abs(currentPos[0] - originalPos[0]) + 10 : 10}
                        y2={currentPos[1] > originalPos[1] ? Math.abs(currentPos[1] - originalPos[1]) + 10 : 10}
                        stroke="#fbbf24"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        markerEnd="url(#arrowhead)"
                      />
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                                refX="0" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
                        </marker>
                      </defs>
                    </svg>
                  )} */}
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto flex-shrink-0">
              <div className="space-y-6">
                {/* Position Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Position Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current:</span>
                      <span className="font-mono">x:{Math.round(currentPos[0])}, y:{Math.round(currentPos[1])}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original:</span>
                      <span className="font-mono text-red-600">x:{Math.round(originalPos[0])}, y:{Math.round(originalPos[1])}</span>
                    </div>
                    {hasAdjustment && (
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Offset:</span>
                        <span className="font-mono text-green-600">
                          x:{adjustedPosition[0] - originalPos[0]}, y:{adjustedPosition[1] - originalPos[1]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Directional Controls */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-4 text-center">Directional Controls</h4>
                  
                  <div className="flex flex-col items-center gap-2">
                    {/* Up Arrow */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handlePositionAdjustment('up', FINE_STEP)}
                        className="w-8 h-6 bg-white hover:bg-blue-100 border border-blue-300 rounded text-blue-600 flex items-center justify-center transition-colors text-xs"
                        title="Move up (fine)"
                      >
                        ⬆
                      </button>
                      <button
                        onClick={() => handlePositionAdjustment('up')}
                        className="w-8 h-6 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-blue-700 flex items-center justify-center transition-colors font-bold"
                        title="Move up"
                      >
                        ⬆
                      </button>
                    </div>
                    
                    {/* Left and Right Arrows */}
                    <div className="flex gap-2 items-center">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handlePositionAdjustment('left', FINE_STEP)}
                          className="w-6 h-8 bg-white hover:bg-blue-100 border border-blue-300 rounded text-blue-600 flex items-center justify-center transition-colors text-xs"
                          title="Move left (fine)"
                        >
                          ⬅
                        </button>
                        <button
                          onClick={() => handlePositionAdjustment('left')}
                          className="w-6 h-8 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-blue-700 flex items-center justify-center transition-colors font-bold"
                          title="Move left"
                        >
                          ⬅
                        </button>
                      </div>
                      
                      <div className="mx-2 text-center">
                        <div className="w-12 h-12 bg-blue-200 border-2 border-blue-400 rounded-full flex items-center justify-center text-blue-800">
                          🎯
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Target</div>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => handlePositionAdjustment('right')}
                          className="w-6 h-8 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-blue-700 flex items-center justify-center transition-colors font-bold"
                          title="Move right"
                        >
                          ➡
                        </button>
                        <button
                          onClick={() => handlePositionAdjustment('right', FINE_STEP)}
                          className="w-6 h-8 bg-white hover:bg-blue-100 border border-blue-300 rounded text-blue-600 flex items-center justify-center transition-colors text-xs"
                          title="Move right (fine)"
                        >
                          ➡
                        </button>
                      </div>
                    </div>
                    
                    {/* Down Arrow */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handlePositionAdjustment('down')}
                        className="w-8 h-6 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-blue-700 flex items-center justify-center transition-colors font-bold"
                        title="Move down"
                      >
                        ⬇
                      </button>
                      <button
                        onClick={() => handlePositionAdjustment('down', FINE_STEP)}
                        className="w-8 h-6 bg-white hover:bg-blue-100 border border-blue-300 rounded text-blue-600 flex items-center justify-center transition-colors text-xs"
                        title="Move down (fine)"
                      >
                        ⬇
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {hasAdjustment && (
                    <button
                      onClick={resetPosition}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors font-medium"
                    >
                      🔄 Reset to Original
                    </button>
                  )}
                  
                  <button
                    onClick={handleConfirmSelection}
                    className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors font-medium"
                  >
                    ✓ Use This Position
                  </button>
                  
                  <button
                    onClick={handleCancelSelection}
                    className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>

                {/* Quick Instructions */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">How to Adjust</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Click directly on the screenshot</li>
                    <li>• Use arrow buttons for precise control</li>
                    <li>• Bold arrows: {POSITION_STEP}px steps</li>
                    <li>• Light arrows: {FINE_STEP}px fine steps</li>
                  </ul>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-red-50 border-b border-red-200 px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-800">Step Failed</h3>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <div className="px-6 py-4 flex-1 overflow-y-auto">
            {/* Error Details */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Error Details:</p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
              </div>
            </div>

            {/* Original Step */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Original Step:</p>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="text-gray-700 text-sm font-mono">{step?.description}</p>
              </div>
            </div>

            {/* Edit Step */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Edit Step:</p>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={editableStep}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !showSuggestions) {
                      e.preventDefault();
                      handleSave();
                    } else if (e.key === 'Escape') {
                      setShowSuggestions(false);
                    } else if (e.key === 'ArrowDown' && showSuggestions && suggestions.length > 0) {
                      e.preventDefault();
                      document.querySelector('.modal-suggestion-item')?.focus();
                    }
                  }}
                  className="w-full p-3 border border-gray-200 rounded-md text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter step description..."
                />
                
                {/* Modal-specific SuggestionsDropdown */}
                {/* {commandType === 'scroll' && showScrollSuggestions && (
                  <div className="absolute z-20 w-full bg-white shadow-xl rounded-md border border-gray-200 mt-1 animate-fadeIn">
                    <div className="sticky top-0 bg-purple-50 p-3 border-b border-purple-100">
                      <h4 className="font-medium text-purple-800 flex items-center">
                        🖱️ Scroll Options:
                      </h4>
                    </div>
                    <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                      {filteredScrollOptions.map((option, index) => (
                        <li 
                          key={index}
                          className="modal-suggestion-item p-3 hover:bg-purple-50 cursor-pointer transition-colors duration-150"
                          onClick={() => handleScrollOptionClick(option)}
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {commandType === 'swipe' && showScrollSuggestions && (
                  <div className="absolute z-20 w-full bg-white shadow-xl rounded-md border border-gray-200 mt-1 animate-fadeIn">
                    <div className="sticky top-0 bg-purple-50 p-3 border-b border-purple-100">
                      <h4 className="font-medium text-purple-800 flex items-center">
                        👆 Swipe Options:
                      </h4>
                    </div>
                    <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                      {filteredSwipeOptions.map((option, index) => (
                        <li 
                          key={index}
                          className="modal-suggestion-item p-3 hover:bg-purple-50 cursor-pointer transition-colors duration-150"
                          onClick={() => handleScrollOptionClick(option)}
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  </div>
                )} */}

                {showSuggestions && ['click', 'type', 'verify', 'get'].includes(commandType) && (
                  <div className="absolute z-20 w-full bg-white shadow-xl rounded-md border border-gray-200 mt-1 max-h-72 overflow-y-auto animate-fadeIn">
                    <div className="sticky top-0 bg-purple-50 p-3 border-b border-purple-100">
                      <h4 className="font-medium text-purple-800 flex items-center">
                        
                        {commandType === 'click' && (
                          <>
                            <span className="mr-2">🖱️</span> Click on an element:
                          
                            {editableStep.includes(' left ') && <span className="ml-2 text-blue-600">(← 60px left offset)</span>}
                            {editableStep.includes(' right ') && <span className="ml-2 text-blue-600">(→ 60px right offset)</span>}
                            {editableStep.includes(' above ') && <span className="ml-2 text-blue-600">(↑ 60px above offset)</span>}
                            {(editableStep.includes(' below ') || editableStep.includes(' bottom ')) && <span className="ml-2 text-blue-600">(↓ 60px below offset)</span>}
                          </>
                        )}
                        {commandType === 'type' && (
                          <>
                            <span className="mr-2">⌨️</span> Select where to type:
                            
                            {editableStep.includes(' in left ') && <span className="ml-2 text-blue-600">(← 60px left offset)</span>}
                            {editableStep.includes(' in right ') && <span className="ml-2 text-blue-600">(→ 60px right offset)</span>}
                            {editableStep.includes(' in above ') && <span className="ml-2 text-blue-600">(↑ 60px above offset)</span>}
                            {(editableStep.includes(' in below ') || editableStep.includes(' in bottom ')) && <span className="ml-2 text-blue-600">(↓ 60px below offset)</span>}
                        </>
                        )}
                        {commandType === 'verify' && (
                          <>
                            <span className="mr-2">✓</span> Verify text on page:
                          </>
                        )}
                        {commandType === 'get' && (
                          <>
                            <span className="mr-2">📄</span> Get text from page:
                          </>
                        )}
                      </h4>

                      {!showPositionControls && (
                        <p className="text-xs text-gray-600 mt-2">
                          Found {suggestions.length} matching elements
                          {suggestions.some(s => s.isDuplicate) && 
                            " (highlighted items have duplicate names)"}
                          {lastClickCoordinates && " (ordered by proximity to last click)"}
                          <br />
                          💡 Click on an element to fine-tune its position if needed
                        </p>
                      )}


                      {/* Position Controls */}
                      {/* {showPositionControls && <PositionControls />} */}

                    </div>

                    {suggestions.length === 0 ? (
                      <div className="p-4 text-center">
                        <div className="text-red-600 font-medium mb-2 flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          No element data available
                        </div>
                        <p className="text-sm text-gray-700">
                          Please check your network connection and try again.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {suggestions.map((suggestion, index) => (
                          <li 
                            key={`modal-${suggestion.id}-${index}`}
                            className={`modal-suggestion-item p-3 hover:bg-purple-50 cursor-pointer focus:bg-purple-100 focus:outline-none transition-colors duration-150 ${
                              suggestion.usageInfo === 'Last executed element' ? 'bg-green-100 border-l-4 border-green-500' : 
                              suggestion.usageInfo === 'Likely last executed element' ? 'bg-green-50 border-l-4 border-green-400' :
                              suggestion.usageInfo === 'Near last click' ? 'bg-blue-50 border-l-4 border-blue-300' :
                              suggestion.usageInfo ? 'bg-green-50 border-l-4 border-green-300' : 
                              suggestion.proximityToLastClick === 'very-close' ? 'bg-blue-50 border-l-2 border-blue-300' :
                              suggestion.proximityToLastClick === 'close' ? 'bg-blue-50 border-l-1 border-blue-200' :
                              suggestion.isDuplicate ? 'border-l-4 border-yellow-400' : ''
                            }`}
                            tabIndex={0}
                            onClick={() => handleSuggestionClick(suggestion)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSuggestionSelect(suggestion);
                              } else if (e.key === 'ArrowDown' && index < suggestions.length - 1) {
                                e.preventDefault();
                                document.querySelectorAll('.suggestion-item')[index + 1].focus();
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                if (index > 0) {
                                  document.querySelectorAll('.suggestion-item')[index - 1].focus();
                                } else {
                                  inputRef.current.focus();
                                }
                              } else if (e.key === 'Escape') {
                                setShowSuggestions(false);
                                inputRef.current.focus();
                              }
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {suggestion.displayName || suggestion.name}
                                {suggestion.usageInfo && (
                                  <span className={`ml-2 text-xs font-semibold ${
                                    suggestion.usageInfo === 'Last executed element' ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded-full' :
                                    suggestion.usageInfo === 'Likely last executed element' ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded-full' :
                                    suggestion.usageInfo === 'Near last click' ? 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full' :
                                    'text-green-600'
                                  }`}>
                                    ({suggestion.usageInfo})
                                  </span>
                                )}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSuggestionSelect(suggestion);
                                }}
                                >
                                  🎯 Adjust
                                </span>

                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  suggestion.type === 'button' || suggestion.tag === 'button' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : suggestion.type === 'input' || suggestion.tag === 'input'
                                      ? 'bg-green-100 text-green-700'
                                      : suggestion.type === 'link' || suggestion.tag === 'a'
                                      ? 'bg-purple-100 text-purple-700'
                                      : suggestion.type === 'text'
                                      ? 'bg-gray-100 text-gray-700'
                                      : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {suggestion.type || suggestion.tag || "Element"}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-600 mt-2 flex items-center gap-3">
                              <span>Position: x:{Math.round(suggestion.click_point[0])}, y:{Math.round(suggestion.click_point[1])}</span>
                              {suggestion.isDuplicate && !suggestion.usageInfo && (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                  Multiple matches
                                </span>
                              )}
                              {suggestion.proximityToLastClick === 'very-close' && !suggestion.usageInfo && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  Near last click
                                </span>
                              )}
                            </div>
                            
                            {suggestion.text && (
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                Text: "{suggestion.text.substring(0, 30)}{suggestion.text.length > 30 ? '...' : ''}"
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between">
            <button 
              onClick={onSkip} 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip Step
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editableStep.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    {showPositionControls && <PositionControls />}
    </>
  );
};

  return ( 
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-4 md:p-6">
          {/* Test Case Info Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-purple-700">WebRecord:{testCaseInfo.testcase_name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs">
                    Type: {testCaseInfo.testcase_type}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                    Priority: {testCaseInfo.testcase_priority}
                  </span>
                  {testCaseInfo.platform === 'Mobile' && (
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium ${
                      deviceConnected 
                        ? 'bg-green-100 text-green-800' 
                        : connectionLoading
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {connectionLoading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : deviceConnected ? (
                        <>
                          <Wifi className="w-4 h-4" />
                          Connected
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-4 h-4" />
                          Not Connected
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Right side - Project and Platform info */}
              <div className="flex flex-col items-end gap-2 ml-auto">
                <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                  <Tag className="w-4 h-4" />
                  {testCaseInfo.project_type}
                </span>

                <span className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium ${
                  testCaseInfo.platform === 'Mobile' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {testCaseInfo.platform === 'Mobile' 
                    ? <>
                        <Smartphone className="w-4 h-4" />
                        Mobile (Chrome Only)
                      </>
                    : <>
                        <MonitorSmartphone className="w-4 h-4" />
                        {testCaseInfo.platform}
                      </>
                  }
                </span>
              </div>
            </div>
          </div>
          
          {loadingMessage && <LoadingIndicator message={loadingMessage} />}
          
          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Panel - Test Steps */}
            <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Test Steps</h2>
                <div className="flex gap-2">
                  <button
                    onClick={clearSession}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                  <button
                    onClick={createTestCase}
                    disabled={testSteps.length === 0 || createTestCaseLoading}
                    className="flex items-center gap-1 px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm transition-colors duration-200"
                  >
                    {createTestCaseLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {createTestCaseLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>

              <div ref={stepsRef} className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 280px)" }}>
                <div className="space-y-3">
                  {testSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`p-3 bg-white rounded-lg shadow-sm border-l-4 transition-all duration-300 ${
                        step.status === 'complete' ? 'border-green-500' :
                        step.status === 'error' ? 'border-red-500' :
                        'border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-medium">Step {index + 1}</h3>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-600">{step.duration}</span>
                          {step.status === 'complete' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {step.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{step.description}</p>
                      {step.elementClicked && (
                        <div className="mt-1 text-xs text-blue-600">
                          Clicked element: {step.elementClicked.name} at x:{step.elementClicked.click_point[0]}, y:{step.elementClicked.click_point[1]}
                        </div>
                      )}
                      {step.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs animate-appear">
                          <div className="font-medium">Error:</div>
                          <div>{step.error}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {testSteps.length === 0 && !isProcessing && (
                    <div className="text-center p-8 text-gray-400">
                      No steps added yet. Enter a command below to begin.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex flex-col gap-2 relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      ref={inputRef}
                      value={newStep}
                      onChange={(e) => setNewStep(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          // addTestStep();
                        } else if (e.key === 'Escape') {
                          setShowSuggestions(false);
                        } else if (e.key === 'ArrowDown' && showSuggestions && suggestions.length > 0) {
                          e.preventDefault();
                          document.querySelector('.suggestion-item').focus();
                        }
                      }}
                      placeholder="Enter command (e.g., 'open https://example.com' or 'Click login')"
                      disabled={isProcessing}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50 text-sm transition-all duration-200"
                    />
                    <button
                      // onClick={addTestStep}
                      disabled={isProcessing || !newStep.trim()}
                      className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors duration-200"
                    >
                      {isProcessing ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Right Panel - Test Execution Timeline */}
            <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Test Execution Timeline</h2>
              <button 
                onClick={() => setInstructionModalOpen(true)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-purple-600 transition-colors duration-200"
                title="View Instructions"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
              
              <div ref={previewRef} className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
                <div className="space-y-5">
                  {testSteps.length === 0 ? (
                    <div className="text-center text-gray-500 py-16">
                      Enter a URL to begin testing.
                    </div>
                  ) : (
                    testSteps.map((step, index) => (
                      <div key={step.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">

                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">Step {index + 1}</h3>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600">{step.duration}</span>
                            {step.status === 'complete' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {step.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3 text-sm">{step.description}</p>

                        
                        {step.status === 'complete' && step.screenshot && (
                          <div className="relative">
                            <img
                              src={step.screenshot}
                              alt={`Step ${index + 1}`}
                              className="w-full rounded-lg border border-gray-200 cursor-pointer"
                              onClick={() => setFullScreenImage(step.screenshot)}
                            />
                            <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                              Screenshot {index + 1}
                            </div>
                          </div>
                        )}

                        {step.message && (
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Status:</span> {step.message}
                          </p>
                        )}

                        {/* OTP Display Section - Only for OTP steps */}
                        {isStepWaitingForOtp(step) && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <span className="text-blue-600 mr-2">
                                  {step.otpType === 'phone' ? '📱' : '📧'}
                                </span>
                                <span className="font-medium text-blue-800">
                                  {step.otpType === 'phone' ? 'Phone' : 'Email'} OTP
                                </span>
                              </div>
                              {step.otpReceived && (
                                <button
                                  onClick={() => copyToClipboard(step.otpValue)}
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs transition-colors"
                                  title="Copy OTP"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  Copy
                                </button>
                              )}
                            </div>
                            
                            {otpCheckLoadingStepId === step.id ? (
                              <div className="flex items-center text-blue-600">
                                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                </svg>
                                <span className="text-sm font-medium">Checking OTP Verification...</span>
                              </div>
                            ) : step.otpReceived ? (
                              <div className="bg-white p-2 rounded border border-blue-200">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-lg font-bold text-green-600">
                                    {step.otpValue}
                                  </span>
                                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                    ✓ Received
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                <div className="flex items-center text-yellow-700">
                                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                  </svg>
                                  <span className="text-sm">Please send OTP to continue</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Verification result display */}
                        {step.description.toLowerCase().startsWith('verify') && step.status === 'complete' && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                            <div className="flex items-center text-green-600 mb-2">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              <span className="font-medium">Verification passed</span>
                            </div>
                            <p className="text-sm text-gray-700">
                              Successfully verified {step.verificationType === 'link' ? 'link' : 'text'}: 
                              "{step.selectedElement?.displayName || step.selectedElement?.name || 'Element'}"
                            </p>
                            {step.verifiedText && (
                              <p className="text-xs text-gray-600 mt-1">
                                Actual content: "{step.verifiedText.substring(0, 50)}{step.verifiedText.length > 50 ? '...' : ''}"
                              </p>
                            )}
                            {step.selectedElement && (
                              <div className="mt-2 text-xs text-gray-500">
                                <span className="font-medium">Element location:</span> x:{Math.round(step.selectedElement.click_point[0])}, y:{Math.round(step.selectedElement.click_point[1])}
                              </div>
                            )}
                          </div>
                        )}

                        {step.status === 'error' && (
                          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center text-red-600 mb-2">
                              <XCircle className="w-5 h-5 mr-2" />
                              <span className="font-medium">Error occurred</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{step.error || "Failed to execute command. Please try again."}</p>
                            
                            <div className="mt-3 text-xs text-gray-500">
                              <p className="font-medium">Troubleshooting tips:</p>
                              <ul className="list-disc pl-4 mt-1 space-y-1">
                                <li>Check your internet connection</li>
                                <li>Verify the URL is correct and accessible</li>
                                <li>Try using a different command</li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {step.description.toLowerCase().startsWith('verify') && step.status === 'error' && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                            <div className="flex items-center text-red-600 mb-2">
                              <XCircle className="w-5 h-5 mr-2" />
                              <span className="font-medium">Verification failed</span>
                            </div>
                            <p className="text-sm text-gray-700">
                              Failed to verify {step.verificationType || 'text'}: "{step.selectedElement?.name || 'Element'}"
                            </p>
                            {step.error && (
                              <p className="text-xs text-red-600 mt-1">{step.error}</p>
                            )}
                          </div>
                        )}

                        {/* Get result display */}
                        {step.description.toLowerCase().startsWith('get') && step.status === 'complete' && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex items-center text-green-600 mb-2">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              <span className="font-medium">Retrieved element text</span>
                            </div>
                            <p className="text-sm text-gray-700">
                              Successfully retrieved text from: 
                              "{step.selectedElement?.displayName || step.selectedElement?.name || 'Element'}"
                            </p>
                            {step.retrievedText && (
                              <p className="text-xs text-gray-600 mt-1">
                                Text content: "{step.retrievedText.substring(0, 50)}{step.retrievedText.length > 50 ? '...' : ''}"
                              </p>
                            )}
                            {step.selectedElement && (
                              <div className="mt-2 text-xs text-gray-500">
                                <span className="font-medium">Element location:</span> x:{Math.round(step.selectedElement.click_point[0])}, y:{Math.round(step.selectedElement.click_point[1])}
                              </div>
                            )}
                          </div>
                        )}

                        {step.elementClicked && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                              <p className="text-xs text-blue-700 font-medium">
                                  Element details: {step.elementClicked.displayName || step.elementClicked.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                  Position: x:{step.elementClicked.click_point[0]}, y:{step.elementClicked.click_point[1]}
                              </p>
                              {previouslySelectedElements[step.elementClicked.name?.toLowerCase()] && (
                                  <p className="text-xs text-green-600 mt-1">
                                      Used {previouslySelectedElements[step.elementClicked.name.toLowerCase()].count} time(s)
                                  </p>
                              )}
                          </div>
                        )}

                      </div>
                    ))
                  )}

                </div>
                <ImageModal />
                <VerificationConfirmation
                  isOpen={verificationModal.isOpen}
                  onClose={() => setVerificationModal({...verificationModal, isOpen: false})}
                  onConfirm={handleVerificationConfirm}
                  textToVerify={verificationModal.textToVerify}
                  matchingElements={verificationModal.matchingElements}
                />
                <SecondaryVerificationConfirmation
                  isOpen={secondaryVerification.isOpen}
                  onClose={() => setSecondaryVerification({isOpen: false, stepObj: null})}
                  onConfirm={handleFinalVerificationConfirm}
                  stepObj={secondaryVerification.stepObj}
                />
                <InstructionModal 
                  isOpen={instructionModalOpen}
                  onClose={() => setInstructionModalOpen(false)}
                />
                <WaitModal
                  isOpen={waitModalOpen}
                  onClose={() => setWaitModalOpen(false)}
                  onConfirm={handleWaitConfirm}
                />
                <ConnectDeviceModal />  
              </div>
            </div>

            <ElementSelectionModal />
            <OtpReplacementModal
              isOpen={otpReplacementModal.isOpen}
              onClose={() => setOtpReplacementModal({ isOpen: false, step: null, fetchedOtp: '', stepIndex: null })}
              onConfirm={handleOtpReplaceConfirm}
              otpStep={otpReplacementModal.step}
              fetchedOtp={otpReplacementModal.fetchedOtp}
              stepIndex={otpReplacementModal.stepIndex}
            />
            <EditStepModal
              isOpen={editStepModal.isOpen}
              onClose={() => setEditStepModal({
                isOpen: false,
                step: null,
                errorMessage: '',
                currentPageData: null,
                stepIndex: null,
                suggestions: [],
                currentEditText: ''
              })}
              onSave={(newStepDescription, selectedElementData) => {
                // console.log("🔧 EditModal onSave called:");
                // console.log("  - New description:", newStepDescription);
                // console.log("  - Selected element:", selectedElementData);
                
                const updatedStep = {
                  ...editStepModal.step,
                  description: newStepDescription,
                  // ✅ CRITICAL: Add the selected element and coordinates
                  selectedElement: selectedElementData,
                  coordinates: selectedElementData?.coordinates || selectedElementData?.click_point
                };
                
                console.log("🔧 Updated step with element:", updatedStep);
                
                if (selectedElementData) {
                  const elementKey = `${selectedElementData.name || selectedElementData.displayName}_${editStepModal.stepIndex}`;
                  setPreviouslySelectedElements(prev => ({
                    ...prev,
                    [elementKey]: {
                      element: selectedElementData,
                      stepIndex: editStepModal.stepIndex,
                      timestamp: Date.now()
                    }
                  }));

                  if (selectedElementData.click_point) {
                    setLastClickCoordinates(selectedElementData.click_point);
                  }
                }
                
                handleEditStep(updatedStep);
              }}
              onSkip={handleSkipStep}
              step={editStepModal.step}
              errorMessage={editStepModal.errorMessage}
              onEditTextChange={(text) => setEditStepModal(prev => ({
                ...prev, 
                currentEditText: text
              }))}
              elementData={elementData}
              testSteps={testSteps}
              previouslySelectedElements={previouslySelectedElements}
              testData={testData}
              // isTestDataLoading={isTestDataLoading}
              currentScreenshot={editStepModal.currentScreenshot}
            />

          </div>
        </div>
      </div>
    </div>
  );
};

export default MobilePrompt;