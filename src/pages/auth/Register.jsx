import { useState } from "react";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    UserRound,
    ArrowRight,
    GraduationCap,
    BriefcaseBusiness,
    ClipboardCheck,
    UsersRound,
    CheckCircle2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import spmsLogo from "../../assets/logo/spms-logo.png";
import loginBackground from "../../assets/login/login-background.png";
import "./Register.css";
import { register } from "../../services/authService";
import { addStudentToStore } from "../../utils/studentsStore";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");

        if (!formData.fullName.trim()) {
            setErrorMessage("Please enter your full name.");
            return;
        }

        if (!formData.email.trim()) {
            setErrorMessage("Please enter your email address.");
            return;
        }

        if (formData.password.length < 6) {
            setErrorMessage("Password must be at least 6 characters long.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Passwords do not match. Please verify your password.");
            return;
        }

        setLoading(true);

        try {
            const userEmail = formData.email.trim().toLowerCase();
            const trimmedName = formData.fullName.trim();

            await register({
                name: trimmedName,
                email: userEmail,
                password: formData.password,
                role: "student"
            });

            // Save registered student details keyed by their email
            try {
                const initialStudentProfile = {
                    fullName: trimmedName,
                    name: trimmedName,
                    email: userEmail,
                    rollNo: "Not Assigned",
                    degree: "MCA",
                    department: "Computer Applications",
                    cgpa: "",
                    backlogs: "0",
                    phone: "",
                    location: "",
                    skills: [],
                    status: "Unplaced"
                };

                localStorage.setItem(`spms_student_profile_${userEmail}`, JSON.stringify(initialStudentProfile));
                localStorage.setItem(`spms_v3_profile_${userEmail}`, JSON.stringify(initialStudentProfile));
                localStorage.setItem("spms_registered_student", JSON.stringify(initialStudentProfile));
                // Initialize clean, fresh applications list for new student
                localStorage.setItem(`spms_applications_${userEmail}`, JSON.stringify([]));

                // Add to real student directory for Admin/TPO
                addStudentToStore(initialStudentProfile);
            } catch (e) {
                console.error("Storage error:", e);
            }

            setSuccessMessage(true);

            // Transition smoothly to login after short delay
            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            console.error("Registration failed:", error);
            const msg = error.response?.data?.error || error.response?.data?.message || "Registration failed. Please try again.";
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="register-page"
            style={{
                backgroundImage: `url(${loginBackground})`
            }}
        >
            {/* =================================
                LEFT HERO SECTION
            ================================= */}
            <section className="register-left">
                <div className="logo-container">
                    <Link to="/" title="Back to Home" className="register-brand-link">
                        <div className="register-logo-box">
                            <img
                                src={spmsLogo}
                                alt="SPMS Logo"
                                className="register-logo"
                            />
                        </div>
                        <div className="register-brand-text">
                            <span className="register-brand-title">SPMS</span>
                            <span className="register-brand-subtitle">Placement Portal</span>
                        </div>
                    </Link>
                </div>

                <div className="left-content">
                    <p className="career-label">
                        GET RECRUITMENT READY
                    </p>

                    <h1 className="main-heading">
                        Join Campus
                        <span>
                            Placements<span className="green-period">.</span>
                        </span>
                    </h1>

                    <p className="tagline">
                        Register your student profile & unlock opportunities.
                    </p>

                    <div className="features">
                        <div className="feature-item">
                            <div className="feature-icon">
                                <BriefcaseBusiness size={24} />
                            </div>
                            <div className="feature-text">
                                <h3>Verified Companies</h3>
                                <p>Access 150+ verified enterprise recruiters</p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <div className="feature-icon">
                                <ClipboardCheck size={24} />
                            </div>
                            <div className="feature-text">
                                <h3>Automated Eligibility</h3>
                                <p>Instant checks based on your CGPA & branch</p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <div className="feature-icon">
                                <UsersRound size={24} />
                            </div>
                            <div className="feature-text">
                                <h3>Direct Interview Calls</h3>
                                <p>Track application status in real-time</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="left-footer">
                    <span>Register.</span>
                    <b>•</b>
                    <span>Prepare.</span>
                    <b>•</b>
                    <span>Get Placed.</span>
                </div>
            </section>

            {/* =================================
                RIGHT FORM SECTION
            ================================= */}
            <section className="register-right">
                <div className="register-card">
                    {successMessage ? (
                        <div className="register-success">
                            <CheckCircle2 size={56} color="#10b981" />
                            <h2>Registration Successful!</h2>
                            <p>Your account has been created. Redirecting to login...</p>
                        </div>
                    ) : (
                        <>
                            <div className="register-header">
                                <div className="register-badge-icon">
                                    <GraduationCap size={26} />
                                </div>
                                <h2>Create Account</h2>
                                <p>Join the placement portal in just a few seconds</p>
                            </div>

                            <form onSubmit={handleSubmit} className="register-form">
                                {errorMessage && (
                                    <div className="register-error-banner">
                                        {errorMessage}
                                    </div>
                                )}

                                {/* FULL NAME */}
                                <div className="form-group">
                                    <label htmlFor="fullName">Full Name</label>
                                    <div className="input-box">
                                        <UserRound size={18} className="input-left-icon" />
                                        <input
                                            id="fullName"
                                            name="fullName"
                                            type="text"
                                            placeholder="e.g. Rahul Sharma"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            required
                                            autoComplete="name"
                                        />
                                    </div>
                                </div>

                                {/* EMAIL */}
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <div className="input-box">
                                        <Mail size={18} className="input-left-icon" />
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="e.g. rahul@example.com or student@cusat.ac.in"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                {/* PASSWORD */}
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <div className="input-box">
                                        <Lock size={18} className="input-left-icon" />
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a password (min. 6 characters)"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className="eye-button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* CONFIRM PASSWORD */}
                                <div className="form-group">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <label htmlFor="confirmPassword">Confirm Password</label>
                                        {formData.confirmPassword && (
                                            <span style={{
                                                fontSize: "11px",
                                                fontWeight: "600",
                                                color: formData.password === formData.confirmPassword ? "#10b981" : "#f87171"
                                            }}>
                                                {formData.password === formData.confirmPassword ? "✓ Passwords match" : "✕ Passwords must match"}
                                            </span>
                                        )}
                                    </div>
                                    <div className="input-box">
                                        <Lock size={18} className="input-left-icon" />
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Re-enter your password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className="eye-button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            tabIndex={-1}
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* HELPFUL TIP */}
                                <div className="register-quick-tip">
                                    <span className="tip-icon">💡</span>
                                    <span>
                                        Academic details like <strong>Roll No, Course, CGPA & Resume</strong> can be completed easily in your profile anytime after sign up.
                                    </span>
                                </div>

                                {/* SUBMIT BUTTON */}
                                <button
                                    type="submit"
                                    className="register-submit-button"
                                    disabled={loading}
                                    style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                                >
                                    <span>{loading ? "Creating Account..." : "Create Account"}</span>
                                    {!loading && <ArrowRight size={20} />}
                                </button>
                            </form>

                            {/* BACK TO LOGIN */}
                            <div className="login-switch-text">
                                <span>Already have an account?</span>
                                <Link to="/login">Sign In</Link>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

export default Register;
