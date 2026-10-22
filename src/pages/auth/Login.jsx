import { useState } from "react";

import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    UserRound,
    ArrowRight,
    BriefcaseBusiness,
    ClipboardCheck,
    UsersRound
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import spmsLogo from "../../assets/logo/spms-logo.png";
import loginBackground from "../../assets/login/login-background.png";

import "./Login.css";
import { login } from "../../services/authService";


function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [role, setRole] = useState("student");

    const [showPassword, setShowPassword] = useState(false);

    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");


    const handleSubmit = async (event) => {

        event.preventDefault();
        setErrorMessage("");
        setLoading(true);

        try {
            const data = await login(email, password, role);

            const userRole = data.user?.role?.toLowerCase() || role.toLowerCase();
            const selectedRole = role.toLowerCase();

            if (userRole !== selectedRole) {
                setErrorMessage(`Role mismatch: This account is registered as '${userRole.toUpperCase()}', not '${selectedRole.toUpperCase()}'. Please select '${userRole.toUpperCase()}' in the 'Login As' dropdown.`);
                localStorage.removeItem("spms_token");
                localStorage.removeItem("spms_user");
                return;
            }

            // Role-based navigation
            if (userRole === "admin") {
                navigate("/admin/dashboard");
            } else {
                navigate("/student/dashboard");
            }
        } catch (error) {
            console.error("Login failed:", error);
            const msg = error.response?.data?.error || error.response?.data?.message || "Invalid email or password. Please try again.";
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }

    };


    return (

        <div
            className="login-page"
            style={{
                backgroundImage: `url(${loginBackground})`
            }}
        >

            {/* =================================
                LEFT SECTION
            ================================= */}

            <section className="login-left">

                {/* LOGO */}

                <div className="logo-container">

                    <Link to="/" title="Back to Home" className="login-brand-link">
                        <div className="login-logo-box">
                            <img
                                src={spmsLogo}
                                alt="SPMS Logo"
                                className="login-logo"
                            />
                        </div>
                        <div className="login-brand-text">
                            <span className="login-brand-title">SPMS</span>
                            <span className="login-brand-subtitle">Placement Portal</span>
                        </div>
                    </Link>

                </div>


                {/* MAIN CONTENT */}

                <div className="left-content">

                    <p className="career-label">
                        YOUR CAREER JOURNEY STARTS HERE
                    </p>


                    <h1 className="main-heading">

                        Your Future

                        <span>
                            Starts Here<span className="green-period">.</span>
                        </span>

                    </h1>


                    <p className="tagline">
                        Find. Apply. Succeed.
                    </p>


                    {/* FEATURES */}

                    <div className="features">


                        {/* FEATURE 1 */}

                        <div className="feature-item">

                            <div className="feature-icon">

                                <BriefcaseBusiness
                                    size={25}
                                />

                            </div>

                            <div className="feature-text">

                                <h3>
                                    Explore Opportunities
                                </h3>

                                <p>
                                    Find the best jobs & internships
                                </p>

                            </div>

                        </div>


                        {/* FEATURE 2 */}

                        <div className="feature-item">

                            <div className="feature-icon">

                                <ClipboardCheck
                                    size={25}
                                />

                            </div>

                            <div className="feature-text">

                                <h3>
                                    Track Progress
                                </h3>

                                <p>
                                    Stay updated with applications
                                </p>

                            </div>

                        </div>


                        {/* FEATURE 3 */}

                        <div className="feature-item">

                            <div className="feature-icon">

                                <UsersRound
                                    size={25}
                                />

                            </div>

                            <div className="feature-text">

                                <h3>
                                    Build Connections
                                </h3>

                                <p>
                                    Connect with top recruiters
                                </p>

                            </div>

                        </div>

                    </div>

                </div>


                {/* FOOTER */}

                <div className="left-footer">

                    <span>Find.</span>

                    <b>•</b>

                    <span>Apply.</span>

                    <b>•</b>

                    <span>Succeed.</span>

                </div>

            </section>


            {/* =================================
                RIGHT SECTION
            ================================= */}

            <section className="login-right">

                <div className="login-card">


                    {/* HEADER */}

                    <div className="login-header">

                        <div className="login-lock">

                            <Lock size={27} />

                        </div>


                        <h2>
                            Welcome Back
                        </h2>


                        <p>
                            Login to continue
                        </p>

                    </div>


                    {/* FORM */}

                    <form onSubmit={handleSubmit}>

                        {errorMessage && (
                            <div style={{
                                padding: "10px 14px",
                                marginBottom: "16px",
                                backgroundColor: "#fef2f2",
                                border: "1px solid #f87171",
                                borderRadius: "8px",
                                color: "#b91c1c",
                                fontSize: "14px",
                                textAlign: "center"
                            }}>
                                {errorMessage}
                            </div>
                        )}


                        {/* EMAIL */}

                        <div className="form-group">

                            <label htmlFor="email">
                                Email Address
                            </label>


                            <div className="input-box">

                                <Mail
                                    size={21}
                                    className="input-left-icon"
                                />


                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    required
                                />

                            </div>

                        </div>


                        {/* PASSWORD */}

                        <div className="form-group">

                            <label htmlFor="password">
                                Password
                            </label>


                            <div className="input-box">

                                <Lock
                                    size={21}
                                    className="input-left-icon"
                                />


                                <input
                                    id="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    required
                                />


                                <button
                                    type="button"
                                    className="eye-button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >

                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}

                                </button>

                            </div>

                        </div>


                        {/* ROLE */}

                        <div className="form-group">

                            <label htmlFor="role">
                                Login As
                            </label>


                            <div className="input-box">

                                <UserRound
                                    size={21}
                                    className="input-left-icon"
                                />


                                <select
                                    id="role"
                                    value={role}
                                    onChange={(event) =>
                                        setRole(event.target.value)
                                    }
                                >

                                    <option value="student">
                                        Student
                                    </option>

                                    <option value="admin">
                                        Admin
                                    </option>

                                </select>

                            </div>

                        </div>


                        {/* OPTIONS */}

                        <div className="login-options">

                            <label className="remember-me">

                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(event) =>
                                        setRememberMe(
                                            event.target.checked
                                        )
                                    }
                                />

                                <span>
                                    Remember me
                                </span>

                            </label>


                            <button
                                type="button"
                                className="forgot-password"
                            >
                                Forgot Password?
                            </button>

                        </div>


                        {/* LOGIN BUTTON */}

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                        >

                            <span>
                                {loading ? "Logging in..." : "Login"}
                            </span>

                            {!loading && (
                                <ArrowRight
                                    size={23}
                                />
                            )}

                        </button>

                    </form>


                    {/* OR */}

                    <div className="or-divider">

                        <span></span>

                        <div>
                            OR
                        </div>

                        <span></span>

                    </div>


                    {/* REGISTER */}

                    <div className="register-text">

                        <span>
                            Don't have an account?
                        </span>

                        <Link to="/register">
                            Register
                        </Link>

                    </div>


                </div>

            </section>

        </div>
    );
}


export default Login;