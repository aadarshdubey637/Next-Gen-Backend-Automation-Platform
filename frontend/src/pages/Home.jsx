import React from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronRight, 
  Play, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Code2, 
  Rocket, 
  Settings, 
  Activity,
  Twitter,
  Github,
  Linkedin,
  Mail,
  Globe
} from 'lucide-react'
import { Link } from 'react-router-dom'
import FeatureCards from '../components/FeatureCards'
import CommandBar from '../components/CommandBar'

const FadeIn = ({ children, delay = 0, y = 20 }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {children}
  </motion.div>
)

const Home = () => {
  return (
    <div className="bg-[#000] text-white selection:bg-primary/30 selection:text-primary relative overflow-x-hidden min-h-screen font-sans">
      {/* ── Background Elements ── */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 opacity-[0.05]" 
             style={{ 
               backgroundImage: 'radial-gradient(circle at 2px 2px, #333 1px, transparent 0)', 
               backgroundSize: '32px 32px' 
             }} />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00ffaa]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      {/* ── 1. Hero Section ── */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#1a1a1a] border border-[#333] mb-8">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffaa] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00ffaa]"></span>
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#888]">v2.0: Now with AI-Powered Architecting</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-white mb-6 leading-[1.1]">
              Next Gen API Platform <br />
              <span className="text-[#00ffaa]">
                for Developers
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-lg md:text-xl text-[#888] max-w-3xl mx-auto mb-10 font-normal leading-relaxed">
              Build, test, and deploy production-grade backends in record time. 
              AutoBackend combines visual architecture with AI automation to handle the heavy lifting.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <CommandBar />
          </FadeIn>

          {/* Hero Visual Mockup */}
          <FadeIn delay={0.5}>
            <div className="mt-20 relative max-w-5xl mx-auto group">
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00ffaa]/10 via-purple-500/10 to-[#00ffaa]/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="relative rounded-2xl border border-white/10 bg-[#0b1120] p-1 shadow-2xl overflow-hidden">
                {/* Header Bar */}
                <div className="flex items-center justify-between bg-[#030712]/50 px-6 py-4 border-b border-white/5 backdrop-blur-sm">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_10px_rgba(255,95,86,0.3)]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_10px_rgba(255,189,46,0.3)]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_10px_rgba(39,201,63,0.3)]" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono tracking-[0.3em] uppercase opacity-70">
                    AutoBackend API Console
                  </div>
                  <div className="w-12 h-1 bg-white/5 rounded-full" />
                </div>

                <div className="grid grid-cols-12 h-[450px]">
                  {/* Left Sidebar */}
                  <div className="col-span-3 border-r border-white/5 bg-[#030712]/30 p-6 space-y-6">
                    <div className="space-y-3">
                      <div className="h-2 w-12 bg-[#00ffaa]/10 rounded-full" />
                      <div className="h-4 w-full bg-white/5 rounded-md" />
                      <div className="h-4 w-5/6 bg-white/5 rounded-md" />
                    </div>
                    <div className="pt-4 space-y-3">
                      <div className="h-2 w-16 bg-purple-500/10 rounded-full" />
                      <div className="h-10 w-full bg-[#00ffaa]/5 border border-[#00ffaa]/20 rounded-xl flex items-center px-3 gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#00ffaa] animate-pulse" />
                        <div className="h-2 w-16 bg-[#00ffaa]/20 rounded-full" />
                      </div>
                      <div className="h-10 w-full bg-white/5 border border-white/5 rounded-xl flex items-center px-3 gap-2">
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                        <div className="h-2 w-20 bg-white/5 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="col-span-9 p-8 flex flex-col gap-6 bg-[#030712]/10">
                    {/* URL Bar */}
                    <div className="flex gap-3">
                      <div className="h-12 w-28 bg-[#00ffaa] border border-[#00ffaa]/30 rounded-xl flex items-center justify-center text-xs font-black tracking-widest text-black shadow-lg shadow-[#00ffaa]/20">
                        POST
                      </div>
                      <div className="h-12 flex-1 bg-black/40 border border-white/10 rounded-xl flex items-center px-6 text-sm font-mono text-slate-400">
                        https://api.autobackend.io/v1/deploy
                      </div>
                    </div>

                    {/* Response Area */}
                    <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 p-8 font-mono text-sm relative group/code overflow-hidden">
                      <div className="absolute top-4 right-4 text-[10px] text-slate-600 font-bold tracking-widest uppercase">JSON Response</div>
                      <div className="space-y-1.5 relative z-10">
                        <div className="flex gap-2">
                          <span className="text-purple-400">"status"</span>: 
                          <span className="text-[#00ffaa]">"success"</span>,
                        </div>
                        <div className="flex gap-2">
                          <span className="text-purple-400">"message"</span>: 
                          <span className="text-[#00ffaa]">"Backend engine initialized"</span>,
                        </div>
                        <div className="flex gap-2">
                          <span className="text-purple-400">"latency"</span>: 
                          <span className="text-[#00ffaa]">"12ms"</span>,
                        </div>
                        <div className="flex gap-2">
                          <span className="text-purple-400">"region"</span>: 
                          <span className="text-slate-400">"us-east-1"</span>,
                        </div>
                        <div className="flex gap-2">
                          <span className="text-purple-400">"deployment"</span>: 
                          <span className="text-slate-400">"production-v2"</span>
                        </div>
                        <motion.div 
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-2 h-5 bg-[#00ffaa] inline-block align-middle ml-1"
                        />
                      </div>
                      
                      {/* Decorative Code Blur */}
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#00ffaa]/5 blur-[60px] rounded-full" />
                    </div>
                  </div>
                </div>
                
                {/* Bottom Status Bar */}
                <div className="bg-[#030712]/80 border-t border-white/5 px-6 py-3 flex justify-between items-center backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Online</span>
                    </div>
                    <div className="h-3 w-[1px] bg-white/10" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CPU: 0.2%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="h-full w-1/2 bg-gradient-to-r from-transparent via-[#00ffaa]/50 to-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 2. Feature Highlights ── */}
      <section className="py-24 px-6 bg-transparent">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-medium mb-4 tracking-tight text-white">One Platform, Endless Possibilities</h2>
              <p className="text-[#888] text-lg max-w-2xl mx-auto font-normal">
                Everything you need to manage the full lifecycle of your backend.
              </p>
            </div>
          </FadeIn>
          <FeatureCards />
        </div>
      </section>

      {/* ── 3. Product Capabilities Section ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-32">
          {/* Capability 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div className="space-y-6 text-left">
                <div className="w-10 h-10 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#00ffaa]">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-4xl font-medium text-white tracking-tight leading-tight">
                  Automate the complex, <br /> Focus on the unique.
                </h3>
                <p className="text-[#888] text-lg leading-relaxed font-normal">
                  Stop writing repetitive CRUD boilerplate. Our AI engine analyzes your schema 
                  and generates production-ready controllers, models, and routes instantly.
                </p>
                <ul className="space-y-3">
                  {[
                    'Instant CRUD Generation',
                    'Automated Database Migrations',
                    'Built-in JWT & RBAC Security',
                    'Scalable Microservices Architecture'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-[#888] font-normal text-sm">
                      <div className="w-1 h-1 rounded-full bg-[#00ffaa]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="relative group">
                <div className="relative rounded-md border border-[#1a1a1a] bg-[#0f0f0f] p-8 overflow-hidden">
                  <Code2 className="absolute top-[-20%] right-[-10%] w-64 h-64 text-[#00ffaa]/5 -rotate-12" />
                  <div className="space-y-4 font-mono text-sm">
                    <div className="flex justify-between items-center text-[#888] border-b border-[#1a1a1a] pb-2">
                      <span>controller.js</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[#00ffaa]">export const <span className="text-purple-400">createUser</span> = async (req, res) =&gt; &#123;</div>
                      <div className="pl-4 text-[#888]">const user = await <span className="text-[#00ffaa]">User</span>.create(req.body);</div>
                      <div className="pl-4 text-[#888]">return res.status(<span className="text-[#00ffaa]">201</span>).json(user);</div>
                      <div className="text-[#00ffaa]">&#125;;</div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Capability 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
            <FadeIn order={2}>
              <div className="relative group lg:order-1">
                <div className="relative rounded-md border border-[#1a1a1a] bg-[#0f0f0f] p-8">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Security', icon: <ShieldCheck />, color: 'text-[#00ffaa]' },
                      { label: 'Uptime', icon: <Activity />, color: 'text-[#00ffaa]' },
                      { label: 'Performance', icon: <Zap />, color: 'text-[#00ffaa]' },
                      { label: 'Deployment', icon: <Rocket />, color: 'text-[#00ffaa]' },
                    ].map((card, i) => (
                      <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-md p-6 flex flex-col items-center gap-2">
                        <div className={card.color}>{card.icon}</div>
                        <span className="text-[10px] font-medium uppercase tracking-widest text-[#888]">{card.label}</span>
                        <div className="text-lg font-medium text-white">99.9%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.2} order={1}>
              <div className="space-y-6 lg:order-2 text-left">
                <div className="w-10 h-10 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#00ffaa]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-4xl font-medium text-white tracking-tight leading-tight">
                  Enterprise security <br /> for every startup.
                </h3>
                <p className="text-[#888] text-lg leading-relaxed font-normal">
                  We take security seriously. Every API generated by AutoBackend follows 
                  OWASP best practices, with built-in protection against common vulnerabilities.
                </p>
                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="space-y-1">
                    <h4 className="font-medium text-white uppercase text-[10px] tracking-widest">Auth</h4>
                    <p className="text-[#888] text-xs">JWT, OAuth2, and RBAC support out of the box.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-white uppercase text-[10px] tracking-widest">Compliance</h4>
                    <p className="text-[#888] text-xs">GDPR and SOC2 ready infrastructure.</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── 4. Workflow Section ── */}
      <section className="py-24 px-6 bg-[#0f0f0f]/50 relative border-y border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-medium mb-4 tracking-tight text-white uppercase tracking-tight">The Modern Workflow</h2>
              <p className="text-[#888] text-lg max-w-2xl mx-auto font-normal">
                From idea to production in four simple steps.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Define', desc: 'Describe your data models using our Schema Modeler.' },
              { step: '02', title: 'Architect', desc: 'Let AI generate your routes, logic, and controllers.' },
              { step: '03', title: 'Preview', desc: 'Test and debug instantly in the integrated Console.' },
              { step: '04', title: 'Deploy', desc: 'One-click push to AWS, GCP, or Azure infrastructure.' },
            ].map((step, i) => (
              <FadeIn key={i} delay={0.1 * i}>
                <div className="relative p-6 rounded-md border border-[#1a1a1a] bg-[#0f0f0f] group">
                  <div className="text-4xl font-medium text-[#1a1a1a] mb-4 group-hover:text-[#00ffaa]/10 transition-colors">{step.step}</div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-white">{step.title}</h4>
                    <p className="text-[#888] text-sm leading-relaxed font-normal">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Final CTA ── */}
      <section className="py-32 px-6">
         <FadeIn>
            <div className="max-w-5xl mx-auto rounded-md bg-[#0f0f0f] border border-[#1a1a1a] p-16 text-center relative overflow-hidden group">
               <h2 className="text-5xl md:text-6xl font-medium mb-8 tracking-tight text-white uppercase tracking-tight">Accelerate Your Backend</h2>
               <p className="text-[#888] text-sm font-normal mb-10 max-w-xl mx-auto uppercase tracking-[0.2em]">Ready to build the future? Start your project today.</p>
               <Link to="/generator" className="inline-flex items-center gap-3 bg-[#00ffaa] text-black font-medium py-4 px-10 rounded-md hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider">
                  Create Project <ChevronRight className="w-4 h-4" />
               </Link>
            </div>
         </FadeIn>
      </section>

      {/* ── 6. Footer ── */}
      <footer className="relative z-10 pt-24 pb-12 px-6 border-t border-white/5 bg-[#000]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-16 mb-24">
            {/* Brand Section */}
            <div className="lg:col-span-2 space-y-8">
              <Link to="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight text-white group">
                <div className="w-10 h-10 rounded-lg bg-[#00ffaa]/10 flex items-center justify-center border border-[#00ffaa]/20 group-hover:border-[#00ffaa]/50 transition-all">
                  <Zap className="text-[#00ffaa] fill-[#00ffaa] w-5 h-5" />
                </div>
                <span>AutoBackend</span>
              </Link>
              <p className="text-[#888] font-medium leading-relaxed text-sm max-w-sm">
                The world's first AI-native backend automation platform. 
                Engineered for speed, security, and developer happiness.
              </p>
              <div className="flex gap-4">
                {[
                  { icon: <Twitter size={18} />, href: "#" },
                  { icon: <Github size={18} />, href: "#" },
                  { icon: <Linkedin size={18} />, href: "#" },
                  { icon: <Globe size={18} />, href: "#" },
                ].map((social, i) => (
                  <a key={i} href={social.href} className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#888] hover:text-[#00ffaa] hover:border-[#00ffaa]/50 transition-all shadow-lg">
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Link Columns */}
            <div className="space-y-6">
              <h5 className="font-bold text-[10px] uppercase tracking-[0.2em] text-[#888]">Platform</h5>
              <ul className="space-y-4">
                <li><Link to="/generator" className="text-sm font-bold text-slate-500 hover:text-[#00ffaa] transition-colors">API Architect</Link></li>
                <li><a href="#" className="text-sm font-bold text-slate-500 hover:text-[#00ffaa] transition-colors">API Console</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-500 hover:text-[#00ffaa] transition-colors">Schema Modeler</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-500 hover:text-[#00ffaa] transition-colors">Monitoring</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-bold text-[10px] uppercase tracking-[0.2em] text-[#888]">Company</h5>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm font-bold text-slate-500 hover:text-[#00ffaa] transition-colors">About Us</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-500 hover:text-[#00ffaa] transition-colors">Careers</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-500 hover:text-[#00ffaa] transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-500 hover:text-[#00ffaa] transition-colors">Legal</a></li>
              </ul>
            </div>

            {/* Newsletter Section */}
            <div className="lg:col-span-2 space-y-6">
              <h5 className="font-bold text-[10px] uppercase tracking-[0.2em] text-[#888]">Stay Updated</h5>
              <p className="text-sm text-slate-500 font-medium">Join 5,000+ developers getting weekly backend tips.</p>
              <form className="relative group">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-5 py-4 text-sm text-white placeholder:text-slate-700 focus:border-[#00ffaa]/50 outline-none transition-all pr-12 shadow-inner"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#00ffaa] text-black rounded-lg hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,170,0.3)]">
                  <Mail size={18} />
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-10 border-t border-[#1a1a1a] flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
              <span>© 2026 AutoBackend Inc.</span>
              <div className="h-1 w-1 rounded-full bg-slate-800" />
              <span>Made for builders</span>
            </div>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
              <a href="#" className="hover:text-white transition-colors">Status</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
