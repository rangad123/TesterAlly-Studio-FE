import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { FaDesktop } from "react-icons/fa";

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

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0xFFF8E1, 0.3); // Warm amber background color
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Completely different particles effect - hexagonal pattern
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1800; // Increased count for more density
    const posArray = new Float32Array(particlesCount * 3);
    
    // Create a hexagonal lattice pattern
    let index = 0;
    const gridSize = 25; // Size of the overall grid
    
    for (let layer = -gridSize/2; layer < gridSize/2; layer += 2) {
      for (let i = -gridSize; i < gridSize; i += 3) {
        for (let j = -gridSize; j < gridSize; j += 3) {
          if (index < particlesCount * 3) {
            // Offset every other row for hexagonal pattern
            const xOffset = (Math.abs(layer) % 2) * 1.5;
            
            posArray[index] = i + xOffset + (Math.random() - 0.5) * 0.5; // x with offset
            posArray[index + 1] = j + (Math.random() - 0.5) * 0.5; // y
            posArray[index + 2] = layer + (Math.random() - 0.5) * 0.5; // z
            
            index += 3;
          }
        }
      }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.4, // Slightly larger points
      color: new THREE.Color('rgb(245, 158, 11)'), // Amber color
      transparent: true,
      opacity: 0.8,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    const animate = () => {
      requestAnimationFrame(animate);
      
      // Completely different rotation and animation pattern
      particles.rotation.y += 0.0015;
      
      // Pulsating effect
      const time = Date.now() * 0.0005;
      const positions = particles.geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        // Add a breathing effect to the particles
        const originalZ = positions[i + 2];
        const distance = Math.sqrt(
          positions[i] * positions[i] + 
          positions[i + 1] * positions[i + 1]
        );
        
        // Create a ripple effect
        positions[i + 2] = originalZ + Math.sin(time + distance * 0.5) * 0.3;
      }
      
      particles.geometry.attributes.position.needsUpdate = true;
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
      container.removeChild(renderer.domElement);
      scene.remove(particles);
      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
  }, []);

  return (
    <section className="relative bg-[rgb(255,248,225)] max-w-7xl mx-auto ">
      <div 
        ref={containerRef} 
        className="absolute inset-0 z-0"
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">

        <motion.div 
            className="space-y-6 px-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-[rgb(245,158,11)] mb-[40px]">
              Local Test Execution Environment
              <div className="text-sm font-semibold mt-2 ml-8 text-[rgb(245,158,11)] flex items-center">
                <FaDesktop className="mr-2" /> TesterAlly Agent
              </div>
            </h1>
            
            <motion.p 
              className="text-base md:text-lg text-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{textAlign:"justify"}}
            >
              TesterAlly Agent enables powerful test automation directly on your local machine. Run tests behind your 
              firewall, leverage your own hardware resources, and maintain complete control over your testing environment 
              while still benefiting from TesterAlly's comprehensive test management capabilities.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
            </motion.div>
          </motion.div>

          <motion.div 
            className="relative lg:h-[600px] sm:h-[300px]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img src={`${process.env.PUBLIC_URL}/agent-hero.svg`} className='lg:mt-[30px] sm:mt-[50px]' alt='TesterAlly Agent' />
            
            {/* Network connection indicators with updated colors */}
            <div className="absolute top-1/2 left-1/3 w-8 h-8 rounded-full bg-amber-500 opacity-20 animate-ping" style={{animationDuration: '3s'}}></div>
            <div className="absolute bottom-1/3 right-1/3 w-6 h-6 rounded-full bg-amber-500 opacity-15 animate-ping" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AgentHeroSection;