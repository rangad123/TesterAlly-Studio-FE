import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';

const HeroSection = () => {
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
    renderer.setClearColor(0xedebfe, 0.3);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.2,
      color: new THREE.Color('rgb(126, 58, 242)'),
      transparent: true,
      opacity: 0.6,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    const animate = () => {
      requestAnimationFrame(animate);
      particles.rotation.x += 0.0003;
      particles.rotation.y += 0.0005;
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
    <section className="relative bg-[rgb(237,235,254)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div 
        ref={containerRef} 
        className="absolute inset-0 z-0"
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">

        <motion.div 
            className="space-y-6 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-[rgb(126,58,242)] mb-[40px]">
              Scalable & Intelligent Automation for Enterprise Needs
              <div className="text-sm font-semibold mt-2 text-[rgb(126,58,242)]">
                Powered by TesterAlly QA Suite
              </div>
            </h1>
            
            <motion.p 
              className="text-base md:text-lg text-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{textAlign:"justify"}}
            >
              Tester Ally delivers cutting-edge test automation designed to enhance efficiency and reliability in enterprise software development. 
              Leverage AI-driven test coverage to reduce risks and accelerate deployment cycles. Our comprehensive UI testing tools ensure 
              seamless automation, allowing teams to maintain high-quality application standards effortlessly.
            </motion.p>
          </motion.div>

          <motion.div 
            className="relative lg:h-[500px] sm:h-[300px]"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img src={`${process.env.PUBLIC_URL}/hero.svg`} className='lg:mt-[30px] sm:mt-[50px]' alt='TesterAlly' />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
