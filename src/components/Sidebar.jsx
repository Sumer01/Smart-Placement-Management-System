import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../services/authService";
import spmsLogo from "../assets/logo/spms-logo.png";
import "./Sidebar.css";

function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = location.pathname.startsWith("/admin");

    const handleLogout = () => {
        logout();
        if (onClose) onClose();
        navigate("/");
    };

    const handleNavClick = (targetPath) => {
        console.log(`[SPMS Navigation] Clicked link: ${targetPath} (current: ${location.pathname})`);
        if (isOpen && onClose) {
            onClose();
        }
    };


    return (
        <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>

            <div className="mobile-sidebar-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img src={spmsLogo} alt="SPMS" style={{ height: "28px", width: "auto" }} />
                    <span style={{ fontSize: "16px", fontWeight: "800" }}>
                        {isAdmin ? "TPO Portal" : "SPMS"}
                    </span>
                </div>

                <button
                    className="sidebar-close-btn"
                    onClick={onClose}
                    aria-label="Close navigation menu"
                >
                    ✕
                </button>
            </div>

            {/* Portal Badge */}
            <div style={{
                padding: "16px 16px 0 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
            }}>
                <span style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: isAdmin ? "#e78b35" : "#10b981",
                    background: isAdmin ? "rgba(231, 139, 53, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    padding: "4px 10px",
                    borderRadius: "6px"
                }}>
                    {isAdmin ? "🛡️ PLACEMENT OFFICE" : "🎓 Student Portal"}
                </span>
            </div>

            <div className="sidebar-menu">
                {isAdmin ? (
                    // ADMIN / TPO MENU
                    <>
                        <NavLink to="/admin/dashboard" onClick={() => handleNavClick("/admin/dashboard")}>
                            <span className="sidebar-icon">🏠</span>
                            <span>Dashboard</span>
                        </NavLink>

                        <NavLink to="/admin/drives" onClick={() => handleNavClick("/admin/drives")}>
                            <span className="sidebar-icon">💼</span>
                            <span>Placement Drives</span>
                        </NavLink>

                        <NavLink to="/admin/students" onClick={() => handleNavClick("/admin/students")}>
                            <span className="sidebar-icon">👥</span>
                            <span>Student Management</span>
                        </NavLink>

                        <NavLink to="/admin/companies" onClick={() => handleNavClick("/admin/companies")}>
                            <span className="sidebar-icon">🏢</span>
                            <span>Recruiters & Companies</span>
                        </NavLink>
                    </>
                ) : (
                    // STUDENT MENU
                    <>
                        <NavLink to="/student/dashboard" onClick={() => handleNavClick("/student/dashboard")}>
                            <span className="sidebar-icon">🏠</span>
                            <span>Dashboard</span>
                        </NavLink>

                        <NavLink to="/student/profile" onClick={() => handleNavClick("/student/profile")}>
                            <span className="sidebar-icon">👤</span>
                            <span>My Profile</span>
                        </NavLink>

                        <NavLink to="/student/companies" onClick={() => handleNavClick("/student/companies")}>
                            <span className="sidebar-icon">🏢</span>
                            <span>Companies</span>
                        </NavLink>

                        <NavLink to="/student/drives" onClick={() => handleNavClick("/student/drives")}>
                            <span className="sidebar-icon">💼</span>
                            <span>Placement Drives</span>
                        </NavLink>

                        <NavLink to="/student/applications" onClick={() => handleNavClick("/student/applications")}>
                            <span className="sidebar-icon">📄</span>
                            <span>My Applications</span>
                        </NavLink>
                    </>
                )}
            </div>

            <div className="sidebar-bottom">
                <button onClick={handleLogout}>
                    <span className="sidebar-icon">🚪</span>
                    <span>Logout</span>
                </button>
            </div>

        </aside>
    );
}

export default Sidebar;