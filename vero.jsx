import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  MeshTransmissionMaterial, 
  Environment, 
  Float, 
  Sparkles,
  Lightformer
} from '@react-three/drei';
import { motion } from 'framer-motion';
import { ArrowRight, Menu, ArrowUpRight } from 'lucide-react';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// ERROR BOUNDARY: Catches crashes and shows them on screen
// -----------------------------------------------------------------------------
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: '20px', background: 'black', height: '100vh', zIndex: 9999, position: 'relative' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// -----------------------------------------------------------------------------
// HOOKS
// -----------------------------------------------------------------------------
const useMousePosition = () => {
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
  return mouse;
};

// -----------------------------------------------------------------------------
// 3D SCENE
// -----------------------------------------------------------------------------
const VeroLens = ({ mouse }) => {
  const mesh = useRef();
  const { viewport } = useThree();

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, mouse.y * 0.5, 0.1);
      mesh.current.rotation.y = THREE.MathUtils.lerp(mesh.current.rotation.y, mouse.x * 0.5, 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={mesh} scale={viewport.width < 7 ? 2 : 3.5}>
        <torusKnotGeometry args={[1, 0.35, 128, 32]} />
        <MeshTransmissionMaterial 
          backside
          samples={8} // Reduced samples for better performance/compatibility
          thickness={0.2} 
          roughness={0.05} 
          clearcoat={1} 
          transmission={1} 
          ior={1.5} 
          chromaticAberration={0.15} 
          anisotropy={0.3}
          color="#ffffff"
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

const Scene = ({ mouse }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, background: '#050505' }}>
      <Canvas 
        dpr={[1, 2]} 
        camera={{ position: [0, 0, 15], fov: 45 }} 
        gl={{ alpha: true, antialias: true }}
        onCreated={() => console.log("Canvas Created Successfully")}
      >
        <color attach="background" args={['#050505']} />
        <Suspense fallback={null}>
          <Lighting />
          <VeroLens mouse={mouse} />
        </Suspense>
        <Sparkles count={50} scale={10} size={2} speed={0.4} opacity={0.5} color="#C67C4E" />
      </Canvas>
      {/* Simple fallback text instead of Loader component */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, color: '#333', fontSize: '10px' }}>
        Rendering 3D...
      </div>
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
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-2 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full" style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <Magnetic>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent text-white hover:bg-white/10 transition-colors" style={{ width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '9999px', background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}>
          <Menu size={18} />
        </button>
      </Magnetic>
      
      <div style={{ width: '1px', height: '1rem', background: 'rgba(255,255,255,0.2)' }}></div>
      
      <nav style={{ display: 'flex', gap: '0.25rem' }}>
        {['Work', 'Agency', 'Systems', 'Contact'].map((item) => (
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

const Section = ({ title, subtitle, children, id, align = "left" }) => {
  return (
    <section id={id} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '6rem', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '56rem', alignSelf: align === "right" ? "flex-end" : "flex-start", textAlign: align === "right" ? "right" : "left" }}>
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
    </section>
  );
};

// -----------------------------------------------------------------------------
// MAIN APP
// -----------------------------------------------------------------------------
export default function App() {
  const mouse = useMousePosition();
  
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
        
        {/* SCENE (Z-INDEX 0) */}
        <Scene mouse={mouse} />

        {/* CONTENT (Z-INDEX 10) */}
        <main style={{ position: 'relative', zIndex: 10 }}>
          
          <section style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', zIndex: 10, mixBlendMode: 'exclusion' }}>
              {/* Removed initial opacity 0 for debugging */}
              <motion.div animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ fontSize: '12vw', lineHeight: '0.9', fontWeight: 500, letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                  VERO<br />MEDIA
                </h1>
              </motion.div>
              
              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.6)' }}>Est. 2024</span>
                <div style={{ width: '4px', height: '4px', background: '#C67C4E', borderRadius: '50%' }} />
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.6)' }}>Digital Alchemy</span>
              </div>
            </div>
            
            <div style={{ position: 'absolute', bottom: '2.5rem', left: '6rem' }}>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Scroll to Explore</span>
                  <div style={{ width: '1px', height: '3rem', background: 'linear-gradient(to bottom, #C67C4E, transparent)' }}></div>
               </div>
            </div>
          </section>

          <Section id="work" subtitle="Recent Case Studies" title="Systems That Scale">
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

          <Section id="agency" align="right" subtitle="Our Philosophy" title="The Lens of Truth">
            <p>
              "Vero" means true. In an age of digital noise, clarity is the ultimate luxury.
              We strip away the non-essential to reveal the core truth of your brand.
              Using light, physics, and motion, we tell stories that don't just inform—they mesmerize.
            </p>
          </Section>

          <Section id="contact" subtitle="Initiate Protocol" title="Ready to transcend?">
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
