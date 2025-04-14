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
    renderer.setClearColor(0xedebfe, 0.3); // Keeping the original color
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Modified particles effect - grid pattern instead of random
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500; // Slightly reduced count
    const posArray = new Float32Array(particlesCount * 3);
    
    // Create a more structured grid pattern
    let index = 0;
    for (let i = -25; i <= 25; i += 2) {
      for (let j = -25; j <= 25; j += 2) {
        for (let k = -25; k <= 25; k += 5) {
          if (index < particlesCount * 3) {
            posArray[index] = i + (Math.random() - 0.5) * 0.5; // x
            posArray[index + 1] = j + (Math.random() - 0.5) * 0.5; // y
            posArray[index + 2] = k + (Math.random() - 0.5) * 0.5; // z
            index += 3;
          }
        }
      }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.3, // Slightly larger particles
      color: new THREE.Color('rgb(126, 58, 242)'), // Same purple color
      transparent: true,
      opacity: 0.6,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    const animate = () => {
      requestAnimationFrame(animate);
      // Different rotation pattern
      particles.rotation.x += 0.0004;
      particles.rotation.y += 0.0002;
      particles.rotation.z += 0.0001;
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
    <section className="relative bg-[rgb(237,235,254)] max-w-7xl mx-auto ">
      <div 
        ref={containerRef} 
        className="absolute inset-0 z-0"
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">

        <motion.div 
            className="space-y-6 px-4"
            initial={{ opacity: 0, y: 15 }} // Slightly different animation
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }} // Slightly faster
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-[rgb(126,58,242)] mb-[40px]">
              Local Test Execution Environment
              <div className="text-sm font-semibold mt-2 ml-8 text-[rgb(126,58,242)] flex items-center">
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
            initial={{ opacity: 0, x: 20 }} // Different animation
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img src={`${process.env.PUBLIC_URL}/agent-hero.svg`} className='lg:mt-[30px] sm:mt-[50px]' alt='TesterAlly Agent' />
            
            {/* Simple network connection indicators */}
            <div className="absolute top-1/2 left-1/3 w-8 h-8 rounded-full bg-purple-500 opacity-20 animate-ping" style={{animationDuration: '3s'}}></div>
            <div className="absolute bottom-1/3 right-1/3 w-6 h-6 rounded-full bg-purple-500 opacity-15 animate-ping" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AgentHeroSection;