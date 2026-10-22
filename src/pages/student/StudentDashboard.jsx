import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import { getStoredUser } from "../../services/authService";
import { getStudentApplications, getStoredDrives, getStudentProfile, getProfileCompletion } from "../../utils/drivesStore";
import { getStoredCompanies } from "../../utils/companiesStore";
import API from "../../services/api";

function StudentDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const studentName = user?.name ? user.name.split(" ")[0] : "Student";
  const avatarLetter = user?.name ? user.name[0].toUpperCase() : "S";
  const hour = new Date().getHours();

  // Dynamic applications, drives, and companies state
  const [applications, setApplications] = useState([]);
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [studentProfile, setStudentProfile] = useState(() => getStudentProfile(user) || {});

  useEffect(() => {
    setApplications(getStudentApplications(user?.email));
    const loadedDrives = getStoredDrives();
    setDrives(loadedDrives);

    // Always fetch companies from MySQL — the single source of truth
    API.get("/companies")
      .then(res => {
        const list = res.data?.companies || (Array.isArray(res.data) ? res.data : null);
        setCompanies(list || getStoredCompanies());
      })
      .catch(() => {
        setCompanies(getStoredCompanies());
      });

    setStudentProfile(getStudentProfile(user) || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const completion = getProfileCompletion(studentProfile, user);
  const percentage = completion.percentage;

  const totalApps = applications.length;
  const shortlisted = applications.filter(a => a.status === "Shortlisted").length;
  const placed = applications.filter(a => a.status === "Selected" || a.status === "Offer").length;
  const activeDrives = drives.length;

  let greeting;
  let greetingEmoji;

  if (hour >= 5 && hour < 12) {
    greeting = "Good Morning";
    greetingEmoji = "🌅";
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good Afternoon";
    greetingEmoji = "☀️";
  } else if (hour >= 17 && hour < 21) {
    greeting = "Good Evening";
    greetingEmoji = "🌆";
  } else {
    greeting = "Good Night";
    greetingEmoji = "🌙";
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>
            {greetingEmoji} {greeting}, {studentName} 👋
          </h1>
          <p>Here's your placement overview.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button 
            onClick={() => navigate("/student/profile?edit=true")}
            style={{
              background: "#173b32",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "9px 15px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            ✏️ Edit Profile
          </button>

          <div 
            className="student-avatar" 
            onClick={() => navigate("/student/profile")}
            style={{ cursor: "pointer" }}
            title="Go to Profile"
          >
            {avatarLetter}
          </div>
        </div>
      </div>

      {/* Profile Completion Widget - Clean Modern SaaS Card */}
      <div style={{
        background: "#ffffff",
        border: percentage === 100 ? "1px solid #d1fae5" : "1px solid #e5ebe8",
        borderRadius: "16px",
        padding: "18px 22px",
        marginBottom: "24px",
        boxShadow: "0 4px 18px rgba(20, 55, 47, 0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Progress Circular Badge */}
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: percentage === 100 ? "#ecfdf5" : (percentage >= 50 ? "#f0fdf4" : "#fef3c7"),
              color: percentage === 100 ? "#059669" : (percentage >= 50 ? "#059669" : "#d97706"),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "14px",
              border: percentage === 100 ? "2px solid #10b981" : (percentage >= 50 ? "2px solid #10b981" : "2px solid #f59e0b"),
              flexShrink: 0
            }}>
              <span>{percentage}%</span>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#173b32" }}>
                  {percentage === 100 ? "Placement Profile Complete" : "Complete Your Placement Profile"}
                </h3>
                <span style={{
                  padding: "3px 9px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "0.3px",
                  background: percentage === 100 ? "#ecfdf5" : "#eff6ff",
                  color: percentage === 100 ? "#047857" : "#1d4ed8",
                  border: percentage === 100 ? "1px solid #a7f3d0" : "1px solid #bfdbfe"
                }}>
                  {percentage === 100 ? "✓ 100% Placement Ready" : `${completion.completedCount}/${completion.totalCount} Details Filled`}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                {percentage === 100 
                  ? "All personal details, academics, and key skills are completed. You are eligible to apply for campus recruitment drives." 
                  : "Fill in your remaining details to reach 100% and ensure full eligibility across all visiting companies."}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {percentage === 100 ? (
              <button
                onClick={() => navigate("/student/profile")}
                style={{
                  background: "#ffffff",
                  color: "#173b32",
                  border: "1px solid #cbd5e1",
                  borderRadius: "9px",
                  padding: "9px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease"
                }}
              >
                <span>👁️ View Profile</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/student/profile?edit=true")}
                style={{
                  background: "#173b32",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "9px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease"
                }}
              >
                <span>Complete Profile →</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: "100%",
          height: "6px",
          background: "#f1f5f9",
          borderRadius: "8px",
          overflow: "hidden"
        }}>
          <div style={{
            width: `${percentage}%`,
            height: "100%",
            background: percentage === 100 ? "#10b981" : "linear-gradient(90deg, #10b981, #059669)",
            borderRadius: "8px",
            transition: "width 0.4s ease"
          }} />
        </div>

        {/* Missing fields badges if under 100% */}
        {percentage < 100 && completion.missing.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", paddingTop: "2px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Missing details:</span>
            {completion.missing.map((item) => (
              <span
                key={item.key}
                onClick={() => navigate("/student/profile?edit=true")}
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "#f8fafc",
                  color: "#334155",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  fontWeight: "500",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                title={`Click to fill ${item.label}`}
              >
                <span style={{ color: "#d97706", fontWeight: "bold" }}>+</span> {item.label} (+10%)
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div 
          className="stat-card" 
          onClick={() => navigate("/student/applications")}
          style={{ cursor: "pointer" }}
          title="View My Applications"
        >
          <div className="stat-icon">📄</div>
          <div>
            <p>Applications</p>
            <h2>{totalApps}</h2>
          </div>
        </div>

        <div 
          className="stat-card" 
          onClick={() => navigate("/student/applications")}
          style={{ cursor: "pointer" }}
          title="View Shortlisted"
        >
          <div className="stat-icon">⭐</div>
          <div>
            <p>Shortlisted</p>
            <h2>{shortlisted}</h2>
          </div>
        </div>

        <div 
          className="stat-card" 
          onClick={() => navigate("/student/applications")}
          style={{ cursor: "pointer" }}
          title="View Offers"
        >
          <div className="stat-icon">🎯</div>
          <div>
            <p>Placed</p>
            <h2>{placed}</h2>
          </div>
        </div>

        <div 
          className="stat-card" 
          onClick={() => navigate("/student/drives")}
          style={{ cursor: "pointer" }}
          title="View Active Drives"
        >
          <div className="stat-icon">💼</div>
          <div>
            <p>Active Drives</p>
            <h2>{activeDrives}</h2>
          </div>
        </div>

        <div 
          className="stat-card" 
          onClick={() => navigate("/student/companies")}
          style={{ cursor: "pointer" }}
          title="View Connected Partner Companies"
        >
          <div className="stat-icon">🏢</div>
          <div>
            <p>Connected Companies</p>
            <h2>{companies.length}</h2>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-grid">
        {/* Upcoming Drives */}
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Upcoming Placement Drives</h2>
              <p>Don't miss these opportunities.</p>
            </div>

            <button onClick={() => navigate("/student/drives")}>View All</button>
          </div>

          <div className="drive-list">
            {drives.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "#64748b" }}>
                <p style={{ fontSize: "14px", margin: "0 0 6px 0", fontWeight: 500 }}>No placement drives active right now.</p>
                <small style={{ fontSize: "12px", color: "#94a3b8" }}>Upcoming drives will appear here once announced by the TPO.</small>
              </div>
            ) : (
              drives.slice(0, 3).map((drive) => {
                const isApplied = applications.some(a => 
                  (a.driveId && String(a.driveId) === String(drive.id)) ||
                  (a.company && drive.company && a.company.toLowerCase().trim() === drive.company.toLowerCase().trim())
                );

                return (
                  <div className="drive-item" key={drive.id}>
                    <div className="company-logo">{drive.logoLetter || drive.company[0]}</div>

                    <div className="drive-info">
                      <h3>{drive.company}</h3>
                      <p>{drive.role}</p>
                    </div>

                    <div className="drive-date">
                      <strong>{drive.driveDate ? drive.driveDate.slice(5) : "TBA"}</strong>
                      <span>{drive.packageLpa ? `₹${drive.packageLpa}L` : "2026"}</span>
                    </div>

                    {isApplied ? (
                      <button 
                        className="apply-btn applied-btn" 
                        onClick={() => navigate("/student/applications")}
                        style={{
                          background: "rgba(16, 185, 129, 0.15)",
                          color: "#059669",
                          border: "1px solid #10b981",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                        title="You have applied! Click to view in My Applications"
                      >
                        ✓ Applied
                      </button>
                    ) : (
                      <button 
                        className="apply-btn" 
                        onClick={() => navigate(`/student/drives?apply=${drive.id}`)}
                      >
                        Apply
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Placement Progress */}
        <div className="dashboard-card progress-card">
          <div className="card-header">
            <div>
              <h2>Profile & Activity</h2>
              <p>Your current completion & status.</p>
            </div>
          </div>

          <div className="progress-circle">
            <div>
              <strong>{percentage}%</strong>
              <span>Profile</span>
            </div>
          </div>

          <div className="progress-info">
            <div>
              <span>Profile Strength</span>
              <strong style={{ color: percentage === 100 ? "#10b981" : "#f59e0b" }}>
                {percentage === 100 ? "100% Ready" : `${percentage}% Completed`}
              </strong>
            </div>

            <div>
              <span>Applications</span>
              <strong>{totalApps}</strong>
            </div>

            <div>
              <span>Shortlisted</span>
              <strong>{shortlisted}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications — Professional Card Style */}
      <div className="dashboard-card applications-card">
        <div className="card-header">
          <div>
            <h2>Recent Applications</h2>
            <p>Track your latest applications.</p>
          </div>
          <button onClick={() => navigate("/student/applications")}>View All</button>
        </div>

        {applications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 16px", color: "#64748b" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
            <p style={{ fontSize: "15px", marginBottom: "6px", fontWeight: 600, color: "#1e293b" }}>No applications submitted yet.</p>
            <small style={{ fontSize: "13px" }}>Browse open placement drives above and submit your first application!</small>
          </div>
        ) : (
          <div className="applications-table">
            {/* Table Header */}
            <div className="table-row table-heading">
              <span>Company</span>
              <span>Position</span>
              <span>Applied On</span>
              <span>Status</span>
            </div>

            {applications.slice(0, 4).map((app) => {
              const statusMap = {
                "Applied":             { label: "Applied",              cls: "dash-status-applied"    },
                "Under Review":        { label: "Under Review",         cls: "dash-status-review"     },
                "Shortlisted":         { label: "Shortlisted",          cls: "dash-status-shortlisted"},
                "Interview":           { label: "Interview",            cls: "dash-status-interview"  },
                "Interview Scheduled": { label: "Interview Scheduled",  cls: "dash-status-interview"  },
                "Selected":            { label: "Offer Received 🎉",    cls: "dash-status-selected"   },
                "Offer":               { label: "Offer Received 🎉",    cls: "dash-status-selected"   },
                "Not Selected":        { label: "Not Selected",         cls: "dash-status-rejected"   },
              };
              const { label, cls } = statusMap[app.status] || { label: app.status, cls: "dash-status-applied" };

              return (
                <div className="table-row" key={app.id}>
                  {/* Company with logo */}
                  <span className="dash-app-company">
                    <span className="dash-app-logo">{app.logoLetter || app.company[0]}</span>
                    <span className="company-name">{app.company}</span>
                  </span>
                  <span style={{ color: "#374151", fontSize: "13px" }}>{app.role}</span>
                  <span style={{ color: "#6b7280", fontSize: "13px" }}>{app.appliedDate}</span>
                  <span className={`dash-status-badge ${cls}`}>{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
