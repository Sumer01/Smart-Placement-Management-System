import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../services/authService";
import { getStudentApplications } from "../../utils/drivesStore";
import "./MyApplications.css";

/* ─────────────────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────────────────── */
const STATUS_META = {
    "Applied":             { label: "Applied",             cls: "s-applied",     pipeIdx: 0, cardMod: ""           },
    "Under Review":        { label: "Under Review",        cls: "s-review",      pipeIdx: 1, cardMod: ""           },
    "Shortlisted":         { label: "Shortlisted",         cls: "s-shortlisted", pipeIdx: 2, cardMod: ""           },
    "Interview":           { label: "Interview",           cls: "s-interview",   pipeIdx: 3, cardMod: ""           },
    "Interview Scheduled": { label: "Interview Scheduled", cls: "s-interview",   pipeIdx: 3, cardMod: ""           },
    "Selected":            { label: "🎉 Offer Received",   cls: "s-selected",    pipeIdx: 4, cardMod: "card--offer"},
    "Offer":               { label: "🎉 Offer Received",   cls: "s-selected",    pipeIdx: 4, cardMod: "card--offer"},
    "Not Selected":        { label: "Not Selected",        cls: "s-rejected",    pipeIdx:-1, cardMod: "card--rejected"},
};

const PIPE_STEPS = [
    { key: "applied",     label: "Applied"     },
    { key: "review",      label: "Review"      },
    { key: "shortlisted", label: "Shortlisted" },
    { key: "interview",   label: "Interview"   },
    { key: "offer",       label: "Offer"       },
];

function getMeta(status) {
    return STATUS_META[status] ?? { label: status, cls: "s-applied", pipeIdx: 0, cardMod: "" };
}

/* ─────────────────────────────────────────────────────────
   TIMELINE — handles all states incl. rejected
───────────────────────────────────────────────────────── */
function AppTimeline({ pipeIdx, isRejected }) {
    return (
        <div className={`apc-timeline${isRejected ? " apc-timeline--rejected" : ""}`}>
            {PIPE_STEPS.map((step, i) => {
                const done    = !isRejected && i <= pipeIdx;
                const active  = !isRejected && i === pipeIdx;
                const faded   = isRejected;

                return (
                    <React.Fragment key={step.key}>
                        {i > 0 && (
                            <div className={`apc-connector ${done ? "apc-connector--done" : ""} ${isRejected ? "apc-connector--faded" : ""}`} />
                        )}
                        <div className={`apc-node ${done ? "apc-node--done" : ""} ${active ? "apc-node--active" : ""} ${faded ? "apc-node--faded" : ""}`} aria-label={`${step.label} ${done ? "completed" : active ? "current" : "pending"}`} role="listitem">
                            <div className="apc-dot" aria-hidden="true">
                                {done  ? "✓" : ""}
                            </div>
                            <span className="apc-node-label" aria-hidden="true">{step.label}</span>
                        </div>
                    </React.Fragment>
                );
            })}

            {/* Rejected X cap at the end */}
            {isRejected && (
                <>
                    <div className="apc-connector apc-connector--faded" />
                    <div className="apc-node apc-node--rejected-end">
                        <div className="apc-dot apc-dot--x">✕</div>
                        <span className="apc-node-label" style={{ color: "#ef4444", fontWeight: 700 }}>Closed</span>
                    </div>
                </>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────
   APPLICATION CARD
───────────────────────────────────────────────────────── */
function AppCard({ app, onView }) {
    const meta       = getMeta(app.status);
    const isRejected = app.status === "Not Selected";
    const isOffer    = app.status === "Selected" || app.status === "Offer";

    return (
        <div className={`app-card ${meta.cardMod}`}>

            {/* Offer confetti banner */}
            {isOffer && (
                <div className="app-card-offer-banner">
                    🎉 Congratulations! You have received an offer from <strong>{app.company}</strong>
                </div>
            )}

            {/* ── Main info row ── */}
            <div className="app-card-top">

                {/* Logo + Name */}
                <div className="app-card-company">
                    <div className={`app-card-logo ${isRejected ? "logo--rejected" : ""} ${isOffer ? "logo--offer" : ""}`}>
                        {app.logoLetter || app.company[0]}
                    </div>
                    <div>
                        <h3 className="app-card-name">{app.company}</h3>
                        <p  className="app-card-role">{app.role}</p>
                    </div>
                </div>

                {/* Chips */}
                <div className="app-card-meta">
                    <div className="app-card-chip">
                        <span className="app-chip-label">Applied On</span>
                        <span className="app-chip-value">{app.appliedDate}</span>
                    </div>
                    <div className="app-card-chip">
                        <span className="app-chip-label">Package</span>
                        <span className="app-chip-value">₹{app.packageLpa} LPA</span>
                    </div>
                    {app.resumeName && (
                        <div className="app-card-chip">
                            <span className="app-chip-label">Resume</span>
                            <span className="app-chip-value app-chip-resume" title={app.resumeName}>
                                📄 {app.resumeName}
                            </span>
                        </div>
                    )}
                </div>

                {/* Badge + Button */}
                <div className="app-card-actions">
                    <span className={`app-status-badge ${meta.cls}`}>
                        <span className="app-status-dot" />
                        {meta.label}
                    </span>
                    <button className="app-view-btn" onClick={onView}>View →</button>
                </div>
            </div>

            {/* ── Divider ── */}
            <div className="app-card-divider" />

            {/* ── Timeline / Rejected section ── */}
            <div className="app-card-bottom">
                <AppTimeline pipeIdx={meta.pipeIdx} isRejected={isRejected} />

                {isRejected && (
                    <div className="app-rejected-note">
                        <span className="app-rejected-note-icon">💡</span>
                        <span>This application was not progressed. Don't give up — keep applying to other open drives!</span>
                        <button className="app-rejected-cta" onClick={() => onView("/student/drives")}>
                            Explore More Drives →
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
function MyApplications() {
    const navigate = useNavigate();
    const user     = getStoredUser();
    const apps     = getStudentApplications(user?.email || "");

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");

    const total       = apps.length;
    const shortlisted = apps.filter(a => a.status === "Shortlisted").length;
    const interviews  = apps.filter(a => a.status === "Interview" || a.status === "Interview Scheduled").length;
    const offers      = apps.filter(a => a.status === "Selected"  || a.status === "Offer").length;

    const visible = apps.filter(app => {
        const q      = search.toLowerCase();
        const matchQ = app.company.toLowerCase().includes(q) || app.role.toLowerCase().includes(q);
        let matchF   = true;
        if (filter !== "All") {
            if (filter === "Interview") {
                matchF = app.status === "Interview" || app.status === "Interview Scheduled";
            } else {
                matchF = app.status === filter;
            }
        }
        return matchQ && matchF;
    });

    const STATS = [
        { icon: "📄", label: "Total Applications", value: total,       accent: "#6366f1", bg: "#f0f0ff" },
        { icon: "⭐", label: "Shortlisted",         value: shortlisted, accent: "#f59e0b", bg: "#fffbeb" },
        { icon: "🗓️", label: "Interviews",          value: interviews,  accent: "#3b82f6", bg: "#eff6ff" },
        { icon: "🏆", label: "Offers",              value: offers,      accent: "#10b981", bg: "#ecfdf5" },
    ];

    return (
        <div className="applications-page">

            {/* Header */}
            <div className="applications-header">
                <div>
                    <h1>My Applications</h1>
                    <p>Track and manage your placement applications in real-time.</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="application-stats">
                {STATS.map((s, i) => (
                    <div
                        key={i}
                        className="application-stat-card"
                        style={{ "--accent": s.accent, "--bg": s.bg }}
                    >
                        <div className="stat-icon-wrap">{s.icon}</div>
                        <div className="stat-text">
                            <small>{s.label}</small>
                            <strong>{s.value}</strong>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + Filter */}
            <div className="applications-tools">
                <div className="application-search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input
                        type="text"
                        placeholder="Search by company or role..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="search-clear" onClick={() => setSearch("")}>✕</button>
                    )}
                </div>

                <select className="application-filter" value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="All">All Applications</option>
                    <option value="Applied">Applied</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview">Interview</option>
                    <option value="Selected">Selected / Offer</option>
                    <option value="Not Selected">Not Selected</option>
                </select>
            </div>

            {/* Application List */}
            <div className="applications-list-card">

                <div className="applications-list-header">
                    <div>
                        <h2>Application History</h2>
                        <p>Your recent placement applications.</p>
                    </div>
                    <span className="app-count-pill">
                        {visible.length} {visible.length === 1 ? "Application" : "Applications"}
                    </span>
                </div>

                <div className="applications-list-body">
                    {visible.length === 0 ? (
                        <div className="app-empty-state">
                            <div className="app-empty-icon">📋</div>
                            <h3>{total === 0 ? "No Applications Yet" : "No Matching Applications"}</h3>
                            <p>
                                {total === 0
                                    ? "You haven't applied to any placement drives yet. Explore open drives and apply!"
                                    : "Try changing your search query or filter."}
                            </p>
                            {total === 0 && (
                                <button className="app-empty-btn" onClick={() => navigate("/student/drives")}>
                                    Explore Placement Drives →
                                </button>
                            )}
                        </div>
                    ) : (
                        visible.map(app => (
                            <AppCard
                                key={app.id}
                                app={app}
                                onView={(path) => navigate(path || "/student/drives")}
                            />
                        ))
                    )}
                </div>

            </div>

        </div>
    );
}

export default MyApplications;
