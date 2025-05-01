import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { FaRobot, FaCode } from "react-icons/fa";

const AgentHeroSection = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Setup scene with dark theme
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x111827, 0.5); // Dark background with slight transparency
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Advanced particles effect - neural network pattern
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    const velocities = new Float32Array(particlesCount * 3);
    const connections = [];
    const nodePositions = [];

    // Create nodes (larger particles)
    const nodeCount = 30;
    for (let i = 0; i < nodeCount; i++) {
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 30;
      nodePositions.push({ x, y, z });
    }

    // Create regular particles and connections between nodes
    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;
      
      if (i < nodeCount) {
        // Place nodes
        posArray[i3] = nodePositions[i].x;
        posArray[i3 + 1] = nodePositions[i].y;
        posArray[i3 + 2] = nodePositions[i].z;
      } else {
        // Random particles in space
        posArray[i3] = (Math.random() - 0.5) * 80;
        posArray[i3 + 1] = (Math.random() - 0.5) * 80;
        posArray[i3 + 2] = (Math.random() - 0.5) * 60;
      }
      
      // Add velocity
      velocities[i3] = (Math.random() - 0.5) * 0.05;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.05;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.05;
    }

    // Create connections between nodes (for neural network effect)
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (Math.random() > 0.85) { // Only connect some nodes
          connections.push({
            from: i,
            to: j,
            pulseSpeed: 0.5 + Math.random() * 2,
            pulseProgress: Math.random()
          });
        }
      }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Use separate materials for nodes and regular particles
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.2,
      color: new THREE.Color('rgb(139, 92, 246)'), // Purple color
      transparent: true,
      opacity: 0.7,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Create line material for connections
    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color('rgb(139, 92, 246)'),
      transparent: true,
      opacity: 0.3
    });

    // Create connection lines
    const lineGeometries = [];
    const lines = [];
    
    connections.forEach((connection) => {
      const geometry = new THREE.BufferGeometry();
      const linePositions = new Float32Array(6); // 2 points * 3 coordinates
      
      // Initial positions from nodes
      linePositions[0] = nodePositions[connection.from].x;
      linePositions[1] = nodePositions[connection.from].y;
      linePositions[2] = nodePositions[connection.from].z;
      linePositions[3] = nodePositions[connection.to].x;
      linePositions[4] = nodePositions[connection.to].y;
      linePositions[5] = nodePositions[connection.to].z;
      
      geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      const line = new THREE.Line(geometry, lineMaterial);
      scene.add(line);
      
      lineGeometries.push(geometry);
      lines.push(line);
    });

    // Animation function
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update particle positions with velocity
      const positions = particles.geometry.attributes.position.array;
      
      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        
        // Only move normal particles, keep nodes in place
        if (i >= nodeCount) {
          positions[i3] += velocities[i3];
          positions[i3 + 1] += velocities[i3 + 1];
          positions[i3 + 2] += velocities[i3 + 2];
          
          // Boundary check - wrap around
          if (Math.abs(positions[i3]) > 40) velocities[i3] *= -1;
          if (Math.abs(positions[i3 + 1]) > 40) velocities[i3 + 1] *= -1;
          if (Math.abs(positions[i3 + 2]) > 30) velocities[i3 + 2] *= -1;
        }
      }
      
      // Update node connections with pulse effect
      connections.forEach((connection, idx) => {
        connection.pulseProgress += 0.01 * connection.pulseSpeed;
        if (connection.pulseProgress > 1) connection.pulseProgress = 0;
        
        // Update line opacity based on pulse
        const pulseFactor = Math.sin(connection.pulseProgress * Math.PI);
        lines[idx].material.opacity = 0.1 + pulseFactor * 0.3;
        
        // Update line positions from nodes
        const positions = lineGeometries[idx].attributes.position.array;
        positions[0] = nodePositions[connection.from].x;
        positions[1] = nodePositions[connection.from].y;
        positions[2] = nodePositions[connection.from].z;
        positions[3] = nodePositions[connection.to].x;
        positions[4] = nodePositions[connection.to].y;
        positions[5] = nodePositions[connection.to].z;
        lineGeometries[idx].attributes.position.needsUpdate = true;
      });
      
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y += 0.001;
      particles.rotation.x += 0.0005;
      
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Cleanup
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      
      scene.remove(particles);
      lines.forEach(line => scene.remove(line));
      
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      lineGeometries.forEach(geo => geo.dispose());
    };
  }, []);

  return (
    <section className="relative bg-gray-900 py-16">
      <div 
        ref={containerRef} 
        className="absolute inset-0 z-0"
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Container - Moved up with negative margin and adjusted spacing */}
          <motion.div 
            className="space-y-4 px-4 md:mt-0 lg:-mt-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-500 px-3 py-1 rounded-full text-sm font-medium text-white mb-3"
            >
              Next-Gen AI Testing
            </motion.div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white mb-3">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="block"
              >
                AI-Powered Test
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600"
              >
                Execution Environment
              </motion.span>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="text-sm font-semibold mt-2 ml-1 text-purple-400 flex items-center"
              >
                <FaRobot className="mr-2" /> TesterAlly AI Agent v2.0
              </motion.div>
            </h1>
            
            <motion.p 
              className="text-base md:text-lg text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              Harness the power of artificial intelligence to revolutionize your testing workflow. 
              TesterAlly AI Agent intelligently identifies issues, adapts to application changes, 
              and provides actionable insights while executing tests directly on your local machine 
              with maximum security and control.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="flex flex-col sm:flex-row gap-4 pt-3"
            >
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-md hover:from-purple-700 hover:to-purple-900 transition-all duration-300 shadow-lg shadow-purple-900/30 flex items-center justify-center">
                <FaRobot className="mr-2" /> Get Started with AI
              </button>
              <button className="px-6 py-3 bg-gray-800 text-purple-400 border border-purple-700/30 rounded-md hover:bg-gray-700 transition-all duration-300 flex items-center justify-center">
                <FaCode className="mr-2" /> View Documentation
              </button>
            </motion.div>
          </motion.div>

          {/* Right Container - Terminal */}
          <motion.div 
            className="relative sm:h-[400px] px-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative z-10 bg-gray-800 p-6 rounded-xl border border-purple-900/20 shadow-2xl shadow-purple-900/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-xs text-gray-400">TesterAlly AI v2.0</div>
              </div>
              
              <div className="space-y-3 font-mono text-sm">
                <div className="text-green-400">$ testerally init ai-agent</div>
                <div className="text-gray-300">Initializing AI testing environment...</div>
                <div className="text-gray-300">Loading machine learning models...</div>
                <div className="text-gray-300">Scanning application architecture...</div>
                <div className="text-purple-400">AI Agent successfully connected.</div>
                <div className="text-gray-300 flex items-center">
                  <span className="inline-block h-3 w-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Ready to execute intelligent tests
                </div>
              </div>
              
              {/* Metrics Panel */}
              <div className="mt-6 bg-gray-900/60 p-3 rounded-lg border border-gray-700">
                <div className="text-xs text-gray-400 mb-2">AI Agent Metrics</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">Test Coverage</span>
                    <div className="flex items-center">
                      <div className="h-2 w-24 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full" style={{width: '92%'}}></div>
                      </div>
                      <span className="text-xs text-white ml-2">92%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">AI Accuracy</span>
                    <div className="flex items-center">
                      <div className="h-2 w-24 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full" style={{width: '96%'}}></div>
                      </div>
                      <span className="text-xs text-white ml-2">96%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Network connection indicators with purple theme */}
            <div className="absolute top-1/2 left-1/3 w-8 h-8 rounded-full bg-purple-600 opacity-20 animate-ping" style={{animationDuration: '3s'}}></div>
            <div className="absolute bottom-1/3 right-1/3 w-6 h-6 rounded-full bg-purple-500 opacity-15 animate-ping" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AgentHeroSection;