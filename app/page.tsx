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
  const [activeToolkit, setActiveToolkit] = useState<number>(0);

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
          <div ref={rightColRef} className="md:col-span-12 lg:col-span-5 lg:pt-36 xl:pt-44">
            <div className="rounded-2xl border border-[#d1d5d3]/70 bg-white p-6 shadow-2xl shadow-[#1A3024]/10">
              <div className="mb-5 flex items-center justify-between"><span className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#5A7973]"><span className="h-2 w-2 rounded-full bg-[#5A7973]" /> Live interview</span><span className="text-[10px] text-neutral-400">01:23</span></div>
              <div className="mb-5 flex items-center gap-3"><img src={DASHBOARD_PERSONAS[0].imgUrl} alt={DASHBOARD_PERSONAS[0].name} className="h-12 w-12 rounded-full object-cover" /><div><p className="text-sm font-medium text-[#121314]">{DASHBOARD_PERSONAS[0].name}</p><p className="text-xs text-[#748076]">{DASHBOARD_PERSONAS[0].title}</p></div></div>
              <p className="rounded-lg bg-[#fafbfa] p-4 text-[13px] italic leading-relaxed text-[#454947]">&ldquo;{DASHBOARD_PERSONAS[0].interviewQuote.slice(0, 170)}&hellip;&rdquo;</p>
              <div className="mt-5 border-t border-[#e3e5e3] pt-4"><div className="mb-2 flex justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-[#748076]"><span>Confidence score</span><span className="text-[#121314]">82% · Strong</span></div><div className="h-2 overflow-hidden rounded-full bg-[#e3e5e3]"><div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#5A7973] to-[#1A3024]" /></div></div>
            </div>
            <Link href="/signup" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1A3024] px-6 py-3 text-[12px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#5A7973]">Start your first interview <span className="material-symbols-outlined text-[17px]">arrow_forward</span></Link>
          </div>

        </div>
      </header>

      {/* Personas */}
      <RevealSection>
        <section id="dashboard-replica" className="relative border-b border-[#1A3024]/10 px-6 py-20 sm:px-12 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex items-center gap-4"><span className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#5A7973]">01 // Personas</span><span className="hidden h-px flex-1 bg-[#1A3024]/10 sm:block" /></div>
            <h2 className="max-w-3xl text-[32px] leading-[1.1] tracking-tight text-[#121314] sm:text-[44px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>AI-generated personas built from real research.</h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#5c625d]">Explore beliefs, behaviors, needs, and motivations. Each persona answers with the nuance of a real interview, including the objections that matter.</p>
            <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
              {DASHBOARD_PERSONAS.map((persona) => {
                const active = selectedPersona.id === persona.id
                return <button key={persona.id} onClick={() => !isSimulating && setSelectedPersona(persona)} className={`group rounded-xl border p-5 text-left transition-all duration-500 ${active ? 'border-[#1A3024]/25 bg-white shadow-xl shadow-[#1A3024]/10 -translate-y-1' : 'border-[#d1d5d3] bg-[#fafbfa]/70 hover:border-[#aeb7af] hover:bg-white'}`}>
                  <div className="relative mb-5 aspect-square overflow-hidden rounded-lg"><img src={persona.imgUrl} alt={persona.name} className={`h-full w-full object-cover transition-transform duration-700 ${active ? 'scale-100' : 'scale-95 group-hover:scale-100'}`} /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3 text-[10px] font-medium text-white">{persona.location}</div></div>
                  <h3 className="text-[22px] text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{persona.name}</h3><p className="mt-1 text-[11px] text-[#748076]">{persona.title}</p><p className="mt-4 line-clamp-3 text-[13px] leading-relaxed text-[#5c625d]">{persona.bio}</p>
                </button>
              })}
            </div>
            <div className="mt-12 rounded-xl border border-[#d1d5d3] bg-white p-7 sm:p-10">
              <div className="flex flex-col gap-7 lg:flex-row"><img src={selectedPersona.imgUrl} alt={selectedPersona.name} className="h-20 w-20 rounded-full object-cover" /><div className="flex-1"><p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#748076]">Interview question</p><p className="mt-3 text-[21px] leading-snug text-[#121314] sm:text-[26px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{selectedPersona.question}</p><div className="mt-6 border-l-2 border-[#1A3024] bg-[#fafbfa] p-5"><p className="text-[14px] italic leading-relaxed text-[#454947]">&ldquo;{selectedPersona.interviewQuote}&rdquo;</p></div><div className="mt-6 flex items-center gap-4"><span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#748076]">Confidence</span><div className="h-1.5 max-w-xs flex-1 overflow-hidden rounded-full bg-[#e3e5e3]"><div className="h-full rounded-full bg-[#1A3024]" style={{ width: '82%' }} /></div><span className="text-[13px] font-medium text-[#121314]">82%</span></div></div></div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Methodology Section */}
      <RevealSection>
        <section id="methodology" className="bg-[#F5F2F0] px-6 sm:px-12 py-20 sm:py-28 border-b border-[#1A3024]/10 scroll-mt-16 z-10 relative">
          <div 
            id="methodology-header" 
            onClick={() => setIsMethodologyActive(!isMethodologyActive)}
            className={`mb-12 sm:mb-20 flex items-end justify-between cursor-pointer group ${isMethodologyActive ? 'is-active' : ''}`}
          >
            <div className="flex-shrink-0">
              <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.3em] sm:tracking-[0.4em] text-neutral-600">02 // The Methodology</span>
              <h2 className="max-w-3xl text-[30px] sm:text-[42px] mt-2 sm:mt-4 tracking-tighter font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>From assumptions to decisions — in three movements.</h2>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 border border-[#d1d5d3] divide-y lg:divide-y-0 lg:divide-x divide-[#d1d5d3] rounded-xl overflow-hidden bg-[#F5F2F0]">
            <div className="p-8 sm:p-10 group hover:bg-white transition-all duration-500">
              <div className="flex justify-between items-start mb-10 sm:mb-16">
                <span className="text-[44px] sm:text-[56px] text-[#1A3024]/10 leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>01</span>
                <span className="material-symbols-outlined text-neutral-400 text-2xl sm:text-3xl transition-all duration-300 transform animate-editorial-bounce">hub</span>
              </div>
              <h3 className="text-[24px] sm:text-[28px] mb-3 sm:mb-4 tracking-tight font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Ingest</h3>
              <p className="text-[14px] sm:text-[15px] text-[#454947] leading-relaxed opacity-85">
                Transform assumptions into intelligence. Bring your customer, market, brand, and product context together to build a foundation for smarter decisions.
              </p>
            </div>
            <div className="p-8 sm:p-10 group hover:bg-white transition-all duration-500">
              <div className="flex justify-between items-start mb-10 sm:mb-16">
                <span className="text-[44px] sm:text-[56px] text-[#1A3024]/10 leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>02</span>
                <span className="material-symbols-outlined text-neutral-400 text-2xl sm:text-3xl transition-all duration-300 transform animate-editorial-bounce">psychology</span>
              </div>
              <h3 className="text-[24px] sm:text-[28px] mb-3 sm:mb-4 tracking-tight font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Simulate</h3>
              <p className="text-[14px] sm:text-[15px] text-[#454947] leading-relaxed opacity-85">
                Understand your customers at scale. Model perspectives, uncover motivations, objections, and opportunities before investing time, media, inventory, or engineering resources.
              </p>
            </div>
            <div className="p-8 sm:p-10 group hover:bg-white transition-all duration-500">
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
      {/* Confidence score */}
      <RevealSection>
        <section className="relative overflow-hidden border-b border-[#1A3024]/10 bg-[#1A3024] px-6 py-20 text-[#fcf9f8] sm:px-12 sm:py-28">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7"><div className="mb-10 flex items-center gap-4"><span className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#b8ccba]">Confidence score</span><span className="hidden h-px flex-1 bg-white/15 sm:block" /></div><h2 className="text-[32px] leading-[1.1] tracking-tight sm:text-[44px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Move Forward With Confidence.</h2><p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/70">Every AI interview gets a Confidence Score: how strongly that persona’s response indicates they would buy, adopt, or recommend what you’re testing. It is a read on one simulated person’s conviction, not a market verdict.</p><div className="mt-10 space-y-2">{[['Stated Conviction', 'Extracted directly from the persona’s own response.'], ['Behavioral Anchors', 'Calibrated against concrete reactions instead of generic sentiment.'], ['Visible Justification', 'Every score includes a reason you can audit.']].map(([title, description]) => <div key={title} className="flex gap-5 rounded-xl p-4 transition-colors hover:bg-white/5"><span className="material-symbols-outlined mt-0.5 text-[#b8ccba]">check_circle</span><div><h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-white">{title}</h3><p className="mt-1 text-[13px] leading-relaxed text-white/60">{description}</p></div></div>)}</div></div>
            <div className="flex flex-col items-center lg:col-span-5"><div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-[#e3e5e3] bg-white shadow-xl shadow-black/20"><svg className="absolute h-56 w-56 -rotate-90"><circle cx="112" cy="112" r="98" stroke="#e3e5e3" strokeWidth="3" fill="none" /><circle cx="112" cy="112" r="98" stroke="#1A3024" strokeWidth="4" fill="none" strokeDasharray="615.75" strokeDashoffset="30.79" strokeLinecap="round" /></svg><div className="z-10 text-center"><p className="text-[56px] leading-none text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>95</p><span className="mt-3 inline-block rounded bg-[#e9edea] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#1A3024]">Confidence Score</span></div></div><p className="mt-4 text-center text-[10px] uppercase tracking-[0.16em] text-white/40">Stated conviction · Visible justification</p></div>
          </div>
        </section>
      </RevealSection>

      {/* Platform toolkit */}
      <RevealSection>
        <section id="features" className="relative border-b border-[#1A3024]/10 px-6 py-20 sm:px-12 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex items-center gap-4"><span className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#5A7973]">03 // Platform</span><span className="hidden h-px flex-1 bg-[#1A3024]/10 sm:block" /></div>
            <h2 className="max-w-3xl text-[32px] leading-[1.1] tracking-tight text-[#121314] sm:text-[44px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Put every important decision in front of the people it needs to win over.</h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#5c625d]">Test your message, concept, product, or creative, then turn reactions into a clear next move before you commit time, budget, or a launch.</p>
            <div className="mt-14 grid gap-8 lg:grid-cols-12">
              <div className="space-y-2 lg:col-span-5">
                {[
                  ['01', 'Persona interviews', 'Hear the reason behind each reaction.'],
                  ['02', 'Concept test', 'Find the strongest direction before you build.'],
                  ['03', 'Creative assessment', 'See where visual attention lands.'],
                  ['04', 'Insight reports', 'Make the decision with clear evidence.'],
                ].map(([number, label, title], index) => <button key={label} onClick={() => setActiveToolkit(index)} className={`w-full rounded-xl border p-5 text-left transition-all duration-300 ${activeToolkit === index ? 'border-[#1A3024]/25 bg-white shadow-lg shadow-[#1A3024]/10' : 'border-transparent hover:bg-[#fafbfa]'}`}><div className="mb-2 flex items-center gap-3"><span className={`text-xs ${activeToolkit === index ? 'text-[#1A3024]' : 'text-[#aab0a3]'}`}>{number}</span><span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#748076]">{label}</span></div><p className="text-[18px] text-[#1A3024]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{title}</p></button>)}
              </div>
              <div className="min-h-[420px] rounded-2xl border border-[#d1d5d3] bg-white p-7 sm:p-9 lg:col-span-7">
                {activeToolkit === 0 && <div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#748076]">01 / Persona interview</p><h3 className="mt-3 text-[28px] text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Customer context, in their own words.</h3><div className="mt-8 flex gap-4 rounded-xl bg-[#fafbfa] p-5"><img src={DASHBOARD_PERSONAS[1].imgUrl} alt={DASHBOARD_PERSONAS[1].name} className="h-11 w-11 rounded-full object-cover" /><div><p className="text-xs font-medium text-[#121314]">{DASHBOARD_PERSONAS[1].name}</p><p className="mt-2 text-[13px] italic leading-relaxed text-[#5c625d]">&ldquo;{DASHBOARD_PERSONAS[1].interviewQuote.slice(0, 210)}&hellip;&rdquo;</p></div></div><div className="mt-7 flex items-center gap-3"><span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#748076]">Confidence</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e3e5e3]"><div className="h-full w-[82%] rounded-full bg-[#1A3024]" /></div><span className="text-sm font-medium">82%</span></div></div>}
                {activeToolkit === 1 && <div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#748076]">02 / Concept test</p><h3 className="mt-3 text-[28px] text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>See which idea has the strongest response.</h3><div className="mt-10 space-y-4">{[['Concept A', 68], ['Concept B', 84], ['Concept C', 45], ['Concept D', 72]].map(([name, score]) => <div key={String(name)} className="flex items-center gap-4"><span className="w-20 text-xs font-medium text-[#5c625d]">{name}</span><div className="h-7 flex-1 overflow-hidden rounded-md bg-[#e9edea]"><div className="flex h-full items-center justify-end rounded-md bg-[#1A3024] pr-2 text-[10px] text-white" style={{ width: `${score}%` }}>{score}%</div></div></div>)}</div></div>}
                {activeToolkit === 2 && <div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#748076]">03 / Creative assessment</p><h3 className="mt-3 text-[28px] text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>See what earns attention.</h3><div className="relative mt-10 h-52 overflow-hidden rounded-xl bg-[#1f3b2a]" style={{ backgroundImage: 'radial-gradient(ellipse 24% 72% at 24% 47%, #f6d545 0%, #ed7131 17%, rgba(94,144,71,.72) 45%, transparent 74%), radial-gradient(ellipse 20% 65% at 78% 42%, #f6d545 0%, #ed7131 18%, rgba(94,144,71,.7) 47%, transparent 74%)' }}><span className="absolute bottom-4 left-4 rounded-full bg-white px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#36453a]">High attention</span></div></div>}
                {activeToolkit === 3 && <div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#748076]">04 / Insight report</p><h3 className="mt-3 text-[28px] text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Evidence your whole team can act on.</h3><div className="mt-10 grid grid-cols-3 gap-3">{[['6', 'Key themes'], ['12', 'Signals'], ['82%', 'Confidence']].map(([metric, label]) => <div key={label} className="rounded-xl border border-[#d1d5d3] p-4"><p className="text-[29px] leading-none text-[#1A3024]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{metric}</p><p className="mt-2 text-[9px] font-medium uppercase tracking-[0.12em] text-[#748076]">{label}</p></div>)}</div><div className="mt-5 rounded-xl bg-[#fafbfa] p-5 text-[13px] leading-relaxed text-[#5c625d]">Price sensitivity is the primary objection. All personas value speed over depth. Slack integration is a top feature request.</div></div>}
              </div>
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
