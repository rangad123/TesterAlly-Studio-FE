import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";

const URL = "https://api.testerally.ai/api/login/";

const Login = (props) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

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

  const handleLogin = async (ev) => {
    ev.preventDefault();
    console.time("Login Total Time");
    setLoading(true);
  
    const email = ev.target.email.value;
    const password = ev.target.password.value;
    const formData = { email, password };

    console.log(formData)
  
    try {
      console.time("API Call");
      const res = await axios.post(URL, formData);
      console.timeEnd("API Call");
  
      const data = res.data;

      console.log(data)
  
      if (data.success === true) {
        console.time("Post-Success Operations");
  
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userId", data.user.id);

        setIsLoggedIn(true);
        setEmail(email);
        setName(data.user.name);

        console.log("Role ID:", data.user.roleId); 


        handleRedirect(data.user.roleId);
  
      
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
  
  
  

  return (
    <div className="w-full flex flex-col lg:flex-row justify-center items-center min-h-screen -mt-10 px-6 py-8 gap-8">
      <div className="hidden lg:block w-2/5 p-6 rounded-lg mt-[50px]">
        <img
          src="/logo1.jpg"
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
            Not yet registered?{" "}
            <a
              href="/dashboard/register"
              className="font-semibold text-purple-700 hover:text-purple-800 dark:text-purple-500 dark:hover:text-purple-400"
            >
              Register Here
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
