import { Link, useLocation } from "react-router-dom";
import spmsLogo from "../assets/logo/spms-logo.png";
import "./Navbar.css";
import { getStoredUser } from "../services/authService";

function Navbar({ onMenuClick }) {
    const location = useLocation();
    const isAdmin = location.pathname.startsWith("/admin");
    const user = getStoredUser();
    const displayName = user?.name ? user.name.split(" ")[0] : "Student";

    return (
        <nav className="navbar">

            <div className="navbar-left">

                <button
                    className="mobile-menu-btn"
                    onClick={onMenuClick}
                    aria-label="Open navigation menu"
                >
                    ☰
                </button>

                <Link to={isAdmin ? "/admin/dashboard" : "/student/dashboard"} className="navbar-brand-link">
                    <div className="navbar-logo-badge">
                        <img 
                            src={spmsLogo} 
                            alt="SPMS Logo" 
                            className="navbar-logo-img" 
                        />
                    </div>
                    <span className="desktop-logo">
                        {isAdmin ? "SPMS • Training & Placement Cell (TPO)" : "Smart Placement Management System"}
                    </span>

                    <span className="mobile-logo">
                        {isAdmin ? "TPO Portal" : "SPMS"}
                    </span>
                </Link>

            </div>

            <div className="navbar-right">

                <button className="notification-btn" title="Notifications">
                    🔔
                </button>

                {isAdmin ? (
                    <div className="profile" style={{ background: "rgba(231, 139, 53, 0.15)", border: "1px solid rgba(231, 139, 53, 0.4)" }}>
                        <span>🛡️</span>
                        <span style={{ color: "#f97316" }}>{user?.name || "TPO Admin"}</span>
                    </div>
                ) : (
                    <Link to="/student/profile" className="profile" style={{ textDecoration: "none" }}>
                        <span>👤</span>
                        <span>{displayName}</span>
                    </Link>
                )}

            </div>

        </nav>
    );
}

export default Navbar;