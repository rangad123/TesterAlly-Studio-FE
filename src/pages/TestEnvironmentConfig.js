/*
import React, { useState, useMemo, useEffect } from 'react';
import { X, Play } from 'lucide-react';

const TestEnvironmentModal = ({ isOpen, onClose, onExecute, testCaseName, testCaseId, steps, projectId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [os, setOs] = useState("windows");
  const [browser, setBrowser] = useState("chrome");

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const osOptions = useMemo(() => ({
    windows: { name: "Windows", browsers: ["chrome", "firefox", "edge"] },
    macos: { name: "macOS", browsers: ["chrome", "firefox", "safari"] },
    linux: { name: "Linux", browsers: ["chrome", "firefox"] },
  }), []);

  const executeTest = async () => {
    try {
      setLoading(true);
      setError(null);

      const requestBody = {
        os,
        browser,
        testCaseId,
        projectId,
        steps
      };

      const response = await fetch('http://127.0.0.1:8000/api/execute-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to execute test');
      }

      const data = await response.json();
      console.log('Test execution response:', data);

      onClose();
      onExecute?.(data);
    } catch (err) {
      console.error('Error executing test:', err);
      setError(err.message || 'Failed to execute test. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Execute Test: {testCaseName}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-sm hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="p-3 mb-4 text-sm bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Operating System
              </label>
              <select
                value={os}
                onChange={(e) => setOs(e.target.value)}
                className="mt-1 w-full p-2 bg-white border border-gray-300 rounded-md"
              >
                {Object.entries(osOptions).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Browser
              </label>
              <select
                value={browser}
                onChange={(e) => setBrowser(e.target.value)}
                className="mt-1 w-full p-2 bg-white border border-gray-300 rounded-md"
              >
                {osOptions[os].browsers.map((browserOption) => (
                  <option key={browserOption} value={browserOption}>
                    {browserOption.charAt(0).toUpperCase() + browserOption.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={executeTest}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-purple-400"
            >
              <Play className="w-4 h-4 mr-2" />
              {loading ? "Executing..." : "Execute Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEnvironmentModal;





*/


import React, { useState, useMemo, useEffect } from 'react';
import { X, Play } from 'lucide-react';

const TestEnvironmentModal = ({ isOpen, onClose, onExecute, testCaseName, testCaseId, steps, projectId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [os, setOs] = useState("windows");
  const [browser, setBrowser] = useState("chrome");
  const [testUrl, setTestUrl] = useState(null);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  useEffect(() => {
    const fetchTestUrl = async () => {
      if (!isOpen || !projectId) return;
      
      try {
        const response = await fetch(`https://api.testerally.ai/api/testdata/${projectId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch test URL');
        }
        const data = await response.json();
        setTestUrl(data.url); 
      } catch (err) {
        console.error('Error fetching test URL:', err);
        setError('Failed to fetch test configuration. Please try again.');
      }
    };

    fetchTestUrl();
  }, [isOpen, projectId]);

  const osOptions = useMemo(() => ({
    windows: { name: "Windows", browsers: ["chrome", "firefox", "edge"] },
    macos: { name: "macOS", browsers: ["chrome", "firefox", "safari"] },
    linux: { name: "Linux", browsers: ["chrome", "firefox"] },
  }), []);

  const executeTest = async () => {
    if (!testUrl) {
      setError('Test URL not available. Please try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestBody = {
        os,
        browser,
        testCaseId,
        projectId,
        steps,
        url: testUrl 
      };
 
      console.log(requestBody);
      

      const response = await fetch('http://127.0.0.1:8000/api/execute-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to execute test');
      }

      const data = await response.json();
      console.log('Test execution response:', data);

      onClose();
      onExecute?.(data);
    } catch (err) {
      console.error('Error executing test:', err);
      setError(err.message || 'Failed to execute test. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Execute Test: {testCaseName}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-sm hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="p-3 mb-4 text-sm bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Operating System
              </label>
              <select
                value={os}
                onChange={(e) => setOs(e.target.value)}
                className="mt-1 w-full p-2 bg-white border border-gray-300 rounded-md"
              >
                {Object.entries(osOptions).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Browser
              </label>
              <select
                value={browser}
                onChange={(e) => setBrowser(e.target.value)}
                className="mt-1 w-full p-2 bg-white border border-gray-300 rounded-md"
              >
                {osOptions[os].browsers.map((browserOption) => (
                  <option key={browserOption} value={browserOption}>
                    {browserOption.charAt(0).toUpperCase() + browserOption.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={executeTest}
              disabled={loading || !testUrl}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-purple-400"
            >
              <Play className="w-4 h-4 mr-2" />
              {loading ? "Executing..." : "Execute Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEnvironmentModal;