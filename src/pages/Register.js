import axios from "axios";
import { toast } from "react-toastify";
import CountryInput from "../components/CountryInput";
import { useState, useEffect } from "react";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
import "./Login.css";

const URL = "https://api.testerally.ai/api/register/";

const Register = (props) => {
  const { setName, setEmail } = props;
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");


  const validateEmail = (email) => {
    const domainRegex = /@.+\..+/; 
    if (!domainRegex.test(email)) {
      setEmailError("Please include a valid domain name (e.g., example.com).");
    } else {
      setEmailError("");
    }
  };
  const validatePhone = (phone) => {
    const phoneRegex = /^[7-9][0-9]{9}$/;
    return phoneRegex.test(phone);
  };
  const handlePhoneChange = (event) => {
    const value = event.target.value;
    setPhone(value);

    if (!validatePhone(value)) {
      setPhoneError("Phone number must be between 10 to 15 digits.");
    } else {
      setPhoneError("");
    }
  };



  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const [isConfPasswordVisible, setIsConfPasswordVisible] = useState(false);

  const toggleConfPasswordVisibility = () => {
    setIsConfPasswordVisible((prev) => !prev);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handlePasswordChange = (event) => {
    const value = event.target.value;
    setPassword(value);

    if (!validatePassword(value)) {
      setPasswordError("The password should include at least 8 characters, one uppercase letter, one number, and one special character.");
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (event) => {
    const value = event.target.value;
    setConfPassword(value);

    if (value !== password) {
      setConfirmPasswordError("Passwords do not match!");
    } else {
      setConfirmPasswordError("");
    }
  };

  useEffect(() => {
    const form = document.querySelector("form");
    if (form) {
      form.setAttribute("autocomplete", "off");
    }
  }, []);

  const handleRegister = async (ev) => {
    ev.preventDefault();

    const name = ev.target.name.value.trim();
    const email = ev.target.email.value;
    const password = ev.target.password.value;
    const confirmpassword = ev.target.confirmpassword.value;
    const country = ev.target.country.value;
    const phone = ev.target.phone.value;

    if (passwordError || confirmPasswordError) {
      return;  
    }

    if (country === "Select Country") {
      toast.error("Select your country!");
    } else if (password !== confirmpassword) {
      toast.error("Passwords do not match!");
    } else {
      const formData = {
        name: name,
        email: email,
        password: password,
        country: country,
        phone: phone,
        roleid:2
      };
      try {
        const res = await axios.post(URL, formData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = res.data;
        if (data.success === true) {
          localStorage.setItem("userName", name);
          localStorage.setItem("userEmail", email);
          toast.success("Registration successful! You can now log in.");
          setName(name);
          setEmail(email);

          ev.target.reset();

          setTimeout(() => {
            window.location.href = "/dashboard/login";
          }, 2000);
          
        } else {
          toast.error(data.message || "Registration failed. Please try again.");
        }
      } catch (err) {

        console.error('Error details:', err.response);
        if (err.response) {

          if (err.response.status === 409) {
            toast.error(err.response.data.message || "Email is already registered..");
          } else {
            toast.error(err.response.data.message || "An error occurred during registration. Please try again.");
          }
        } else {
          toast.error("An error occurred during registration. Please try again.");
        }
      }
      
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row justify-center items-center min-h-screen -mt-10 px-6 py-8 gap-8">
      <div className="hidden lg:block w-2/5  p-6 rounded-lg"  style={{ marginTop: "50px" }}>
        <img
          src="/ai-image-1.jpg"
          alt="TesterAlly Login"
          className="w-full max-w-md mx-auto mb-6 rounded-3xl shadow-md transform hover:scale-105 transition-transform duration-300"
        />
        <h1 className="text-3xl font-bold text-gray-800 text-center">Join TesterAlly</h1>
        <p className="text-lg text-gray-600 text-center mt-2">
          Revolutionizing Automation Testing with AI
        </p>
        <ul className="mt-6 space-y-4">
          <li className="flex items-start">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mr-3">
              &#10003;
            </span>
            <span className="text-gray-700">
              Sign up for AI-powered tools that make writing test cases a breeze.
            </span>
          </li>
          <li className="flex items-start">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mr-3">
              &#10003;
            </span>
            <span className="text-gray-700">
            Access codeless testing solutions for fast and efficient workflows.
            </span>
          </li>
          <li className="flex items-start">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mr-3">
              &#10003;
            </span>
            <span className="text-gray-700">
            Start your journey with plain English, no coding skills required.
            </span>
          </li>
          <li className="flex items-start">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mr-3">
              &#10003;
            </span>
            <span className="text-gray-700">
            Free signup – no credit card required!
            </span>
          </li>
        </ul>
        <p className="text-sm text-gray-500 text-center mt-4">
        Join teams worldwide using TesterAlly to accelerate testing with cutting-edge AI.
        </p>
      </div>
      
      <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-xl xl:p-0 dark:bg-gray-800 dark:border-gray-700 " style={{ marginTop: "50px" }}>
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center">
            Create an account
          </h1>
          <form
            className="space-y-4 md:space-y-"
            action="POST"
            onSubmit={handleRegister}
            autoComplete="new-password"
          >
            <div>
              <div className="mb-2 block">
                <label htmlFor="name" className="font-medium required">
                  Organization Name
                </label>
              </div>
              <input
                id="name"
                name="name"
                type="text"
                onChange={(e) => {
                  const { value } = e.target;
                  if (/[^a-zA-Z0-9\s]/.test(value)) {
                    toast.error("Name can only contain letters.");
                  }
                }}
                placeholder="Your Name"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500"
                required
                autoComplete="off"
              />
            </div>

            <div>
              <div className="mb-2 block">
                <label htmlFor="email" className="font-medium required">
                  Business Email
                </label>
              </div>
              <input
                type="email"
                name="email"
                id="email"
                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500"
                placeholder="Your Email"
                required
                autoComplete="off"
                onChange={(e) => validateEmail(e.target.value)}
              />
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>

            <div className="grid gap-6 mb-6 md:grid-cols-2">
              <div className="relative">
                <div className="mb-2 block">
                  <label htmlFor="password" className="block mb-2 font-medium required">
                    Password
                  </label>
                </div>
                <div className="relative">
            <input
              type={isPasswordVisible ? "text" : "password"}
              name="password"
              id="password"
              placeholder="Your Password"
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500"
              required
              value={password}
              minLength="8"
              autoComplete="new-password"
              onChange={handlePasswordChange}
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none mr-[10px]"
              onClick={togglePasswordVisibility}
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
              {isPasswordVisible ? (
                <FaEyeSlash className="w-5 h-5" />
              ) : (
                <FaEye className="w-5 h-5" />
              )}
            </button>
          </div>
          {passwordError && <p className="text-red-500 text-sm mt-2">{passwordError}</p>}
          </div>

          <div className="relative">
          <label htmlFor="confirmpassword" className="block mb-2 font-medium required">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={isConfPasswordVisible ? "text" : "password"}
              name="confirmpassword"
              id="confirmpassword"
              placeholder="Re-enter Password"
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500"
              required
              value={confPassword}
              autoComplete="new-password"
              onChange={handleConfirmPasswordChange}
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none mr-[10px]"
              onClick={toggleConfPasswordVisibility}
              aria-label={isConfPasswordVisible ? "Hide password" : "Show password"}
            >
              {isConfPasswordVisible ? (
                <FaEyeSlash className="w-5 h-5" />
              ) : (
                <FaEye className="w-5 h-5" />
              )}
            </button>
          </div>
          {confirmPasswordError && <p className="text-red-500 text-sm mt-2">{confirmPasswordError}</p>}
        </div>
      </div>

            <CountryInput />
            <div className="max-w-xl">
              <div className="mb-2 block">
                <label htmlFor="phone" className="font-medium">
                  Phone Number
                </label>
              </div>
              <input
                type="number"
                id="phone"
                name="phone"
                value={phone}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500"
                maxLength={10}
                pattern="^[79][0-9]{9}"
                placeholder="Your Phone Number"
                aria-errormessage="Phone number must start with 7 or 9"
                autoComplete="off"
                onChange={handlePhoneChange}
              />
              {phoneError && <p className="text-red-500 text-sm mt-2">{phoneError}</p>}
            </div>

            <button
              type="submit"
                className="w-full py-3 px-5 text-base font-medium text-center text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 rounded-lg dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-800 transition-colors"
              >
              Create an account
            </button>
            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <a
                href="/dashboard/login"
                className="font-semibold leading-6 text-purple-600 hover:text-purple-500"
              >
                Login Here
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
