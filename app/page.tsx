'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import IntelligenceSignal from '@/components/IntelligenceSignal';

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
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
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

interface DashboardPersona {
  id: string;
  name: string;
  title: string;
  location: string;
  imgUrl: string;
  tags: string[];
  bio: string;
  interviewQuote: string;
}

const DASHBOARD_PERSONAS: DashboardPersona[] = [
  {
    id: 'arjun',
    name: 'Arjun Sharma',
    title: 'Freelance Full-Stack Developer',
    location: 'Austin, Texas',
    imgUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    tags: ['freelancer', 'solopreneur', 'growth-focused', 'developer'],
    bio: 'Arjun moved from Bangalore to Austin three years ago and built his freelance business from scratch with no local network. He tracks his business metrics obsessively in a Notion...',
    interviewQuote: "I track my metrics closely, but my biggest blindspot is positioning. Traditional tools charge thousands just to tell me what keywords to target. With SignalRoom, I simulated a discovery call with three local tech founders and unraveled exactly why they hesitate to hire external agency contractors within twenty minutes."
  },
  {
    id: 'priya',
    name: 'Priya Nair',
    title: 'Senior Product Manager',
    location: 'Austin, Texas',
    imgUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    tags: ['startup', 'product management', 'SaaS', 'time-pressed'],
    bio: 'Priya loves the startup density but misses the slower pace of her hometown. She manages complex multi-tenant system backlogs and cross-functional user pipelines...',
    interviewQuote: "We won't buy proprietary analytical infrastructure unless it integrates natively. I am highly allergic to client-side scripts wrapper layers that degrade performance funnel metrics."
  },
  {
    id: 'marisol',
    name: 'Marisol Delgado',
    title: 'Stay-at-Home Mom & Full-Time Caregiver',
    location: 'Albuquerque, New Mexico',
    imgUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
    tags: ['stay-at-home mom', 'budget-conscious', 'caregiver', 'family-first'],
    bio: 'Marisol holds a bachelor\'s degree in Communications but left a marketing coordinator job when her second child was born with a mild developmental delay requiring extra therapeutic attention...',
    interviewQuote: "Our activation drop-off is entirely structural micro-friction. Forcing user profile registration prior to experiencing the actual utility core cuts conversion metrics by exactly 34%."
  }
];

export default function LandingPage() {
  const [roiValue, setRoiValue] = useState<number>(8);
  const [isMethodologyActive, setIsMethodologyActive] = useState<boolean>(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [displayedWord, setDisplayedWord] = useState<string>('');

  const nAnchorRef = useRef<HTMLSpanElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  const [selectedPersona, setSelectedPersona] = useState<DashboardPersona>(DASHBOARD_PERSONAS[0]);
  const [streamingText, setStreamingText] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const wordsDataset = ["opinions", "objections", "blindspots", "expectations"];

  const TRADITIONAL_COST_PER_INTERVIEW = 1250; 
  const TRADITIONAL_HOURS_PER_INTERVIEW = 6; 
  const TRADITIONAL_WEEKS_TURNAROUND = 4;

  const traditionalCost = roiValue * TRADITIONAL_COST_PER_INTERVIEW;
  const traditionalHours = roiValue * TRADITIONAL_HOURS_PER_INTERVIEW;
  
  const SIGNAL_PLAN_COST = 499;
  const savings = Math.max(0, traditionalCost - SIGNAL_PLAN_COST);
  const annualSavings = savings * 12;
  const calculatedReduction = Math.round((1 - (12 / (TRADITIONAL_WEEKS_TURNAROUND * 5 * 8))) * 100);

  useEffect(() => {
    setDisplayedWord(wordsDataset[currentWordIndex]);
    const rotationInterval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % wordsDataset.length);
    }, 3800);
    return () => clearInterval(rotationInterval);
  }, [currentWordIndex]);

  useEffect(() => {
    setStreamingText('');
    setIsSimulating(true);
    let charIdx = 0;
    const targetPayload = selectedPersona.interviewQuote;

    const stream = setInterval(() => {
      if (charIdx < targetPayload.length) {
        setStreamingText((prev) => prev + targetPayload.charAt(charIdx));
        charIdx++;
      } else {
        clearInterval(stream);
        setIsSimulating(false);
      }
    }, 8);

    return () => clearInterval(stream);
  }, [selectedPersona]);

  return (
    <div className="font-body-md overflow-x-hidden relative min-h-screen bg-[#FCFCFB] text-[#121314] antialiased">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,200,0,0" rel="stylesheet" />

      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.12] mix-blend-multiply"
        style={{
          backgroundImage: `
            linear-gradient(rgba(26, 48, 36, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26, 48, 36, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '4px 4px'
        }}
      />

      <style jsx global>{`
        html { scroll-behavior: smooth; }
        @keyframes premiumCharIn {
          0% { opacity: 0; transform: translateY(0.18em) scale(0.99); filter: blur(1.5px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        .char-reveal-span {
          display: inline-block;
          opacity: 0;
          will-change: transform, opacity;
          animation: premiumCharIn 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .mobile-crisp-vector {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          transform: translateZ(0);
          content-visibility: auto;
        }
        @keyframes subtleCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .editorial-stream-cursor {
          animation: subtleCursorBlink 1s infinite;
        }
        
        @keyframes clearIconBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-7px) scale(1.04); }
        }
        .group:hover .animate-editorial-bounce {
          animation: clearIconBounce 1.4s ease-in-out infinite;
          color: #1A3024 !important;
        }

        .eyebrow-shine-wrap {
          position: relative;
          display: inline-block;
          overflow: hidden;
        }
        .eyebrow-shine-sweep {
          position: absolute;
          top: 0;
          left: -75%;
          width: 50%;
          height: 100%;
          pointer-events: none;
          background: linear-gradient(100deg, transparent 0%, rgba(255, 255, 255, 0.65) 50%, transparent 100%);
          mix-blend-mode: overlay;
          animation: eyebrowShineSweep 15s ease-in-out infinite;
        }
        @keyframes eyebrowShineSweep {
          0% { left: -75%; }
          30% { left: 130%; }
          100% { left: 130%; }
        }
      `}</style>

      {/* TopNavBar */}
      <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#1A3024]/10 bg-white/80 px-6 sm:px-12 backdrop-blur-xl">
        <div className="flex items-center">
          <img
            src="/signalroom-logo.svg"
            alt="SignalRoom Logo"
            width="75"
            height="44"
            className="h-11 w-auto object-contain mobile-crisp-vector"
          />
        </div>
        <div className="hidden lg:flex items-center gap-10">
          <a className="text-[11px] font-medium uppercase tracking-[0.15em] border-b border-transparent hover:border-[#1A3024]/40 text-[#454947] hover:text-[#121314] transition-all duration-300" href="#dashboard-replica">Platform</a>
          <a className="text-[11px] font-medium uppercase tracking-[0.15em] border-b border-transparent hover:border-[#1A3024]/40 text-[#454947] hover:text-[#121314] transition-all duration-300" href="#methodology">Methodology</a>
          <a className="text-[11px] font-medium uppercase tracking-[0.15em] border-b border-transparent hover:border-[#1A3024]/40 text-[#454947] hover:text-[#121314] transition-all duration-300" href="#roi">ROI</a>
          <a className="text-[11px] font-medium uppercase tracking-[0.15em] border-b border-transparent hover:border-[#1A3024]/40 text-[#454947] hover:text-[#121314] transition-all duration-300" href="#pricing">Pricing</a>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#454947] hover:text-[#121314] transition-colors" href="/login">Sign In</Link>
          <Link className="bg-[#1A3024] text-white px-4 sm:px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] hover:bg-[#5A7973] transition-all duration-300 rounded-[4px] whitespace-nowrap" href="/signup">
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero Header Section */}
      <header className="relative pt-16 sm:pt-24 pb-12 sm:pb-16 px-6 sm:px-12 z-10">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Eyebrow sub-header */}
          <div className="md:col-span-12 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="eyebrow-shine-wrap">
              <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#5A7973] leading-relaxed">Customer intelligence that turns market signals into strategic decisions</span>
              <span className="eyebrow-shine-sweep" aria-hidden="true" />
            </span>
            <div className="hidden sm:block h-px w-20 bg-[#1A3024]/10" />
          </div>

          {/* LEFT SIDE */}
          <div className="md:col-span-12 lg:col-span-7 flex flex-col justify-between min-h-[350px] overflow-visible">
            <h1 className="text-[38px] sm:text-[64px] lg:text-[84px] leading-[1.1] lg:leading-[82px] tracking-tight font-normal text-[#121314] break-words" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              <span className="block lg:whitespace-nowrap">
                Your market has {' '}
                <span className="relative inline-block text-[#AAB0A3] italic whitespace-nowrap min-w-[220px]">
                  <span className="relative inline-flex overflow-visible">
                    {displayedWord.split('').map((char, idx) => (
                      <span
                        key={`${currentWordIndex}-${idx}`}
                        className="char-reveal-span"
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </span>
                    ))}
                  </span>
                  <span>.</span>
                </span>
              </span>
              <span className="block mt-1 lg:mt-2"><span ref={nAnchorRef}>N</span>ow you can ask.</span>
            </h1>

            <div className="mt-4 mb-4 w-full max-w-[900px] bg-transparent overflow-visible">
              <IntelligenceSignal anchorRef={nAnchorRef} boundaryRef={rightColRef} />
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div ref={rightColRef} className="md:col-span-12 lg:col-span-5 lg:pt-64 flex flex-col justify-start lg:self-start">
            <div className="border-l-2 pl-4 mb-6 border-[#5A7973]/30">
              <p className="text-xs font-medium uppercase tracking-wide text-[#1A3024] mb-2 leading-snug">AI-powered customer intelligence for teams building what customers actually want.</p>
              
              <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed mb-2">
                SignalRoom uses AI-powered research simulations and market intelligence to reveal customer needs, validate decisions, and uncover opportunities faster. No noise, just architecture.
              </p>
              
              <p className="text-xs text-neutral-500 italic">Built for teams that can't afford to invest in the wrong thing.</p>
            </div>

            <div className="flex items-center gap-8">
              <a href="#dashboard-replica" className="w-full sm:w-auto text-center border border-[#1A3024]/20 px-8 py-4 text-[11px] font-medium uppercase tracking-[0.3em] bg-[#1A3024] text-white hover:bg-[#5A7973] transition-all duration-500 shadow-xl shadow-black/5 rounded-[4px]">
                Explore Platform
              </a>
            </div>
          </div>

        </div>
      </header>

      {/* DASHBOARD PREVIEW WORKSPACE */}
      <RevealSection>
        <section id="dashboard-replica" className="px-6 sm:px-12 pb-16 sm:pb-24 scroll-mt-20 z-10 relative">
          <div className="bg-[#F4F5F4] border border-[#E3E5E3] rounded-[12px] shadow-xs min-h-[640px] grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            
            <div className="md:col-span-3 lg:col-span-2 bg-white border-r border-[#E3E5E3] p-5 flex flex-col justify-between hidden md:flex">
              <div className="space-y-8">
                <div className="px-2 text-[11px] font-mono tracking-widest text-neutral-400 font-medium uppercase">Navigation</div>
                <div className="space-y-1">
                  {[
                    { n: 'Home', i: 'home', a: false },
                    { n: 'Projects', i: 'folder', a: false },
                    { n: 'Personas', i: 'groups', a: true },
                    { n: 'Interviews', i: 'chat_bubble', a: false },
                    { n: 'Compare', i: 'compare_arrows', a: false },
                    { n: 'Audience Panel', i: 'assignment_ind', a: false },
                    { n: 'Signals', i: 'analytics', a: false },
                    { n: 'Insights', i: 'insights', a: false }
                  ].map((route, rIdx) => (
                    <div 
                      key={rIdx} 
                      className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium tracking-tight rounded-[6px] transition-colors ${
                        route.a ? 'bg-[#D1D6CE] text-[#1A3024]' : 'text-neutral-500 opacity-80'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{route.i}</span>
                      {route.n}
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-6 border-t border-[#E3E5E3] space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold font-mono text-neutral-400 block px-2">Recent Projects</span>
                <div className="flex items-center gap-2 px-2 py-1 text-[12px] text-neutral-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A3024]" />
                  Sustainable Skincare L...
                </div>
              </div>
            </div>

            <div className="md:col-span-9 lg:col-span-10 p-6 sm:p-10 flex flex-col justify-between bg-[#F4F5F4] relative">
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 mb-6">
                  <div>
                    <h2 className="text-[32px] font-normal text-neutral-900 tracking-tight leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Personas</h2>
                    <p className="text-xs text-neutral-500 mt-2 max-w-2xl">AI-generated personas built from real research. Explore beliefs, behaviors, needs, and motivations.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button disabled className="bg-[#1A3024] text-white px-4 py-2 text-[12px] font-medium rounded-[6px] opacity-95 cursor-not-allowed flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">add</span> Create Persona
                    </button>
                    <button disabled className="border border-[#E3E5E3] text-neutral-600 px-3 py-2 text-[12px] rounded-[6px] bg-white cursor-not-allowed flex items-center gap-1"><span className="material-symbols-outlined text-sm">tune</span> Filters</button>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-[#E3E5E3] text-[12px] whitespace-nowrap font-medium">
                  <span className="bg-[#1A3024] text-white px-3 py-1.5 rounded-[6px]">All Personas <span className="opacity-60 ml-1 text-xs bg-black/20 px-1.5 py-0.5 rounded-full">3</span></span>
                  <span className="border border-[#E3E5E3] text-neutral-500 px-3 py-1.5 rounded-[6px] bg-white">Awareness <span className="opacity-50 text-xs">0</span></span>
                  <span className="border border-[#E3E5E3] text-neutral-500 px-3 py-1.5 rounded-[6px] bg-white">Consideration <span className="opacity-50 text-xs">0</span></span>
                  <span className="border border-[#E3E5E3] text-neutral-500 px-3 py-1.5 rounded-[6px] bg-white">Purchase <span className="opacity-50 text-xs">0</span></span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {DASHBOARD_PERSONAS.map((persona) => {
                    const isSelected = selectedPersona.id === persona.id;
                    return (
                      <div 
                        key={persona.id}
                        onClick={() => !isSimulating && setSelectedPersona(persona)}
                        className={`border p-6 rounded-[12px] transition-all duration-500 flex flex-col justify-between relative group ${
                          isSelected 
                            ? 'bg-[#E3E5E3] border-neutral-400 shadow-xs scale-[1.01]' 
                            : 'bg-white border-[#E3E5E3] opacity-80 hover:opacity-100 hover:border-neutral-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-start gap-4 mb-4">
                            <img src={persona.imgUrl} alt={persona.name} className="w-14 h-14 rounded-[8px] object-cover border border-neutral-100" />
                            <div>
                              <h4 className="text-[20px] font-normal text-neutral-900 tracking-tight leading-snug" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{persona.name}</h4>
                              <p className="text-[12px] text-neutral-500 font-light mt-0.5">{persona.title}</p>
                              <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-0.5 font-light">
                                <span className="material-symbols-outlined text-[12px]">location_on</span> {persona.location}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {persona.tags.map((tag, tIdx) => (
                              <span key={tIdx} className="bg-[#F4F5F4] text-neutral-600 text-[10px] px-2.5 py-0.5 rounded-[4px] border border-[#E3E5E3]/60 font-light">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-[12px] text-neutral-600 leading-relaxed font-light mb-6">
                            {persona.bio}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-neutral-200/50">
                          <button disabled className="w-full text-center border border-[#E3E5E3] bg-white text-neutral-700 py-2 rounded-[6px] text-[12px] font-medium cursor-not-allowed">View Details</button>
                          <button 
                            className={`w-full text-center py-2 rounded-[6px] text-[12px] font-medium transition-all ${
                              isSelected 
                                ? 'bg-[#1A3024] text-white font-semibold' 
                                : 'bg-[#1A3024] text-white hover:bg-[#5A7973]'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Start Interview'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 bg-white border border-[#E3E5E3] p-6 rounded-[8px] relative transition-all">
                  <div className="flex items-center justify-between border-b border-[#E3E5E3]/60 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#1A3024] animate-pulse" />
                      <h4 className="text-[16px] font-normal text-neutral-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Simulated Dialogue Panel // Response from {selectedPersona.name}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">STATUS: PIPELINE_ACTIVE</span>
                  </div>
                  <p className="text-[13px] text-neutral-700 font-light leading-relaxed italic">
                    "{streamingText}"
                    {isSimulating && (
                      <span className="inline-block w-1 h-3.5 bg-[#1A3024] ml-1 editorial-stream-cursor align-middle" />
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E3E5E3] mt-8 flex justify-between items-center text-neutral-400 text-[11px] font-light">
                <span>Interactive Sandboxed Preview Engine</span>
                <span className="text-[#1A3024] font-medium uppercase tracking-wider text-[10px]">Select cards above to alternate streams</span>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Methodology Section */}
      <RevealSection>
        <section id="methodology" className="px-6 sm:px-12 py-16 sm:py-20 border-t border-b border-[#1A3024]/10 scroll-mt-16 z-10 relative">
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
                className="absolute inset-0 bg-[#1A3024]/30 h-full transition-all duration-600"
                style={{ 
                  width: isMethodologyActive ? '100%' : '0%', 
                  opacity: isMethodologyActive ? 1 : 0,
                  backgroundColor: '#1A3024'
                }} 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 border border-[#d1d5d3] divide-y lg:divide-y-0 lg:divide-x divide-[#d1d5d3] rounded-[4px] overflow-hidden bg-white">
            <div className="p-8 sm:p-16 group hover:bg-[#fafbfa] transition-all duration-500">
              <div className="flex justify-between items-start mb-10 sm:mb-16">
                <span className="text-[44px] sm:text-[56px] text-[#1A3024]/10 leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>01</span>
                <span className="material-symbols-outlined text-neutral-400 text-2xl sm:text-3xl transition-all duration-300 transform animate-editorial-bounce">hub</span>
              </div>
              <h3 className="text-[24px] sm:text-[28px] mb-3 sm:mb-4 tracking-tight font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Ingest</h3>
              <p className="text-[14px] sm:text-[15px] text-[#454947] leading-relaxed opacity-85">
                Transform assumptions into intelligence. Bring your customer, market, and product context together to build a foundation for smarter decisions.
              </p>
            </div>
            <div className="p-8 sm:p-16 group hover:bg-[#fafbfa] transition-all duration-500">
              <div className="flex justify-between items-start mb-10 sm:mb-16">
                <span className="text-[44px] sm:text-[56px] text-[#1A3024]/10 leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>02</span>
                <span className="material-symbols-outlined text-neutral-400 text-2xl sm:text-3xl transition-all duration-300 transform animate-editorial-bounce">psychology</span>
              </div>
              <h3 className="text-[24px] sm:text-[28px] mb-3 sm:mb-4 tracking-tight font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Simulate</h3>
              <p className="text-[14px] sm:text-[15px] text-[#454947] leading-relaxed opacity-85">
                Understand your customers at scale. Model customer perspectives and uncover motivations, objections, and opportunities before investing resources.
              </p>
            </div>
            <div className="p-8 sm:p-16 group hover:bg-[#fafbfa] transition-all duration-500">
              <div className="flex justify-between items-start mb-10 sm:mb-16">
                <span className="text-[44px] sm:text-[56px] text-[#1A3024]/10 leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>03</span>
                <span className="material-symbols-outlined text-neutral-400 text-2xl sm:text-3xl transition-all duration-300 transform animate-editorial-bounce">location_on</span>
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
        <section id="roi" className="px-6 sm:px-12 py-16 sm:py-20 bg-[#fafbfa] border-b border-[#1A3024]/10 relative overflow-hidden scroll-mt-16 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-start">
            <div className="lg:col-span-5">
              <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-neutral-600 mb-4 sm:mb-6 block">The Value Logic</span>
              <h2 className="text-[30px] sm:text-[36px] mb-6 sm:mb-8 leading-[1.1] tracking-tighter font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Quantify the Signal. Eliminate Waste.</h2>
              <p className="text-[14px] sm:text-[15px] text-[#454947] mb-6 max-w-sm leading-relaxed opacity-90">
                Traditional research engagements can cost $15,000+ for a single study. SignalRoom gives teams continuous customer intelligence at a predictable monthly cost.
              </p>
            </div>
            <div className="lg:col-start-7 lg:col-span-6">
              <div className="border border-[#d1d5d3] p-5 sm:p-10 bg-white relative rounded-[4px]">
                <div className="px-1 pb-4 mb-6 border-b border-[#d1d5d3]">
                  <h3 className="text-lg text-neutral-900 font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>See your savings</h3>
                  <p className="text-xs text-neutral-500 mt-1">Traditional research costs thousands. See how SignalRoom compares.</p>
                </div>
                <div className="space-y-10">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-700 block">Interviews per month</label>
                      <span className="text-neutral-900 font-normal text-xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{roiValue}</span>
                    </div>
                    <input 
                      className="w-full h-[2px] bg-[#e2e2e2] appearance-none accent-[#1A3024] cursor-pointer rounded" 
                      id="roi-range" max="30" min="1" step="1" type="range" value={roiValue}
                      onChange={(e) => setRoiValue(parseInt(e.target.value))}
                    />
                    <div className="flex justify-between mt-3 text-[10px] tracking-[0.2em] font-medium text-neutral-600">
                      <span>1 UNIT</span>
                      <span>30 UNITS</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#d1d5d3] border border-[#d1d5d3] rounded-[4px] overflow-hidden">
                    <div className="p-5 sm:p-6">
                      <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-700 block mb-2">Traditional</span>
                      <span className="text-[28px] font-normal tracking-tighter text-neutral-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>${traditionalCost.toLocaleString()}</span>
                      <p className="text-[11px] text-neutral-600 font-medium mb-3">/month</p>
                      <div className="border-t border-[#d1d5d3] pt-3 space-y-1.5 text-[11px] text-neutral-600">
                        <div className="flex justify-between"><span>Time</span><span className="font-medium text-neutral-800">4 weeks</span></div>
                        <div className="flex justify-between"><span>Per interview</span><span className="font-medium text-neutral-800">$1,250</span></div>
                        <div className="flex justify-between"><span>Hours</span><span className="font-medium text-neutral-800">{traditionalHours}h</span></div>
                      </div>
                    </div>
                    <div className="p-5 sm:p-6 bg-[#e9edea]">
                      <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#1A3024] block mb-2">SignalRoom</span>
                      <span className="text-[28px] font-normal tracking-tighter text-[#1A3024]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>$499</span>
                      <p className="text-[11px] text-[#1A3024] font-medium mb-3">unlimited/month</p>
                      <div className="border-t border-[#b8c2bc] pt-3 space-y-1.5 text-[11px] text-[#1A3024]">
                        <div className="flex justify-between"><span>Time</span><span className="font-medium">Minutes</span></div>
                        <div className="flex justify-between"><span>Per interview</span><span className="font-medium">~$0</span></div>
                        <div className="flex justify-between"><span>Hours</span><span className="font-medium">&lt; 1h</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1A3024] p-5 sm:p-6 grid grid-cols-2 gap-4 text-white rounded-[4px]">
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
        <section id="pricing" className="px-6 sm:px-12 py-16 sm:py-20 border-b border-[#1A3024]/10 scroll-mt-16 z-10 relative">
          <div className="text-center mb-12 sm:mb-20">
            <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-neutral-600">Subscription Models</span>
            <h2 className="text-[30px] sm:text-[36px] mt-3 sm:mt-4 tracking-tighter font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Built for validation. Designed for scale.</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 border border-[#d1d5d3] divide-y lg:divide-y-0 lg:divide-x divide-[#d1d5d3] rounded-[4px] overflow-hidden bg-white">
            
            {/* 01 // Starter */}
            <div className="p-6 sm:p-10 flex flex-col hover:bg-[#fafbfa] transition-all duration-1000 group">
              <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-neutral-700 mb-8 sm:mb-10">01 // Starter</span>
              <h3 className="text-[28px] sm:text-[32px] mb-2 tracking-tighter font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Pulse</h3>
              <p className="text-xs text-neutral-600 mb-4">Validate ideas before investing months of engineering time. Simulate customer conversations and uncover demand signals early.</p>
              <div className="flex items-baseline gap-2 mb-8 sm:mb-10">
                <span className="text-[40px] sm:text-[48px] tracking-tighter text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>$199</span>
                <span className="text-[11px] text-neutral-600 font-medium uppercase tracking-widest">/ month</span>
              </div>
              <ul className="space-y-4 mb-12 sm:mb-16 flex-grow">
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ 3 active research projects</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ 10 AI customer personas</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Core simulation dialogue templates</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Automated intelligence summaries</li>
              </ul>
              <Link href="/signup" className="w-full text-center border border-[#b5bab7]/20 py-4 text-[11px] font-medium uppercase tracking-[0.3em] group-hover:bg-[#1A3024] group-hover:text-white transition-all duration-500 rounded-[4px] text-neutral-700">Subscribe</Link>
            </div>

            {/* 02 // Professional */}
            <div className="p-6 sm:p-10 flex flex-col bg-[#e9edea] relative shadow-xl shadow-black/[0.01]">
              <div className="absolute top-0 right-0 bg-[#1A3024] text-white text-[9px] px-4 py-1.5 uppercase tracking-[0.3em]">Most popular</div>
              <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#1A3024] mb-8 sm:mb-10">02 // Professional</span>
              <h3 className="text-[28px] sm:text-[32px] mb-2 tracking-tighter text-[#1A3024] font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Signal</h3>
              <p className="text-xs text-[#1A3024] font-medium mb-4">Replace slow research cycles with continuous customer intelligence for faster product decisions.</p>
              <div className="flex items-baseline gap-2 mb-8 sm:mb-10">
                <span className="text-[40px] sm:text-[48px] tracking-tighter text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>$499</span>
                <span className="text-[11px] text-[#1A3024] font-medium uppercase tracking-widest">/ month</span>
              </div>
              <ul className="space-y-4 mb-12 sm:mb-16 flex-grow">
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Unlimited research projects</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Unlimited AI customer personas</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Unlimited simulated interviews</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Executive-ready research reports</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Multi-persona comparative analysis</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Advanced insight synthesis</li>
              </ul>
              <Link href="/signup" className="w-full text-center bg-[#1A3024] text-white py-4 text-[11px] font-medium uppercase tracking-[0.4em] hover:bg-[#5A7973] transition-all shadow-xl shadow-black/10 rounded-[4px]">Subscribe</Link>
            </div>

            {/* 03 // Enterprise */}
            <div className="p-6 sm:p-10 flex flex-col hover:bg-[#fafbfa] transition-all duration-1000 group thin-border">
              <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-neutral-700 mb-8 sm:mb-10">03 // Enterprise</span>
              <h3 className="text-[28px] sm:text-[32px] mb-2 tracking-tighter font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Broadcast</h3>
              <p className="text-xs text-neutral-500 mb-4">For agencies and growing teams requiring comprehensive organization-wide research scaling.</p>
              <div className="flex items-baseline gap-2 mb-8 sm:mb-10">
                <span className="text-[40px] sm:text-[48px] tracking-tighter text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>$999</span>
                <span className="text-[11px] text-neutral-600 font-medium uppercase tracking-widest">/ month</span>
              </div>
              <ul className="space-y-4 mb-12 sm:mb-16 flex-grow">
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Everything in Signal</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ 10 collaborative team seats</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ White-label executive reports</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Shared research workspace</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Organization-wide project management</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Priority feature access</li>
              </ul>
              <Link href="/signup" className="w-full text-center border border-[#b5bab7]/30 py-4 text-[11px] font-medium uppercase tracking-[0.3em] group-hover:bg-[#1A3024] group-hover:text-white transition-all duration-500 rounded-[4px] text-neutral-700">Subscribe</Link>
            </div>

          </div>

          {/* Enterprise Anchor Notice */}
          <div className="mt-8 text-center">
            <p className="text-xs text-neutral-500">
              For teams scaling customer intelligence across the organization,{' '}
              <Link href="/contact" className="text-[#1A3024] font-medium underline hover:text-[#5A7973] transition-colors">
                contact us for tailored enterprise solutions
              </Link>.
            </p>
          </div>

        </section>
      </RevealSection>

      {/* CTA Section */}
      <RevealSection>
        <section className="relative bg-[#1A3024] text-white py-20 sm:py-24 px-6 sm:px-12 overflow-hidden border-b border-[#1A3024]/10 z-10">
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
              <Link href="/signup" className="w-full sm:w-auto bg-white text-[#1A3024] px-12 py-4 text-[11px] font-medium uppercase tracking-[0.4em] hover:bg-[#f0f2f0] transition-all duration-300 rounded-[4px] text-center">
                Find the signal
              </Link>
              <Link href="/contact" className="w-full sm:w-auto border border-white/20 px-12 py-4 text-[11px] font-medium uppercase tracking-[0.4em] hover:bg-white hover:text-[#1A3024] transition-all duration-500 rounded-[4px] text-center">
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
              width="109"
              height="64"
              className="h-16 w-auto object-contain mobile-crisp-vector"
            />
          </div>
          <p className="text-[14px] sm:text-[15px] text-[#454947] max-w-xs mb-6 sm:mb-10 leading-relaxed opacity-90">
            Customer intelligence infrastructure for modern teams.
          </p>
        </div>
        <div className="md:col-start-6 md:col-span-2 space-y-3 sm:space-y-4">
          <span className="text-[11px] uppercase tracking-[0.4em] text-neutral-700 font-medium block mb-4 sm:mb-6">Legal</span>
          <Link className="block text-[9px] uppercase tracking-[0.3em] text-[#454947] hover:text-[#1A3024] transition-colors font-medium" href="/privacy">Privacy</Link>
          <Link className="block text-[9px] uppercase tracking-[0.3em] text-[#454947] hover:text-[#1A3024] transition-colors font-medium" href="/terms">Terms</Link>
        </div>
        <div className="md:col-span-2 space-y-3 sm:space-y-4">
          <span className="text-[11px] uppercase tracking-[0.4em] text-neutral-700 font-medium block mb-4 sm:mb-6">Support</span>
          <Link className="block text-[9px] uppercase tracking-[0.3em] text-[#454947] hover:text-[#1A3024] transition-colors font-medium" href="/faq">FAQ</Link>
          <Link className="block text-[9px] uppercase tracking-[0.3em] text-[#454947] hover:text-[#1A3024] transition-colors font-medium" href="/contact">Contact</Link>
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