import { useEffect } from "react";  
import { useNavigate } from "react-router-dom";
import UserIcon from "../images/user.png";
import "../pages/Profile.css";
import MemberSidebar from "./MemberSidebar";


const MemberProfile = () => {
  const name = localStorage.getItem("userName") || "User Name";
  const email = localStorage.getItem("userEmail") || "user@example.com";

  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"; 

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/");  
    }
  }, [isLoggedIn, navigate]);

  return (
    <div>
      <MemberSidebar />
    <div className="profile-container !mt-0">
      <div className="profile-card mt-[50px]">
      <h1>Member Profile</h1>
        <div className="profile-header">
          <img
            alt="User Icon"
            src={UserIcon}
            className="profile-avatar"
          />
          <h5 className="profile-name">{name}</h5>
          <span className="profile-email">{email}</span>
        </div>
        <div className="profile-actions">
          <a href="addfriend" className="profile-btn add-friend">
            Add Friend
          </a>
          <a href="message" className="profile-btn message">
            Message
          </a>
        </div>
      </div>
    </div>
    </div>
  );
};

export default MemberProfile;
