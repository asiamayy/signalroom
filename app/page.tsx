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
      className={`transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: delay }}
    >
      {children}
    </div>
  );
}

// Slack's four-color mark — used to indicate real integration compatibility,
// not affiliation with or endorsement by Slack.
function SlackMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 122.8 122.8" xmlns="http://www.w3.org/2000/svg">
      <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9z" fill="#E01E5A" />
      <path d="M32.3 77.6c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#E01E5A" />
      <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2z" fill="#36C5F0" />
      <path d="M45.2 32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36C5F0" />
      <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2z" fill="#2EB67D" />
      <path d="M90.5 45.2c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2EB67D" />
      <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9z" fill="#ECB22E" />
      <path d="M77.6 90.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ECB22E" />
    </svg>
  );
}

// Notion's app-icon mark — used to indicate real integration compatibility,
// not affiliation with or endorsement by Notion.
function NotionMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="92" height="92" rx="18" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="4" />
      <path d="M30 28 h10 l24 36 V28 h8 v44 h-10 l-24-36 v36 h-8 Z" fill="#1A1A1A" />
    </svg>
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
  question: string;
  interviewQuote: string;
}

const DASHBOARD_PERSONAS: DashboardPersona[] = [
  {
    id: 'arjun',
    name: 'Arjun Sharma',
    title: 'Freelance Full-Stack Developer',
    location: 'Austin, Texas',
    imgUrl: '/landing-personas/arjun.jpg',
    tags: ['freelancer', 'solopreneur', 'growth-focused', 'developer'],
    bio: 'Arjun moved from Bangalore to Austin three years ago and built his freelance business from scratch with no local network. He tracks his business metrics obsessively in a Notion...',
    question: "What's your honest first reaction to a tool that simulates customer interviews instead of running real ones?",
    interviewQuote: "I track my metrics closely, but my biggest blindspot is positioning. Traditional research firms charge thousands just to tell me what keywords to target. Something like this — where I could talk through my pitch with a few realistic founder personas before I ever cold-email someone — would've saved me a lot of guessing early on."
  },
  {
    id: 'priya',
    name: 'Priya Nair',
    title: 'Senior Product Manager',
    location: 'Austin, Texas',
    imgUrl: '/landing-personas/priya.jpg',
    tags: ['startup', 'product management', 'SaaS', 'time-pressed'],
    bio: 'Priya loves the startup density but misses the slower pace of her hometown. She manages complex multi-tenant system backlogs and cross-functional user pipelines...',
    question: "Would a $499/month research tool actually replace what your team does today for user testing?",
    interviewQuote: "Honestly, I'd be skeptical at first — my team is already stretched thin, and I don't want to babysit one more tool. But if it got me a directionally-useful read in an afternoon instead of waiting three weeks for a research firm, I'd run it in parallel on one feature before trusting it with something bigger."
  },
  {
    id: 'marisol',
    name: 'Marisol Delgado',
    title: 'Stay-at-Home Mom & Full-Time Caregiver',
    location: 'Albuquerque, New Mexico',
    imgUrl: '/landing-personas/marisol.jpg',
    tags: ['stay-at-home mom', 'budget-conscious', 'caregiver', 'family-first'],
    bio: 'Marisol holds a bachelor\'s degree in Communications but left a marketing coordinator job when her second child was born with a mild developmental delay requiring extra therapeutic attention...',
    question: "If a company asked you to try a new budgeting app, what would actually make you trust it enough to use it?",
    interviewQuote: "I'd want to see exactly how it helps before I hand over my email just to find out. Between the kids and our budget, I don't have patience for another app that makes me sign up first and figure out later if it's even useful — let me try it, then ask for my info."
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

  const wordsDataset = ["signals", "opinions", "objections", "blindspots", "expectations"];

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
    const targetPayload = selectedPersona.interviewQuote;
    let charCount = 0;

    // Recompute the substring from scratch each tick (rather than
    // accumulating via prev + char) so this stays correct even under
    // React Strict Mode's dev-only double effect invocation, which
    // otherwise risks losing the first character or two.
    const stream = setInterval(() => {
      charCount++;
      setStreamingText(targetPayload.slice(0, charCount));
      if (charCount >= targetPayload.length) {
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

        /* Gentler hover drift for the Integrations icon — a smaller nudge
           than the Methodology bounce, not a repeat of it. */
        @keyframes subtleIconDrift {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-2px) scale(1.03); }
        }
        .group:hover .animate-icon-subtle {
          animation: subtleIconDrift 2.2s ease-in-out infinite;
          color: #1A3024 !important;
        }

        /* Integration flow lines — a soft gradient streak travels from
           SignalRoom out to each connected tool (that's the real direction:
           SignalRoom pushes reports/signals out to Slack/Notion). Linear
           timing keeps the speed constant through the loop point — an
           ease-in-out here decelerates to a standstill right at the reset
           and then has to accelerate again, which reads as a visible
           stop-and-restart instead of one continuous glide. Same duration
           on both lines so they stay in sync without JS timing. */
        /* -176 is a clean multiple of the 44px dash pattern (16 dash + 28
           gap) below, so the loop point lands on an identical phase of the
           pattern instead of snapping visibly when it resets. */
        @keyframes flowDash {
          to { stroke-dashoffset: -176; }
        }
        .flow-dash {
          stroke-dasharray: 16 28;
          animation: flowDash 3.6s linear infinite;
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

        /* A restrained, product-shaped animation for the toolkit preview. */
        @keyframes toolkitPreviewScan {
          0%, 18% { transform: translateX(-135%); opacity: 0; }
          28% { opacity: 0.9; }
          68% { opacity: 0.9; }
          78%, 100% { transform: translateX(260%); opacity: 0; }
        }
        .toolkit-preview-scan { animation: toolkitPreviewScan 6.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        @keyframes toolkitPreviewBar {
          0%, 12% { transform: scaleX(0.38); opacity: 0.55; }
          42%, 78% { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(0.72); opacity: 0.8; }
        }
        .toolkit-preview-bar { transform-origin: left; animation: toolkitPreviewBar 4.8s ease-in-out infinite; }
        .toolkit-preview-bar-delay { animation-delay: -1.5s; }
        .toolkit-preview-bar-delay-2 { animation-delay: -3s; }
        @keyframes toolkitPreviewFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .toolkit-preview-float { animation: toolkitPreviewFloat 4.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .toolkit-preview-scan, .toolkit-preview-bar, .toolkit-preview-float { animation: none; }
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
          <a className="text-[11px] font-medium uppercase tracking-[0.15em] border-b border-transparent hover:border-[#1A3024]/40 text-[#454947] hover:text-[#121314] transition-all duration-300" href="#features">Features</a>
          <a className="text-[11px] font-medium uppercase tracking-[0.15em] border-b border-transparent hover:border-[#1A3024]/40 text-[#454947] hover:text-[#121314] transition-all duration-300" href="#integrations">Integrations</a>
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
                        {char === ' ' ? ' ' : char}
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
              <p className="text-xs font-medium uppercase tracking-wide text-[#1A3024] mb-2 leading-snug">AI-powered customer intelligence for brands and teams building what customers actually want.</p>
              
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
          <div className="bg-[#FCF9F8] border border-[#E3E5E3] rounded-[12px] shadow-xs min-h-[640px] grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            
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

            <div className="md:col-span-9 lg:col-span-10 p-6 sm:p-10 flex flex-col justify-between bg-[#FCF9F8] relative">
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
                              <span key={tIdx} className="bg-[#FCF9F8] text-neutral-600 text-[10px] px-2.5 py-0.5 rounded-[4px] border border-[#E3E5E3]/60 font-light">
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

                <div className="mt-8 space-y-4">
                  {/* Researcher question — mirrors the real Interview Chat's "You" bubble */}
                  <div className="flex flex-col gap-1.5 items-end">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">You</span>
                    <div className="rounded-xl px-5 py-3.5 max-w-[92%] sm:max-w-[85%] bg-[#1A3024] shadow-sm">
                      <p className="text-sm font-light leading-relaxed text-white">{selectedPersona.question}</p>
                    </div>
                  </div>

                  {/* Persona response — mirrors the real Interview Chat's persona bubble */}
                  <div className="flex flex-col gap-1.5 items-start group">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                      <img src={selectedPersona.imgUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                      {selectedPersona.name}
                    </span>
                    <div className="rounded-xl px-5 py-3.5 max-w-[92%] sm:max-w-[85%] bg-white border border-[#E3E5E3] shadow-sm group-hover:shadow-md transition-shadow duration-300">
                      <p className="text-[13px] text-neutral-700 font-light leading-relaxed">
                        {streamingText}
                        {isSimulating && (
                          <span className="inline-block w-1 h-3.5 bg-[#1A3024] ml-1 editorial-stream-cursor align-middle" />
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E3E5E3] mt-8 flex justify-between items-center text-neutral-400 text-[11px] font-light">
                <span>Example persona exchange</span>
                <span className="text-[#1A3024] font-medium uppercase tracking-wider text-[10px]">Click a card above to preview another persona</span>
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
                Transform assumptions into intelligence. Bring your customer, market, brand, and product context together to build a foundation for smarter decisions.
              </p>
            </div>
            <div className="p-8 sm:p-16 group hover:bg-[#fafbfa] transition-all duration-500">
              <div className="flex justify-between items-start mb-10 sm:mb-16">
                <span className="text-[44px] sm:text-[56px] text-[#1A3024]/10 leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>02</span>
                <span className="material-symbols-outlined text-neutral-400 text-2xl sm:text-3xl transition-all duration-300 transform animate-editorial-bounce">psychology</span>
              </div>
              <h3 className="text-[24px] sm:text-[28px] mb-3 sm:mb-4 tracking-tight font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Simulate</h3>
              <p className="text-[14px] sm:text-[15px] text-[#454947] leading-relaxed opacity-85">
                Understand your customers at scale. Model perspectives, uncover motivations, objections, and opportunities before investing time, media, inventory, or engineering resources.
              </p>
            </div>
            <div className="p-8 sm:p-16 group hover:bg-[#fafbfa] transition-all duration-500">
              <div className="flex justify-between items-start mb-10 sm:mb-16">
                <span className="text-[44px] sm:text-[56px] text-[#1A3024]/10 leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>03</span>
                <span className="material-symbols-outlined text-neutral-400 text-2xl sm:text-3xl transition-all duration-300 transform animate-editorial-bounce">location_on</span>
              </div>
              <h3 className="text-[24px] sm:text-[28px] mb-3 sm:mb-4 tracking-tight font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Decide</h3>
              <p className="text-[14px] sm:text-[15px] text-[#454947] leading-relaxed opacity-85">
                Move forward with confidence. Convert customer signals into strategic recommendations that help teams reduce risk and act faster across product, brand, and go-to-market decisions.
              </p>
            </div>
          </div>
        </section>
      </RevealSection>
{/* Confidence Score demo — mirrors the report-page Confidence Score */}
      <div className="relative">
        {/* We use a local state-wrapped inner block to handle the scroll-triggered ring draw */}
        {(() => {
          const [hasLoaded, setHasLoaded] = React.useState(false);
          const elementRef = React.useRef<HTMLDivElement>(null);

          React.useEffect(() => {
            const observer = new IntersectionObserver(
              ([entry]) => {
                if (entry.isIntersecting) {
                  setHasLoaded(true);
                  observer.unobserve(entry.target);
                }
              },
              { threshold: 0.2 }
            );

            if (elementRef.current) {
              observer.observe(elementRef.current);
            }

            return () => observer.disconnect();
          }, []);

          return (
            <RevealSection>
              <section 
                ref={elementRef}
                id="calibration" 
                className="px-6 sm:px-12 py-20 bg-[#F5F2F0] border-b border-[#1A3024]/10 scroll-mt-16 z-10 relative"
              >
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  
                  {/* Left Column: New Copy and 3 Pillars */}
                  <div className="lg:col-span-7 space-y-8">
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.3em] sm:tracking-[0.4em] text-neutral-600">01 // Confidence Engine</span>
                      <h2 className="text-[28px] sm:text-[36px] mt-2 sm:mt-4 tracking-tighter font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Move Forward With Confidence.
                      </h2>
                      <p className="text-[13px] sm:text-[14px] text-neutral-500 font-light mt-2 max-w-xl">
                        Every AI interview gets a Confidence Score — how strongly that persona's response indicates they'd buy, adopt, or recommend what you're testing. It's a read on one simulated person's conviction, not a verdict on the market; SignalRoom always tells you to validate real findings with real customers.
                      </p>
                    </div>
                    
                    <div className="space-y-6 border-l-2 border-[#5A7973]/20 pl-4">
                      <div>
                        <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#1A3024] mb-1">Stated Conviction</h4>
                        <p className="text-[12px] sm:text-[13px] text-neutral-600 leading-relaxed font-light">Extracted directly from the persona's own response, not calculated as a separate judgment layered on top.</p>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#1A3024] mb-1">Behavioral Anchors</h4>
                        <p className="text-[12px] sm:text-[13px] text-neutral-600 leading-relaxed font-light">Calibrated against concrete reactions, from "I'd sign up today" to "this doesn't work for me," for scores that are differentiated instead of generic.</p>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#1A3024] mb-1">Visible Justification</h4>
                        <p className="text-[12px] sm:text-[13px] text-neutral-600 leading-relaxed font-light">Every score ships with a one-sentence reason pulled straight from what the persona said, so you can audit it instead of trusting a black box.</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Premium Scroll-Animated Metric Gauge */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center">
                    <div className="relative w-64 h-64 flex items-center justify-center bg-white rounded-full border border-[#E3E5E3] shadow-sm group hover:shadow-md transition-shadow duration-500">
                      
                      {/* SVG Radial Progress Ring */}
                      <svg className="absolute transform -rotate-90 w-56 h-56">
                        {/* Track Circle */}
                        <circle
                          cx="112"
                          cy="112"
                          r="98"
                          stroke="#E3E5E3"
                          strokeWidth="3"
                          fill="transparent"
                          strokeOpacity="0.6"
                        />
                        {/* Active Ring — Animates dynamically from 615.75 to the 95% offset value when scrolled into view */}
                        <circle
                          cx="112"
                          cy="112"
                          r="98"
                          stroke="#1A3024"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray="615.75"
                          strokeLinecap="round"
                          style={{
                            strokeDashoffset: hasLoaded
                              ? "calc(615.75 - (615.75 * 95) / 100)"
                              : "615.75",
                            transition: "stroke-dashoffset 2.5s cubic-bezier(0.16, 1, 0.3, 1)"
                          }}
                        />
                      </svg>

                      {/* Internal Center Typography Panel */}
                      <div className="text-center z-10 flex flex-col items-center justify-center">
                        <span className="text-[56px] font-normal leading-none text-[#121314] tracking-tighter mb-2.5" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                          95
                        </span>
                        <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#1A3024] bg-[#e9edea] px-2.5 py-0.5 rounded-[4px]">
                          Confidence Score
                        </span>
                      </div>

                    </div>

                    <div className="mt-4 text-center">
                      <span className="text-[10px] text-neutral-400 italic font-light">
                        *Illustrative example — extracted from a persona's stated response, not calculated independently
                      </span>
                    </div>
                  </div>

                </div>
              </section>
            </RevealSection>
          );
        })()}
      </div>

      {/* Feature Showcase — every way to test an idea */}
      <RevealSection>
        <section id="features" className="px-6 sm:px-12 py-16 sm:py-20 border-b border-[#1A3024]/10 scroll-mt-16 z-10 relative">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.3em] sm:tracking-[0.4em] text-neutral-600">02 // Test Before You Build</span>
              <div className="hidden sm:block h-px flex-grow bg-[#1A3024]/10" />
            </div>
            <h2 className="text-[28px] sm:text-[40px] mb-4 tracking-tighter font-normal text-[#121314] max-w-2xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Put every important decision in front of the people it needs to win over.
            </h2>
            <p className="text-[14px] sm:text-[15px] text-[#454947] leading-relaxed max-w-2xl mb-12 sm:mb-16">
              Test your message, concept, product, or creative, then turn real-looking reactions into a clear next move before you commit time, budget, or a launch.
            </p>

            <div aria-label="SignalRoom concept test preview" className="mb-12 overflow-hidden rounded-[6px] border border-[#1A3024]/15 bg-white shadow-[0_24px_60px_rgba(26,48,36,0.10)] sm:mb-16">
              <div className="flex h-10 items-center justify-between border-b border-[#1A3024]/10 bg-[#fbfcfa] px-4 sm:px-5">
                <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#d6a4a1]" /><span className="h-1.5 w-1.5 rounded-full bg-[#d8c58e]" /><span className="h-1.5 w-1.5 rounded-full bg-[#9ebaa5]" /></div>
                <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#6b726c]">SignalRoom · Concept test</span>
                <span className="hidden text-[9px] text-[#7e847f] sm:block">Live analysis</span>
              </div>
              <div className="grid min-h-[330px] grid-cols-1 sm:grid-cols-[150px_1fr]">
                <aside className="hidden border-r border-[#1A3024]/10 bg-[#f7f8f6] p-4 sm:block">
                  <div className="mb-6 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1A3024] text-[10px] font-semibold text-white">S</span><span className="text-[10px] font-semibold text-[#1A3024]">SignalRoom</span></div>
                  <div className="space-y-2 text-[9px] font-medium text-[#767d77]"><div className="rounded-md bg-[#e8eee8] px-2.5 py-2 text-[#1A3024]">Research</div><div className="px-2.5 py-1.5">Personas</div><div className="px-2.5 py-1.5">Interviews</div><div className="px-2.5 py-1.5">Reports</div></div>
                  <div className="mt-8 border-t border-[#1A3024]/10 pt-4"><p className="text-[8px] uppercase tracking-[0.17em] text-[#858c86]">Project</p><p className="mt-1 text-[10px] font-semibold text-[#303a31]">Spring launch</p></div>
                </aside>
                <div className="relative overflow-hidden p-5 sm:p-7">
                  <div className="toolkit-preview-scan pointer-events-none absolute inset-y-0 z-10 w-20 bg-gradient-to-r from-transparent via-[#dcebdd]/40 to-transparent" />
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                    <div><p className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#6b726c]">Testing now</p><h3 className="mt-1 text-[19px] tracking-tight text-[#1A3024] sm:text-[23px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>New product positioning</h3></div>
                    <div className="rounded-full border border-[#a8c0ac] bg-[#eef6ee] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#294b31]">4 reactions in</div>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="rounded-[5px] border border-[#1A3024]/10 bg-[#fcfdfb] p-4">
                      <div className="mb-4 flex items-center justify-between"><span className="text-[10px] font-semibold text-[#26392a]">Persona reactions</span><span className="text-[9px] text-[#7d867e]">Updated now</span></div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3"><img src="/landing-personas/priya.jpg" alt="" className="h-8 w-8 rounded-full object-cover" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold text-[#26392a]">Priya Nair</span><span className="text-[9px] font-semibold text-[#3d6947]">Strong fit</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e4e9e3]"><div className="toolkit-preview-bar h-full w-[83%] rounded-full bg-[#52765a]" /></div></div></div>
                        <div className="flex items-center gap-3"><img src="/landing-personas/arjun.jpg" alt="" className="h-8 w-8 rounded-full object-cover" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold text-[#26392a]">Arjun Sharma</span><span className="text-[9px] font-semibold text-[#3d6947]">Interested</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e4e9e3]"><div className="toolkit-preview-bar toolkit-preview-bar-delay h-full w-[68%] rounded-full bg-[#7b9a80]" /></div></div></div>
                        <div className="flex items-center gap-3"><img src="/landing-personas/marisol.jpg" alt="" className="h-8 w-8 rounded-full object-cover" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold text-[#26392a]">Marisol Vega</span><span className="text-[9px] font-semibold text-[#846559]">Needs proof</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e4e9e3]"><div className="toolkit-preview-bar toolkit-preview-bar-delay-2 h-full w-[48%] rounded-full bg-[#a48275]" /></div></div></div>
                      </div>
                    </div>
                    <div className="toolkit-preview-float rounded-[5px] bg-[#1A3024] p-4 text-white shadow-lg shadow-[#1A3024]/15">
                      <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-[#bcd0bf]">Signal emerging</p>
                      <p className="mt-3 text-[18px] leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>The benefit is clear, but buyers need proof before they switch.</p>
                      <div className="mt-5 border-t border-white/15 pt-4"><div className="flex items-end justify-between"><div><p className="text-[9px] uppercase tracking-[0.16em] text-white/55">Evidence strength</p><p className="mt-1 text-[13px] font-semibold text-[#d8ead9]">Growing</p></div><span className="text-[24px] leading-none text-[#d8ead9]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>3</span></div><div className="mt-3 flex gap-1"><span className="h-1.5 flex-1 rounded-full bg-[#b7cfb9]" /><span className="h-1.5 flex-1 rounded-full bg-[#b7cfb9]" /><span className="h-1.5 flex-1 rounded-full bg-[#b7cfb9]" /><span className="h-1.5 flex-1 rounded-full bg-white/15" /></div></div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-[5px] border border-[#1A3024]/10 bg-[#f8faf7] px-3 py-2.5"><span className="material-symbols-outlined text-[15px] text-[#5a7960]">auto_awesome</span><span className="text-[10px] text-[#526057]">AI has connected a new response to this signal</span><span className="ml-auto hidden text-[9px] font-semibold uppercase tracking-[0.12em] text-[#355d3e] sm:inline">View evidence →</span></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#d1d5d3] border border-[#d1d5d3] rounded-[4px] overflow-hidden">
              {[
                {
                  icon: 'compare_arrows',
                  title: 'Compare Reactions',
                  body: 'Put 2–4 personas side by side on the same question and see exactly where their reactions split — and why.',
                },
                {
                  icon: 'groups',
                  title: 'Audience Testing',
                  body: 'Run one question against 5–10 personas at once and get sentiment distribution, a consensus score, and an AI executive summary in minutes.',
                },
                {
                  icon: 'layers',
                  title: 'Concept Testing',
                  body: 'Upload up to 4 concepts — images included — and let the full panel rank them: a declared winner, per-persona scores, and the reasoning behind each.',
                },
                {
                  icon: 'visibility',
                  title: 'Creative Testing',
                  badge: 'New',
                  body: 'See where attention actually lands on your packaging, ad, or landing page — a real measured heatmap, not a guess — then hear how each persona reads what’s there.',
                },
                {
                  icon: 'sensors',
                  title: 'Market Signals',
                  body: 'Every interview and test feeds a living signal feed — recurring pain points, objections, and opportunities, tracked as they strengthen or fade.',
                },
                {
                  icon: 'description',
                  title: 'Research Reports',
                  body: 'Every interview becomes a structured report: key themes, verbatim quotes, a confidence score, and next-step recommendations — shareable with your team.',
                },
              ].map((feature) => (
                <div key={feature.title} className="bg-white p-8 sm:p-10 group hover:bg-[#fafbfa] transition-all duration-500 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <span className="material-symbols-outlined text-neutral-400 text-3xl transition-all duration-300 transform animate-editorial-bounce">{feature.icon}</span>
                    {feature.badge && (
                      <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white bg-[#1A3024] px-2 py-1 rounded-full">{feature.badge}</span>
                    )}
                  </div>
                  <h3 className="text-[20px] sm:text-[22px] mb-3 tracking-tight font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {feature.title}
                  </h3>
                  <p className="text-[13px] sm:text-sm text-neutral-600 leading-relaxed">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Team Workspaces + Integrations Section */}
      <RevealSection>
        <section id="integrations" className="px-6 sm:px-12 py-16 sm:py-20 border-b border-[#1A3024]/10 scroll-mt-16 z-10 relative">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-10 sm:mb-16">
              <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.3em] sm:tracking-[0.4em] text-neutral-600">03 // Built For Teams</span>
              <div className="hidden sm:block h-px flex-grow bg-[#1A3024]/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
              {/* Workspaces */}
              <div className="border border-[#d1d5d3] rounded-[4px] p-8 sm:p-12 bg-white group hover:bg-[#fafbfa] transition-all duration-500">
                <span className="material-symbols-outlined text-neutral-400 text-3xl mb-6 block transition-all duration-300 transform animate-editorial-bounce">workspaces</span>
                <h3 className="text-[26px] sm:text-[32px] tracking-tighter font-normal text-[#121314] mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Keep every research initiative in its own space.
                </h3>
                <p className="text-[13px] sm:text-sm text-neutral-600 leading-relaxed mb-6">
                  Whether you&rsquo;re managing multiple brands, launching a new product, or supporting different clients, create dedicated workspaces that keep customer research organized and teams aligned. Share access with the right people while keeping each initiative focused.
                </p>
                <Link href="#pricing" className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#1A3024] border-b border-[#1A3024]/30 hover:border-[#1A3024] transition-colors pb-0.5">
                  10 seats on Broadcast →
                </Link>
              </div>

              {/* Integrations */}
              <div className="border border-[#d1d5d3] rounded-[4px] p-8 sm:p-12 bg-white flex flex-col group hover:bg-[#fafbfa] transition-all duration-500">
                <span className="material-symbols-outlined text-neutral-400 text-3xl mb-6 block transition-all duration-300 transform animate-icon-subtle">sync_alt</span>
                <h3 className="text-[26px] sm:text-[32px] tracking-tighter font-normal text-[#121314] mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Bring customer intelligence into your workflow.
                </h3>
                <p className="text-[13px] sm:text-sm text-neutral-600 leading-relaxed mb-8">
                  Connect Slack and Notion once, and SignalRoom automatically delivers new reports, trends, and customer signals where your team already works — turning research into action without another dashboard to check.
                </p>

                {/* Connection diagram — animated flow lines from each icon to SignalRoom */}
                <div className="mt-auto flex items-center justify-center gap-1 sm:gap-3 py-6">
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <div className="w-14 h-14 rounded-[10px] border border-[#d1d5d3] flex items-center justify-center bg-white shadow-sm relative">
                      <img src="/signalroom-icon.png" alt="SignalRoom" className="w-10 h-10 object-contain" />
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-neutral-400">SignalRoom</span>
                  </div>

                  <svg width="68" height="100" viewBox="0 0 68 100" className="flex-shrink-0 -mx-1 sm:-mx-2" fill="none">
                    {/* Static base lines */}
                    <path d="M4,50 C 34,50 34,22 64,22" stroke="#1A3024" strokeOpacity="0.12" strokeWidth="1.5" />
                    <path d="M4,50 C 34,50 34,78 64,78" stroke="#1A3024" strokeOpacity="0.12" strokeWidth="1.5" />
                    {/* Traveling gradient streak, SignalRoom → icon (that's the
                        real direction: SignalRoom pushes reports/signals out) */}
                    <path d="M4,50 C 34,50 34,22 64,22" stroke="url(#flow-grad-a)" strokeWidth="2" strokeLinecap="round" className="flow-dash" />
                    <path d="M4,50 C 34,50 34,78 64,78" stroke="url(#flow-grad-b)" strokeWidth="2" strokeLinecap="round" className="flow-dash" />
                    <defs>
                      <linearGradient id="flow-grad-a" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1A3024" stopOpacity="0" />
                        <stop offset="50%" stopColor="#5A7973" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#1A3024" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="flow-grad-b" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1A3024" stopOpacity="0" />
                        <stop offset="50%" stopColor="#5A7973" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#1A3024" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="flex flex-col gap-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-11 h-11 rounded-[10px] border border-[#d1d5d3] flex items-center justify-center bg-white shadow-sm flex-shrink-0">
                        <SlackMark size={22} />
                      </div>
                      <span className="text-[11px] font-medium text-neutral-700">Slack</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-11 h-11 rounded-[10px] border border-[#d1d5d3] flex items-center justify-center bg-white shadow-sm flex-shrink-0">
                        <NotionMark size={22} />
                      </div>
                      <span className="text-[11px] font-medium text-neutral-700">Notion</span>
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#1A3024] border-b border-[#1A3024]/30 w-fit pb-0.5">
                  Included on Signal & Broadcast
                </span>
              </div>
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
                Traditional research engagements can cost thousands for a single study and move too slowly for real product cycles. SignalRoom gives teams a faster, more predictable way to pressure-test decisions before budget, inventory, packaging, media spend, or engineering time are committed.
              </p>
            </div>
            <div className="lg:col-start-7 lg:col-span-6">
              <div className="border border-[#d1d5d3] p-5 sm:p-10 bg-[#F5F2F0] relative rounded-[4px]">
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
                    <div className="p-5 sm:p-6 bg-white">
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
                      <p className="text-[11px] text-[#1A3024] font-medium mb-3">100 interviews/month</p>
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
              <p className="text-xs text-neutral-600 mb-4">Validate ideas before investing in launch, inventory, media, or engineering time. Simulate customer conversations and uncover demand signals early.</p>
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
              <p className="text-xs text-[#1A3024] font-medium mb-4">Replace slow research cycles with continuous customer intelligence for faster product, brand, and go-to-market decisions.</p>
              <div className="flex items-baseline gap-2 mb-8 sm:mb-10">
                <span className="text-[40px] sm:text-[48px] tracking-tighter text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>$499</span>
                <span className="text-[11px] text-[#1A3024] font-medium uppercase tracking-widest">/ month</span>
              </div>
              <ul className="space-y-4 mb-12 sm:mb-16 flex-grow">
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Unlimited research projects</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Up to 50 AI customer personas</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ 100 interviews per month</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Executive-ready research reports</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Multi-persona comparative analysis</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Advanced insight synthesis</li>
                <li className="flex items-center gap-4 text-xs text-[#121314] font-medium">✓ Slack & Notion integrations</li>
              </ul>
              <Link href="/signup" className="w-full text-center bg-[#1A3024] text-white py-4 text-[11px] font-medium uppercase tracking-[0.4em] hover:bg-[#5A7973] transition-all shadow-xl shadow-black/10 rounded-[4px]">Subscribe</Link>
            </div>

            {/* 03 // Enterprise */}
            <div className="p-6 sm:p-10 flex flex-col hover:bg-[#fafbfa] transition-all duration-1000 group thin-border">
              <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-neutral-700 mb-8 sm:mb-10">03 // Agency</span>
              <h3 className="text-[28px] sm:text-[32px] mb-2 tracking-tighter font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Broadcast</h3>
              <p className="text-xs text-neutral-500 mb-4">For agencies and growing teams running research across multiple brands, clients, or initiatives at once.</p>
              <div className="flex items-baseline gap-2 mb-8 sm:mb-10">
                <span className="text-[40px] sm:text-[48px] tracking-tighter text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>$999</span>
                <span className="text-[11px] text-neutral-600 font-medium uppercase tracking-widest">/ month</span>
              </div>
              <ul className="space-y-4 mb-12 sm:mb-16 flex-grow">
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Unlimited AI customer personas</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Unlimited interviews</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Everything in Signal</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ 10 collaborative team seats</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ White-label executive reports</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Slack & Notion integrations</li>
                <li className="flex items-center gap-4 text-xs text-[#454947]">✓ Priority feature access and support</li>
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
      <footer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-6 px-6 sm:px-12 py-16 sm:py-20 w-full bg-[#ECE9E6] relative z-10">
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
