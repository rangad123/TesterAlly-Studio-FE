import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { FaEdit, FaTrash, FaSearch } from "react-icons/fa";

export default function AdminTestCases() {
  const [testCases, setTestCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTestCases = async () => {
      try {
        const response = await fetch("https://api.testerally.ai/api/admin/testcases/");
        if (!response.ok) {
          throw new Error("Failed to fetch test cases. Please try again later.");
        }
        const data = await response.json();
        setTestCases(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTestCases();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this test case?")) {
      // Handle delete functionality
      alert(`Test case with ID ${id} deleted successfully.`);
    }
  };

  const handleEdit = (id) => {
    // Handle edit functionality
    alert(`Edit functionality for test case with ID ${id}.`);
  };

  const filteredTestCases = testCases.filter((testCase) =>
    testCase.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="dashboard-container flex-1 p-6" style={{ backgroundColor: "rgb(237 235 254 / 1)" }}>
        <h1 className="text-4xl font-bold text-center mb-6" style={{ color: "rgb(126, 58, 242)" }}>
          Test Case Management
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" style={{ borderColor: "rgb(126, 58, 242) transparent" }}></div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center">{error}</div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Search test cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border">ID</th>
                    <th className="px-4 py-2 border">Name</th>
                    <th className="px-4 py-2 border">URL</th>
                    <th className="px-4 py-2 border">Project ID</th>
                    <th className="px-4 py-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTestCases.length > 0 ? (
                    filteredTestCases.map((testCase) => (
                      <tr key={testCase.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border text-center">{testCase.id}</td>
                        <td className="px-4 py-2 border">{testCase.name}</td>
                        <td className="px-4 py-2 border">{testCase.url}</td>
                        <td className="px-4 py-2 border">{testCase.project_id}</td>
                        <td className="px-4 py-2 border flex justify-center gap-4">
                          <button
                            onClick={() => handleEdit(testCase.id)}
                            className="text-white bg-blue-500 p-2 rounded-md hover:bg-blue-600"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(testCase.id)}
                            className="text-white bg-red-500 p-2 rounded-md hover:bg-red-600"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-gray-600">
                        No test cases found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
