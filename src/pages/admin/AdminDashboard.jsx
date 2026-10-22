import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid
} from "recharts";
import {
    Users,
    Briefcase,
    Award,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Trash2,
    Building2
} from "lucide-react";
import { getStoredDrives, getAllApplications, resetAllData } from "../../utils/drivesStore";
import { getStoredStudents } from "../../utils/studentsStore";
import { getStoredCompanies } from "../../utils/companiesStore";
import API from "../../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
    const navigate = useNavigate();
    const [drives, setDrives] = useState([]);
    const [students, setStudents] = useState([]);
    const [applications, setApplications] = useState([]);
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        const loadedDrives = getStoredDrives();
        setDrives(loadedDrives);
        setStudents(getStoredStudents());
        setApplications(getAllApplications());

        // Load companies from MySQL (source of truth) — no merging with drives
        API.get("/companies")
            .then(res => {
                const list = res.data?.companies || (Array.isArray(res.data) ? res.data : null);
                if (list) {
                    setCompanies(list);
                } else {
                    setCompanies(getStoredCompanies());
                }
            })
            .catch(() => {
                setCompanies(getStoredCompanies());
            });
    }, []);

    // Live Metrics Calculations
    const totalStudents = students.length;
    const verifiedCount = students.filter(s => s.verified).length;
    const activeDrivesCount = drives.filter(d => d.status === "Active" || !d.status).length;
    
    // Placed applications & students
    const placedApps = applications.filter(a => a.status === "Selected" || a.status === "Offer");
    const offersCount = placedApps.length;
    const placedStudentEmails = new Set(placedApps.map(a => a.studentEmail));
    const placedCount = placedStudentEmails.size;

    // Placement rate
    const placementRate = totalStudents > 0 
        ? ((placedCount / totalStudents) * 100).toFixed(1) 
        : "0.0";

    // Average package calculation
    const avgPackage = offersCount > 0
        ? (placedApps.reduce((acc, a) => acc + (parseFloat(a.packageLpa) || 0), 0) / offersCount).toFixed(1)
        : null;

    // In-process students
    const inProcessCount = students.filter(s => 
        !placedStudentEmails.has(s.email) && 
        applications.some(a => a.studentEmail === s.email && a.status !== "Rejected")
    ).length;

    const unplacedCount = Math.max(0, totalStudents - placedCount - inProcessCount);

    // Dynamic Pie Chart Data
    const placementData = totalStudents > 0 ? [
        { name: "Placed", value: placedCount, color: "#10b981" },
        { name: "In Process", value: inProcessCount, color: "#f59e0b" },
        { name: "Unplaced", value: unplacedCount, color: "#ef4444" }
    ] : [];

    // Department Breakdown Data (from real students)
    const uniqueDegrees = [...new Set(students.map(s => s.degree || "MCA"))];
    const departmentData = uniqueDegrees.map(deg => {
        const eligible = students.filter(s => (s.degree || "MCA") === deg).length;
        const offers = placedApps.filter(a => (a.degree || "MCA") === deg).length;
        const rate = eligible > 0 ? `${((offers / eligible) * 100).toFixed(0)}%` : "0%";
        return {
            name: deg,
            offers,
            eligible,
            rate
        };
    });

    // Real Activity Stream
    const activities = [];
    applications.slice(0, 5).forEach(app => {
        if (app.status === "Selected" || app.status === "Offer") {
            activities.push({
                id: `act_${app.id}`,
                icon: "green",
                iconComp: CheckCircle2,
                title: `${app.studentName} (${app.degree || 'MCA'})`,
                desc: `accepted offer from ${app.company} (₹${app.packageLpa} LPA)`,
                time: app.appliedDate || "Recently"
            });
        } else if (app.status === "Shortlisted") {
            activities.push({
                id: `act_${app.id}`,
                icon: "blue",
                iconComp: ArrowUpRight,
                title: `${app.studentName}`,
                desc: `was shortlisted for ${app.company} (${app.role})`,
                time: app.appliedDate || "Recently"
            });
        } else {
            activities.push({
                id: `act_${app.id}`,
                icon: "amber",
                iconComp: Clock,
                title: `${app.studentName || 'Student'}`,
                desc: `applied for ${app.company} (${app.role})`,
                time: app.appliedDate || "Recently"
            });
        }
    });

    drives.slice(0, 3).forEach(drive => {
        activities.push({
            id: `act_drive_${drive.id}`,
            icon: "blue",
            iconComp: Briefcase,
            title: drive.company,
            desc: `announced drive for ${drive.role} (₹${drive.packageLpa} LPA)`,
            time: drive.driveDate ? `Drive Date: ${drive.driveDate}` : "Active"
        });
    });

    return (
        <div className="admin-dashboard-page">
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1>🏢 TPO Executive Dashboard</h1>
                    <p>Department of Computer Applications • Placement Season 2026</p>
                </div>

                <div className="admin-header-actions" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button 
                        className="btn-create-drive"
                        onClick={() => navigate("/admin/companies")}
                    >
                        <Building2 size={18} />
                        <span>Add Partner Company</span>
                    </button>

                    <button
                        onClick={() => {
                            if (window.confirm("⚠️ Clear all platform data? This will reset all drives, students, partner companies, and applications to 0, giving you a 100% fresh start.")) {
                                resetAllData();
                                window.location.reload();
                            }
                        }}
                        style={{
                            background: "transparent",
                            color: "#ef4444",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            padding: "9px 14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "13px",
                            fontWeight: "600"
                        }}
                        title="Wipe any old dummy data and start completely fresh"
                    >
                        <Trash2 size={16} />
                        <span>Reset All Data</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="admin-kpi-grid">
                <div className="admin-kpi-card" onClick={() => navigate("/admin/students")} style={{ cursor: "pointer" }}>
                    <div className="kpi-icon-box" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <span className="kpi-label">Registered Cohort</span>
                        <h2 className="kpi-value">{totalStudents}</h2>
                        <span className="kpi-sub positive">
                            {totalStudents > 0 
                                ? `✓ ${verifiedCount} Verified (${((verifiedCount / totalStudents) * 100).toFixed(0)}%)` 
                                : "No students registered"}
                        </span>
                    </div>
                </div>

                <div className="admin-kpi-card" onClick={() => navigate("/admin/drives")} style={{ cursor: "pointer" }}>
                    <div className="kpi-icon-box" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <span className="kpi-label">Active Drives</span>
                        <h2 className="kpi-value">{drives.length}</h2>
                        <span className="kpi-sub">
                            {drives.length > 0 ? `${activeDrivesCount} Active Drives` : "No drives posted"}
                        </span>
                    </div>
                </div>

                <div className="admin-kpi-card">
                    <div className="kpi-icon-box" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
                        <Award size={24} />
                    </div>
                    <div>
                        <span className="kpi-label">Offers Released</span>
                        <h2 className="kpi-value">{offersCount}</h2>
                        <span className="kpi-sub positive">
                            {offersCount > 0 ? `Across ${new Set(placedApps.map(a => a.company)).size} Companies` : "0 Offers"}
                        </span>
                    </div>
                </div>

                <div className="admin-kpi-card" onClick={() => navigate("/admin/companies")} style={{ cursor: "pointer" }}>
                    <div className="kpi-icon-box" style={{ background: "rgba(14, 165, 233, 0.12)", color: "#0ea5e9" }}>
                        <Building2 size={24} />
                    </div>
                    <div>
                        <span className="kpi-label">Connected Companies</span>
                        <h2 className="kpi-value">{companies.length}</h2>
                        <span className="kpi-sub">
                            {companies.filter(c => ["active", "hiring"].includes((c.status || "").toLowerCase())).length} Active for Hiring
                        </span>
                    </div>
                </div>

                <div className="admin-kpi-card">
                    <div className="kpi-icon-box" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <span className="kpi-label">Placement Rate</span>
                        <h2 className="kpi-value">{placementRate}%</h2>
                        <span className="kpi-sub">
                            {avgPackage ? `Avg Package: ₹${avgPackage} LPA` : "No placements yet"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Visual Analytics Charts Section */}
            <div className="admin-charts-grid">
                {/* Chart 1: Placement Distribution */}
                <div className="admin-chart-card">
                    <div className="chart-header">
                        <div>
                            <h3>Placement Status Ratio</h3>
                            <p>
                                {totalStudents > 0 
                                    ? `Current hiring status of ${totalStudents} registered candidates`
                                    : "Awaiting student registrations"}
                            </p>
                        </div>
                        <span className="chart-badge">Live Metric</span>
                    </div>
                    <div style={{ width: "100%", height: 260 }}>
                        {totalStudents === 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
                                <Users size={32} style={{ opacity: 0.35, marginBottom: 8 }} />
                                <p style={{ fontSize: "14px", margin: 0 }}>No student data available yet.</p>
                                <small style={{ fontSize: "12px", color: "#94a3b8" }}>When students create accounts, live analytics will show here.</small>
                            </div>
                        ) : (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={placementData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {placementData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ background: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} 
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Chart 2: Department-wise Placements */}
                <div className="admin-chart-card">
                    <div className="chart-header">
                        <div>
                            <h3>Department Offers Breakdown</h3>
                            <p>
                                {departmentData.length > 0 
                                    ? "Total job offers received across disciplines" 
                                    : "Awaiting department registrations"}
                            </p>
                        </div>
                        <span className="chart-badge">Branch Stats</span>
                    </div>
                    <div style={{ width: "100%", height: 260 }}>
                        {departmentData.length === 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
                                <Award size={32} style={{ opacity: 0.35, marginBottom: 8 }} />
                                <p style={{ fontSize: "14px", margin: 0 }}>No department placement data yet.</p>
                                <small style={{ fontSize: "12px", color: "#94a3b8" }}>Offers per department will render here as offers are confirmed.</small>
                            </div>
                        ) : (
                            <ResponsiveContainer>
                                <BarChart data={departmentData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip 
                                        contentStyle={{ background: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#fff" }}
                                        formatter={(value, name) => [value, name === "offers" ? "Job Offers" : "Eligible Students"]}
                                    />
                                    <Legend />
                                    <Bar dataKey="offers" fill="#10b981" name="Offers Made" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="eligible" fill="#64748b" name="Eligible Students" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Active Drives Quick-List & Live Activity */}
            <div className="admin-bottom-grid">
                {/* Active Drives List */}
                <div className="admin-card">
                    <div className="card-header-flex">
                        <div>
                            <h3>Current Placement Drives</h3>
                            <p>Real-time drives managed by placement office</p>
                        </div>
                        <button 
                            className="btn-view-all"
                            onClick={() => navigate("/admin/drives")}
                        >
                            Manage All Drives →
                        </button>
                    </div>

                    <div className="drives-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Role</th>
                                    <th>Package</th>
                                    <th>Cutoff CGPA</th>
                                    <th>Deadline</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drives.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: "center", padding: "40px 16px", color: "#64748b" }}>
                                            <p style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 500 }}>No placement drives posted yet.</p>
                                            <button 
                                                onClick={() => navigate("/admin/drives")}
                                                style={{
                                                    background: "#2563eb",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "6px 14px",
                                                    borderRadius: "6px",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    marginTop: "6px"
                                                }}
                                            >
                                                + Post First Drive
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    drives.slice(0, 4).map((d) => (
                                        <tr key={d.id}>
                                            <td className="company-cell">
                                                <span className="company-logo-pill">{d.logoLetter || d.company.charAt(0)}</span>
                                                <strong>{d.company}</strong>
                                            </td>
                                            <td>{d.role}</td>
                                            <td>
                                                <span className="package-tag">₹{d.packageLpa} LPA</span>
                                            </td>
                                            <td>{d.minCgpa}+ CGPA</td>
                                            <td>
                                                <span className="deadline-text">
                                                    <Calendar size={13} style={{ marginRight: 4 }} />
                                                    {d.deadline}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${d.status === 'Active' ? 'active' : 'closing'}`}>
                                                    {d.status || 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activity Log */}
                <div className="admin-card">
                    <div className="card-header-flex">
                        <div>
                            <h3>Live Placement Feed</h3>
                            <p>Recent campus hiring updates</p>
                        </div>
                        <span className="live-indicator">● LIVE</span>
                    </div>

                    <div className="activity-feed">
                        {activities.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px 16px", color: "#64748b" }}>
                                <Clock size={32} style={{ margin: "0 auto 8px", opacity: 0.4, display: "block" }} />
                                <p style={{ fontSize: "14px", margin: "0 0 4px", fontWeight: 500 }}>No placement activity recorded yet.</p>
                                <small style={{ fontSize: "12px" }}>Real-time updates on drives and student applications will appear here.</small>
                            </div>
                        ) : (
                            activities.map(act => {
                                const IconComponent = act.iconComp;
                                return (
                                    <div className="activity-item" key={act.id}>
                                        <div className={`activity-icon ${act.icon}`}>
                                            <IconComponent size={16} />
                                        </div>
                                        <div className="activity-content">
                                            <p><strong>{act.title}</strong> {act.desc}</p>
                                            <span>{act.time}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
