/*
import React, { useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const TestEnvironmentConfig = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { testCaseName = "Test Case" } = location.state || {};

  const [selectedOS, setSelectedOS] = useState('');
  const [selectedOSVersion, setSelectedOSVersion] = useState('');
  const [selectedBrowser, setSelectedBrowser] = useState('');
  const [selectedBrowserVersion, setSelectedBrowserVersion] = useState('');
  const [isHeadless, setIsHeadless] = useState(false);
  const [resolution, setResolution] = useState('1024x768');

  const osOptions = ['Windows', 'MacOS', 'Linux'];
  const windowsVersions = ['Windows 11', 'Windows 10', 'Windows 8.1'];
  const browserOptions = ['Chrome', 'Firefox', 'Edge'];
  const browserVersions = ['117', '116', '115', '114'];
  const resolutionOptions = ['1024x768', '1366x768', '1920x1080'];

  const handleExecuteTest = () => {
    console.log('Executing test with:', {
      os: selectedOS,
      osVersion: selectedOSVersion,
      browser: selectedBrowser,
      browserVersion: selectedBrowserVersion,
      isHeadless,
      resolution
    });
  };

  const handleBack = () => {
    navigate(-1); 
  };

  return (
    <div className="flex-1 p-6 min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full ">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Test Case
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Run Test: {testCaseName}
            </h1>

            <div className="grid gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Select Test Machine
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operating System *
                    </label>
                    <select
                      value={selectedOS}
                      onChange={(e) => setSelectedOS(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select OS</option>
                      {osOptions.map((os) => (
                        <option key={os} value={os}>{os}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      OS Version *
                    </label>
                    <select
                      value={selectedOSVersion}
                      onChange={(e) => setSelectedOSVersion(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      disabled={!selectedOS}
                    >
                      <option value="">Select Version</option>
                      {windowsVersions.map((version) => (
                        <option key={version} value={version}>{version}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Browser *
                    </label>
                    <select
                      value={selectedBrowser}
                      onChange={(e) => setSelectedBrowser(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Browser</option>
                      {browserOptions.map((browser) => (
                        <option key={browser} value={browser}>{browser}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Browser Version *
                    </label>
                    <select
                      value={selectedBrowserVersion}
                      onChange={(e) => setSelectedBrowserVersion(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      disabled={!selectedBrowser}
                    >
                      <option value="">Select Version</option>
                      {browserVersions.map((version) => (
                        <option key={version} value={version}>{version}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resolution
                    </label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                      {resolutionOptions.map((res) => (
                        <option key={res} value={res}>{res}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center pt-7">
                    <input
                      type="checkbox"
                      id="headless"
                      checked={isHeadless}
                      onChange={(e) => setIsHeadless(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="headless" className="ml-2 block text-sm text-gray-700">
                      Headless Test
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={handleExecuteTest}
                  disabled={!selectedOS || !selectedOSVersion || !selectedBrowser || !selectedBrowserVersion}
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Execute Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div></div>
  );
};

export default TestEnvironmentConfig;

*/

import React, { useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const TestEnvironmentConfig = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { testCaseName, steps } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExecuteTest = () => {
    try {
      setLoading(true);
      setError(null);
  
      const firstStep = steps?.[0];
      if (!firstStep?.step_description) {
        throw new Error("No URL found in test steps");
      }
  
      let url = firstStep.step_description.trim();
  
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
  
      try {
        new URL(url);
        window.open(url, "_blank");
      } catch (urlError) {
        throw new Error("Invalid URL in test step");
      }
    } catch (err) {
      console.error("Error executing test:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="flex-1 p-6 min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Test Steps
          </button>

          <div className="bg-white shadow-md rounded-lg">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Run Test: {testCaseName}
              </h1>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid gap-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Test Environment
                  </h2>

                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Browser
                      </label>
                      <input 
                        type="text" 
                        value="Chrome" 
                        disabled 
                        className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Operating System
                      </label>
                      <input 
                        type="text" 
                        value="Windows" 
                        disabled 
                        className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={handleExecuteTest}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {loading ? 'Opening URL...' : 'Execute Test'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEnvironmentConfig;