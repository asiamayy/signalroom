'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Scroll Reveal Wrapper Component for Vercel/Optimus Effect
function RevealSection({ children, delay = '0ms' }: { children: React.ReactNode; delay?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={sectionRef}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: delay }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [roiValue, setRoiValue] = useState<number>(8);
  const [isMethodologyActive, setIsMethodologyActive] = useState<boolean>(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [displayedWord, setDisplayedWord] = useState<string>('');
  const [isCharIn, setIsCharIn] = useState<boolean>(true);

  const wordsDataset = ["opinions", "objections", "blindspots", "expectations"];

  // Math Calculations Engine
  const TRADITIONAL_COST_PER_INTERVIEW = 750;
  const TRADITIONAL_HOURS_PER_INTERVIEW = 2;
  const TRADITIONAL_WEEKS_TURNAROUND = 3;

  const traditionalCost = roiValue * TRADITIONAL_COST_PER_INTERVIEW;
  const traditionalHours = roiValue * TRADITIONAL_HOURS_PER_INTERVIEW;
  const savings = traditionalCost - 99;
  const annualSavings = savings * 12;
  const calculatedReduction = Math.round((1 - (10 / (TRADITIONAL_WEEKS_TURNAROUND * 5 * 8))) * 100);

  // Character-by-Character Word Animation Loop with Flash Preventions
  useEffect(() => {
    setDisplayedWord(wordsDataset[currentWordIndex]);
    setIsCharIn(true);

    const rotationInterval = setInterval(() => {
      setIsCharIn(false); // Trigger smooth fade-out drift
      
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % wordsDataset.length);
      }, 700); // Perfectly synced to let the slow fade-out complete first
    }, 4000); // 4-second dwell cycle for premium pacing

    return () => clearInterval(rotationInterval);
  }, [currentWordIndex]);

  return (
    <div className="font-body-md overflow-x-hidden relative min-h-screen bg-white text-[#121314] antialiased">
      {/* Import Material Symbols + Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,200,0,0" rel="stylesheet" />

      {/* Structural Architectural Grid Overlay */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1c2d24 1px, transparent 1px),
            linear-gradient(to bottom, #1c2d24 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Global Premium CSS Inject */}
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        
        /* Slow, Elegant Character Reveals (No Flash / Choppiness) */
        @keyframes premiumCharIn {
          0% { 
            opacity: 0; 
            transform: translateY(0.25em) scale(0.97); 
            filter: blur(4px); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
            filter: blur(0); 
          }
        }
        @keyframes premiumCharOut {
          0% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
            filter: blur(0); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-0.25em) scale(0.97); 
            filter: blur(4px); 
          }
        }
        
        .char-reveal-span {
          display: inline-block;
          opacity: 0; /* Guard entry flash */
          will-change: transform, opacity;
        }

        .animate-char-in {
          animation: premiumCharIn 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-char-out {
          animation: premiumCharOut 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* SVG Mobile High-Density Anti-Blur Fix overrides */
        .mobile-crisp-vector {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          transform: translateZ(0);
          backface-visibility: hidden;
          content-visibility: auto;
        }

        @keyframes floatIcon {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        .group:hover .group-hover-animated-symbol {
          display: inline-block;
          animation: floatIcon 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* TopNavBar */}
      <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#1c2d24]/10 bg-white/80 px-6 sm:px-12 backdrop-blur-xl">
        <div className="flex items-center">
          <img 
            src="/signalroom-logo.svg" 
            alt="SignalRoom Logo" 
            width="142"
            height="36"
            className="h-9 w-auto object-contain mobile-crisp-vector" 
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />
        </div>
        <div className="hidden lg:flex items-center gap-10">
          <a className="text-[11px] font-medium uppercase tracking-[0.15em] border-b border-transparent hover:border-[#1c2d24]/40 text-[#454947] hover:text-[#121314] transition-all duration-300" href="#methodology">Methodology</a>
          <a className="text-[11px] font-medium uppercase tracking-[0.15em] border-b border-transparent hover:border-[#1c2d24]/40 text-[#454947] hover:text-[#121314] transition-all duration-300" href="#roi">ROI</a>
          <a className="text-[11px] font-medium uppercase tracking-[0.15em] border-b border-transparent hover:border-[#1c2d24]/40 text-[#454947] hover:text-[#121314] transition-all duration-300" href="#pricing">Pricing</a>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#454947] hover:text-[#121314] transition-colors" href="/login">Sign In</Link>
          <Link className="bg-[#1c2d24] text-white px-4 sm:px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] hover:bg-[#2e533e] transition-all duration-300 rounded-[4px] whitespace-nowrap" href="/signup">
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative border-b border-[#1c2d24]/10 pt-28 sm:pt-36 pb-16 sm:pb-20 px-6 sm:px-12">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-12 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#2e533e] leading-relaxed">Customer intelligence that turns market signals into strategic decisions</span>
            <div className="hidden sm:block h-px w-20 bg-[#1c2d24]/10" />
          </div>
          <div className="md:col-span-12 lg:col-span-10 xl:col-span-9 overflow-visible">
            <h1 className="text-[38px] sm:text-[64px] lg:text-[84px] leading-[1.1] lg:leading-[82px] tracking-tight font-normal text-[#121314] break-words lg:whitespace-nowrap" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Your market has {' '}
              <span className="relative inline-block text-[#2e533e] italic whitespace-nowrap min-w-[220px]">
                <span className="relative inline-flex overflow-visible">
                  {displayedWord.split('').map((char, idx) => (
                    <span 
                      key={`${currentWordIndex}-${idx}`}
                      className={`char-reveal-span ${isCharIn ? 'animate-char-in' : 'animate-char-out'}`}
                      style={{ animationDelay: `${idx * 45}ms` }}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </span>
                <span>.</span>
              </span><br className="hidden lg:block" />
              <span className="inline-block mt-1 lg:mt-2">Now you can ask.</span>
            </h1>
          </div>
          <div className="md:col-span-12 lg:col-start-7 lg:col-span-6 xl:col-start-8 xl:col-span-5 pt-4 sm:pt-6 flex flex-col justify-end">
            <p className="text-[14px] sm:text-[15px] text-[#454947] max-w-sm mb-6 leading-relaxed opacity-90">
              SignalRoom uses AI-powered research simulations and market intelligence to reveal customer needs, validate decisions, and uncover opportunities faster. No noise, just architecture.
            </p>
            <div className="border-l-2 pl-4 mb-6 border-[#2e533e]/30">
              <p className="text-xs font-medium uppercase tracking-wide text-[#2e533e] mb-2 leading-snug">AI-powered customer intelligence for teams building what customers actually want.</p>
              <p className="text-[11px] sm:text-[xs] text-neutral-600 leading-relaxed mb-2">Create AI customer models that represent your target audience. Interview them, test ideas, validate decisions, and generate structured insights in minutes — not weeks.</p>
              <p className="text-xs text-neutral-500 italic">Built for teams that can't afford to invest in the wrong thing.</p>
            </div>
            <div className="flex items-center gap-8">
              <button className="w-full sm:w-auto border border-[#1c2d24]/20 px-8 py-4 text-[11px] font-medium uppercase tracking-[0.3em] bg-[#1c2d24] text-white hover:bg-[#2e533e] transition-all duration-500 shadow-xl shadow-black/5 rounded-[4px]">
                Explore Platform
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Methodology Section */}
      <RevealSection>
        <section id="methodology" className="px-6 sm:px-12 py-16 sm:py-20 border-b border-[#1c2d24]/10 scroll-mt-16">
          <div 
            id="methodology-header" 
            onClick={() => setIsMethodologyActive(!isMethodologyActive)}
            className={`mb-12 sm:mb-20 flex items-end justify-between cursor-pointer group ${isMethodologyActive ? 'is-active' : ''}`}
          >
            <div className="flex-shrink-0">
              <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.3em] sm:tracking-[0.4em] text-neutral-600">00 // Operational Logic</span>
              <h2 className="text-[28px] sm:text-[36px] mt-2 sm:mt-4 tracking-tighter font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>The Methodology</h2>
            </div>
            <div className="hidden sm:block h-px flex-grow ml-16 bg-[#b5bab7]/20 relative">
              <div 
                className="absolute inset-0 bg-[#1c2d24]/30 h-full transition-all duration-600"
                style={{ 
                  width: isMethodologyActive ? '100%' : '0%', 
                  opacity: isMethodologyActive ? 1 : 0,
                  backgroundColor: isMethodologyActive ? '#1c2d24' : 'rgba(28, 45, 36, 0.3)'
                }} 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 border border-[#d1d5d3] divide-y lg:divide-y-0 lg:divide-x divide-[#d1d5d3] rounded-[4px] overflow-hidden">
            {/* Step 01 */}
            <div className="p-8 sm:p-16 group hover:bg-[#fafbfa] transition-colors duration-700">
              <div className="flex justify-between items-start mb-10 sm:mb-16">
                <span className="text-[44px] sm:text-[56px] text-[#1c2d24]/10 leading-none group-hover:text-[#1c2d24]/20 transition-colors" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>01</span>
                <span className="material-symbols-outlined group-hover-animated-symbol text-neutral-400 group-hover:text-[#1c2d24] transition-colors text-2xl sm:text-3xl">hub</span>
              </div>
              <h3 className="text-[24px] sm:text-[28px] mb-3 sm:mb-4 tracking-tight font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Ingest</h3>
              <p className="text-[14px] sm:text-[15px] text-[#454947] leading-relaxed opacity-85">
                Transform assumptions into intelligence. Bring your customer, market, and product context together to build a foundation for smarter decisions.
              </p>
            </div>
            {/* Step 02 */}
            <div className="p-8 sm:p-16 group hover:bg-[#fafbfa] transition-colors duration-700">
              <div className="flex justify-between items-start mb-10 sm:mb-16">
                <span className="text-[44px] sm:text-[56px] text-[#1c2d24]/10 leading-none group-hover:text-[#1c2d24]/20 transition-colors" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>02</span>
                <span className="material-symbols-outlined group-hover-animated-symbol text-neutral-400 group-hover:text-[#1c2d24] transition-colors text-2xl sm:text-3xl">psychology</span>
              </div>
              <h3 className="text-[24px] sm:text-[28px] mb-3 sm:mb-4 tracking-tight font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Simulate</h3>
              <p className="text-[14px] sm:text-[15px] text-[#454947] leading-relaxed opacity-85">
                Understand your customers at scale. Model customer perspectives and uncover motivations, objections, and opportunities before investing resources.
              </p>
            </div>
            {/* Step 03 */}
            <div className="p-8 sm:p-16 group hover:bg-[#fafbfa] transition-colors duration-700">
              <div className="flex justify-between items-start mb-10 sm:mb-16">
                <span className="text-[44px] sm:text-[56px] text-[#1c2d24]/10 leading-none group-hover:text-[#1c2d24]/20 transition-colors" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>03</span>
                <span className="material-symbols-outlined group-hover-animated-symbol text-neutral-400 group-hover:text-[#1c2d24] transition-colors text-2xl sm:text-3xl">location_on</span>
              </div>
              <h3 className="text-[24px] sm:text-[28px] mb-3 sm:mb-4 tracking-tight font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Decide</h3>
              <p className="text-[14px] sm:text-[15px] text-[#454947] leading-relaxed opacity-85">
                Move forward with confidence. Convert customer signals into strategic recommendations that help teams reduce risk and act faster.
              </p>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ROI Calculator */}
      <RevealSection>
        <section id="roi" className="px-6 sm:px-12 py-16 sm:py-20 bg-[#fafbfa] border-b border-[#1c2d24]/10 relative overflow-hidden scroll-mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-start">
            <div className="lg:col-span-5">
              <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-neutral-600 mb-4 sm:mb-6 block">The Value Logic</span>
              <h2 className="text-[30px] sm:text-[36px] mb-6 sm:mb-8 leading-[1.1] tracking-tighter font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Quantify the Signal. Eliminate Waste.</h2>
              <p className="text-[14px] sm:text-[15px] text-[#454947] mb-6 max-w-sm leading-relaxed opacity-90">
                Traditional research can cost thousands in software, recruiting, incentives, and analysis. SignalRoom replaces all of that for a flat monthly fee with no contracts.
              </p>
            </div>
            <div className="lg:col-start-7 lg:col-span-6">
              <div className="border border-[#d1d5d3] p-5 sm:p-10 bg-white relative rounded-[4px]">
                <div className="px-1 pb-4 mb-6 border-b border-[#d1d5d3]">
                  <h3 className="text-lg text-neutral-900 font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>See your savings</h3>
                  <p className="text-xs text-neutral-500 mt-1">Traditional tools charge $8,000+ for 6 months. Compare that to SignalRoom.</p>
                </div>
                <div className="space-y-10">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-700 block">Interviews per month</label>
                      <span className="text-neutral-900 font-normal text-xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{roiValue}</span>
                    </div>
                    <input 
                      className="w-full h-[2px] bg-[#e2e2e2] appearance-none accent-[#1c2d24] cursor-pointer rounded" 
                      id="roi-range" 
                      max="30" 
                      min="1" 
                      step="1" 
                      type="range" 
                      value={roiValue}
                      onChange={(e) => setRoiValue(parseInt(e.target.value))}
                    />
                    <div className="flex justify-between mt-3 text-[10px] tracking-[0.2em] font-medium text-neutral-600">
                      <span>1 UNIT</span>
                      <span>30 UNITS</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#d1d5d3] border border-[#d1d5d3] rounded-[4px] overflow-hidden">
                    <div className="p-5 sm:p-6">
                      <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-600 block mb-2">Traditional</span>
                      <span className="text-[28px] font-normal tracking-tighter text-neutral-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>${traditionalCost.toLocaleString()}</span>
                      <p className="text-[11px] text-neutral-600 font-medium mb-3">/month</p>
                      <div className="border-t border-[#d1d5d3] pt-3 space-y-1.5 text-[11px] text-neutral-600">
                        <div className="flex justify-between"><span>Time</span><span className="font-medium text-neutral-800">3 weeks</span></div>
                        <div className="flex justify-between"><span>Per interview</span><span className="font-medium text-neutral-800">$750</span></div>
                        <div className="flex justify-between"><span>Hours</span><span className="font-medium text-neutral-800">{traditionalHours}h</span></div>
                      </div>
                    </div>
                    <div className="p-5 sm:p-6 bg-[#e9edea]">
                      <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#1c2d24] block mb-2">SignalRoom</span>
                      <span className="text-[28px] font-normal tracking-tighter text-[#1c2d24]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>$99</span>
                      <p className="text-[11px] text-[#1c2d24] font-medium mb-3">unlimited/month</p>
                      <div className="border-t border-[#b8c2bc] pt-3 space-y-1.5 text-[11px] text-[#1c2d24]">
                        <div className="flex justify-between"><span>Time</span><span className="font-medium">Minutes</span></div>
                        <div className="flex justify-between"><span>Per interview</span><span className="font-medium">~$0</span></div>
                        <div className="flex justify-between"><span>Hours</span><span className="font-medium">&lt; 1h</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1c2d24] p-5 sm:p-6 grid grid-cols-2 gap-4 text-white rounded-[4px]">
                    <div>
                      <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-neutral-300 block mb-1">You save</span>
                      <div className="text-xl sm:text-2xl tracking-tighter" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        ${savings.toLocaleString()}<span className="text-xs font-sans font-normal text-neutral-400">/mo</span>
                      </div>
                      <div className="text-[10px] text-neutral-300 mt-0.5">${annualSavings.toLocaleString()}/year</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-medium uppercase tracking-[0.4em] text-neutral-400 block mb-1">Time saved</span>
                      <div className="text-xl sm:text-2xl tracking-tighter" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{calculatedReduction}%</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">faster</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Pricing Section */}
      <RevealSection>
        <section id="pricing" className="px-6 sm:px-12 py-16 sm:py-20 border-b border-[#1c2d24]/10 scroll-mt-16">
          <div className="text-center mb-12 sm:mb-20">
            <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-neutral-600">Subscription Models</span>
            <h2 className="text-[30px] sm:text-[36px] mt-3 sm:mt-4 tracking-tighter font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Simple pricing. No surprises.</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 border border-[#d1d5d3] divide-y lg:divide-y-0 lg:divide-x divide-[#d1d5d3] rounded-[4px] overflow-hidden">
            {/* Plan 1 */}
            <div className="p-6 sm:p-10 flex flex-col hover:bg-[#fafbfa] transition-all duration-1000 group">
              <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-neutral-700 mb-8 sm:mb-10">01 // Pulse</span>
              <h3 className="text-[28px] sm:text-[32px] mb-2 tracking-tighter font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Pulse</h3>
              <p className="text-xs text-neutral-600 mb-4">For solo founders getting started</p>
              <div className="flex items-baseline gap-2 mb-8 sm:mb-10">
                <span className="text-[40px] sm:text-[48px] tracking-tighter text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>$49</span>
                <span className="text-[11px] text-neutral-600 font-medium uppercase tracking-widest">/ month</span>
              </div>
              <ul className="space-y-4 mb-12 sm:mb-16 flex-grow">
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ 3 personas</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ 10 interviews/month</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Core templates</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Basic reports</li>
              </ul>
              <Link href="/signup" className="w-full text-center border border-[#b5bab7]/20 py-4 text-[11px] font-medium uppercase tracking-[0.3em] group-hover:bg-[#1c2d24] group-hover:text-white transition-all duration-500 rounded-[4px] text-neutral-700">Subscribe</Link>
            </div>
            {/* Plan 2 */}
            <div className="p-6 sm:p-10 flex flex-col bg-[#e9edea] relative shadow-xl shadow-black/[0.01]">
              <div className="absolute top-0 right-0 bg-[#1c2d24] text-white text-[9px] px-4 py-1.5 uppercase tracking-[0.3em]">Most popular</div>
              <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#1c2d24] mb-8 sm:mb-10">02 // Core</span>
              <h3 className="text-[28px] sm:text-[32px] mb-2 tracking-tighter text-[#1c2d24] font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Signal</h3>
              <p className="text-xs text-[#1c2d24] font-medium mb-4">For teams validating fast</p>
              <div className="flex items-baseline gap-2 mb-8 sm:mb-10">
                <span className="text-[40px] sm:text-[48px] tracking-tighter text-[#1c2d24]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>$99</span>
                <span className="text-[11px] text-[#1c2d24] font-medium uppercase tracking-widest">/ month</span>
              </div>
              <ul className="space-y-4 mb-12 sm:mb-16 flex-grow">
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Unlimited personas</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Unlimited interviews</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ All templates</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Full reports</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Multi-persona testing</li>
              </ul>
              <Link href="/signup" className="w-full text-center bg-[#1c2d24] text-white py-4 text-[11px] font-medium uppercase tracking-[0.3em] hover:bg-[#2e533e] transition-all shadow-xl shadow-black/10 rounded-[4px]">Subscribe</Link>
            </div>
            {/* Plan 3 */}
            <div className="p-6 sm:p-10 flex flex-col hover:bg-[#fafbfa] transition-all duration-1000 group thin-border">
              <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-neutral-700 mb-8 sm:mb-10">03 // Scale</span>
              <h3 className="text-[28px] sm:text-[32px] mb-2 tracking-tighter font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Broadcast</h3>
              <p className="text-xs text-neutral-500 mb-4">For agencies and growing teams</p>
              <div className="flex items-baseline gap-2 mb-8 sm:mb-10">
                <span className="text-[40px] sm:text-[48px] tracking-tighter text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>$249</span>
                <span className="text-[11px] text-neutral-600 font-medium uppercase tracking-widest">/ month</span>
              </div>
              <ul className="space-y-4 mb-12 sm:mb-16 flex-grow">
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Everything in Signal</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ 10 team seats</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ White-label reports</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Priority support</li>
              </ul>
              <Link href="/signup" className="w-full text-center border border-[#b5bab7]/30 py-4 text-[11px] font-medium uppercase tracking-[0.3em] group-hover:bg-[#1c2d24] group-hover:text-white transition-all duration-500 rounded-[4px] text-neutral-700">Subscribe</Link>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* CTA Section */}
      <RevealSection>
        <section className="relative bg-[#1c2d24] text-white py-20 sm:py-24 px-6 sm:px-12 overflow-hidden border-b border-[#1c2d24]/10">
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.6em] mb-8 sm:mb-10 opacity-60">Final Directive</span>
            <h2 className="text-[34px] sm:text-[48px] md:text-[64px] leading-[1.15] lg:leading-[1.1] max-w-4xl tracking-tighter font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              The market is speaking. It’s time you answered back.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mt-4 opacity-80 leading-relaxed">
              Find the signal before the market does.<br />
              Validate faster. Reduce risk. Build what customers actually want.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-10 w-full sm:w-auto">
              <Link href="/signup" className="w-full sm:w-auto bg-white text-[#1c2d24] px-12 py-4 text-[11px] font-medium uppercase tracking-[0.4em] hover:bg-[#f0f2f0] transition-all duration-300 rounded-[4px] text-center">
                Find the signal
              </Link>
              <Link href="/contact" className="w-full sm:w-auto border border-white/20 px-12 py-4 text-[11px] font-medium uppercase tracking-[0.4em] hover:bg-white hover:text-[#1c2d24] transition-all duration-500 rounded-[4px] text-center">
                Talk to Strategist
              </Link>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Footer */}
      <footer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-6 px-6 sm:px-12 py-16 sm:py-20 w-full bg-white relative z-10">
        <div className="sm:col-span-2 md:col-span-4">
          <div className="flex items-center gap-3 mb-6">
            <img 
              src="/signalroom-logo.svg" 
              alt="SignalRoom Logo" 
              width="140"
              height="35"
              className="h-8 w-auto object-contain mobile-crisp-vector" 
              style={{ imageRendering: '-webkit-optimize-contrast' }}
            />
          </div>
          <p className="text-[14px] sm:text-[15px] text-[#454947] max-w-xs mb-6 sm:mb-10 leading-relaxed opacity-90">
            Customer intelligence infrastructure for modern teams.
          </p>
        </div>
        <div className="md:col-start-6 md:col-span-2 space-y-3 sm:space-y-4">
          <span className="text-[11px] uppercase tracking-[0.4em] text-neutral-700 font-medium block mb-4 sm:mb-6">Legal</span>
          <Link className="block text-[9px] uppercase tracking-[0.3em] text-[#454947] hover:text-[#1c2d24] transition-colors font-medium" href="/privacy">Privacy</Link>
          <Link className="block text-[9px] uppercase tracking-[0.3em] text-[#454947] hover:text-[#1c2d24] transition-colors font-medium" href="/terms">Terms</Link>
        </div>
        <div className="md:col-span-2 space-y-3 sm:space-y-4">
          <span className="text-[11px] uppercase tracking-[0.4em] text-neutral-700 font-medium block mb-4 sm:mb-6">Support</span>
          <Link className="block text-[9px] uppercase tracking-[0.3em] text-[#454947] hover:text-[#1c2d24] transition-colors font-medium" href="/faq">FAQ</Link>
          <Link className="block text-[9px] uppercase tracking-[0.3em] text-[#454947] hover:text-[#1c2d24] transition-colors font-medium" href="/contact">Contact</Link>
        </div>
        <div className="sm:col-span-2 md:col-span-4 text-left sm:text-right flex flex-col justify-end mt-8 sm:mt-12 md:mt-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-medium leading-loose">
            © 2026 SignalRoom. All rights reserved. SignalRoom™ is a proprietary product and trademark.
          </p>
        </div>
      </footer>
    </div>
  );
}