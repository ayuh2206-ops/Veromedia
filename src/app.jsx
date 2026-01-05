import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  MeshTransmissionMaterial, 
  Environment, 
  Float, 
  Sparkles,
  Lightformer
} from '@react-three/drei';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu } from 'lucide-react';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// CONFIGURATION FOR SECTIONS
// -----------------------------------------------------------------------------
// This defines how the 3D object behaves in each section
const SECTION_CONFIGS = {
  hero: { 
    color: '#ffffff', 
    distortion: 0.4, 
    chromaticAberration: 0.1, 
    roughness: 0.05, 
    scale: 3.5, 
    speed: 1 
  },
  work: { 
    color: '#ffffff', 
    distortion: 0.0, // Sharp, crystalline
    chromaticAberration: 1.5, // High rainbow effect (Prism)
    roughness: 0.0, 
    scale: 4.5, 
    speed: 0.2 
  },
  agency: { 
    color: '#C67C4E', // Brand color
    distortion: 1.5, // High liquid distortion
    chromaticAberration: 0.2, 
    roughness: 0.2, 
    scale: 3.0, 
    speed: 3.0 // Fast spin
  },
  contact: { 
    color: '#C67C4E', 
    distortion: 0.2, 
    chromaticAberration: 0.5, 
    roughness: 0.1, 
    scale: 2.0, // Smaller, intimate
    speed: 0.5 
  }
};

// -----------------------------------------------------------------------------
// CINEMATIC TITLE COMPONENT
// -----------------------------------------------------------------------------
const CinematicTitle = () => {
  const text = "VERO MEDIA";
  const letters = text.split("");
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.5 }
    })
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100
      }
    },
    hidden: {
      opacity: 0,
      y: 50,
      filter: "blur(20px)",
      scale: 1.5,
    }
  };

  return (
    <motion.div 
      style={{ display: 'flex', overflow: 'hidden' }}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, index) => (
        <motion.span 
          key={index} 
          variants={child}
          style={{ 
            fontSize: '12vw', 
            lineHeight: '0.9', 
            fontWeight: 500, 
            letterSpacing: '-0.05em', 
            color: 'rgba(255,255,255,0.9)',
            display: 'inline-block',
            marginRight: letter === " " ? "2rem" : "0" // Handle spaces
          }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

// -----------------------------------------------------------------------------
// ERROR BOUNDARY
// -----------------------------------------------------------------------------
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: '#ff4444', padding: '20px', background: '#050505', height: '100vh', zIndex: 9999, position: 'relative' }}>
          <h2>System Error</h2>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// -----------------------------------------------------------------------------
// 3D SCENE
// -----------------------------------------------------------------------------
const VeroLens = ({ mouse, activeSection }) => {
  const mesh = useRef();
  const materialRef = useRef();
  const { viewport } = useThree();
  
  // Current values to lerp from
  const currentConfig = useRef({ ...SECTION_CONFIGS.hero });

  useFrame((state, delta) => {
    if (!mesh.current || !materialRef.current) return;

    // Get target config based on active section
    const target = SECTION_CONFIGS[activeSection] || SECTION_CONFIGS.hero;

    // LERP (Linear Interpolation) for smooth transitions
    const lerpFactor = 2.5 * delta; // Adjust speed of transition here

    currentConfig.current.color = target.color; // Colors animate differently in Three.js usually, but MeshTransmission handles string colors well enough for this
    currentConfig.current.distortion = THREE.MathUtils.lerp(currentConfig.current.distortion, target.distortion, lerpFactor);
    currentConfig.current.chromaticAberration = THREE.MathUtils.lerp(currentConfig.current.chromaticAberration, target.chromaticAberration, lerpFactor);
    currentConfig.current.roughness = THREE.MathUtils.lerp(currentConfig.current.roughness, target.roughness, lerpFactor);
    currentConfig.current.scale = THREE.MathUtils.lerp(currentConfig.current.scale, target.scale, lerpFactor);
    currentConfig.current.speed = THREE.MathUtils.lerp(currentConfig.current.speed, target.speed, lerpFactor);

    // Apply values
    materialRef.current.distortion = currentConfig.current.distortion;
    materialRef.current.chromaticAberration = currentConfig.current.chromaticAberration;
    materialRef.current.roughness = currentConfig.current.roughness;
    materialRef.current.color = currentConfig.current.color;

    // Animate Mesh Scale
    const viewportRatio = viewport.width < 7 ? 0.6 : 1; // Mobile adjustment
    mesh.current.scale.setScalar(currentConfig.current.scale * viewportRatio);

    // Animate Rotation
    mesh.current.rotation.x += delta * 0.2 * currentConfig.current.speed;
    mesh.current.rotation.y += delta * 0.3 * currentConfig.current.speed;
    
    // Add Mouse Influence
    mesh.current.rotation.x += (mouse.y * 0.5 - mesh.current.rotation.x) * 0.1;
    mesh.current.rotation.y += (mouse.x * 0.5 - mesh.current.rotation.y) * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={mesh}>
        <torusKnotGeometry args={[1, 0.35, 128, 32]} />
        <MeshTransmissionMaterial 
          ref={materialRef}
          backside={false}
          samples={6}
          resolution={512}
          thickness={0.2}
          clearcoat={1}
          transmission={1}
          ior={1.5}
          anisotropy={0.1}
          background={new THREE.Color('#050505')}
        />
      </mesh>
    </Float>
  );
};

const Lighting = () => (
  <>
    <Environment preset="city" />
    <ambientLight intensity={0.5} />
    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#C67C4E" />
    <pointLight position={[-10, -10, -10]} intensity={1} color="#00bcd4" />
    <Float speed={5} floatIntensity={2}>
      <Lightformer form="ring" color="#C67C4E" intensity={2} scale={10} position={[-15, 0, -10]} target={[0, 0, 0]} />
    </Float>
  </>
);

const Scene = ({ mouse, activeSection }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', zIndex: 0, background: '#050505' }}>
      <Canvas 
        dpr={[1, 1.5]} 
        camera={{ position: [0, 0, 15], fov: 45 }} 
        gl={{ alpha: true, antialias: false, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => { gl.setClearColor(new THREE.Color('#050505')); }}
      >
        <Suspense fallback={null}>
          <Lighting />
          <VeroLens mouse={mouse} activeSection={activeSection} />
        </Suspense>
        <Sparkles count={40} scale={10} size={2} speed={0.4} opacity={0.5} color="#C67C4E" />
      </Canvas>
    </div>
  );
};

// -----------------------------------------------------------------------------
// UI COMPONENTS
// -----------------------------------------------------------------------------
const Magnetic = ({ children }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.1, y: middleY * 0.1 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

const Cursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const mouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    const handleMouseOver = (e) => {
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    return () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return (
    <motion.div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: 'white',
        mixBlendMode: 'difference',
        pointerEvents: 'none',
        zIndex: 9999
      }}
      animate={{
        x: mousePosition.x - (isHovered ? 24 : 8),
        y: mousePosition.y - (isHovered ? 24 : 8),
        scale: isHovered ? 3 : 1,
      }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
    />
  );
};

const Navigation = () => {
  return (
    <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
      <Magnetic>
        <button style={{ width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '9999px', background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}>
          <Menu size={18} />
        </button>
      </Magnetic>
      
      <div style={{ width: '1px', height: '1rem', background: 'rgba(255,255,255,0.2)' }}></div>
      
      <nav style={{ display: 'flex', gap: '0.25rem' }}>
        {['Work', 'Agency', 'Contact'].map((item) => (
          <Magnetic key={item}>
            <a href={`#${item.toLowerCase()}`} style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', borderRadius: '9999px' }}>
              {item}
            </a>
          </Magnetic>
        ))}
      </nav>

      <div style={{ width: '1px', height: '1rem', background: 'rgba(255,255,255,0.2)' }}></div>

      <Magnetic>
        <button style={{ padding: '0.5rem 1.25rem', background: '#C67C4E', color: 'black', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '9999px', border: 'none', cursor: 'pointer' }}>
          Let's Talk
        </button>
      </Magnetic>
    </div>
  );
};

// Modified Section to report visibility
const Section = ({ title, subtitle, children, id, align = "left", onInView }) => {
  return (
    <section id={id} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '6rem', position: 'relative', zIndex: 10 }}>
      <motion.div
        onViewportEnter={() => onInView && onInView(id)}
        viewport={{ amount: 0.5 }} // Trigger when 50% visible
      >
        <div style={{ maxWidth: '56rem', alignSelf: align === "right" ? "flex-end" : "flex-start", textAlign: align === "right" ? "right" : "left", marginLeft: align === "right" ? "auto" : "0" }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.8 }}
          >
            <span style={{ color: '#C67C4E', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.875rem', marginBottom: '1rem', display: 'block' }}>
              {subtitle}
            </span>
            <h2 style={{ fontSize: '4rem', fontFamily: 'Playfair Display, serif', color: 'white', marginBottom: '2rem', lineHeight: '1.1' }}>
              {title}
            </h2>
            <div style={{ color: '#9ca3af', fontSize: '1.25rem', lineHeight: '1.625', maxWidth: '42rem', fontWeight: 300 }}>
              {children}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

// -----------------------------------------------------------------------------
// MAIN APP
// -----------------------------------------------------------------------------
export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMouse = (e) => {
      setMouse({ 
        x: (e.clientX / window.innerWidth) * 2 - 1, 
        y: -(e.clientY / window.innerHeight) * 2 + 1 
      });
    };
    window.addEventListener('mousemove', updateMouse);
    return () => window.removeEventListener('mousemove', updateMouse);
  }, []);

  return (
    <ErrorBoundary>
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', backgroundColor: '#050505', color: 'white' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');
          :root { cursor: none; }
          html { scroll-behavior: smooth; }
          body { margin: 0; padding: 0; background: #050505; }
        `}</style>

        <Cursor />
        <Navigation />
        
        {/* SCENE (Responds to activeSection) */}
        <Scene mouse={mouse} activeSection={activeSection} />

        {/* CONTENT */}
        <main style={{ position: 'relative', zIndex: 10 }}>
          
          {/* HERO */}
          <section 
            style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          >
            <motion.div 
               onViewportEnter={() => setActiveSection('hero')}
               viewport={{ amount: 0.6 }}
               style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ textAlign: 'center', zIndex: 10, mixBlendMode: 'exclusion' }}>
                <CinematicTitle />
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.5 }}
                  style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
                >
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.6)' }}>Est. 2024</span>
                  <div style={{ width: '4px', height: '4px', background: '#C67C4E', borderRadius: '50%' }} />
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.6)' }}>Digital Alchemy</span>
                </motion.div>
              </div>
              
              <div style={{ position: 'absolute', bottom: '2.5rem', left: '6rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Scroll to Explore</span>
                    <div style={{ width: '1px', height: '3rem', background: 'linear-gradient(to bottom, #C67C4E, transparent)' }}></div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* SECTIONS */}
          <Section 
            id="work" 
            subtitle="Recent Case Studies" 
            title="Systems That Scale" 
            onInView={setActiveSection}
          >
            <p style={{ marginBottom: '1.5rem' }}>
              We don't just build websites; we engineer digital ecosystems. 
              By blending refractive aesthetics with robust React architecture, 
              we create experiences that linger in the memory of your users.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
              {[1, 2].map((i) => (
                <Magnetic key={i}>
                  <div style={{ position: 'relative', aspectRatio: '4/3', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', cursor: 'none' }}>
                     <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', zIndex: 20 }}>
                        <h3 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '0.25rem' }}>Project {i === 1 ? 'Obsidian' : 'Aether'}</h3>
                        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', color: '#C67C4E' }}>Fintech / WebGL</p>
                     </div>
                  </div>
                </Magnetic>
              ))}
            </div>
          </Section>

          <Section 
            id="agency" 
            align="right" 
            subtitle="Our Philosophy" 
            title="The Lens of Truth"
            onInView={setActiveSection}
          >
            <p>
              "Vero" means true. In an age of digital noise, clarity is the ultimate luxury.
              We strip away the non-essential to reveal the core truth of your brand.
              Using light, physics, and motion, we tell stories that don't just inform—they mesmerize.
            </p>
          </Section>

          <Section 
            id="contact" 
            subtitle="Initiate Protocol" 
            title="Ready to transcend?"
            onInView={setActiveSection}
          >
            <div style={{ marginTop: '2rem' }}>
              <Magnetic>
                <a href="mailto:hello@veromedia.org" style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', fontSize: '4rem', color: 'white', textDecoration: 'none' }}>
                  <span>Start a Project</span>
                  <ArrowRight size={48} />
                </a>
              </Magnetic>
            </div>
          </Section>

        </main>
      </div>
    </ErrorBoundary>
  );
}
