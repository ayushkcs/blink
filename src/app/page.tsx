import Link from "next/link";
import { Header } from "@/components/Header";

export default function LandingPage() {
  return (
    <div className="landing">
      <Header />

      {/* Hero */}
      <section className="hero" id="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Open Source · Free Forever
          </div>

          <h1 className="hero-title">
            Share Files <span className="hero-title-gradient">Instantly.</span>
            <br />
            No Setup Required.
          </h1>

          <p className="hero-subtitle">
            Drop any file and send it directly to another device. No accounts, no uploads, no servers.
            Just pure peer-to-peer magic powered by WebRTC.
          </p>

          <div className="hero-cta-row">
            <Link href="/share" className="btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m16 16-4-4-4 4" />
              </svg>
              Start Sharing
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <div className="features-inner">
          <div className="features-header">
            <span className="features-label">Features</span>
            <h2 className="features-title">Everything you need, nothing you don&apos;t</h2>
            <p className="features-subtitle">
              Built for simplicity and speed. No compromise on privacy.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon feature-icon-purple">🔒</div>
              <h3 className="feature-title">End-to-End Private</h3>
              <p className="feature-desc">
                Files transfer directly between browsers via WebRTC. Your data never touches any server. Ever.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-pink">⚡</div>
              <h3 className="feature-title">Blazing Fast</h3>
              <p className="feature-desc">
                Direct peer-to-peer connections mean your files transfer at the maximum speed your network allows.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-orange">📂</div>
              <h3 className="feature-title">Any File Format</h3>
              <p className="feature-desc">
                PDF, PNG, JPG, GIF, ZIP, MP4 and more. Send literally any file format. No restrictions, no compression.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-cyan">📡</div>
              <h3 className="feature-title">Auto Discovery</h3>
              <p className="feature-desc">
                Automatically finds devices on the same network. Just open the app and your peers appear like magic.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-green">✨</div>
              <h3 className="feature-title">No Setup Needed</h3>
              <p className="feature-desc">
                No accounts, no downloads, no room codes. Just open the page and start sharing with nearby devices.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-blue">📱</div>
              <h3 className="feature-title">Works Everywhere</h3>
              <p className="feature-desc">
                Desktop, tablet, or phone. The responsive design adapts perfectly to any screen size.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section" id="how-it-works">
        <div className="how-inner">
          <div className="how-header">
            <span className="features-label">How It Works</span>
            <h2 className="how-title">Three steps. That&apos;s it.</h2>
            <p className="how-subtitle">No sign-up, no downloads, no nonsense.</p>
          </div>

          <div className="how-steps">
            <div className="how-step">
              <div className="how-step-number">1</div>
              <h3 className="how-step-title">Open the App</h3>
              <p className="how-step-desc">
                Just visit the page on any device. Blink automatically detects other devices on your same network.

              </p>
            </div>
            <div className="how-step">
              <div className="how-step-number">2</div>
              <h3 className="how-step-title">Connect</h3>
              <p className="how-step-desc">
                Other devices on the same Wi-Fi are discovered automatically.
                A direct WebRTC connection is established. No servers involved.
              </p>
            </div>
            <div className="how-step">
              <div className="how-step-number">3</div>
              <h3 className="how-step-title">Drop & Send</h3>
              <p className="how-step-desc">
                Drag any file onto the page. It transfers directly to your peer&apos;s browser. Instantly and privately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to share files?</h2>
          <p className="cta-subtitle">
            No account needed. No app to install. Works right in your browser.
          </p>
          <Link href="/share" className="btn-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            Start Sharing Now
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <p>
          Files never leave your browser
        </p>
        <p style={{ marginTop: 4 }}>
          Built by <a href="https://ayushk.blog/" target="_blank" rel="noopener noreferrer">Ayush</a>
        </p>
      </footer>
    </div>
  );
}
