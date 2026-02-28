import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>

      {/* ── Navigation ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-logo">
            <div className="lp-logo-mark">B</div>
            BitLazy
          </Link>
          <div className="lp-nav-links">
            <a href="#features" className="lp-nav-link">Features</a>
            <a href="#how" className="lp-nav-link">How it works</a>
            <a href="#usecases" className="lp-nav-link">Use cases</a>
          </div>
          <Link href="/lobby" className="lp-nav-cta">
            Open App →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        {/* Left */}
        <div>
          <div className="lp-hero-eyebrow">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <circle cx="5" cy="5" r="5" />
            </svg>
            AI-Powered Reasoning Platform
          </div>
          <h1 className="lp-hero-h1">
            Collaborative Intelligence for Better Thinking
          </h1>
          <p className="lp-hero-sub">
            A structured reasoning platform where students learn to think better — with AI that guides, not answers. Build arguments, surface contradictions, and reason together.
          </p>
          <div className="lp-hero-actions">
            <Link href="/lobby" className="btn-primary">
              Get Started
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a href="#how" className="btn-secondary">
              View Demo
            </a>
          </div>
        </div>

        {/* Right — diagram */}
        <div className="lp-hero-visual">
          <div className="hero-diagram">
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div className="hero-diagram-node">
                <div className="hero-diagram-dot" style={{ background: "var(--color-claim)" }} />
                <div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 2 }}>Claim</div>
                  AI systems should be subject to regulation
                </div>
              </div>
              <div className="hero-diagram-connector" />
              <div className="hero-diagram-node">
                <div className="hero-diagram-dot" style={{ background: "var(--color-evidence)" }} />
                <div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 2 }}>Evidence</div>
                  EU AI Act shows regulation is feasible
                </div>
              </div>
              <div className="hero-diagram-connector" />
              <div className="hero-diagram-node">
                <div className="hero-diagram-dot" style={{ background: "var(--color-counter)" }} />
                <div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 2 }}>Counter</div>
                  Regulation stifles innovation
                </div>
              </div>
              <div className="hero-diagram-connector" />
              <div className="hero-diagram-node hero-diagram-ai">
                <div className="hero-diagram-dot" />
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 2 }}>🤖 AI Moderator</div>
                  What evidence exists that regulation improved AI safety?
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: "var(--color-border)", maxWidth: 1100, margin: "0 auto 0" }} />

      {/* ── Features ── */}
      <section className="lp-features" id="features">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="lp-section-head">
            <div className="lp-section-label">Core Capabilities</div>
            <h2 className="lp-section-h2">Everything you need to reason better</h2>
            <p className="lp-section-sub">Built for structured thought — not just chat. Every feature is designed to surface insight, not noise.</p>
          </div>
          <div className="features-grid">
            {[
              {
                icon: "🤖",
                bg: "#f0f0f2",
                title: "AI Moderation (No Answers)",
                desc: "The AI never tells you the answer. It asks targeted Socratic questions to guide your thinking forward.",
              },
              {
                icon: "🕸️",
                bg: "#eff6ff",
                title: "Structured Reasoning Graph",
                desc: "Every message is a node. See how claims connect to evidence, counters, and synthesis in real time.",
              },
              {
                icon: "📊",
                bg: "#f0fdf4",
                title: "Contribution Quality Scoring",
                desc: "Arguments are scored for depth, novelty, and logical integrity — not upvotes.",
              },
              {
                icon: "🧬",
                bg: "#f5f3ff",
                title: "Collective Intelligence Metrics",
                desc: "Track reasoning diversity, discussion stage, and group convergence over time.",
              },
            ].map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon" style={{ background: f.bg }}>
                  {f.icon}
                </div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-how" id="how">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="lp-section-head">
            <div className="lp-section-label">Process</div>
            <h2 className="lp-section-h2">How it works</h2>
            <p className="lp-section-sub">Three phases. Repeating. Each iteration making the reasoning sharper.</p>
          </div>
          <div className="how-grid">
            {[
              {
                n: "1",
                icon: "✍️",
                title: "Submit structured thoughts",
                desc: "Students add claims, evidence, counterarguments, and questions. Every entry is tagged by type.",
              },
              {
                n: "2",
                icon: "⚙️",
                title: "Engine analyzes & scores",
                desc: "Our backend pipeline checks for duplicates, scores reasoning quality, and updates session metrics in real time.",
              },
              {
                n: "3",
                icon: "💡",
                title: "AI guides, never answers",
                desc: "The AI responds with a Socratic question and feedback — never the answer. It surfaces contradictions and logical gaps.",
              },
            ].map((s) => (
              <div className="how-step" key={s.n}>
                <div className="how-step-num">{s.n}</div>
                <div>
                  <div className="how-step-title">{s.icon} {s.title}</div>
                  <div className="how-step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="lp-usecases" id="usecases">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="lp-section-head">
            <div className="lp-section-label">Use Cases</div>
            <h2 className="lp-section-h2">Built for every learning context</h2>
            <p className="lp-section-sub">From classrooms to workshops, wherever deep thinking happens.</p>
          </div>
          <div className="usecase-grid">
            {[
              {
                icon: "🏫",
                title: "Classrooms",
                desc: "Give students a structured space to debate topics, backed by AI that ensures rigor without giving away answers. Works across all subjects.",
              },
              {
                icon: "👥",
                title: "Group Projects",
                desc: "Replace chaotic group chats with a structured reasoning board. Track who contributed what and how well the arguments hold up.",
              },
              {
                icon: "🧠",
                title: "Critical Thinking Workshops",
                desc: "Design exercises around real controversy. Let participants reason through complex topics with AI keeping the discussion sharp.",
              },
            ].map((u) => (
              <div className="usecase-card" key={u.title}>
                <span className="usecase-icon">{u.icon}</span>
                <div className="usecase-title">{u.title}</div>
                <div className="usecase-desc">{u.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="lp-cta-banner">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="cta-inner">
            <h2>Start reasoning together</h2>
            <p>Create a room in seconds. No account needed. Just better thinking.</p>
            <Link href="/lobby" className="btn-white">
              Open App
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span className="lp-footer-copy">© {new Date().getFullYear()} BitLazy. All rights reserved.</span>
          <nav className="lp-footer-links">
            {[
              { label: "About", href: "#" },
              { label: "Privacy", href: "#" },
              { label: "Contact", href: "#" },
              { label: "GitHub", href: "https://github.com" },
              { label: "LinkedIn", href: "https://linkedin.com" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="lp-footer-link" target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
