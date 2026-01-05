import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  MeshTransmissionMaterial, 
  Environment, 
  Float, 
  Sparkles,
  Lightformer,
  Icosahedron,
  TorusKnot,
  Sphere,
  Capsule
} from '@react-three/drei';
import { motion } from 'framer-motion';
import { ArrowRight, Menu } from 'lucide-react';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// CONFIGURATION FOR SECTIONS
// -----------------------------------------------------------------------------
const SECTION_CONFIGS = {
  hero: { 
    shape: 'knot',
    color: '#ffffff', 
    config: { roughness: 0.05, ior: 1.5, chromaticAberration: 0.1 }
  },
  work: { 
    shape: 'prism',
    color: '#ffffff', 
    config: { roughness: 0.0, ior: 2.0, chromaticAberration: 1.5 } // High refraction for 'gem' look
  },
  agency: { 
    shape: 'capsule',
    color: '#C67C4E', 
    config: { roughness: 0.2, ior: 1.2, chromaticAberration: 0.2 }
  },
  contact: { 
    shape: 'orb',
    color: '#C67C4E', 
    config: { roughness: 0.1, ior: 1.5, chromaticAberration: 0.5 }
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
      transition: { type: "spring", damping: 12, stiffness: 100 }
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
            marginRight: letter === " " ? "2rem" : "0"
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
// 3D SCENE & MORPHING LOGIC
// -----------------------------------------------------------------------------

// Reusable Material Component to ensure consistency
const GlassMaterial = ({ config, color }) => (
  <MeshTransmissionMaterial 
    backside={false}
    samples={6}
    resolution={512}
    thickness={0.25}
    anisotropy={0.1}
    clearcoat={1}
    {...config}
    color={color}
    background={new THREE.Color('#050505')}
  />
);

// Individual Shapes that scale in/out
const MorphingShape = ({ activeSection, mouse }) => {
  const group = useRef();
  const { viewport } = useThree();
  
  // Refs for individual meshes
  const knot = useRef();
  const prism = useRef();
  const capsule = useRef();
  const orb = useRef();

  useFrame((state, delta) => {
    if (!group.current) return;

    // Base Rotation
    group.current.rotation.x += delta * 0.1;
    group.current.rotation.y += delta * 0.15;
    
    // Mouse Interaction (Parallax)
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, mouse.x * 0.5 + 3, 0.05); // biased to right (+3)
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, mouse.y * 0.5, 0.05);

    // Helper to animate scale
    const animateScale = (ref, targetScale) => {
      if (ref.current) {
        ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 4);
        // Rotate active ones slightly faster
        if (targetScale > 0.1) {
           ref.current.rotation.x += delta * 0.2;
           ref.current.rotation.y += delta * 0.2;
        }
      }
    };

    // Determine target scales based on activeSection
    const currentShape = SECTION_CONFIGS[activeSection]?.shape || 'knot';
    const mobileRatio = viewport.width < 7 ? 0.6 : 1;

    animateScale(knot, currentShape === 'knot' ? 3 * mobileRatio : 0);
    animateScale(prism, currentShape === 'prism' ? 3.5 * mobileRatio : 0);
    animateScale(capsule, currentShape === 'capsule' ? 2.5 * mobileRatio : 0);
    animateScale(orb, currentShape === 'orb' ? 2.5 * mobileRatio : 0);
  });

  return (
    <group ref={group} position={[3, 0, 0]}> {/* Positioned to the right side */}
      
      {/* HERO: TorusKnot */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={knot}>
          <torusKnotGeometry args={[1, 0.35, 128, 32]} />
          <GlassMaterial config={SECTION_CONFIGS.hero.config} color={SECTION_CONFIGS.hero.color} />
        </mesh>
      </Float>

      {/* WORK: Icosahedron (Prism) */}
      <Float speed={3} rotationIntensity={1} floatIntensity={0.5}>
        <mesh ref={prism}>
          <Icosahedron args={[1, 0]} />
          <GlassMaterial config={SECTION_CONFIGS.work.config} color={SECTION_CONFIGS.work.color} />
        </mesh>
      </Float>

      {/* AGENCY: Capsule */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={capsule}>
          <Capsule args={[0.7, 2, 4, 16]} />
          <GlassMaterial config={SECTION_CONFIGS.agency.config} color={SECTION_CONFIGS.agency.color} />
        </mesh>
      </Float>

      {/* CONTACT: Sphere (Orb) */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1}>
        <mesh ref={orb}>
          <Sphere args={[1.2, 32, 32]} />
          <GlassMaterial config={SECTION_CONFIGS.contact.config} color={SECTION_CONFIGS.contact.color} />
        </mesh>
      </Float>

    </group>
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
          <MorphingShape mouse={mouse} activeSection={activeSection} />
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
