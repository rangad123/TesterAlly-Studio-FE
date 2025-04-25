import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";

const URL = "http://127.0.0.1:8000/api/login/";
const SYSTEM_CHECK_URL = "http://127.0.0.1:8000/installer/EXE_login/";

const Login = (props) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [, setAgentKey] = useState("");
  const [rememberMe, setRememberMe] = useState(false);


  const togglePasswordVisiblity = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  let navigate = useNavigate();
  const { setIsLoggedIn, setName, setEmail } = props;

  useEffect(() => {
    const form = document.querySelector("form");
    if (form) {
      form.setAttribute("autocomplete", "off");
    }
  }, []);

  const validateEmail = (email) => {
    const domainRegex = /@.+\..+/;
    if (!domainRegex.test(email)) {
      setEmailError("Please include a valid domain name (e.g., example.com).");
    } else {
      setEmailError("");
    }
  };

  const handleRedirect = (roleId) => {
    console.log("Redirecting with Role ID:", roleId);
    roleId = Number(roleId);
    switch (roleId) {
      case 3:
        navigate("/member-dashboard");
        break;
      case 2:
        navigate("/dashboard-user");
        break;
      case 1:
        navigate("/admin-dashboard");
        break;
      default:
        navigate("/dashboard/login");
        break;
    }
  };

  const verifySystemInfo = async ( downloadUid) => {
    try {
      console.time("System Verification");
      const response = await axios.post(SYSTEM_CHECK_URL, {
        "download_uid" : downloadUid
      });
      console.timeEnd("System Verification");

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error("❌ Error verifying system:", error);
      let errorMessage = "System verification failed.";
      
      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || error.response.data.Key_error || errorMessage;
        if (errorMessage.includes("Download_uid does not match")) {
          errorMessage = "Agent key does not match any agent.";
        }
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberEmail");
    const rememberedPassword = localStorage.getItem("rememberPassword");
    const rememberedAgentKey = localStorage.getItem("rememberAgentKey"); 
  
    if (rememberedEmail && rememberedPassword) {
      document.getElementById("email").value = rememberedEmail;
      document.getElementById("password").value = rememberedPassword;
      document.getElementById("agentKey").value = rememberedAgentKey;
      setRememberMe(true);
    }
  
    const form = document.querySelector("form");
    if (form) {
      form.setAttribute("autocomplete", "off");
    }
  }, []);
  

  const handleLogin = async (ev) => {
    ev.preventDefault();
    console.time("Login Total Time");
    setLoading(true);

    const email = ev.target.email.value;
    const password = ev.target.password.value;
    const agentKeyValue = ev.target.agentKey.value;
    setAgentKey(agentKeyValue);
    const formData = { email, password };

    console.log("Login attempt with:", { email, agentKey: agentKeyValue });

    try {
      // Step 1: Authenticate user
      console.time("API Call");
      const res = await axios.post(URL, formData);
      console.timeEnd("API Call");

      const data = res.data;

      if (data.success === true) {
        console.time("Post-Success Operations");


        // Step 4: Verify system info before redirecting
        const systemVerification = await verifySystemInfo(agentKeyValue);

        console.log("agentKeyValue:",agentKeyValue)

        // Step 2: Store user data in localStorage
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("user_id", data.user.user_id);
        localStorage.setItem("agentKey", agentKeyValue);

        if (rememberMe) {
          localStorage.setItem("rememberEmail", email);
          localStorage.setItem("rememberPassword", password);
          localStorage.setItem("rememberAgentKey", agentKeyValue);
        } else {
          localStorage.removeItem("rememberEmail");
          localStorage.removeItem("rememberPassword");
          localStorage.removeItem("rememberAgentKey");
        }
        

        // Step 3: Update app state
        setIsLoggedIn(true);
        setEmail(email);
        setName(data.user.name);
        
        if (systemVerification.success) {
          console.log("✅ System verification successful:", systemVerification.data);

          const userId = localStorage.getItem("userId"); 
          checkForUpdates(userId);
          console.log("userId:",userId);

          handleRedirect(data.user.roleId);
          toast.success("Login successful!");
        } else {

          toast.error(systemVerification.message || "System verification failed. Please use the correct device.");
          localStorage.clear();
          setIsLoggedIn(false);
        }

        console.timeEnd("Post-Success Operations");
      } else {
        console.warn("API Error Message:", data.message);
        toast.error(data.message || "An error occurred during login.");
      }
    } catch (error) {
      console.error("Error Details:", error);
      if (error.response) {
        toast.error(error.response.data.message || "Invalid email or password.");
      } else {
        toast.error("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
      console.timeEnd("Login Total Time");
    }
  };

  const checkForUpdates = async (userId) => {
    try {
      const queryParams = new URLSearchParams({
        user_id: userId,
      });
  
      const getResponse = await fetch(`http://127.0.0.1:8000/installer/track-download/?${queryParams}`);
      if (!getResponse.ok) {
        throw new Error("Failed to fetch download UID");
      }
      
      const responseData = await getResponse.json();
      console.log("response data:", responseData);

      if (Array.isArray(responseData) && responseData.length > 0) {

        const sortedDownloads = [...responseData].sort((a, b) => 
          new Date(b.last_downloaded) - new Date(a.last_downloaded)
        );
        
        const hasUpdate = sortedDownloads.some(item => item.is_update_available === "yes");
        
        const mostRecentDownload = sortedDownloads[0];
        
        if (hasUpdate) {
          const current_version = mostRecentDownload.file_version;
          
          toast.info(
            <div className="update-notification">
              <div className="flex items-center">
                <div>
                  <p className="font-bold">Update Available!</p>
                  <p>A new version is now available.</p>
                  <p className="text-sm mt-1">Your current version: {current_version}</p>
                </div>
              </div>
              <button 
                className="mt-2 bg-purple-600 text-white px-4 py-1 rounded-lg hover:bg-purple-700 transition-colors w-full"
                onClick={() => window.open('https://testerally.ai', '_blank')}
              >
                Download Update
              </button>
            </div>,
            {
              autoClose: false,
              closeOnClick: false,
              position: "top-right",
              className: "update-toast",
            }
          );
        } else {
          console.log("No updates available at this time.");
        }
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row justify-center items-center min-h-screen -mt-10 px-6 py-8 gap-8">
      <div className="hidden lg:block w-2/5 p-6 rounded-lg mt-[50px]">
        <img
          src={`${process.env.PUBLIC_URL}/logo1.jpg`}
          alt="TesterAlly Login"
          className="w-full max-w-md mx-auto mb-6 rounded-3xl shadow-md transform hover:scale-105 transition-transform duration-300"
        />
        <h1 className="text-3xl font-bold text-gray-800 text-center">TesterAlly</h1>
        <p className="text-lg text-gray-600 text-center mt-2">
          Revolutionizing Automation Testing with AI
        </p>
        <ul className="mt-6 space-y-4">
          <li className="flex items-start">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mr-3">
              &#10003;
            </span>
            <span className="text-gray-700">
              Write test cases effortlessly with AI-powered automation tools.
            </span>
          </li>
          <li className="flex items-start">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mr-3">
              &#10003;
            </span>
            <span className="text-gray-700">
              Codeless testing solutions for faster test creation and execution.
            </span>
          </li>
          <li className="flex items-start">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mr-3">
              &#10003;
            </span>
            <span className="text-gray-700">
              No coding skills required – plain English testing made easy.
            </span>
          </li>
          <li className="flex items-start">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mr-3">
              &#10003;
            </span>
            <span className="text-gray-700">
              Get started with no credit card required.
            </span>
          </li>
        </ul>
        <p className="text-sm text-gray-500 text-center mt-4">
          Trusted by teams worldwide to accelerate testing with cutting-edge AI.
        </p>
      </div>

      {/* Right section with login form */}
      <div className="w-full max-w-lg p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <h5 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center">
          Login to your account
        </h5>
        <form
          className="w-full flex flex-col gap-5"
          onSubmit={handleLogin}
          autoComplete="off"
        >
          <div>
            <label htmlFor="email" className="font-medium required">
              Email
            </label>
          </div>
          <div>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Your Email"
              autoComplete="off"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500"
              required
              onChange={(e) => validateEmail(e.target.value)}
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </div>
          <div>
            <label htmlFor="password" className="font-medium required">
              Password
            </label>
          </div>
          <div className="relative w-full">
            <input
              id="password"
              name="password"
              type={isPasswordVisible ? "text" : "password"}
              placeholder="Your Password"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500"
              required
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={togglePasswordVisiblity}
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
              {isPasswordVisible ? (
                <FaEyeSlash className="w-5 h-5" />
              ) : (
                <FaEye className="w-5 h-5" />
              )}
            </button>
          </div>
          {/* Agent Key field */}
          <div>
            <label htmlFor="agentKey" className="font-medium required">
              Agent Key
            </label>
          </div>
          <div>
            <input
              id="agentKey"
              name="agentKey"
              type="text"
              placeholder="Your Agent Key"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500"
              required
            />
          </div>
          <div className="forgot-password">
            <span
              className="font-semibold text-purple-600 hover:text-purple-500 cursor-pointer"
              onClick={() => navigate("/forgotPassword")}
            >
              Forgot password?
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="remember" className="font-medium">
              Remember me
            </label>
          </div>
          <button
            type="submit"
            className="w-full py-3 px-5 text-base font-medium text-center text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 rounded-lg dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-800 transition-colors"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account? Please contact{" "}
            <a
              href="https://testerally.ai"
              className="font-semibold text-purple-700 hover:text-purple-800 dark:text-purple-500 dark:hover:text-purple-400"
            >
              TesterAlly.ai
            </a>{" "}
            or visit our website.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;