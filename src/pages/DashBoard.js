import React from "react";
import "./Style2.css";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import CookieConsent from "./CookieConsent";
import AgentHeroSection from "./HeroSection";

export default function Dashboard() {
  const FeatureCard = ({ title, description, icon }) => (
    <div className="feature-cards">
      <div className="feature-icon">{icon}</div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
  const StepCard = ({ step, title, description }) => (
    <div className="step-card">
      <div className="step-icon">{step}</div>
      <h4 className="step-title">{title}</h4>
      <p className="step-description">{description}</p>
    </div>
  );

  return (
    <div className="">
      <CookieConsent />
      
      {/* Hero Section */}
      <section className="hero">
        <AgentHeroSection />
      </section>

      {/* Marquee Section - Slightly modified for Agent */}
      <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 my-8 mx-4 md:mx-8 lg:mx-auto lg:max-w-7xl rounded-lg">
        <p className="text-blue-800 text-sm md:text-base lg:text-lg font-semibold text-center animate-pulse">
          🖥️ Local Testing Environment | 🚀 Run tests directly on your machine | 📈 Seamless integration with TesterAlly platform
        </p>
      </div>

      {/* Features Section */}
      <section id="features" className="features max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">Agent Testing Features</h2>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <FeatureCard
              title="Local Test Execution"
              description="Execute tests directly on your machine using your local browser installations and system resources for efficient testing."
              icon="⚙️"
            />
            <FeatureCard
              title="Real-time Reporting"
              description="View detailed test results in real-time with synchronized reporting between your local environment and the TesterAlly platform."
              icon="📊"
            />
            <FeatureCard
              title="Secure Testing"
              description="Test applications behind your firewall without exposing internal systems, ensuring security compliance for sensitive applications."
              icon="🔒"
            />
            <FeatureCard
              title="Cross-browser Testing"
              description="Utilize locally installed browsers to perform comprehensive testing across multiple browser environments."
              icon="🌐"
            />
            <FeatureCard
              title="Resource Optimization"
              description="Efficiently manage system resources during test execution with intelligent CPU and memory allocation."
              icon="💻"
            />
            <FeatureCard
              title="Offline Capability"
              description="Continue testing operations even without internet connectivity, with results synchronized when connection is restored."
              icon="⚡"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">How the Agent Works</h2>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <StepCard
              step="1"
              title="Install Local Agent"
              description="Download and install the TesterAlly Agent on your machine to establish a secure connection with the TesterAlly platform."
            />
            <StepCard
              step="2"
              title="Configure Test Environment"
              description="Set up your local testing environment with browsers, devices, and system resources that match your specific testing needs."
            />
            <StepCard
              step="3"
              title="Execute & Monitor Tests"
              description="Run tests locally while monitoring performance and results through the agent interface, with data synchronized to your TesterAlly account."
            />
          </div>
        </div>
      </section>

      {/* About Agent Section */}
      <section id="about-us" className="about-us max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">About TesterAlly Agent</h2>
        <p>
          TesterAlly Agent extends the power of our cloud-based testing platform directly to your local environment.
          This agent provides a bridge between your machine and the TesterAlly platform, allowing you to execute tests
          locally while maintaining all the benefits of centralized test management. The agent is particularly useful
          for testing applications that require access to internal resources, specialized hardware configurations,
          or when security policies restrict external testing tools. With TesterAlly Agent, you get the best of both
          worlds: local execution capabilities with enterprise-grade test management and reporting.
        </p>
      </section>

      {/* Agent Resources - Modified from Blog section */}
      <section id="resources" className="blog-highlights max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">Agent Resources</h2>
        <div className="blog-grid">
          <div className="blog-card">
            <h4>Agent Configuration Guide</h4>
            <p>
              Learn how to configure your TesterAlly Agent for optimal performance in your local environment.
              This guide covers all aspects of agent setup, including browser configurations, system requirements,
              and integration with your development workflow.
            </p>
            <button className="btn primary-btn">Read Guide</button>
          </div>
          <div className="blog-card">
            <h4>Troubleshooting & Best Practices</h4>
            <p>
              Discover solutions for common agent issues and learn best practices for efficient local test execution.
              This resource includes performance optimization tips and strategies for maximizing test coverage.
            </p>
            <button className="btn primary-btn">Learn More</button>
          </div>
        </div>
      </section>

      {/* Simple Agent Status Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Agent Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border-l-4 border-purple-500 pl-3">
              <div className="text-sm text-gray-500">CPU Usage</div>
              <div className="text-lg font-semibold">12%</div>
            </div>
            <div className="border-l-4 border-purple-500 pl-3">
              <div className="text-sm text-gray-500">Memory</div>
              <div className="text-lg font-semibold">245 MB</div>
            </div>
            <div className="border-l-4 border-purple-500 pl-3">
              <div className="text-sm text-gray-500">Tests Run</div>
              <div className="text-lg font-semibold">17</div>
            </div>
            <div className="border-l-4 border-purple-500 pl-3">
              <div className="text-sm text-gray-500">Uptime</div>
              <div className="text-lg font-semibold">3h 42m</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">What Our Users Say</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p>
              "The local agent has been a game-changer for our internal application testing. We can now test securely behind our firewall while still using all of TesterAlly's features."
            </p>
            <h4>- David Kim, QA Lead</h4>
          </div>
          <div className="testimonial-card">
            <p>
              "Setting up the agent was seamless, and the performance is outstanding. We've cut our testing time in half by running tests locally."
            </p>
            <h4>- Lisa Chen, DevOps Engineer</h4>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="footer">
        <p>© 2024 TesterAlly Agent v1.2.4. All Rights Reserved.</p>
        <div className="social-links">
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaLinkedin /> LinkedIn
          </a>
          <a href="https://github.com/rangad123/TesterAlly-FE/" target="_blank" rel="noopener noreferrer">
            <FaGithub /> GitHub
          </a>
          <a href="mailto:agent-support@testerally.com">
            <FaEnvelope /> Support
          </a>
        </div>
      </footer>
    </div>
  );
}