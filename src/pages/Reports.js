import React, { useState, useEffect } from "react";
import { FaSearch, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { Calendar, BarChart2, Download, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [activeTab, setActiveTab] = useState("suites");
  const [timeRange, setTimeRange] = useState("last7days");
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState({
    totalRuns: 0,
    passRate: 0,
    failRate: 0,
    pendingRate: 0
  });

  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [showTestCaseDetails, setShowTestCaseDetails] = useState(false);
  const [testCaseSteps, setTestCaseSteps] = useState([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setLoading(false);
      return;
    }

    const savedProjectKey = `selectedProject_${userId}`;
    const savedProject = localStorage.getItem(savedProjectKey);

    if (savedProject) {
      try {
        const project = JSON.parse(savedProject);
        setSelectedProject(project);
      } catch (err) {
        console.error("Error parsing saved project:", err);
        localStorage.removeItem(savedProjectKey);
      }
    }

    const handleProjectChange = (event) => {
      const newProject = event.detail;
      setSelectedProject(newProject);
    };

    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, []);

const fetchTestResults = React.useCallback(async () => {
  setLoading(true);
  try {
    const userId = localStorage.getItem("userId");
    if (!userId || !selectedProject?.project_name) {
      setTestResults([]);
      setStats({ totalRuns: 0, passRate: 0, failRate: 0, pendingRate: 0 });
      setLoading(false);
      return;
    }

    // ✅ Both Test Suites and Test Cases use localStorage
    const localStorageKey = activeTab === "suites" ? 'testSuiteResults' : 'testCaseResults';
    const localData = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
    console.log(`📦 ${activeTab} localStorage data:`, localData);

    const dateFilteredData = localData.filter(item => {
      const itemDate = new Date(item.execution_date).toISOString().split('T')[0];
      return itemDate >= dateRange.from && itemDate <= dateRange.to;
    });

    let projectFilteredData = dateFilteredData;

    if (selectedProject) {
      projectFilteredData = dateFilteredData.filter(item => {
        const selectedProjectName = selectedProject.project_name || selectedProject.folder_name;
        const itemProjectName = item.project_name || item.name || item.project_id;
        
        if (selectedProjectName && itemProjectName) {
          return selectedProjectName.toLowerCase() === itemProjectName.toLowerCase();
        }
        return true;
      });
    }

    const sortedData = projectFilteredData.sort((a, b) => 
      new Date(b.execution_date) - new Date(a.execution_date)
    );

    console.log("🔍 Final sorted data for display:", sortedData); 
    console.log("🔍 First item structure:", sortedData[0]);

    setTestResults(sortedData);
    calculateStats(sortedData);
    
  } catch (error) {
    console.error(`Error fetching ${activeTab} results:`, error);
    setTestResults([]);
    setStats({ totalRuns: 0, passRate: 0, failRate: 0, pendingRate: 0 });
  } finally {
    setLoading(false);
  }
}, [activeTab, dateRange, selectedProject]);

  useEffect(() => {
    if (!selectedProject?.project_name) {
      setLoading(false);
      return;
    }

    fetchTestResults();
  }, [selectedProject, activeTab, timeRange, dateRange, fetchTestResults]);

const fetchTestCaseDetails = async (testCaseName) => {
  try {
    const userId = localStorage.getItem("userId");
    const response = await fetch(`http://127.0.0.1:8000/integrate/case_report/?user_id=${userId}&project_name=${selectedProject.project_name}&testcase_name=${testCaseName}`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("test case info:", data)
      setTestCaseSteps(data.steps || []); 
      setSelectedTestCase(testCaseName);
      setShowTestCaseDetails(true);
    }
  } catch (error) {
    console.error('Error fetching test case details:', error);
  }
};

  const calculateStats = (data) => {
    if (!data.length) {
      setStats({
        totalRuns: 0,
        passRate: 0,
        failRate: 0,
        pendingRate: 0
      });
      return;
    }

    const totalRuns = data.length;
    const passCount = data.filter(item => 
      item.status === "PASS" || item.status === "passed"
    ).length;
    const failCount = data.filter(item => 
      item.status === "FAIL" || item.status === "failed"
    ).length;
    const pendingCount = data.filter(item => 
      item.status === "PENDING" || item.status === "pending"
    ).length;

    setStats({
      totalRuns,
      passRate: Math.round((passCount / totalRuns) * 100),
      failRate: Math.round((failCount / totalRuns) * 100),
      pendingRate: Math.round((pendingCount / totalRuns) * 100)
    });
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    const today = new Date();
    let fromDate;

    switch (range) {
      case "today":
        fromDate = new Date(today);
        break;
      case "last7days":
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 7);
        break;
      case "last30days":
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 30);
        break;
      case "last90days":
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 90);
        break;
      default:
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 7);
    }

    setDateRange({
      from: fromDate.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    });
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
    setTimeRange("custom");
  };

const handleExportReport = async () => {
  if (!testResults.length) {
    alert("No results to export");
    return;
  }

  const doc = new jsPDF();
  const purpleColor = [147, 51, 234];
  const lightPurple = [237, 233, 254];
  const darkPurple = [88, 28, 135];
  
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  const checkPageBreak = (requiredSpace = 30) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  doc.setFillColor(...purpleColor);
  doc.rect(10, 10, pageWidth - 20, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Test Execution Report', pageWidth / 2, 20, { align: 'center' });
  
  yPosition = 35;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Project: ${selectedProject?.project_name || 'N/A'}`, 15, yPosition);
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 15, yPosition + 5);
  doc.text(`Total Test Cases: ${testResults.length}`, 15, yPosition + 10);
  
  yPosition += 25;

  checkPageBreak(40);
  doc.setFillColor(...lightPurple);
  doc.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
  doc.setTextColor(...darkPurple);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Execution Summary', 15, yPosition);
  
  yPosition += 15;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  
  const totalPassed = testResults.reduce((sum, result) => sum + (result.passed_steps || 0), 0);
  const totalFailed = testResults.reduce((sum, result) => sum + (result.failed_steps || 0), 0);
  const totalSteps = testResults.reduce((sum, result) => sum + (result.total_steps || 0), 0);
  const passRate = totalSteps > 0 ? ((totalPassed / totalSteps) * 100).toFixed(1) : 0;
  
  doc.text(`Total Steps: ${totalSteps}`, 15, yPosition);
  doc.text(`Passed: ${totalPassed}`, 80, yPosition);
  doc.text(`Failed: ${totalFailed}`, 130, yPosition);
  doc.text(`Pass Rate: ${passRate}%`, 180, yPosition);
  
  yPosition += 20;

  for (let i = 0; i < testResults.length; i++) {
    const testCase = testResults[i];
    
    checkPageBreak(50);
    
    doc.setFillColor(...purpleColor);
    doc.rect(10, yPosition - 5, pageWidth - 20, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`Test Case: ${testCase.name}`, 15, yPosition + 2);
    
    const statusColor = testCase.status === 'PASS' ? [34, 197, 94] : testCase.status === 'FAIL' ? [239, 68, 68] : [251, 191, 36];
    doc.setFillColor(...statusColor);
    doc.rect(pageWidth - 50, yPosition - 3, 35, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(testCase.status, pageWidth - 32, yPosition + 1, { align: 'center' });
    
    yPosition += 15;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    
    const summaryData = [
      ['Execution Date:', new Date(testCase.execution_date).toLocaleString()],
      ['Total Steps:', testCase.total_steps || 0],
      ['Passed Steps:', testCase.passed_steps || 0],
      ['Failed Steps:', testCase.failed_steps || 0],
      ['Healed Steps:', testCase.healed_steps || 0],
      ['Execution Time:', testCase.execution_time || 'N/A']
    ];
    
    const baseY = yPosition;
    summaryData.forEach((item, index) => {
      const x = 15 + (index % 2) * 95;
      const y = baseY + Math.floor(index / 2) * 5;
      doc.setFont(undefined, 'bold');
      doc.text(item[0], x, y);
      doc.setFont(undefined, 'normal');
      doc.text(String(item[1]), x + 25, y);
    });
    
    yPosition += 20;

    try {
      const userId = localStorage.getItem("userId");
      const response = await fetch(`http://127.0.0.1:8000/integrate/case_report/?user_id=${userId}&project_name=${selectedProject.project_name}&testcase_name=${testCase.name}`);
      
      if (response.ok) {
        const stepData = await response.json();
        const steps = stepData.steps || [];
        
        if (steps.length > 0) {
          checkPageBreak(30);
          
          doc.setFillColor(...lightPurple);
          doc.rect(10, yPosition - 2, pageWidth - 20, 6, 'F');
          doc.setTextColor(...darkPurple);
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.text('Test Steps Details', 15, yPosition + 2);
          
          yPosition += 12;
          
          const stepHeaders = ['#', 'Command', 'Duration', 'Status', 'Healed'];
          const stepRows = steps.map(step => [
            step.step_number || '',
            (step.command || step.step_description || '').substring(0, 25) + ((step.command || '').length > 25 ? '...' : ''),
            step.duration || 'N/A',
            step.result || 'N/A',
            step.healed ? 'Yes' : 'No'
          ]);
          
          autoTable(doc, {
            head: [stepHeaders],
            body: stepRows,
            startY: yPosition,
            margin: { left: 10, right: 10 },
            tableWidth: 'auto',
            styles: { 
              fontSize: 7,
              cellPadding: 2,
              overflow: 'linebreak',
              cellWidth: 'wrap'
            },
            headStyles: { 
              fillColor: purpleColor,
              textColor: [255, 255, 255],
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252]
            },
            columnStyles: {
              0: { cellWidth: 8 },
              1: { cellWidth: 45 },
              2: { cellWidth: 15 },
              3: { cellWidth: 15 },
              4: { cellWidth: 10 }
            }
          });
          
          yPosition = doc.lastAutoTable.finalY + 15;
        }
      }
    } catch (error) {
      console.error(`Error fetching steps for ${testCase.name}:`, error);
      
      doc.setTextColor(239, 68, 68);
      doc.setFontSize(8);
      doc.text('Error loading step details', 15, yPosition);
      yPosition += 10;
    }
    
    if (i < testResults.length - 1) {
      checkPageBreak(15);
      doc.setDrawColor(200, 200, 200);
      doc.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 10;
    }
  }
  
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
    doc.text(`Generated by TesterAlly - ${new Date().toLocaleDateString()}`, 15, pageHeight - 10);
  }

  const filename = `test-cases-detailed-report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusIcon = (status) => {
    // Normalize status values
    const normalizedStatus = status?.toUpperCase();
    
    switch (normalizedStatus) {
      case "PASS":
      case "PASSED":
        return <FaCheckCircle className="text-green-500" />;
      case "FAIL":
      case "FAILED":
        return <FaTimesCircle className="text-red-500" />;
      case "PENDING":
        return <FaExclamationTriangle className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    const normalizedStatus = status?.toUpperCase();
    
    switch (normalizedStatus) {
      case "PASS":
      case "PASSED":
        return "text-green-700";
      case "FAIL":
      case "FAILED":
        return "text-red-700";
      case "PENDING":
        return "text-yellow-700";
      default:
        return "text-gray-700";
    }
  };

  console.log("🔍 testResults before filtering:", testResults);
  console.log("🔍 First result:", testResults[0]);
  console.log("🔍 First result name type:", typeof testResults[0]?.name);
  console.log("🔍 First result name value:", testResults[0]?.name);

  const filteredResults = testResults.filter(result => {
    const resultName = String(result.name || result.title || '');
    const searchTermLower = searchTerm.toLowerCase();
    return resultName.toLowerCase().includes(searchTermLower);
  });

  const renderSuiteResults = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Test Suite
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Execution Date
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Test Cases
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Pass/Fail
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Execution Time
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredResults.map((result, idx) => (
          <tr key={result.id || idx} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {result.name|| result.title }
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {formatDate(result.execution_date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                {getStatusIcon(result.status)}
                <span className={`ml-2 text-sm ${getStatusClass(result.status)}`}>
                  {result.status?.toUpperCase()}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {result.total_testcases || 0}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <span className="text-green-600 font-medium">{result.passed_testcases || 0}</span>
              {" / "}
              <span className="text-red-600 font-medium">{result.failed_testcases || 0}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {result.execution_time ? `${result.execution_time}s` : "N/A"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderTestCaseResults = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Test Case
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Execution Date
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Test Steps
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Pass/Fail
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Execution Time
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredResults.map((result, idx) => (
          <tr key={result.id || idx} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              <button 
                onClick={() => fetchTestCaseDetails(result.name || result.test_name)}
                className="text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
              >
                {result.name || result.test_name || 'Unnamed Test'}
              </button>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {formatDate(result.execution_date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                {getStatusIcon(result.status)}
                <span className={`ml-2 text-sm ${getStatusClass(result.status)}`}>
                  {result.status?.toUpperCase()}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {result.total_steps || 0}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <span className="text-green-600 font-medium">{result.passed_steps || 0}</span>
              {" / "}
              <span className="text-red-600 font-medium">{result.failed_steps || 0}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {result.execution_time ? `${result.execution_time}s` : "N/A"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const animateValue = (start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      return value;
    };
    return step;
  };

  const useCounter = (end, duration = 1500) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      let animationFrameId;
      let start = 0;
      let step = animateValue(start, end, duration);
      
      const updateCount = (timestamp) => {
        const value = step(timestamp);
        setCount(value);
        if (value < end) {
          animationFrameId = requestAnimationFrame(updateCount);
        }
      };
      
      animationFrameId = requestAnimationFrame(updateCount);
      return () => cancelAnimationFrame(animationFrameId);
    }, [end, duration]);
    
    return count;
  };

  const animatedTotalRuns = useCounter(stats.totalRuns);
  const animatedPassRate = useCounter(stats.passRate);
  const animatedFailRate = useCounter(stats.failRate);
  const animatedPendingRate = useCounter(stats.pendingRate);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 lg:ml-[300px] transition-all duration-300 lg:max-w-[calc(100%-300px)] sm:ml-[60px] sm:max-w-full">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-center p-4 border-b">
              <div className="flex space-x-4 mb-4 sm:mb-0">
                <button 
                  className={`px-4 py-2 font-medium ${activeTab === "suites" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500 hover:text-purple-600"}`}
                  onClick={() => setActiveTab("suites")}
                >
                  Test Suite Reports
                </button>
                <button 
                  className={`px-4 py-2 font-medium ${activeTab === "cases" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500 hover:text-purple-600"}`}
                  onClick={() => setActiveTab("cases")}
                >
                  Test Case Reports
                </button>
              </div>
              <button
                onClick={handleExportReport}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 lg:mt-0 sm:mt-3"
              >
                <Download className="mr-2 w-4 h-4" />
                Export Report
              </button>
            </div>

            <div className="p-4 flex flex-col lg:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <h2 className="text-lg font-medium text-gray-700">
                {selectedProject ? `${activeTab === "suites" ? "Test Suite" : "Test Case"} Reports` : 'Select a Project'}
              </h2>
              {selectedProject && (
                <div className="relative w-full sm:w-64">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab === "suites" ? "test suites" : "test cases"}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          </div>

          {selectedProject && (
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex flex-wrap mb-4 md:mb-0 gap-2">
                  <button
                    onClick={() => handleTimeRangeChange("today")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      timeRange === "today" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handleTimeRangeChange("last7days")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      timeRange === "last7days" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => handleTimeRangeChange("last30days")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      timeRange === "last30days" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => handleTimeRangeChange("last90days")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      timeRange === "last90days" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Last 90 Days
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      name="from"
                      value={dateRange.from}
                      onChange={handleDateRangeChange}
                      className="px-3 py-1.5 border rounded-md text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">to</span>
                    <input
                      type="date"
                      name="to"
                      value={dateRange.to}
                      onChange={handleDateRangeChange}
                      className="px-3 py-1.5 border rounded-md text-sm"
                    />
                  </div>
                  <button
                    onClick={fetchTestResults}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedProject && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Test Execution Summary</h3>
              </div>
              {/* MODIFIED: Updated to ensure the boxes display in one row with better sizing */}
              <div className="flex flex-row flex-wrap p-4">
                {/* Total Test Runs */}
                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md h-full">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <BarChart2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Trend</span>
                          <span className="text-green-500 text-xs font-medium">↑ 12%</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-medium text-gray-700">Total Test Runs</h4>
                      <div className="flex items-baseline mt-1">
                        <p className="text-2xl font-bold text-gray-900 transition-all duration-1000">
                          {animatedTotalRuns}
                        </p>
                        <span className="ml-1 text-xs text-gray-500">executions</span>
                      </div>
                      <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full rounded-full" style={{ width: '100%', transition: 'width 1s ease-in-out' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pass Rate */}
                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md h-full">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <FaCheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Trend</span>
                          <span className="text-green-500 text-xs font-medium">↑ 5%</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-medium text-gray-700">Pass Rate</h4>
                      <div className="flex items-baseline mt-1">
                        <p className="text-2xl font-bold text-green-600 transition-all duration-1000">
                          {animatedPassRate}%
                        </p>
                        <span className="ml-1 text-xs text-gray-500">success</span>
                      </div>
                      <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: `${stats.passRate}%`, transition: 'width 1s ease-in-out' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fail Rate */}
                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md h-full">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <FaTimesCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Trend</span>
                          <span className="text-red-500 text-xs font-medium">↓ 3%</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-medium text-gray-700">Fail Rate</h4>
                      <div className="flex items-baseline mt-1">
                        <p className="text-2xl font-bold text-red-600 transition-all duration-1000">
                          {animatedFailRate}%
                        </p>
                        <span className="ml-1 text-xs text-gray-500">failures</span>
                      </div>
                      <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: `${stats.failRate}%`, transition: 'width 1s ease-in-out' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Rate */}
                <div className="w-full sm:w-1/2 md:w-1/4 p-2">
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md h-full">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-yellow-100 p-2 rounded-lg">
                          <FaExclamationTriangle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Trend</span>
                          <span className="text-yellow-500 text-xs font-medium">↓ 2%</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-medium text-gray-700">Pending Rate</h4>
                      <div className="flex items-baseline mt-1">
                        <p className="text-2xl font-bold text-yellow-600 transition-all duration-1000">
                          {animatedPendingRate}%
                        </p>
                        <span className="ml-1 text-xs text-gray-500">pending</span>
                      </div>
                      <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${stats.pendingRate}%`, transition: 'width 1s ease-in-out' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
              </div>
            ) : !selectedProject ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-6">
                  <BarChart2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Please select a project from the sidebar to view test results and analytics
                </p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-6">
                  <FaExclamationTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No test results match your current search criteria. Try adjusting your filters or date range.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === "suites" ? renderSuiteResults() : renderTestCaseResults()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Case Details Modal */}
      {showTestCaseDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Test Case: {selectedTestCase}</h3>
              <button onClick={() => setShowTestCaseDetails(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Step</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Command</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th> 
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Healed</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Screenshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {testCaseSteps.map((step, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm">{step.step_number || index + 1}</td>
                      <td className="px-4 py-2 text-sm">{step.command || step.step_description}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className="text-blue-600 font-mono">
                          {step.duration || 'N/A'}
                        </span>
                      </td>

                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${step.healed ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                          {step.healed ? 'Healed' : 'Normal'}
                        </span>
                      </td>
      
                      <td className="px-4 py-2 text-sm">
                        <span className={step.result === 'success' ? 'text-green-600' : 'text-red-600'}>
                          {step.result || 'Not Executed'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {step.screenshot && (
                          <button 
                            onClick={() => {
                              setSelectedScreenshot(`http://127.0.0.1:8000${step.screenshot}`);
                              setShowScreenshotModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            📸 View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Modal */}
      {showScreenshotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Screenshot</h3>
              <button onClick={() => setShowScreenshotModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="p-4 flex justify-center">
              <img 
                src={selectedScreenshot} 
                alt="Step Screenshot" 
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;