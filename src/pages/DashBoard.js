import React from "react";
import "./Style2.css";
import { FaGithub, FaLinkedin, FaEnvelope, FaRocket, FaLock, FaCogs, FaGlobe, FaServer, FaBolt } from "react-icons/fa";
import CookieConsent from "./CookieConsent";
import AgentHeroSection from "./HeroSection";

export default function Dashboard() {
  const FeatureCard = ({ title, description, icon }) => (
    <div className="feature-card bg-gray-800 border border-gray-700 rounded-lg p-6 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg hover:shadow-purple-900/20">
      <div className="feature-icon text-purple-500 text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );

  const StepCard = ({ step, title, description }) => (
    <div className="step-card bg-gray-800 border border-gray-700 rounded-lg p-6 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20">
      <div className="step-number bg-purple-700 text-white text-xl font-bold rounded-full w-10 h-10 flex items-center justify-center mb-4">
        {step}
      </div>
      <h4 className="step-title text-xl font-bold text-white mb-2">{title}</h4>
      <p className="step-description text-gray-400">{description}</p>
    </div>
  );

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen">
      <CookieConsent />
      
      {/* Hero Section */}
      <section className="hero">
        <AgentHeroSection />
      </section>

      {/* Marquee Section - Dark theme with purple accent */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 my-8 mx-4 md:mx-8 lg:mx-auto lg:max-w-7xl rounded-lg border border-purple-800/30 shadow-md">
        <p className="text-purple-400 text-sm md:text-base lg:text-lg font-semibold text-center animate-pulse">
          🖥️ AI-Powered Testing Environment | 🚀 Run tests directly on your machine | 📈 Advanced analytics with TesterAlly platform
        </p>
      </div>

      {/* Features Section */}
      <section id="features" className="features max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="section-title text-3xl font-bold text-center mb-12 text-white">
          <span className="text-purple-500">Advanced</span> Testing Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            title="AI-Powered Test Execution"
            description="Execute intelligent tests that adapt to your application's behavior using our advanced machine learning algorithms."
            icon={<FaCogs className="text-purple-500" />}
          />
          <FeatureCard
            title="Real-time Analytics"
            description="View detailed test results with comprehensive analytics and actionable insights to improve your application quality."
            icon={<FaRocket className="text-purple-500" />}
          />
          <FeatureCard
            title="Enterprise-Grade Security"
            description="Test applications behind your firewall with end-to-end encryption ensuring maximum security for sensitive applications."
            icon={<FaLock className="text-purple-500" />}
          />
          <FeatureCard
            title="Multi-environment Testing"
            description="Seamlessly test across browsers, devices and operating systems with intelligent test distribution."
            icon={<FaGlobe className="text-purple-500" />}
          />
          <FeatureCard
            title="Performance Optimization"
            description="Identify and resolve performance bottlenecks with intelligent resource monitoring and allocation."
            icon={<FaServer className="text-purple-500" />}
          />
          <FeatureCard
            title="Continuous Integration"
            description="Integrate with your CI/CD pipeline for continuous testing with automatic synchronization when connectivity is restored."
            icon={<FaBolt className="text-purple-500" />}
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-850">
        <h2 className="section-title text-3xl font-bold text-center mb-12 text-white">
          How Our <span className="text-purple-500">AI Testing</span> Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepCard
            step="1"
            title="Install Agent & Connect AI"
            description="Download the TesterAlly Agent on your machine and connect to our AI backend to establish a secure testing environment."
          />
          <StepCard
            step="2"
            title="Configure Smart Test Suite"
            description="Set up your test suite with our AI recommendations that automatically adapt to your specific application architecture."
          />
          <StepCard
            step="3"
            title="Execute & Analyze Results"
            description="Run tests locally while our AI analyzes performance patterns and provides actionable insights to optimize your application."
          />
        </div>
      </section>

      {/* Dashboard Section - New */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          Live <span className="text-purple-500">Testing Dashboard</span>
        </h2>
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="stat-card bg-gray-900 p-4 rounded-lg border-l-4 border-purple-600">
              <div className="text-sm text-gray-400">Test Success Rate</div>
              <div className="text-2xl font-bold text-white flex items-center">
                94% <span className="text-green-500 text-sm ml-2">↑ 3%</span>
              </div>
            </div>
            <div className="stat-card bg-gray-900 p-4 rounded-lg border-l-4 border-purple-600">
              <div className="text-sm text-gray-400">AI Coverage</div>
              <div className="text-2xl font-bold text-white flex items-center">
                89% <span className="text-green-500 text-sm ml-2">↑ 5%</span>
              </div>
            </div>
            <div className="stat-card bg-gray-900 p-4 rounded-lg border-l-4 border-purple-600">
              <div className="text-sm text-gray-400">Tests Executed</div>
              <div className="text-2xl font-bold text-white">287</div>
            </div>
            <div className="stat-card bg-gray-900 p-4 rounded-lg border-l-4 border-purple-600">
              <div className="text-sm text-gray-400">Avg. Response Time</div>
              <div className="text-2xl font-bold text-white">124ms</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-white font-bold mb-4">Agent Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-l-4 border-purple-500 pl-3">
                  <div className="text-sm text-gray-400">CPU Usage</div>
                  <div className="text-lg font-semibold text-white">12%</div>
                </div>
                <div className="border-l-4 border-purple-500 pl-3">
                  <div className="text-sm text-gray-400">Memory</div>
                  <div className="text-lg font-semibold text-white">245 MB</div>
                </div>
                <div className="border-l-4 border-purple-500 pl-3">
                  <div className="text-sm text-gray-400">Tests Run</div>
                  <div className="text-lg font-semibold text-white">17</div>
                </div>
                <div className="border-l-4 border-purple-500 pl-3">
                  <div className="text-sm text-gray-400">Uptime</div>
                  <div className="text-lg font-semibold text-white">3h 42m</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-white font-bold mb-4">Recent Tests</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 border-b border-gray-700">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Login Authentication</span>
                  </div>
                  <span className="text-gray-400 text-sm">2m ago</span>
                </div>
                <div className="flex items-center justify-between p-2 border-b border-gray-700">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">User Registration</span>
                  </div>
                  <span className="text-gray-400 text-sm">5m ago</span>
                </div>
                <div className="flex items-center justify-between p-2 border-b border-gray-700">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-white">Payment Processing</span>
                  </div>
                  <span className="text-gray-400 text-sm">12m ago</span>
                </div>
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-white">Data Export</span>
                  </div>
                  <span className="text-gray-400 text-sm">20m ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Agent Section */}
      <section id="about-us" className="about-us max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="section-title text-3xl font-bold text-center mb-8 text-white">
          About <span className="text-purple-500">TesterAlly</span> AI Agent
        </h2>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md">
          <p className="text-gray-400 leading-relaxed">
            TesterAlly AI Agent represents the next generation of test automation tools, combining the power of
            artificial intelligence with local execution flexibility. Our agent leverages machine learning to understand your
            application's behavior patterns, identifying potential issues before they impact your users.
            
            The agent provides an intelligent bridge between your local environment and the TesterAlly platform,
            allowing you to execute sophisticated tests locally while maintaining all the benefits of centralized test
            management and AI-powered analytics. This approach is especially valuable for testing applications that require
            access to internal resources, specialized hardware configurations, or when security policies restrict external
            testing tools.
          </p>
        </div>
      </section>

      {/* Agent Resources */}
      <section id="resources" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-850">
        <h2 className="section-title text-3xl font-bold text-center mb-12 text-white">
          AI Agent <span className="text-purple-500">Resources</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20">
            <h4 className="text-xl font-bold text-white mb-4">AI Configuration Guide</h4>
            <p className="text-gray-400 mb-6">
              Learn how to configure the TesterAlly AI Agent for optimal performance in your local environment.
              This guide covers all aspects of agent setup, including neural network configurations, learning parameters,
              and integration with your CI/CD pipeline.
            </p>
            <button className="px-6 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-600 transition-colors duration-300">Read Guide</button>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20">
            <h4 className="text-xl font-bold text-white mb-4">Advanced AI Testing Techniques</h4>
            <p className="text-gray-400 mb-6">
              Discover cutting-edge AI testing methodologies and learn best practices for efficient test automation.
              This resource includes performance optimization tips and strategies for maximizing test coverage using
              our proprietary machine learning algorithms.
            </p>
            <button className="px-6 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-600 transition-colors duration-300">Learn More</button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="section-title text-3xl font-bold text-center mb-12 text-white">
          What Our <span className="text-purple-500">Users</span> Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              ))}
            </div>
            <p className="text-gray-300 mb-4">
              "The AI-powered agent has completely transformed our testing approach. We're now identifying issues we never would have caught with traditional testing methods. The machine learning capabilities are truly impressive."
            </p>
            <h4 className="text-purple-400 font-semibold">- David Kim, QA Lead</h4>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              ))}
            </div>
            <p className="text-gray-300 mb-4">
              "Setting up the AI agent was remarkably easy, and the performance is outstanding. The intelligent test generation has reduced our testing time by 65% while increasing our coverage by over 40%."
            </p>
            <h4 className="text-purple-400 font-semibold">- Lisa Chen, DevOps Engineer</h4>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 border-t border-gray-800 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-bold text-white mb-2">TesterAlly <span className="text-purple-500">AI Agent</span></h3>
              <p className="text-gray-400">Next-generation test automation with artificial intelligence</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
              <a href="#features" className="text-gray-400 hover:text-purple-400 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-400 hover:text-purple-400 transition-colors">How it Works</a>
              <a href="#about-us" className="text-gray-400 hover:text-purple-400 transition-colors">About</a>
              <a href="#resources" className="text-gray-400 hover:text-purple-400 transition-colors">Resources</a>
            </div>
          </div>
          <hr className="border-gray-800 mb-8" />
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">© 2024 TesterAlly AI Agent v2.0.1. All Rights Reserved.</p>
            <div className="flex gap-6">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-2"
              >
                <FaLinkedin /> LinkedIn
              </a>
              <a 
                href="https://github.com/rangad123/TesterAlly-FE/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-2"
              >
                <FaGithub /> GitHub
              </a>
              <a 
                href="mailto:ai-support@testerally.com"
                className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-2"
              >
                <FaEnvelope /> Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}