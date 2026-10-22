import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, 
  Award, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  GraduationCap, 
  FileText, 
  ChevronRight
} from "lucide-react";
import spmsLogo from "../assets/logo/spms-logo.png";
import "./LandingPage.css";

function LandingPage({ onNavigateToLogin }) {
  const navigate = useNavigate();
  const [topCompanies, setTopCompanies] = useState([]);

  // Fetch companies from MySQL on mount — always live
  useEffect(() => {
    fetch("http://localhost:5001/api/companies")
      .then(res => res.json())
      .then(data => {
        const list = data?.companies || (Array.isArray(data) ? data : []);
        setTopCompanies(list);
      })
      .catch(() => setTopCompanies([]));
  }, []);

  const handleLogin = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      navigate("/login");
    }
  };
  // Placement Statistics Data
  const stats = [
    { label: "Placement Rate", value: "94%", icon: TrendingUp },
    { label: "Recruiting Partners", value: `${topCompanies.length || "14"}+`, icon: Building2 },
    { label: "Highest Package", value: "₹42 LPA", icon: Award },
    { label: "Average Package", value: "₹8.5 LPA", icon: Briefcase },
  ];

  // Core Features Data
  const features = [
    {
      icon: ShieldCheck,
      title: "Automated Eligibility Check",
      desc: "Instantly see which campus placement drives you qualify for based on your department, CGPA, and backlog criteria."
    },
    {
      icon: TrendingUp,
      title: "Real-Time Application Tracking",
      desc: "Monitor your application status from submission to interview rounds and final offer letters live."
    },
    {
      icon: Building2,
      title: "Top Tier Hiring Partners",
      desc: "Connect directly with leading multinational corporations, fast-growing tech companies, and consulting giants."
    },
    {
      icon: FileText,
      title: "Centralized Resume & Profile",
      desc: "Maintain your verified academic credentials, technical skills, and resume for one-click drive applications."
    }
  ];

  return (
    <div className="landing-container">
      {/* 1. TOP NAVIGATION BAR (Dark Slate theme so white logo pops) */}
      <header className="landing-navbar">
        <div className="nav-brand">
          <div className="nav-logo-box">
            <img src={spmsLogo} alt="SPMS Logo" className="nav-logo" />
          </div>
          <div className="brand-text">
            <span className="brand-title">SPMS</span>
            <span className="brand-subtitle">Placement Portal</span>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#stats">Statistics</a>
          <a href="#companies">Recruiters</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          <button className="btn-login" onClick={handleLogin}>
            <span>Portal Login</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="hero-section">
        <div className="hero-badge">
          <GraduationCap size={16} />
          <span>Smart Placement Management System</span>
        </div>

        <h1 className="hero-title">
          Connecting Student Ambition <br />
          With <span className="highlight">Top Industry Careers<span className="dot"></span></span>
        </h1>

        <p className="hero-subtitle">
          The centralized platform for campus drives, internships, eligibility verification, 
          and seamless recruiter coordination for students and faculty.
        </p>

        <div className="hero-cta-group">
          <button className="btn-primary" onClick={handleLogin}>
            <span>Access Student Portal</span>
            <ArrowRight size={18} />
          </button>
          
          <a href="#companies" className="btn-secondary">
            <span>View Hiring Companies</span>
            <ChevronRight size={18} />
          </a>
        </div>

        {/* Micro Features */}
        <div className="hero-micro-points">
          <div className="micro-point">
            <CheckCircle2 size={16} className="check-icon" />
            <span>100% Verified Campus Drives</span>
          </div>
          <div className="micro-point">
            <CheckCircle2 size={16} className="check-icon" />
            <span>Automated Status Alerts</span>
          </div>
          <div className="micro-point">
            <CheckCircle2 size={16} className="check-icon" />
            <span>Direct TPO Coordination</span>
          </div>
        </div>
      </section>

      {/* 3. STATS COUNTER */}
      <section className="stats-section" id="stats">
        <div className="stats-grid">
          {stats.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div className="stat-box" key={index}>
                <div className="stat-icon-wrapper">
                  <IconComponent size={24} />
                </div>
                <div className="stat-info">
                  <h2 className="stat-value">{item.value}</h2>
                  <p className="stat-label">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. KEY CAPABILITIES */}
      <section className="features-section" id="features">
        <div className="section-header">
          <span className="section-tag">KEY CAPABILITIES</span>
          <h2 className="section-title">Built For Seamless Campus Placements</h2>
          <p className="section-desc">
            Everything students and placement coordinators need to manage end-to-end recruitment drives.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => {
            const IconComp = feature.icon;
            return (
              <div className="feature-card" key={index}>
                <div className="feature-icon-box">
                  <IconComp size={24} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. TOP HIRING PARTNERS */}
      <section className="companies-section" id="companies">
        <div className="section-header">
          <span className="section-tag">CAMPUS RECRUITERS</span>
          <h2 className="section-title">Leading Companies Hiring Our Talent</h2>
          <p className="section-desc">
            Top global organizations regularly visit our campus to recruit forward-thinking graduates.
          </p>
        </div>

        <div className="companies-marquee-grid">
          {topCompanies.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", gridColumn: "1/-1", padding: "20px" }}>
              Loading partner companies...
            </p>
          ) : (
            topCompanies.map((comp, index) => {
              const packageLabel = comp.package_lpa ? `₹${comp.package_lpa} LPA` : (comp.roles_count ? `${comp.roles_count}+ Roles` : "Hiring");
              const statusLabel = (comp.status || "").toLowerCase();
              const isActive = statusLabel === "active" || statusLabel === "hiring";
              return (
                <div className="company-logo-card" key={comp.id || index}>
                  <div className="company-avatar-badge">
                    {comp.logo_letter || (comp.name ? comp.name.charAt(0).toUpperCase() : "C")}
                  </div>
                  <h4>{comp.name}</h4>
                  <span className="company-tag">{packageLabel}</span>
                  {isActive && (
                    <span style={{
                      fontSize: "10px", fontWeight: "600", background: "#dcfce7",
                      color: "#16a34a", padding: "2px 8px", borderRadius: "20px",
                      marginTop: "4px", display: "inline-block"
                    }}>● Hiring Now</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="cta-banner">
        <div className="cta-content">
          <h2>Ready To Kickstart Your Career?</h2>
          <p>Sign in with your student credentials to view upcoming placement drives and submit your applications.</p>
          <button className="btn-cta" onClick={handleLogin}>
            <span>Login to Student Portal</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="landing-footer" id="about">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand-combo">
              <img src={spmsLogo} alt="SPMS Logo" className="footer-logo" />
              <div>
                <h3>SPMS</h3>
                <p>Smart Placement Management System</p>
              </div>
            </div>
            <p className="footer-text">
              Empowering students and streamlining university campus recruitment with automated drive management.
            </p>
          </div>

          <div className="footer-column">
            <h4>Quick Links</h4>
            <a href="#features">Features</a>
            <a href="#stats">Placement Stats</a>
            <a href="#companies">Recruiters</a>
          </div>

          <div className="footer-column">
            <h4>Portals</h4>
            <span onClick={handleLogin} className="footer-link">Student Login</span>
            <span onClick={handleLogin} className="footer-link">Recruiter Portal</span>
            <span onClick={handleLogin} className="footer-link">TPO / Admin Panel</span>
          </div>

          <div className="footer-column">
            <h4>Support</h4>
            <p className="footer-text">Training & Placement Cell</p>
            <p className="footer-text">placement@cusat.ac.in</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Smart Placement Management System (SPMS). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;