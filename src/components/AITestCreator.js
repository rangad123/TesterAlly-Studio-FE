import React, { useState, useRef } from 'react';
import { CheckCircle, XCircle, Plus, Clock } from 'lucide-react';

const AITestAutomation = () => {
  const [testSteps, setTestSteps] = useState([]);
  const [newStep, setNewStep] = useState('');
  const previewRef = useRef(null);
  const stepsRef = useRef(null);

  const generateScreenshotUrl = (description) => {
    if (description.toLowerCase().includes('google.com')) {
      return '/api/placeholder/800/300?text=Google_Homepage';
    } else if (description.toLowerCase().includes('login')) {
      return '/api/placeholder/800/300?text=Login_Page';
    }
    return `/api/placeholder/800/300?text=Step_${testSteps.length + 1}_Screenshot`;
  };

  const executeStep = async (stepObj) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      ...stepObj,
      status: 'complete',
      duration: '00:' + Math.floor(Math.random() * 60).toString().padStart(2, '0')
    };
  };

  const addTestStep = async () => {
    if (!newStep.trim()) return;
    
    const newStepObj = {
      id: Date.now(),
      description: newStep,
      status: 'pending',
      duration: '00:00',
      screenshot: generateScreenshotUrl(newStep)
    };

    setTestSteps(prev => [...prev, newStepObj]);
    setNewStep('');

    const executedStep = await executeStep(newStepObj);
    setTestSteps(prev => prev.map(step => 
      step.id === executedStep.id ? executedStep : step
    ));


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

  const createTestCase = () => {
    console.log('Test case created:', testSteps);
    alert('Test case created successfully!');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel with Fixed Header and Footer */}
      <div className="w-1/2 flex flex-col border-r border-gray-200">
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">TesterAlly</h1>
            <button
              onClick={createTestCase}
              disabled={testSteps.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
                <Plus className="w-5 h-5" />
              Create
            </button>
          </div>
        </div>

        {/* Scrollable Steps Area */}
        <div 
          ref={stepsRef}
          className="flex-1 overflow-y-auto p-6"
        >
          <div className="space-y-4">
            {testSteps.map((step, index) => (
              <div
                key={step.id}
                className={`p-4 bg-white rounded-lg shadow-sm border-l-4 ${
                  step.status === 'complete' ? 'border-green-500' :
                  step.status === 'error' ? 'border-red-500' :
                  'border-blue-500'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Step {index + 1}</h3>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{step.duration}</span>
                    {step.status === 'complete' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {step.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                </div>
                <p className="text-gray-600 text-left break-words whitespace-normal">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Input Area */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTestStep()}
              placeholder="Add new test step..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <button
              onClick={addTestStep}
              className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Screenshots Timeline */}
      <div className="w-1/2 flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold">Test Execution Timeline</h2>
        </div>
        <div 
          ref={previewRef} 
          className="flex-1 p-6 overflow-y-auto"
        >
          <div className="space-y-6">
            {testSteps.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No steps added yet. Add steps to begin testing.
              </div>
            ) : (
              testSteps.map((step, index) => (
                <div key={step.id} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-lg">Step {index + 1}</h3>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{step.duration}</span>
                      {step.status === 'complete' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {step.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  </div>
                  <p className="text-gray-600 text-left break-words whitespace-normal">{step.description}</p>
                  <div className="relative">
                    <img
                      src={step.screenshot}
                      alt={`Step ${index + 1}`}
                      className="w-full rounded-lg border border-gray-200"
                    />
                    <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                      Screenshot {index + 1}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITestAutomation;