import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { FaEdit, FaTrashAlt, FaSearch } from 'react-icons/fa';

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch('https://api.testerally.ai/api/admin/projects/')
      .then((response) => response.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((error) => {
        setError("Failed to fetch projects. Please try again.");
        setLoading(false);
      });
  }, []);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id) => {
    // Handle delete functionality here
    alert(`Project with ID ${id} deleted (functionality to be implemented).`);
  };

  return (
    <div className="flex bg-[rgb(237,235,254)] min-h-screen">
      <AdminSidebar />
      <div className="dashboard-container flex-1 p-6" style={{ backgroundColor: "rgb(237 235 254 / 1)" }}>
        <h1 className="text-4xl font-bold text-[rgb(126,58,242)] mb-5 text-center">
          Projects Management
        </h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" style={{ borderColor: "rgb(126, 58, 242) transparent" }}></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-[rgb(126,58,242)] text-white">
                    <th className="py-2 px-4 border">Project ID</th>
                    <th className="py-2 px-4 border">Name</th>
                    <th className="py-2 px-4 border">Description</th>
                    <th className="py-2 px-4 border">Type</th>
                    <th className="py-2 px-4 border">User ID</th>
                    <th className="py-2 px-4 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <tr
                        key={project.id}
                        className="text-center border hover:bg-gray-100 transition-colors"
                      >
                        <td className="py-2 px-4 border">{project.project_id}</td>
                        <td className="py-2 px-4 border">{project.name}</td>
                        <td className="py-2 px-4 border">{project.description}</td>
                        <td className="py-2 px-4 border">{project.project_type}</td>
                        <td className="py-2 px-4 border">{project.user_id}</td>
                        <td className="py-2 px-4 border space-x-2">
                          <button
                            onClick={() => alert("Edit functionality to be implemented.")}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-gray-600">
                        No projects found.
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
