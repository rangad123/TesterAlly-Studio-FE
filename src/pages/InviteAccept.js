import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const InviteAccept = () => {
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE_URL = "https://api.testerally.ai/api";

  useEffect(() => {
    const fetchInvitationDetails = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');

        if (!token) {
          setError("Invalid invitation link");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/invitation-details`, {
          params: { token }
        });

        if (response.data) {
          setInvitation(response.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch invitation details");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [location]);

  const handleAcceptInvite = async () => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');

      const response = await axios.post(`${API_BASE_URL}/accept-invite`, {
        token,
        project_id: invitation.project_id,
        user_id: localStorage.getItem('userId')
      });

      if (response.data.success) {

        localStorage.setItem(`selectedProject_${localStorage.getItem('userId')}`, 
          JSON.stringify(response.data.project)
        );

        navigate('/project-details');
      } else {
        setError(response.data.message || "Failed to accept invitation");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Project Invitation</h2>
        {invitation ? (
          <div>
            <p className="mb-4">
              You've been invited to join the project: 
              <span className="font-semibold"> {invitation.project_name}</span>
            </p>
            <button
              onClick={handleAcceptInvite}
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
            >
              Accept Invitation
            </button>
          </div>
        ) : (
          <p>No invitation found</p>
        )}
      </div>
    </div>
  );
};

export default InviteAccept;