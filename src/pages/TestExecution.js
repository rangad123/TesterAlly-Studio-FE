/*
import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, Camera } from 'lucide-react';

const TestExecution = () => {
  const [steps, setSteps] = useState([]);
  const [testCaseName, setTestCaseName] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [executedSteps, setExecutedSteps] = useState([]);

  useEffect(() => {

    const storedSteps = sessionStorage.getItem('testSteps');
    const storedTestName = sessionStorage.getItem('testCaseName');
    
    if (storedSteps && storedTestName) {
      setSteps(JSON.parse(storedSteps));
      setTestCaseName(storedTestName);
    }
  }, []);

  const captureScreenshot = () => {
    return `/api/placeholder/800/600`;
  };

  const handleNextStep = async () => {
    if (currentStepIndex >= steps.length - 1) return;

    const screenshot = captureScreenshot();
    
    setExecutedSteps([
      ...executedSteps,
      {
        stepNumber: currentStepIndex + 1,
        screenshot,
        timestamp: new Date().toISOString()
      }
    ]);
    
    setCurrentStepIndex(prev => prev + 1);
  };


  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'n' && e.ctrlKey) {
        handleNextStep();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStepIndex, steps]);

  return (
    <div className="flex h-screen">

      <div className="w-[300px] h-full bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">{testCaseName}</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`p-4 border-b border-gray-200 ${
                index === currentStepIndex ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Step {index + 1}</span>
                <span className="text-sm text-gray-500">
                  {index < currentStepIndex ? (
                    <span className="text-green-600 flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Completed
                    </span>
                  ) : index === currentStepIndex ? (
                    'In Progress'
                  ) : (
                    'Pending'
                  )}
                </span>
              </div>
              
              <p className="text-gray-700 mb-2">{step.step_description}</p>
              
              {executedSteps[index] && (
                <div className="relative mt-2">
                  <img
                    src={executedSteps[index].screenshot}
                    alt={`Step ${index + 1} result`}
                    className="w-full rounded-md shadow-sm"
                  />
                  <div className="absolute top-2 right-2">
                    <Camera className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {currentStepIndex < steps.length - 1 && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleNextStep}
              className="w-full py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}
      </div>

      <div className="ml-[300px] flex-1 h-full">
        {steps[0] && (
          <iframe
            src={steps[0].step_description.startsWith('http') 
              ? steps[0].step_description 
              : `https://${steps[0].step_description}`}
            className="w-full h-full border-none"
            title="Test Target"
          />
        )}
      </div>
    </div>
  );
};

export default TestExecution;

*/
