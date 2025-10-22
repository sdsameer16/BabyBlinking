import { Link } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  return (
    <div className="landing-container">
      <Link to="/login">
        <button className="login-btn">Login/Register</button>
      </Link>
      
      {/* Main Heading with Animation */}
      <div className="header-section">
        <h1>
          <span>B</span>
          <span>A</span>
          <span>B</span>
          <span>Y</span>
          <span> </span>
          <span>B</span>
          <span>L</span>
          <span>I</span>
          <span>N</span>
          <span>K</span>
        </h1>
        <p className="tagline">Where Every Blink Tells a Story</p>
      </div>

      {/* Main Content Section */}
      <div className="content-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👶</div>
            <h3>Growth Tracking</h3>
            <p>Monitor your baby's development milestones with intuitive tracking tools and personalized insights.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Smart Analytics</h3>
            <p>Get detailed analytics on sleep patterns, feeding schedules, and health metrics with AI-powered insights.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👨‍👩‍👧‍👦</div>
            <h3>Family Sharing</h3>
            <p>Share precious moments and updates with family members in real-time with secure sharing options.</p>
          </div>
        </div>

        {/* About Section */}
        <div className="about-section">
          <h2>Why Choose BabyBlink?</h2>
          <div className="benefits-list">
            <div className="benefit-item">
              <span className="checkmark">✓</span>
              <span>24/7 Health Monitoring</span>
            </div>
            <div className="benefit-item">
              <span className="checkmark">✓</span>
              <span>Expert Pediatric Advice</span>
            </div>
            <div className="benefit-item">
              <span className="checkmark">✓</span>
              <span>Secure Cloud Storage</span>
            </div>
            <div className="benefit-item">
              <span className="checkmark">✓</span>
              <span>Multi-Device Sync</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <h2>Start Your Parenting Journey Today!</h2>
          <p>Join thousands of happy parents who trust BabyBlink for their baby's well-being.</p>
          <Link to="/login">
            <button className="cta-button">Get Started Free</button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <p>© 2025 BabyBlink. All rights reserved. | Safe, Secure, and Loved by Parents Worldwide</p>
      </div>
    </div>
  );
}