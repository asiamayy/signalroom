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
  conviction: number;
}

const HERO_INTERVIEW_QUESTION = "What's your honest first reaction to a tool that simulates customer interviews instead of running real ones?";

const DASHBOARD_PERSONAS: DashboardPersona[] = [
  {
    id: 'arjun',
    name: 'Arjun Sharma',
    title: 'Freelance Full-Stack Developer',
    location: 'Austin, Texas',
    imgUrl: '/landing-personas/arjun.jpg',
    tags: ['freelancer', 'solopreneur', 'growth-focused', 'developer'],
    bio: 'Arjun moved from Bangalore to Austin three years ago and built his freelance business from scratch with no local network. He tracks his business metrics obsessively in a Notion...',
    question: HERO_INTERVIEW_QUESTION,
    interviewQuote: "I track my metrics closely, but my biggest blindspot is positioning. Traditional research firms charge thousands just to tell me what keywords to target. Something like this — where I could talk through my pitch with a few realistic founder personas before I ever cold-email someone — would've saved me a lot of guessing early on.",
    conviction: 82,
  },
  {
    id: 'priya',
    name: 'Priya Nair',
    title: 'Senior Product Manager',
    location: 'Austin, Texas',
    imgUrl: '/landing-personas/priya.jpg',
    tags: ['startup', 'product management', 'SaaS', 'time-pressed'],
    bio: 'Priya loves the startup density but misses the slower pace of her hometown. She manages complex multi-tenant system backlogs and cross-functional user pipelines...',
    question: HERO_INTERVIEW_QUESTION,
    interviewQuote: "Honestly, I'd be skeptical at first — my team is already stretched thin, and I don't want to babysit one more tool. But if it got me a directionally-useful read in an afternoon instead of waiting three weeks for a research firm, I'd run it in parallel on one feature before trusting it with something bigger.",
    conviction: 74,
  },
  {
    id: 'marisol',
    name: 'Marisol Delgado',
    title: 'Stay-at-Home Mom & Full-Time Caregiver',
    location: 'Albuquerque, New Mexico',
    imgUrl: '/landing-personas/marisol.jpg',
    tags: ['stay-at-home mom', 'budget-conscious', 'caregiver', 'family-first'],
    bio: 'Marisol holds a bachelor\'s degree in Communications but left a marketing coordinator job when her second child was born with a mild developmental delay requiring extra therapeutic attention...',
    question: HERO_INTERVIEW_QUESTION,
    interviewQuote: "I'd want to see exactly how it helps before I hand over my email just to find out. Between the kids and our budget, I don't have patience for another app that makes me sign up first and figure out later if it's even useful — let me try it, then ask for my info.",
    conviction: 58,
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
  const TRADITIONAL_HOURS_PER_INTERVIEW = 8;
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
    <div className="overflow-x-hidden relative min-h-screen bg-[#FCFCFB] text-[#121314] antialiased" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />

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
        
        @keyframes editorialBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-editorial-bounce {
          animation: editorialBounce 2.5s ease-in-out infinite;
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

        .roi-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #1A3024;
          border: 3px solid #FCFCFB;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(26, 48, 36, 0.25);
          transition: transform 0.2s ease;
        }
        .roi-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .roi-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #1A3024;
          border: 3px solid #FCFCFB;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(26, 48, 36, 0.25);
          transition: transform 0.2s ease;
        }
        .roi-slider::-moz-range-thumb:hover {
          transform: scale(1.15);
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
          <Link className="bg-[#1A3024] text-white px-4 sm:px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] hover:bg-[#5A7973] transition-all duration-300 rounded-full whitespace-nowrap" href="/signup">
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero Header Section */}
      <header className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 px-6 sm:px-12 z-10">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* LEFT SIDE */}
          <div className="md:col-span-12 lg:col-span-7 flex flex-col justify-between min-h-[350px] overflow-visible">
            <h1 className="text-[34px] sm:text-[56px] lg:text-[72px] leading-[1.1] lg:leading-[70px] tracking-tight font-normal text-[#121314] break-words" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
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

            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-[#454947]">
              SignalRoom uses AI-powered research simulations and market intelligence to reveal customer needs, validate decisions, and uncover opportunities faster. No noise, just architecture.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1A3024] px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-[#5A7973] hover:shadow-lg hover:shadow-[#1A3024]/15">
                Start your first interview
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <a href="#dashboard-replica" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1A3024]/20 px-6 py-3 text-sm font-medium text-[#1A3024] transition-all duration-300 hover:border-[#1A3024]/40 hover:bg-[#fafbfa]">
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                See how it works
              </a>
            </div>

            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-3">
                {DASHBOARD_PERSONAS.map((p) => (
                  <img
                    key={p.id}
                    src={p.imgUrl}
                    alt={p.name}
                    className="w-8 h-8 rounded-full border-2 border-[#FCFCFB] object-cover"
                  />
                ))}
              </div>
              <div className="text-sm text-[#5A7973]">
                Built for teams that can&rsquo;t afford to invest in the wrong thing.
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div ref={rightColRef} className="md:col-span-12 lg:col-span-5 lg:pt-36 xl:pt-44">
            <div className="rounded-2xl border border-[#d1d5d3]/70 bg-white p-6 shadow-2xl shadow-[#1A3024]/10">
              <div className="mb-5 flex items-center justify-between"><span className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#5A7973]"><span className="h-2 w-2 rounded-full bg-[#5A7973]" /> Live interview</span><span className="text-[10px] text-neutral-400">01:23</span></div>
              <div className="mb-5 flex items-center gap-3"><img src={DASHBOARD_PERSONAS[0].imgUrl} alt={DASHBOARD_PERSONAS[0].name} className="h-12 w-12 rounded-full object-cover" /><div><p className="text-sm font-medium text-[#121314]">{DASHBOARD_PERSONAS[0].name}</p><p className="text-xs text-[#748076]">{DASHBOARD_PERSONAS[0].title}</p></div></div>
              <p className="rounded-lg bg-[#fafbfa] p-4 text-[13px] italic leading-relaxed text-[#454947]">&ldquo;{DASHBOARD_PERSONAS[0].interviewQuote.slice(0, 170)}&hellip;&rdquo;</p>
              <div className="mt-5 border-t border-[#e3e5e3] pt-4"><div className="mb-2 flex justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-[#748076]"><span>Confidence score</span><span className="text-[#121314]">82% · Strong</span></div><div className="h-2 overflow-hidden rounded-full bg-[#e3e5e3]"><div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#5A7973] to-[#1A3024]" /></div></div>
              <div className="mt-4 flex items-center gap-1.5">
                {DASHBOARD_PERSONAS.map((p, i) => (
                  <div
                    key={p.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === 0 ? 'w-6 bg-[#1A3024]' : 'w-1.5 bg-[#d1d5d3]'}`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Personas */}
      <RevealSection>
        <section id="dashboard-replica" className="relative border-b border-[#1A3024]/10 px-6 py-20 sm:px-12 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex items-center gap-4"><span className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#5A7973]">01 // Personas</span><span className="hidden h-px flex-1 bg-[#1A3024]/10 sm:block" /></div>
            <h2 className="max-w-3xl text-[32px] leading-[1.1] tracking-tight text-[#121314] sm:text-[44px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>AI-generated personas built from real research.</h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#5c625d]">Explore beliefs, behaviors, needs, and motivations. Each persona responds to your questions with the nuance of a real interview — including the objections that matter.</p>
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
              <div className="flex flex-col gap-7 lg:flex-row"><img src={selectedPersona.imgUrl} alt={selectedPersona.name} className="h-20 w-20 rounded-full object-cover" /><div className="flex-1"><p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#748076]">Interview question</p><p className="mt-3 text-[21px] leading-snug text-[#121314] sm:text-[26px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{selectedPersona.question}</p><div className="mt-6 border-l-2 border-[#1A3024] bg-[#fafbfa] p-5"><p className="text-[14px] italic leading-relaxed text-[#454947]">&ldquo;{selectedPersona.interviewQuote}&rdquo;</p></div><div className="mt-6 flex items-center gap-4"><span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#748076]">Confidence</span><div className="h-1.5 max-w-xs flex-1 overflow-hidden rounded-full bg-[#e3e5e3]"><div className="h-full rounded-full bg-[#1A3024]" style={{ width: `${selectedPersona.conviction}%` }} /></div><span className="text-[13px] font-medium text-[#121314]">{selectedPersona.conviction}%</span></div></div></div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Methodology Section */}
      <RevealSection>
        <section id="methodology" className="bg-[#F7F5F3] px-6 sm:px-12 py-12 sm:py-16 border-b border-[#1A3024]/10 scroll-mt-16 z-10 relative">
          <div
            id="methodology-header"
            onClick={() => setIsMethodologyActive(!isMethodologyActive)}
            className={`mb-8 sm:mb-10 flex items-end justify-between cursor-pointer group ${isMethodologyActive ? 'is-active' : ''}`}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#D1D5D3]/40 rounded-xl overflow-hidden">
            <div className="group relative bg-[#F7F5F3] p-6 sm:p-8 transition-all duration-500 hover:bg-white">
              <div className="flex justify-between items-start mb-6 sm:mb-8">
                <span className="text-[44px] sm:text-[56px] text-[#1A3024]/10 leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>01</span>
                <span className="inline-block animate-editorial-bounce"><span className="material-symbols-outlined text-[#B2B7AB] text-3xl sm:text-4xl transition-all duration-500 group-hover:text-[#5A7973] group-hover:scale-110">hub</span></span>
              </div>
              <h3 className="text-[24px] sm:text-[28px] mb-3 sm:mb-4 tracking-tight font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Ingest</h3>
              <p className="text-[14px] sm:text-[15px] text-[#454947] leading-relaxed opacity-85">
                Transform assumptions into intelligence. Bring your customer, market, brand, and product context together to build a foundation for smarter decisions.
              </p>
            </div>
            <div className="group relative bg-[#F7F5F3] p-6 sm:p-8 transition-all duration-500 hover:bg-white">
              <div className="flex justify-between items-start mb-6 sm:mb-8">
                <span className="text-[44px] sm:text-[56px] text-[#1A3024]/10 leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>02</span>
                <span className="inline-block animate-editorial-bounce"><span className="material-symbols-outlined text-[#B2B7AB] text-3xl sm:text-4xl transition-all duration-500 group-hover:text-[#5A7973] group-hover:scale-110">insights</span></span>
              </div>
              <h3 className="text-[24px] sm:text-[28px] mb-3 sm:mb-4 tracking-tight font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Simulate</h3>
              <p className="text-[14px] sm:text-[15px] text-[#454947] leading-relaxed opacity-85">
                Understand your customers at scale. Model perspectives, uncover motivations, objections, and opportunities before investing time, media, inventory, or engineering resources.
              </p>
            </div>
            <div className="group relative bg-[#F7F5F3] p-6 sm:p-8 transition-all duration-500 hover:bg-white">
              <div className="flex justify-between items-start mb-6 sm:mb-8">
                <span className="text-[44px] sm:text-[56px] text-[#1A3024]/10 leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>03</span>
                <span className="inline-block animate-editorial-bounce"><span className="material-symbols-outlined text-[#B2B7AB] text-3xl sm:text-4xl transition-all duration-500 group-hover:text-[#5A7973] group-hover:scale-110">checkbook</span></span>
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
            <div className="lg:col-span-7"><div className="mb-10 flex items-center gap-4"><span className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#b8ccba]">Confidence Score</span><span className="hidden h-px flex-1 bg-white/15 sm:block" /></div><h2 className="text-[32px] leading-[1.1] tracking-tight sm:text-[44px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Move Forward With Confidence.</h2><p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/70">Every AI interview gets a Confidence Score — how strongly that persona&rsquo;s response indicates they&rsquo;d buy, adopt, or recommend what you&rsquo;re testing. It&rsquo;s a read on one simulated person&rsquo;s conviction, not a verdict on the market; SignalRoom always tells you to validate real findings with real customers.</p><div className="mt-10 space-y-2">{[['record_voice_over', 'Stated Conviction', "Extracted directly from the persona's own response, not calculated as a separate judgment layered on top."], ['psychology', 'Behavioral Anchors', 'Calibrated against concrete reactions, from "I\'d sign up today" to "this doesn\'t work for me," for scores that are differentiated instead of generic.'], ['visibility', 'Visible Justification', 'Every score ships with a one-sentence reason pulled straight from what the persona said, so you can audit it instead of trusting a black box.']].map(([icon, title, description]) => <div key={title} className="flex gap-5 rounded-xl p-4 transition-colors hover:bg-white/5"><div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5"><span className="material-symbols-outlined text-white/60 text-xl">{icon}</span></div><div><h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-white">{title}</h3><p className="mt-1 text-[13px] leading-relaxed text-white/60">{description}</p></div></div>)}</div></div>
            <div className="flex flex-col items-center lg:col-span-5"><div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-[#e3e5e3] bg-white shadow-xl shadow-black/20"><svg className="absolute h-56 w-56 -rotate-90"><circle cx="112" cy="112" r="98" stroke="#e3e5e3" strokeWidth="3" fill="none" /><circle cx="112" cy="112" r="98" stroke="#1A3024" strokeWidth="4" fill="none" strokeDasharray="615.75" strokeDashoffset="30.79" strokeLinecap="round" /></svg><div className="z-10 text-center"><p className="text-[56px] leading-none text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>95</p><span className="mt-3 inline-block rounded bg-[#e9edea] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#1A3024]">Confidence Score</span></div></div><p className="mt-4 text-center text-[10px] uppercase tracking-[0.16em] text-white/40">Stated conviction · Visible justification</p></div>
          </div>
        </section>
      </RevealSection>

      {/* Platform toolkit */}
      <RevealSection>
        <section id="features" className="relative border-b border-[#1A3024]/10 px-6 py-20 sm:px-12 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex items-center gap-4"><span className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#5A7973]">02 // Platform</span><span className="hidden h-px flex-1 bg-[#1A3024]/10 sm:block" /></div>
            <h2 className="max-w-3xl text-[32px] leading-[1.1] tracking-tight text-[#121314] sm:text-[44px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Put every important decision in front of the people it needs to win over.</h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#5c625d]">Test your message, concept, product, or creative, then turn real-looking reactions into a clear next move before you commit time, budget, or a launch.</p>
            <div className="mt-14 grid gap-8 lg:grid-cols-12">
              <div className="space-y-2 lg:col-span-5">
                {[
                  ['01', 'Persona interviews', 'Hear the reason behind the reaction.'],
                  ['02', 'Concept test', 'See which idea wins.'],
                  ['03', 'Creative assessment', 'See what earns attention.'],
                  ['04', 'Insight reports', 'Turn scattered reactions into a decision your team can stand behind.'],
                ].map(([number, label, title], index) => <button key={label} onClick={() => setActiveToolkit(index)} className={`w-full rounded-xl border p-5 text-left transition-all duration-300 ${activeToolkit === index ? 'border-[#1A3024]/25 bg-white shadow-lg shadow-[#1A3024]/10' : 'border-transparent hover:bg-[#fafbfa]'}`}><div className="mb-2 flex items-center gap-3"><span className={`text-xs ${activeToolkit === index ? 'text-[#1A3024]' : 'text-[#aab0a3]'}`}>{number}</span><span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#748076]">{label}</span></div><p className="text-[18px] leading-snug text-[#1A3024]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{title}</p></button>)}
              </div>
              <div className="min-h-[420px] rounded-2xl border border-[#d1d5d3] bg-white p-7 sm:p-9 lg:col-span-7">
                {activeToolkit === 0 && <div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#748076]">01 / Persona interviews</p><h3 className="mt-3 text-[28px] leading-tight text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Hear the reason behind the reaction.</h3><p className="mt-5 text-sm leading-relaxed text-[#5c625d]">Run one-on-one simulated interviews with AI personas that represent your target customer. Every response includes a confidence score, behavioral signals, and a verbatim quote you can trace back to the source.</p><div className="mt-8 flex gap-4 rounded-xl bg-[#fafbfa] p-5"><img src={DASHBOARD_PERSONAS[1].imgUrl} alt={DASHBOARD_PERSONAS[1].name} className="h-11 w-11 rounded-full object-cover" /><div><p className="text-xs font-medium text-[#121314]">{DASHBOARD_PERSONAS[1].name}</p><p className="mt-2 text-[13px] italic leading-relaxed text-[#5c625d]">&ldquo;The confidence score is useful, but I&rsquo;d want to see how it holds up against a real customer panel before I trust it for roadmap decisions.&rdquo;</p></div></div><div className="mt-5 flex items-center gap-3 px-2"><span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#748076]">Confidence</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e3e5e3]"><div className="h-full w-[82%] rounded-full bg-[#1A3024]" /></div><span className="text-sm font-medium">82%</span></div><div className="mt-3 flex gap-1.5 px-2">{DASHBOARD_PERSONAS.map((p, i) => <div key={p.id} className={`h-1.5 rounded-full ${i === 1 ? 'w-6 bg-[#1A3024]' : 'w-1.5 bg-[#d1d5d3]'}`} />)}</div></div>}
                {activeToolkit === 1 && <div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#748076]">02 / Concept test</p><h3 className="mt-3 text-[28px] leading-tight text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>See which idea wins.</h3><p className="mt-5 text-sm leading-relaxed text-[#5c625d]">Upload up to four concepts — images included — and let the full panel rank them. You get a declared winner, per-persona scores, and the reasoning behind each vote before you commit to a direction.</p><div className="mt-8 flex items-center justify-between"><span className="text-xs font-medium text-[#454947]">Winner: Concept B</span><span className="rounded-full bg-[#F3F5F3] px-2 py-0.5 text-[10px] text-[#748076]">84%</span></div><div className="mt-3 space-y-4">{[['Concept A', 68, '#5A7973'], ['Concept B', 84, '#1A3024'], ['Concept C', 45, '#748076'], ['Concept D', 72, '#454947']].map(([name, score, color]) => <div key={String(name)} className="flex items-center gap-4"><span className="w-20 flex-shrink-0 text-xs font-medium text-[#5c625d]">{name}</span><div className="h-7 flex-1 overflow-hidden rounded-md bg-[#e9edea]"><div className="flex h-full items-center justify-end rounded-md pr-2 text-[10px] text-white" style={{ width: `${score}%`, backgroundColor: color as string }}>{score}%</div></div></div>)}</div></div>}
                {activeToolkit === 2 && <div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#748076]">03 / Creative assessment</p><h3 className="mt-3 text-[28px] leading-tight text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>See what earns attention.</h3><p className="mt-5 text-sm leading-relaxed text-[#5c625d]">See where attention actually lands on your packaging, ad, or landing page — a real measured heatmap, not a guess — then hear how each persona reads what&rsquo;s there.</p><div className="relative mt-8 overflow-hidden rounded-lg bg-[#fafbfa] p-4"><div className="relative aspect-[16/9] overflow-hidden rounded-md bg-gradient-to-br from-[#E3E5E3] to-[#D1D5D3]"><div className="absolute left-1/3 top-1/4 h-24 w-24 rounded-full bg-[#5A7973]/20 blur-2xl" /><div className="absolute right-1/4 top-1/2 h-20 w-20 rounded-full bg-[#B2B7AB]/20 blur-2xl" /><div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><span className="material-symbols-outlined text-5xl text-[#1A3024]/40">center_focus_strong</span><div className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#5A7973]">Heatmap overlay</div></div></div></div><div className="mt-3 flex items-center justify-between"><span className="text-xs text-[#748076]">Attention concentration: top-left quadrant</span><span className="text-[10px] text-[#aab0a3]">7 of 10 personas</span></div></div></div>}
                {activeToolkit === 3 && <div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#748076]">04 / Insight reports</p><h3 className="mt-3 text-[28px] leading-tight text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Turn scattered reactions into a decision your team can stand behind.</h3><p className="mt-5 text-sm leading-relaxed text-[#5c625d]">Every interview becomes a structured report: key themes, verbatim quotes, a confidence score, and next-step recommendations — shareable with your team in one click.</p><div className="mt-8 grid grid-cols-3 gap-3">{[['6', 'Themes'], ['12', 'Signals'], ['→', 'Next step']].map(([metric, label]) => <div key={label} className="rounded-lg border border-[#e3e5e3] p-3 text-center"><p className="text-2xl text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{metric}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-[#748076]">{label}</p></div>)}</div><div className="mt-3 space-y-2 rounded-lg bg-[#fafbfa] p-4">{['Price sensitivity is the primary objection', 'All personas value speed over depth', 'Slack integration is a top-3 feature request'].map((theme) => <div key={theme} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#5A7973]" /><span className="text-xs leading-relaxed text-[#454947]">{theme}</span></div>)}</div></div>}
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Capabilities */}
      <RevealSection>
        <section className="relative border-b border-[#1A3024]/10 bg-[#fafbfa]/60 px-6 py-20 sm:px-12 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-3xl text-[28px] sm:text-[36px] leading-tight tracking-tight text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Every tool you need to turn customer reactions into decisions.
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-[#d1d5d3]/30 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: 'compare_arrows', title: 'Compare Reactions', description: 'Put 2–4 personas side by side on the same question and see exactly where their reactions split — and why.' },
                { icon: 'groups', title: 'Audience Testing', description: 'Run one question against 5–10 personas at once and get sentiment distribution, a consensus score, and an AI executive summary in minutes.' },
                { icon: 'lightbulb', title: 'Concept Testing', description: 'Upload up to 4 concepts — images included — and let the full panel rank them: a declared winner, per-persona scores, and the reasoning behind each.' },
                { icon: 'center_focus_strong', title: 'Creative Testing', description: 'See where attention actually lands on your packaging, ad, or landing page — a real measured heatmap, not a guess — then hear how each persona reads what’s there.' },
                { icon: 'sensors', title: 'Market Signals', description: 'Every interview and test feeds a living signal feed — recurring pain points, objections, and opportunities, tracked as they strengthen or fade.' },
                { icon: 'description', title: 'Research Reports', description: 'Every interview becomes a structured report: key themes, verbatim quotes, a confidence score, and next-step recommendations — shareable with your team.' },
              ].map((cap) => (
                <div key={cap.title} className="group flex flex-col bg-white p-8 transition-all duration-500 hover:bg-[#fafbfa]/80 sm:p-10">
                  <span className="inline-block animate-editorial-bounce">
                    <span className="material-symbols-outlined text-4xl text-[#B2B7AB] transition-all duration-300 group-hover:scale-110 group-hover:text-[#454947]">
                      {cap.icon}
                    </span>
                  </span>
                  <h3 className="mt-8 text-xl tracking-tight text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{cap.title}</h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-[#5c625d]">{cap.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Teams and integrations */}
      <RevealSection><section id="integrations" className="border-b border-[#1A3024]/10 px-6 py-20 sm:px-12 sm:py-28"><div className="mx-auto max-w-6xl"><div className="mb-12 flex items-center gap-4"><span className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#5A7973]">03 // Built For Teams</span><span className="hidden h-px flex-1 bg-[#1A3024]/10 sm:block" /></div><div className="grid gap-8 lg:grid-cols-2"><article className="group rounded-xl border border-[#D1D5D3]/60 bg-white p-8 transition-all duration-500 hover:bg-[#FAFBFA]/60 sm:p-12"><span className="material-symbols-outlined mb-6 block text-4xl text-[#B2B7AB] transition-colors duration-300 group-hover:text-[#454947] animate-editorial-bounce">workspaces</span><h2 className="text-[28px] leading-tight text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Keep every research initiative in its own space.</h2><p className="mt-4 text-[14px] leading-relaxed text-[#5c625d]">Whether you&rsquo;re managing multiple brands, launching a new product, or supporting different clients, create dedicated workspaces that keep customer research organized and teams aligned. Share access with the right people while keeping each initiative focused.</p><div className="mt-6 flex gap-2">{['Brand A', 'Product B', 'Client C'].map((label) => <span key={label} className="rounded-full border border-[#D1D5D3] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[#5A7973]">{label}</span>)}</div></article><article className="group rounded-xl border border-[#D1D5D3]/60 bg-white p-8 transition-all duration-500 hover:bg-[#FAFBFA]/60 sm:p-12"><span className="material-symbols-outlined mb-6 block text-4xl text-[#B2B7AB] transition-colors duration-300 group-hover:text-[#454947] animate-editorial-bounce">share</span><h2 className="text-[28px] leading-tight text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Bring customer intelligence into your workflow.</h2><p className="mt-4 text-[14px] leading-relaxed text-[#5c625d]">Connect Slack and Notion once, and SignalRoom automatically delivers new reports, trends, and customer signals where your team already works — turning research into action without another dashboard to check.</p><div className="mt-7 flex gap-3"><div className="flex items-center gap-2 rounded-lg border border-[#e3e5e3] bg-[#fafbfa] px-4 py-3"><SlackMark size={18}/><span className="text-sm font-medium text-[#454947]">Slack</span></div><div className="flex items-center gap-2 rounded-lg border border-[#e3e5e3] bg-[#fafbfa] px-4 py-3"><NotionMark size={18}/><span className="text-sm font-medium text-[#454947]">Notion</span></div></div></article></div></div></section></RevealSection>

      {/* ROI */}
      <RevealSection><section id="roi" className="border-b border-[#1A3024]/10 bg-[#F7F5F3] px-6 py-20 sm:px-12 sm:py-28"><div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12 items-start"><div className="lg:col-span-6"><p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[.4em] text-[#5A7973]">04 // ROI</p><h2 className="mt-4 text-[32px] leading-[1.1] tracking-tight text-[#121314] sm:text-[44px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Quantify the Signal. Eliminate Waste.</h2><p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[#5c625d]">Traditional research engagements can cost thousands for a single study and move too slowly for real product cycles. SignalRoom gives teams a faster, more predictable way to pressure-test decisions before budget, inventory, packaging, media spend, or engineering time are committed.</p></div>
        <div className="lg:col-span-6"><div className="rounded-xl border border-[#d1d5d3] bg-white p-6 sm:p-8 shadow-lg shadow-[#1A3024]/8 transition-all duration-500 hover:shadow-xl hover:shadow-[#1A3024]/10">
          <div className="mb-6"><h3 className="text-xl font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>See your savings</h3><p className="mt-1 text-xs text-[#748076]">Traditional research costs thousands. See how SignalRoom compares.</p></div>
          <div className="space-y-8">
            <div>
              <div className="mb-4 flex items-center justify-between"><label className="block text-[11px] font-medium uppercase tracking-[.3em] text-[#454947]">Interviews per month</label><span className="text-xl font-normal text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{roiValue}</span></div>
              <input
                id="roi-range"
                aria-label="Interviews per month"
                type="range"
                min={1}
                max={30}
                step={1}
                value={roiValue}
                onChange={(event) => setRoiValue(parseInt(event.target.value))}
                className="roi-slider h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#e3e5e3]"
                style={{ background: `linear-gradient(to right, #1A3024 0%, #1A3024 ${((roiValue - 1) / 29) * 100}%, #E3E5E3 ${((roiValue - 1) / 29) * 100}%, #E3E5E3 100%)` }}
              />
              <div className="mt-3 flex justify-between text-[10px] font-medium tracking-[.2em] text-[#748076]"><span>1 UNIT</span><span>30 UNITS</span></div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#e3e5e3] bg-[#fafbfa]/50 p-5 transition-all duration-300 hover:bg-[#fafbfa]">
                <span className="mb-2 block text-[10px] font-medium uppercase tracking-[.3em] text-[#5A7973]">Traditional</span>
                <div className="mb-1 flex items-baseline gap-1"><span className="text-[28px] font-normal tracking-tighter text-[#121314]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>${traditionalCost.toLocaleString()}</span><span className="text-[11px] font-medium text-[#748076]">/month</span></div>
                <div className="mt-3 space-y-1.5 border-t border-[#e3e5e3] pt-3 text-[11px] text-[#5A7973]">
                  <div className="flex justify-between"><span>Time</span><span className="font-medium text-[#1A3024]">4 weeks</span></div>
                  <div className="flex justify-between"><span>Per interview</span><span className="font-medium text-[#1A3024]">$1,250</span></div>
                  <div className="flex justify-between"><span>Hours</span><span className="font-medium text-[#1A3024]">{traditionalHours}h</span></div>
                </div>
              </div>
              <div className="rounded-xl border border-[#d1d5d3] bg-[#F3F5F3] p-5 transition-all duration-300 hover:bg-[#fafbfa]">
                <span className="mb-2 block text-[10px] font-medium uppercase tracking-[.3em] text-[#1A3024]">SignalRoom</span>
                <div className="mb-1 flex items-baseline gap-1"><span className="text-[28px] font-normal tracking-tighter text-[#1A3024]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>$499</span><span className="text-[11px] font-medium text-[#454947]">/month</span></div>
                <p className="mb-3 text-[11px] font-medium text-[#454947]">100 interviews/month</p>
                <div className="space-y-1.5 border-t border-[#d1d5d3] pt-3 text-[11px] text-[#454947]">
                  <div className="flex justify-between"><span>Time</span><span className="font-medium">Minutes</span></div>
                  <div className="flex justify-between"><span>Per interview</span><span className="font-medium">~$0</span></div>
                  <div className="flex justify-between"><span>Hours</span><span className="font-medium">&lt; 1h</span></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#1A3024] p-5 text-white sm:p-6">
              <div><span className="mb-1 block text-[9px] font-medium uppercase tracking-[.3em] text-white/50">You save</span><div className="text-xl tracking-tighter sm:text-2xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>${savings.toLocaleString()}<span className="text-xs font-sans font-normal text-white/50">/mo</span></div><div className="mt-0.5 text-[10px] text-white/50">${annualSavings.toLocaleString()}/year</div></div>
              <div className="text-right"><span className="mb-1 block text-[9px] font-medium uppercase tracking-[.4em] text-white/50">Time saved</span><div className="text-xl tracking-tighter text-[#B2B7AB] sm:text-2xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{calculatedReduction}%</div><div className="mt-0.5 text-[10px] text-white/50">faster</div></div>
            </div>
          </div>
        </div></div>
      </div></section></RevealSection>

      {/* Pricing */}
      <RevealSection><section id="pricing" className="border-b border-[#1A3024]/10 px-6 py-20 sm:px-12 sm:py-28"><div className="mx-auto max-w-6xl"><div className="mb-12 flex items-center gap-4"><span className="text-[10px] font-medium uppercase tracking-[.4em] text-[#5A7973]">05 // Pricing</span><span className="hidden h-px flex-1 bg-[#1A3024]/10 sm:block"/></div><h2 className="max-w-3xl text-[32px] leading-[1.1] text-[#121314] sm:text-[44px]" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>Built for validation. Designed for scale.</h2><p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#5c625d]">Start with a single interview or scale customer intelligence across your entire organization.</p><div className="mt-14 grid gap-6 md:grid-cols-3">{[
        { name: 'Pulse', price: '$199', tagline: 'For solo founders getting started.', features: ['3 active research projects', '10 AI customer personas', 'Core simulation dialogue templates', 'Automated intelligence summaries'], cta: 'Start validating', highlighted: false },
        { name: 'Signal', price: '$499', tagline: 'For teams validating fast.', features: ['Unlimited research projects', 'Up to 50 AI customer personas', '100 interviews per month', 'Executive-ready research reports', 'Multi-persona comparative analysis', 'Advanced insight synthesis', 'Slack & Notion integrations'], cta: 'Get continuous signal', highlighted: true },
        { name: 'Broadcast', price: '$999', tagline: 'For agencies and growing teams.', features: ['Unlimited AI customer personas', 'Unlimited interviews', 'Everything in Signal', '10 collaborative team seats', 'Client-ready white-label reports', 'Priority feature access and support'], cta: 'Scale your research', highlighted: false },
      ].map((plan, index) => <article key={plan.name} className={plan.highlighted ? 'relative flex min-h-[430px] flex-col rounded-2xl border border-[#1A3024] bg-[#1A3024] p-8 text-white shadow-2xl shadow-[#1A3024]/20 md:-translate-y-3' : 'flex min-h-[430px] flex-col rounded-2xl border border-[#d1d5d3] bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#B2B7AB] hover:shadow-lg hover:shadow-[#1A3024]/8'}>{plan.highlighted && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#5A7973] px-4 py-1 text-[10px] font-bold uppercase tracking-[.15em] text-[#fcf9f8]">Most popular</span>}<h3 className="text-2xl" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>{plan.name}</h3><p className={plan.highlighted ? 'mb-6 mt-2 text-xs leading-relaxed text-white/60' : 'mb-6 mt-2 text-xs leading-relaxed text-[#748076]'}>{plan.tagline}</p><div className="mb-8 flex items-baseline gap-1"><span className="text-4xl" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>{plan.price}</span><span className={plan.highlighted ? 'text-sm text-white/50' : 'text-sm text-[#748076]'}>/month</span></div><ul className="mb-8 flex-1 space-y-3">{plan.features.map(feature=><li key={feature} className="flex items-start gap-2.5"><span className={`material-symbols-outlined mt-0.5 flex-shrink-0 text-[16px] ${plan.highlighted ? 'text-[#B2B7AB]' : 'text-[#5A7973]'}`}>check_circle</span><span className={plan.highlighted ? 'text-[13px] leading-relaxed text-white/80' : 'text-[13px] leading-relaxed text-[#5c625d]'}>{feature}</span></li>)}</ul><Link href="/signup" className={plan.highlighted ? 'block rounded-full bg-[#fcf9f8] py-3 text-center text-[11px] font-medium uppercase tracking-[.15em] text-[#121314] transition-all duration-300 hover:bg-[#FAFBFA] hover:shadow-lg hover:shadow-white/20' : 'block rounded-full bg-[#1A3024] py-3 text-center text-[11px] font-medium uppercase tracking-[.15em] text-white transition-all duration-300 hover:bg-[#5A7973]'}>{plan.cta}</Link></article>)}</div><p className="mt-10 text-center text-sm text-[#748076]">For teams scaling customer intelligence across the organization, <a href="#contact" className="text-[#1A3024] underline underline-offset-4 hover:text-[#121314]">contact us for tailored enterprise solutions</a>.</p></div></section></RevealSection>

      {/* CTA */}
      <RevealSection><section className="relative overflow-hidden bg-[#1A3024] px-6 py-24 text-[#fcf9f8] sm:px-12 sm:py-32"><div className="absolute inset-0 opacity-[.07]" style={{backgroundImage:'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)',backgroundSize:'4px 4px'}}/><div className="relative mx-auto max-w-4xl text-center"><img src="/signalroom-mark.svg" alt="SignalRoom" className="mx-auto h-12 w-auto brightness-0 invert"/><h2 className="mt-8 text-[38px] leading-[1.08] sm:text-[58px]" style={{fontFamily:"'Playfair Display', Georgia, serif"}}>The market is speaking.<br/><span className="italic text-white/70">It’s time you answered back.</span></h2><p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-white/65">Find the signal before the market does. Validate faster. Reduce risk. Build what customers actually want.</p><div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"><Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fcf9f8] px-7 py-3.5 text-sm font-medium text-[#1A3024] transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-[#fcf9f8]/10 hover:-translate-y-0.5">Start your first interview<span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link><a href="#methodology" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:border-white/40 hover:bg-white/5">See the methodology</a></div></div></section></RevealSection>

      {/* Footer */}
      <footer className="px-6 sm:px-12 py-14 sm:py-16 w-full bg-[#ECE9E6] relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <img
                src="/signalroom-logo.svg"
                alt="SignalRoom Logo"
                width="109"
                height="64"
                className="h-14 w-auto object-contain mobile-crisp-vector mb-4"
              />
              <p className="text-xs leading-relaxed max-w-xs text-[#454947] opacity-90">
                Customer intelligence infrastructure for modern teams.
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#5c625d] mb-4">Product</h4>
              <ul className="space-y-2.5">
                <li><a href="#dashboard-replica" className="text-xs text-[#454947] hover:text-[#1A3024] transition-colors">Platform</a></li>
                <li><a href="#features" className="text-xs text-[#454947] hover:text-[#1A3024] transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-xs text-[#454947] hover:text-[#1A3024] transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#5c625d] mb-4">Company</h4>
              <ul className="space-y-2.5">
                <li><a href="#methodology" className="text-xs text-[#454947] hover:text-[#1A3024] transition-colors">Methodology</a></li>
                <li><a href="#integrations" className="text-xs text-[#454947] hover:text-[#1A3024] transition-colors">Integrations</a></li>
                <li><Link href="/contact" className="text-xs text-[#454947] hover:text-[#1A3024] transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#5c625d] mb-4">Support</h4>
              <ul className="space-y-2.5">
                <li><Link href="/faq" className="text-xs text-[#454947] hover:text-[#1A3024] transition-colors">FAQ</Link></li>
                <li><Link href="/privacy" className="text-xs text-[#454947] hover:text-[#1A3024] transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-xs text-[#454947] hover:text-[#1A3024] transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#1A3024]/10 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#5c625d] font-medium">
              © 2026 SignalRoom. All rights reserved. SignalRoom™ is a proprietary product and trademark.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-[#5c625d] hover:text-[#1A3024] transition-colors" aria-label="LinkedIn">
                <span className="material-symbols-outlined text-[18px]">share</span>
              </a>
              <Link href="/contact" className="text-[#5c625d] hover:text-[#1A3024] transition-colors" aria-label="Email">
                <span className="material-symbols-outlined text-[18px]">mail</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
