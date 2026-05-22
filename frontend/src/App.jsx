import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Sparkles, AlertCircle, CheckCircle2, ChevronRight, 
  Wand2, Trash2, X, Check, Eye, LayoutDashboard, History,
  AlertTriangle, Info, Zap, ShieldCheck, BarChart3,
  MousePointer2, ArrowRightLeft, Languages, Camera, Loader2
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const API_ROOT = "http://localhost:8000";

const NeuralBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let particles = [];
    const particleCount = 120;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * 1000;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 1.2;
        this.speedY = (Math.random() - 0.5) * 1.2;
        // More vivid colors for light mode
        const hues = [230, 260, 280, 310];
        this.color = `hsla(${hues[Math.floor(Math.random() * hues.length)]}, 80%, 65%, ${0.4 + Math.random() * 0.4})`;
      }

      update(mouse) {
        this.x += this.speedX;
        this.y += this.speedY;

        // 3D Wrapping
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Mouse Parallax
        const dx = mouse.x - canvas.width / 2;
        const dy = mouse.y - canvas.height / 2;
        this.renderX = this.x + (dx * (this.z / 5000));
        this.renderY = this.y + (dy * (this.z / 5000));
      }

      draw() {
        ctx.beginPath();
        const scale = 500 / (500 + this.z);
        ctx.arc(this.renderX, this.renderY, this.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Connections
      particles.forEach((p, i) => {
        p.update(mouse);
        p.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.renderX - p2.renderX, p.renderY - p2.renderY);
          if (dist < 200) {
            ctx.beginPath();
            ctx.moveTo(p.renderX, p.renderY);
            ctx.lineTo(p2.renderX, p2.renderY);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.4 * (1 - dist / 200)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-1] pointer-events-none opacity-60" />;
};

// --- 3D Tilt Card Component ---
const TiltCard = ({ children, className }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const App = () => {
  const [text, setText] = useState("");
  const [issues, setIssues] = useState([]);
  const [metrics, setMetrics] = useState({
    grammar_score: 100,
    spelling_score: 100,
    clarity_score: 100,
    overall_score: 100
  });
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [activeIssueIndex, setActiveIssueIndex] = useState(null);
  const [ignoredIssues, setIgnoredIssues] = useState(new Set());
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);
  const fileInputRef = useRef(null);

  // Mouse trail effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const analyzeText = useCallback(async (currentText) => {
    if (!currentText.trim()) {
      setIssues([]);
      setMetrics({ grammar_score: 100, spelling_score: 100, clarity_score: 100, overall_score: 100 });
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_ROOT}/analyze`, { text: currentText });
      setIssues(response.data.issues);
      setMetrics(response.data.metrics);
      console.log("Research Data Received:", response.data.metrics.research);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeText(text);
    }, 800);
    return () => clearTimeout(timer);
  }, [text, analyzeText]);

  const applyCorrection = (issue) => {
    // Single replacement logic
    const newText = text.slice(0, issue.start) + issue.correction + text.slice(issue.end);
    setText(newText);
    setIssues(prev => prev.filter(i => i.start !== issue.start));
    setActiveIssueIndex(null);
  };

  const applyAllCorrections = () => {
    let newText = text;
    // Process backwards to keep indices valid
    const sortedIssues = [...issues]
      .filter(i => !ignoredIssues.has(`${i.start}-${i.end}`))
      .filter(i => i.text !== i.correction) // Only actually different text
      .sort((a, b) => b.start - a.start);
    
    if (sortedIssues.length === 0) return;

    sortedIssues.forEach(issue => {
      newText = newText.slice(0, issue.start) + issue.correction + newText.slice(issue.end);
    });
    
    setText(newText);
    setIssues([]); // Immediately clear so it feels instant
    setActiveIssueIndex(null);
  };

  const ignoreIssue = (issue) => {
    setIgnoredIssues(prev => new Set(prev).add(`${issue.start}-${issue.end}`));
    setActiveIssueIndex(null);
  };

  const handleOCR = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setOcrLoading(true);
    try {
      const response = await axios.post(`${API_ROOT}/ocr`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.text) {
        setText(prev => (prev ? prev + "\n" : "") + response.data.text);
      }
    } catch (error) {
      console.error("OCR extraction failed", error);
      alert("Failed to extract text. Please check if Tesseract is installed on the server.");
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderTextWithHighlights = () => {
    if (issues.length === 0) return text;

    let result = [];
    let lastIdx = 0;
    const visibleIssues = issues.filter(i => !ignoredIssues.has(`${i.start}-${i.end}`));
    const sortedIssues = [...visibleIssues].sort((a, b) => a.start - b.start);

    sortedIssues.forEach((issue, idx) => {
      result.push(text.slice(lastIdx, issue.start));
      result.push(
        <motion.span
          key={`issue-${idx}`}
          initial={false}
          onClick={() => setActiveIssueIndex(idx)}
          className={cn(
            "cursor-pointer px-0.5 rounded transition-all duration-300 border-b-2 inline",
            idx === activeIssueIndex ? "bg-primary-500/30 border-primary-400" :
            issue.type === 'spelling' ? 'bg-blue-500/10 border-blue-500/50' : 
            issue.type === 'grammar' ? 'bg-red-500/10 border-red-500/50' :
            'bg-yellow-500/10 border-yellow-500/50'
          )}
        >
          {text.slice(issue.start, issue.end)}
        </motion.span>
      );
      lastIdx = issue.end;
    });

    result.push(text.slice(lastIdx));
    return result;
  };

  return (
    <div className="min-h-screen text-slate-900 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-900 relative">
      {/* --- ELITE 3D BACKGROUND --- */}
      <NeuralBackground />
      <div className="neural-bg" />
      <div className="blob blob-purple" />
      <div className="blob blob-cyan" />
      <div className="blob blob-pink" />
      <div className="blob blob-indigo" />

      {/* Mouse Follow Glow */}
      <motion.div 
        className="fixed w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[100px] pointer-events-none z-0"
        style={{ x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%" }}
      />

      <header className="h-24 border-b border-slate-200/60 bg-white/60 backdrop-blur-3xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-12 h-full flex items-center justify-between">
          <div className="flex items-center gap-14">
            <motion.div 
               whileHover={{ scale: 1.05 }}
               className="flex items-center gap-4 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-500">
                <Sparkles size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 font-stylized">
                AETHER<span className="text-indigo-600 italic">WRITER</span>
              </h1>
            </motion.div>
            
            <nav className="hidden lg:flex items-center gap-10 text-[13px] font-black uppercase tracking-[0.2em] text-slate-400">
               <a href="#" className="flex items-center gap-2 text-slate-900 hover:text-indigo-600 transition-all accent-underline pb-1">Intelligence</a>
            </nav>
          </div>

          <div className="flex items-center gap-8">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleOCR} 
            />
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={ocrLoading}
              className="flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-sm"
            >
              {ocrLoading ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : <Camera size={18} className="text-indigo-600" />}
              <span>{ocrLoading ? "Scanning..." : "Scan Screenshot"}</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto w-full px-12 py-16 flex gap-12 flex-1">
        {/* --- WORKSPACE --- */}
        <div className="flex-1 flex flex-col gap-10">
          <div className="grid grid-cols-4 gap-8">
             <MetricCard label="Neural Score" value={metrics.overall_score} icon={<Zap size={22} className="text-indigo-600"/>} color="indigo" />
             <MetricCard label="Grammar" value={metrics.grammar_score} icon={<ShieldCheck size={22} className="text-red-500"/>} color="red" />
             <MetricCard label="Spelling" value={metrics.spelling_score} icon={<Languages size={22} className="text-blue-500"/>} color="blue" />
             <MetricCard label="Structure" value={metrics.clarity_score} icon={<BarChart3 size={22} className="text-amber-500"/>} color="amber" />
          </div>

          <div className="relative flex-1 group aesthetic-panel overflow-hidden border border-slate-200 group-focus-within:border-indigo-500/20 transition-all duration-700">
            <textarea
                ref={textareaRef}
                className="w-full h-full min-h-[600px] m-0 border-0 p-16 bg-transparent text-3xl font-normal leading-[1.6] text-transparent caret-primary-500 placeholder:text-slate-800 resize-none focus:outline-none custom-scrollbar font-stylized relative z-20 box-border [letter-spacing:normal]"
                placeholder="Start your creative journey..."
                value={text}
                onScroll={(e) => {
                  if (overlayRef.current) overlayRef.current.scrollTop = e.target.scrollTop;
                }}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) {
                    setText(e.target.value);
                  }
                }}
                maxLength={1000}
                spellCheck="false"
              />
              {/* Syntax Highlighting Overlay */}
              <div 
                ref={overlayRef}
                className="absolute inset-0 m-0 border-0 p-16 pointer-events-none text-3xl font-normal leading-[1.6] whitespace-pre-wrap break-words overflow-auto select-none font-stylized z-10 custom-scrollbar box-border"
              >
                <div className="text-slate-800 [letter-spacing:normal]">
                  {renderTextWithHighlights()}
                </div>
              </div>
            
            <div className="absolute bottom-12 left-16 flex flex-col gap-4 w-[400px]">
               <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                 <motion.div 
                   className={cn(
                     "h-full transition-colors duration-700",
                     text.length >= 950 ? "bg-red-500" : 
                     text.length >= 800 ? "bg-amber-500" : 
                     "bg-gradient-to-r from-indigo-500 to-indigo-600"
                   )}
                   initial={{ width: 0 }}
                   animate={{ width: `${(text.length / 1000) * 100}%` }}
                 />
               </div>
               <div className="flex justify-between items-center px-1">
                 <span className={cn(
                   "text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300",
                   text.length >= 950 ? "text-red-500" : 
                   text.length >= 800 ? "text-amber-500" : 
                   "text-slate-400"
                 )}>
                   {text.length} / 1000 Characters
                 </span>
               </div>
            </div>
          </div>
        </div>

        {/* --- INTELLIGENCE PANEL --- */}
        <aside className="w-[480px] flex flex-col gap-10 h-full">
           <div className="aesthetic-panel p-10 flex flex-col h-full overflow-hidden border border-slate-200">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 rotate-3">
                    <Wand2 size={28} />
                  </div>
                  <div>
                    <h2 className="font-black text-2xl text-slate-900 font-stylized">Assistant</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">{issues.length} Optimization found</p>
                  </div>
                </div>
                <ResearchDashboard research={metrics.research} />
                {issues.length > 0 && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={applyAllCorrections}
                    className="modern-btn bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-200"
                  >
                    Auto Fix
                  </motion.button>
                )}
              </div>

              <div className="flex-1 overflow-auto space-y-8 pr-4 custom-scrollbar pb-10">
                <AnimatePresence mode="popLayout">
                  {issues.filter(i => !ignoredIssues.has(`${i.start}-${i.end}`)).map((issue, idx) => (
                    <TiltCard key={`${issue.start}-${idx}`} className="group/card">
                      <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.08, type: "spring", damping: 15 }}
                        className={cn(
                          "p-6 aesthetic-card relative transition-all duration-700",
                          idx === activeIssueIndex 
                            ? "border-indigo-200 bg-indigo-50/50 scale-[1.02]" 
                            : "border-slate-100"
                        )}
                        onClick={() => setActiveIssueIndex(idx)}
                      >
                        <div className="flex justify-between items-center mb-8">
                           <div className={cn(
                             "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                             issue.type === 'grammar' ? "text-red-600 bg-red-50 border-red-100" :
                             issue.type === 'spelling' ? "text-blue-600 bg-blue-50 border-blue-100" :
                             "text-amber-600 bg-amber-50 border-amber-100"
                           )}>
                             {issue.type}
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             <Zap size={14} className="text-indigo-500 animate-pulse"/> {Math.round(issue.confidence * 100)}% Prob.
                           </div>
                        </div>

                        <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-8 group-hover/card:border-indigo-100 transition-all duration-500">
                           <div className="flex flex-col gap-2 flex-1">
                              <div className="flex items-center gap-4">
                                <span className="text-red-500/40 line-through text-lg font-bold font-stylized">{issue.text}</span>
                                <ArrowRightLeft size={16} className="text-slate-300" />
                                <span className="text-emerald-600 font-black text-2xl font-stylized">{issue.correction}</span>
                              </div>
                           </div>
                        </div>

                        <p className="text-[13px] text-slate-400 leading-relaxed font-bold mb-10 px-2 italic">
                          "{issue.explanation}"
                        </p>

                        <div className="flex gap-4">
                         <button 
                             onClick={(e) => { e.stopPropagation(); applyCorrection(issue); }}
                             className="flex-1 modern-btn bg-slate-900 text-white py-5 text-[12px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
                           >
                             ACCEPT
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); ignoreIssue(issue); }}
                             className="w-16 h-16 border border-slate-200 rounded-[20px] flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-500 active:scale-95"
                           >
                             <Trash2 size={24} />
                           </button>
                        </div>
                      </motion.div>
                    </TiltCard>
                  ))}
                </AnimatePresence>

                {issues.length === 0 && !loading && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="flex flex-col items-center justify-center py-40 text-center"
                   >
                      <div className="w-28 h-28 bg-white rounded-[40px] flex items-center justify-center mb-10 shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-50 rotate-12">
                        <CheckCircle2 size={48} className="text-indigo-500" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter font-stylized uppercase">Flawless Text</h3>
                      <p className="text-slate-400 text-xs font-black tracking-widest uppercase max-w-[200px] leading-loose">The neural engine found zero discrepancies.</p>
                   </motion.div>
                )}
              </div>

              {/* DASHBOARD BOTTOM */}
              <div className="mt-auto pt-10 border-t border-slate-100">
                 <div className="p-8 bg-indigo-50 rounded-[35px] border border-indigo-100 flex items-center justify-between relative overflow-hidden group/dash shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent group-hover/dash:opacity-50 transition-opacity" />
                    <div className="flex items-center gap-6 relative">
                       <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
                          <BarChart3 className="text-indigo-600" size={28} />
                       </div>
                       <div>
                         <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Intelligence</div>
                         <div className="text-3xl font-black text-slate-900 font-stylized leading-tight">{metrics.overall_score}%</div>
                       </div>
                    </div>
                    <div className="w-20 h-20 relative">
                       <svg className="w-full h-full transform -rotate-90">
                         <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                         <motion.circle 
                            cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" 
                            strokeDasharray={213.6}
                            animate={{ strokeDashoffset: 213.6 - (213.6 * metrics.overall_score) / 100 }}
                            className="text-indigo-600" 
                            style={{ strokeLinecap: "round" }}
                          />
                       </svg>
                    </div>
                 </div>
              </div>
           </div>
        </aside>
      </main>
    </div>
  );
};

const MetricCard = ({ label, value, icon, color }) => (
  <div className="aesthetic-card rounded-[30px] p-6 border transition-all hover:translate-y-[-4px] bg-white shadow-sm" style={{ borderColor: `var(--${color}-color, #f1f5f9)` }}>
     <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-slate-50 rounded-xl">{icon}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
     </div>
     <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-slate-900">{value}</span>
        <span className="text-xs text-slate-400 font-bold">%</span>
     </div>
  </div>
);

const ResearchDashboard = ({ research }) => {
  if (!research) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10 p-8 bg-white/80 backdrop-blur-xl rounded-[40px] border border-slate-200 shadow-2xl shadow-indigo-500/5 overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <LayoutDashboard size={120} className="text-indigo-600" />
      </div>
      
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white">
          <BarChart3 size={24} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 font-stylized">Linguistic Research</h3>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10">
         <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Readability Index</div>
            <div className="flex items-baseline gap-3">
               <span className="text-4xl font-black text-slate-900">{Math.round(research.readability.flesch_reading_ease)}</span>
               <span className="text-xs font-bold text-indigo-600 uppercase">Flesch Ease</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 font-bold">Grade Level: {research.readability.flesch_kincaid_grade}</p>
         </div>
         <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Academic Tone</div>
            <div className="flex items-baseline gap-3">
               <span className="text-4xl font-black text-slate-900">{research.academic_tone}%</span>
               <span className="text-xs font-bold text-emerald-600 uppercase">Formal</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 font-bold">Hedges & Informality detected.</p>
         </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-500">
           <span>Subjectivity</span>
           <span className={research.sentiment.subjectivity > 0.5 ? "text-amber-500" : "text-emerald-500"}>
             {research.sentiment.subjectivity > 0.5 ? "Personal/Opinion" : "Objective/Fact"}
           </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${research.sentiment.subjectivity * 100}%` }}
             className="h-full bg-indigo-600"
           />
        </div>
      </div>
      
      <button 
        className="w-full mt-10 py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98]"
        onClick={() => {
           const report = `
# AETHERWRITER RESEARCH REPORT
---
Text Analysis Summary:
- Readability: ${research.readability.flesch_reading_ease} (Flesch Ease)
- Grade Level: ${research.readability.flesch_kincaid_grade}
- Academic Tone: ${research.academic_tone}%
- Lexicon Count: ${research.readability.lexicon_count}
- Sentiment: ${research.sentiment.polarity} (Polarity), ${research.sentiment.subjectivity} (Subjectivity)
---
GENEATED BY AETHERWRITER NEURAL CORE V5.0
           `;
           const blob = new Blob([report], { type: 'text/markdown' });
           const url = URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url;
           a.download = "AetherWriter_Research_Report.md";
           a.click();
        }}
      >
        Export Research Data
      </button>
    </motion.div>
  );
};

export default App;
