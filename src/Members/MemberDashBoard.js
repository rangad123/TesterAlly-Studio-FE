
import React from "react";
import "../pages/style.css";
import MemberSidebar from "./MemberSidebar";

const MemberDashBoard = () => {
  return (
    <div>
    <MemberSidebar />
    <div className="dashboard-container">
      <div className="main-content">

        <div className="text-center space-y-5">
          <h1 className="text-5xl font-bold">Welcome to TesterAlly MemberDashBoard</h1>
          <p className="text-xl text-gray-600">
            AI-based Test Automation Tool to simplify your testing process. Empower your testing with the power of AI.
          </p>
        </div>

      </div>
    </div>
    </div>
  );
};

export default MemberDashBoard;
