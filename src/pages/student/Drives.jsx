import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
    getStoredDrives, 
    evaluateEligibility, 
    getStudentProfile, 
    getStudentApplications, 
    submitStudentApplication,
    getDriveSpecifications
} from "../../utils/drivesStore";
import { getStoredUser } from "../../services/authService";
import { UploadCloud, FileText, X, AlertCircle } from "lucide-react";
import "./Drives.css";

function Drives() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getStoredUser();
    const studentProfile = getStudentProfile(user) || {};
    const userEmail = user?.email || "";

    const [drives, setDrives] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("All Drives");
    const [filterRole, setFilterRole] = useState("All Job Roles");
    
    // Load this specific student's applied drives
    const [appliedMap, setAppliedMap] = useState(() => {
        const apps = getStudentApplications(userEmail);
        const map = {};
        apps.forEach(a => { 
            if (a.driveId) map[a.driveId] = true;
            if (a.company) map[a.company.toLowerCase().trim()] = true;
        });
        return map;
    });

    const [statusMessage, setStatusMessage] = useState("");

    // Company & Role Specifications Modal state
    const [specModalDrive, setSpecModalDrive] = useState(null);

    // Job Application & Resume Modal state
    const [applyModalDrive, setApplyModalDrive] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [submittingApply, setSubmittingApply] = useState(false);
    const [applyError, setApplyError] = useState("");

    useEffect(() => {
        setDrives(getStoredDrives());
        const apps = getStudentApplications(userEmail);
        const map = {};
        apps.forEach(a => { 
            if (a.driveId) map[a.driveId] = true;
            if (a.company) map[a.company.toLowerCase().trim()] = true;
        });
        setAppliedMap(map);
    }, [userEmail]);

    // Check if navigated with ?apply=driveId from Dashboard
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const driveIdToApply = params.get("apply");
        if (driveIdToApply && drives.length > 0) {
            const target = drives.find(d => String(d.id) === String(driveIdToApply));
            if (target && !appliedMap[target.id]) {
                openApplyModal(target);
                navigate(location.pathname, { replace: true });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drives, appliedMap, location.search]);

    const openSpecsModal = (drive) => {
        setSpecModalDrive(drive);
    };

    const closeSpecsModal = () => {
        setSpecModalDrive(null);
    };

    const openApplyModal = (drive) => {
        setApplyModalDrive(drive);
        setUploadedFile(null);
        setAgreedToTerms(false);
        setApplyError("");
    };

    const closeApplyModal = () => {
        if (submittingApply) return;
        setApplyModalDrive(null);
        setUploadedFile(null);
        setAgreedToTerms(false);
        setApplyError("");
    };

    const handleResumeFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 8 * 1024 * 1024) {
            setApplyError("Resume file is too large (max 8MB). Please choose a smaller PDF or DOCX file.");
            return;
        }

        setApplyError("");
        setUploadedFile(file);
    };

    const handleSubmitApplication = async (e) => {
        e.preventDefault();
        if (!applyModalDrive) return;

        if (!uploadedFile) {
            setApplyError("Please select and upload your resume for this drive.");
            return;
        }

        if (!agreedToTerms) {
            setApplyError("Please confirm that you meet the company specifications and eligibility criteria.");
            return;
        }

        setApplyError("");
        setSubmittingApply(true);

        try {
            // Read file as base64 DataURL
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(uploadedFile);
            });

            const resumePayload = {
                resumeName: uploadedFile.name,
                resumeData: dataUrl,
                resumeType: uploadedFile.type || (uploadedFile.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream"),
                resumeSize: (uploadedFile.size / 1024).toFixed(1) + " KB"
            };

            // Submit application with attached resume for this specific job
            submitStudentApplication(userEmail, applyModalDrive, studentProfile, resumePayload);

            setAppliedMap(prev => ({ 
                ...prev, 
                [applyModalDrive.id]: true,
                [applyModalDrive.company ? applyModalDrive.company.toLowerCase().trim() : ""]: true
            }));

            setStatusMessage(`🎉 Successfully applied for ${applyModalDrive.company}! Your resume "${uploadedFile.name}" has been submitted.`);
            setTimeout(() => setStatusMessage(""), 5000);

            closeApplyModal();
        } catch (err) {
            console.error("Application error:", err);
            setApplyError("Failed to submit application. Please try again.");
        } finally {
            setSubmittingApply(false);
        }
    };

    // Filter logic
    const filteredDrives = drives.filter(drive => {
        const matchesSearch = drive.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            drive.role.toLowerCase().includes(searchQuery.toLowerCase());
        
        const { isEligible } = evaluateEligibility(drive, studentProfile);
        const isApplied = !!appliedMap[drive.id] || (drive.company && !!appliedMap[drive.company.toLowerCase().trim()]);

        let matchesCategory = true;
        if (filterCategory === "Eligible") {
            matchesCategory = isEligible;
        } else if (filterCategory === "Applied") {
            matchesCategory = isApplied;
        } else if (filterCategory === "Closing Soon") {
            matchesCategory = drive.status === "Closing Soon";
        }

        let matchesRole = true;
        if (filterRole !== "All Job Roles") {
            matchesRole = drive.role.toLowerCase().includes(filterRole.toLowerCase());
        }

        return matchesSearch && matchesCategory && matchesRole;
    });

    return (
        <div className="drives-page">

            {/* Page Header */}
            <div className="drives-header">
                <div>
                    <h1>Placement Drives</h1>
                    <p>
                        Discover and apply for available placement opportunities.
                    </p>
                </div>
            </div>

            {statusMessage && (
                <div style={{
                    padding: "12px 20px",
                    background: "#ecfdf5",
                    border: "1px solid #10b981",
                    color: "#065f46",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <span>{statusMessage}</span>
                    <button 
                        onClick={() => setStatusMessage("")} 
                        style={{ color: "#065f46", fontWeight: "bold", background: "none", border: "none", cursor: "pointer" }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Search & Filters */}
            <div className="drives-tools">

                <div className="drive-search">
                    <span>🔍</span>

                    <input
                        type="text"
                        placeholder="Search by company or job role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <select 
                    className="drive-filter"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option>All Drives</option>
                    <option>Eligible</option>
                    <option>Applied</option>
                    <option>Closing Soon</option>
                </select>

                <select 
                    className="drive-filter"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                >
                    <option>All Job Roles</option>
                    <option>Software Engineer</option>
                    <option>Systems Engineer</option>
                    <option>Associate Developer</option>
                    <option>Project Engineer</option>
                </select>

            </div>

            {/* Drive Count */}
            <div className="drives-summary">
                <strong>{filteredDrives.length} Placement Drives</strong>
                <span>
                    {studentProfile.cgpa 
                        ? `Opportunities matching your profile (CGPA: ${studentProfile.cgpa}, Backlogs: ${studentProfile.backlogs || 0})`
                        : "Browse active placement drives and check your eligibility"}
                </span>
            </div>

            {/* Drives Grid */}
            <div className="drives-grid">
                {filteredDrives.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", gridColumn: "1 / -1", color: "#64748b" }}>
                        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏢</div>
                        <h3 style={{ fontSize: "18px", color: "#1e293b", marginBottom: "6px" }}>
                            {drives.length === 0 ? "No Placement Drives Posted Yet" : "No Drives Match Your Filters"}
                        </h3>
                        <p style={{ maxWidth: "450px", margin: "0 auto", fontSize: "14px" }}>
                            {drives.length === 0 
                                ? "The Placement Cell hasn't announced any active drives yet. Check back soon!" 
                                : "Try resetting your search query or role filter."}
                        </p>
                    </div>
                ) : (
                    filteredDrives.map((drive) => {
                        const { isEligible, reason } = evaluateEligibility(drive, studentProfile);
                        const isApplied = !!appliedMap[drive.id];

                        return (
                            <div className="drive-card" key={drive.id}>

                                <div className="drive-card-header">

                                    <div className="drive-company">
                                        <div className="drive-company-logo">
                                            {drive.logoLetter || drive.company.charAt(0)}
                                        </div>

                                        <div>
                                            <h2>{drive.company}</h2>
                                            <span>{drive.industry}</span>
                                        </div>
                                    </div>

                                    {!isEligible ? (
                                        <span className="drive-status not-eligible" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                                            Not Eligible
                                        </span>
                                    ) : drive.status === "Closing Soon" ? (
                                        <span className="drive-status closing">
                                            Closing Soon
                                        </span>
                                    ) : (
                                        <span className="drive-status eligible">
                                            Eligible
                                        </span>
                                    )}

                                </div>

                                <div className="drive-role">
                                    <span>💼</span>
                                    <div>
                                        <small>Job Role</small>
                                        <strong>{drive.role}</strong>
                                    </div>
                                </div>

                                <div className="drive-info-grid">

                                    <div>
                                        <small>Package</small>
                                        <strong>₹{drive.packageLpa} LPA</strong>
                                    </div>

                                    <div>
                                        <small>Location</small>
                                        <strong>{drive.location || "Bangalore"}</strong>
                                    </div>

                                    <div>
                                        <small>Drive Date</small>
                                        <strong>{drive.driveDate}</strong>
                                    </div>

                                    <div>
                                        <small>Deadline</small>
                                        <strong>{drive.deadline}</strong>
                                    </div>

                                </div>

                                <div className="eligibility">
                                    <span>Eligibility</span>
                                    <p>
                                        Min {drive.minCgpa} CGPA • {drive.maxBacklogs === 0 ? "No active backlogs" : `Max ${drive.maxBacklogs} backlog`}
                                    </p>
                                </div>

                                <div className="drive-card-actions">
                                    <button 
                                        type="button"
                                        className="drive-view-spec-btn"
                                        onClick={() => openSpecsModal(drive)}
                                    >
                                        👁️ View Details
                                    </button>

                                    {!isEligible ? (
                                        <button 
                                            className="drive-apply-btn not-eligible-btn"
                                            disabled
                                            title={reason}
                                        >
                                            Not Eligible
                                        </button>
                                    ) : isApplied ? (
                                        <button 
                                            className="drive-apply-btn applied-btn"
                                            disabled
                                        >
                                            ✓ Applied
                                        </button>
                                    ) : (
                                        <button 
                                            className="drive-apply-btn"
                                            onClick={() => openApplyModal(drive)}
                                        >
                                            Apply Now →
                                        </button>
                                    )}
                                </div>

                            </div>
                        );
                    })
                )}
            </div>

            {/* ========================================================= */}
            {/* COMPANY & DRIVE SPECIFICATIONS MODAL */}
            {/* ========================================================= */}
            {specModalDrive && (() => {
                const specs = getDriveSpecifications(specModalDrive);
                const { isEligible, reason } = evaluateEligibility(specModalDrive, studentProfile);
                const isApplied = !!appliedMap[specModalDrive.id] || (specModalDrive.company && !!appliedMap[specModalDrive.company.toLowerCase().trim()]);
                const studentCgpa = parseFloat(studentProfile.cgpa || 0);
                const minCgpa = parseFloat(specs.minCgpa || 0);
                const studentBacklogs = parseInt(studentProfile.backlogs || 0, 10);
                const maxBacklogs = parseInt(specs.maxBacklogs || 0, 10);
                const cgpaPassed = !studentProfile.cgpa || studentCgpa >= minCgpa;
                const backlogsPassed = studentBacklogs <= maxBacklogs;

                return (
                    <div className="spec-modal-backdrop" onClick={closeSpecsModal}>
                        <div className="spec-modal-card" onClick={(e) => e.stopPropagation()}>
                            
                            {/* Modal Header */}
                            <div className="spec-modal-header">
                                <div className="spec-modal-brand">
                                    <div className="spec-company-logo">
                                        {specs.logoLetter || (specs.company ? specs.company[0] : "C")}
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                                            <h2 style={{ margin: 0 }}>{specs.company}</h2>
                                            <span className="spec-badge-industry">{specs.industry}</span>
                                            <span className="spec-badge-status">🟢 Verified Drive</span>
                                        </div>
                                        <p className="spec-subtitle">
                                            {specs.role} • <strong>₹{specs.packageLpa} LPA CTC</strong> • {specs.workMode} ({specs.location})
                                        </p>
                                    </div>
                                </div>

                                <button className="spec-close-icon-btn" onClick={closeSpecsModal}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Clean Body */}
                            <div className="spec-modal-body" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                                
                                {/* Quick Highlights Grid */}
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                                    gap: "12px",
                                    background: "#f8fafc",
                                    padding: "16px",
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0"
                                }}>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>Annual CTC</span>
                                        <strong style={{ fontSize: "15px", color: "#10b981", fontWeight: "800" }}>₹{specs.packageLpa} LPA</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>Job Role</span>
                                        <strong style={{ fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>{specs.role}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>Location</span>
                                        <strong style={{ fontSize: "14px", color: "#0f172a", fontWeight: "600" }}>{specs.location || "Bangalore"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>Drive Date</span>
                                        <strong style={{ fontSize: "14px", color: "#0f172a", fontWeight: "600" }}>{specs.driveDate || "TBA"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>Application Deadline</span>
                                        <strong style={{ fontSize: "14px", color: "#e11d48", fontWeight: "700" }}>{specs.deadline || "TBA"}</strong>
                                    </div>
                                </div>

                                {/* Compulsory Eligibility Criteria */}
                                <div style={{
                                    border: `1px solid ${isEligible ? "#bbf7d0" : "#fecaca"}`,
                                    background: isEligible ? "#f0fdf4" : "#fef2f2",
                                    borderRadius: "12px",
                                    padding: "16px"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "16px" }}>⚖️</span>
                                            <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a", fontWeight: "700" }}>
                                                Eligibility Criteria & Cutoffs
                                            </h3>
                                        </div>
                                        <span style={{
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            padding: "3px 10px",
                                            borderRadius: "6px",
                                            background: isEligible ? "#16a34a" : "#dc2626",
                                            color: "#ffffff"
                                        }}>
                                            {isEligible ? "✓ You Meet All Criteria" : `⚠️ ${reason}`}
                                        </span>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                        <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)" }}>
                                            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Required CGPA</span>
                                            <strong style={{ fontSize: "13px", color: cgpaPassed ? "#16a34a" : "#dc2626" }}>
                                                Min {specs.minCgpa} CGPA (Your CGPA: {studentProfile.cgpa || "Pending"})
                                            </strong>
                                        </div>
                                        <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)" }}>
                                            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Backlog Allowance</span>
                                            <strong style={{ fontSize: "13px", color: backlogsPassed ? "#16a34a" : "#dc2626" }}>
                                                {specs.maxBacklogs === 0 ? "Zero Active Backlogs" : `Max ${specs.maxBacklogs} Backlogs`} (Yours: {studentBacklogs})
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                {/* About Company (if entered by Admin) */}
                                {specs.aboutCompany && (
                                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                                        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>
                                            🏢 About {specs.company}
                                        </h4>
                                        <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                                            {specs.aboutCompany}
                                        </p>
                                    </div>
                                )}

                                {/* Job Description / Key Responsibilities (if entered by Admin) */}
                                {specs.jobDescription && (
                                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                                        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>
                                            💼 Job Description & Role Scope
                                        </h4>
                                        <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                                            {specs.jobDescription}
                                        </p>
                                    </div>
                                )}

                                {/* Required Skills (if entered by Admin) */}
                                {Array.isArray(specs.requiredSkills) && specs.requiredSkills.length > 0 && (
                                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                                        <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>
                                            ⚡ Required Skills
                                        </h4>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                            {specs.requiredSkills.map((sk, i) => (
                                                <span key={i} style={{ background: "#eff6ff", color: "#1d4ed8", padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", border: "1px solid #dbeafe" }}>
                                                    {sk}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Selection Process (if entered by Admin) */}
                                {specs.selectionProcess && (
                                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                                        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>
                                            🎯 Selection Process
                                        </h4>
                                        <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                                            {specs.selectionProcess}
                                        </p>
                                    </div>
                                )}

                            </div>

                            {/* Modal Footer */}
                            <div className="spec-modal-footer">
                                <div style={{ fontSize: "13px", color: "#64748b" }}>
                                    📅 Applications close on <strong>{specs.deadline}</strong>
                                </div>

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button className="spec-secondary-btn" onClick={closeSpecsModal}>
                                        Close
                                    </button>

                                    {isApplied ? (
                                        <button className="spec-primary-btn applied" disabled>
                                            ✓ Applied for this Drive
                                        </button>
                                    ) : !isEligible ? (
                                        <button className="spec-primary-btn disabled" disabled title={reason}>
                                            Criteria Not Met
                                        </button>
                                    ) : (
                                        <button 
                                            className="spec-primary-btn"
                                            onClick={() => {
                                                closeSpecsModal();
                                                openApplyModal(specModalDrive);
                                            }}
                                        >
                                            Proceed to Apply & Submit Resume →
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                );
            })()}

            {/* ========================================================= */}
            {/* APPLY & RESUME UPLOAD MODAL */}
            {/* ========================================================= */}
            {applyModalDrive && (() => {
                const { isEligible, reason } = evaluateEligibility(applyModalDrive, studentProfile);

                return (
                    <div className="apply-modal-backdrop" onClick={closeApplyModal}>
                        <div className="apply-modal-card" onClick={(e) => e.stopPropagation()}>
                            
                            {/* Header */}
                            <div className="apply-modal-header">
                                <div className="apply-modal-brand">
                                    <div className="apply-company-logo">
                                        {applyModalDrive.logoLetter || (applyModalDrive.company ? applyModalDrive.company[0] : "C")}
                                    </div>
                                    <div>
                                        <h2>Apply to {applyModalDrive.company}</h2>
                                        <p>{applyModalDrive.role} • ₹{applyModalDrive.packageLpa} LPA • {applyModalDrive.location || "On-site"}</p>
                                    </div>
                                </div>
                                <button className="apply-modal-close" onClick={closeApplyModal} disabled={submittingApply}>
                                    <X size={20} />
                                </button>
                            </div>

                            {applyError && (
                                <div className="apply-error-banner">
                                    <AlertCircle size={18} />
                                    <span>{applyError}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmitApplication} className="apply-modal-form">
                                
                                {/* Mandatory Eligibility Check Status */}
                                <div style={{
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    background: isEligible ? "#ecfdf5" : "#fef2f2",
                                    border: isEligible ? "1px solid #a7f3d0" : "1px solid #fecaca",
                                    color: isEligible ? "#065f46" : "#991b1b",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between"
                                }}>
                                    <span>{isEligible ? "✓ Mandatory Criteria Verified: Eligible to Apply" : `⚠️ ${reason}`}</span>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const d = applyModalDrive;
                                            closeApplyModal();
                                            openSpecsModal(d);
                                        }}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: isEligible ? "#047857" : "#b91c1c",
                                            textDecoration: "underline",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            fontWeight: "700"
                                        }}
                                    >
                                        View Company Specs
                                    </button>
                                </div>

                                {/* Candidate Summary Box */}
                                <div className="apply-candidate-box">
                                    <span className="box-title">Applicant Credentials</span>
                                    <div className="candidate-grid">
                                        <div>
                                            <small>Candidate Name</small>
                                            <strong>{studentProfile.fullName || user?.name || "Student"}</strong>
                                        </div>
                                        <div>
                                            <small>Email Address</small>
                                            <strong>{userEmail}</strong>
                                        </div>
                                        <div>
                                            <small>Roll Number</small>
                                            <strong>{(studentProfile.rollNo && studentProfile.rollNo !== "Not Assigned") ? studentProfile.rollNo : "Roll Pending"}</strong>
                                        </div>
                                        <div>
                                            <small>Degree & Branch</small>
                                            <strong>{studentProfile.degree || "MCA"} ({studentProfile.department || "CS"})</strong>
                                        </div>
                                        <div>
                                            <small>Current CGPA</small>
                                            <strong>{studentProfile.cgpa ? `${studentProfile.cgpa} / 10` : "Not Provided"}</strong>
                                        </div>
                                        <div>
                                            <small>Active Backlogs</small>
                                            <strong>{studentProfile.backlogs || "0"}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Mandatory Resume Upload for this Specific Job */}
                                <div className="apply-resume-section">
                                    <div className="resume-section-heading">
                                        <h3>Upload Resume for {applyModalDrive.company} *</h3>
                                        <p>Please upload your tailored resume/CV for this company application (PDF, DOCX up to 8MB)</p>
                                    </div>

                                    <div className="resume-upload-container">
                                        <input 
                                            type="file" 
                                            id="resumeFileUpload"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleResumeFileSelect}
                                            style={{ display: "none" }}
                                        />
                                        
                                        {!uploadedFile ? (
                                            <label htmlFor="resumeFileUpload" className="resume-dropzone">
                                                <UploadCloud size={34} className="dropzone-icon" />
                                                <strong>Click or Drag to Upload Resume</strong>
                                                <span>Supports PDF, DOC, DOCX up to 8MB</span>
                                            </label>
                                        ) : (
                                            <div className="uploaded-file-card">
                                                <div className="file-card-details">
                                                    <FileText size={26} className="file-icon" />
                                                    <div>
                                                        <strong>{uploadedFile.name}</strong>
                                                        <span>{(uploadedFile.size / 1024).toFixed(1)} KB • Attached for {applyModalDrive.company}</span>
                                                    </div>
                                                </div>
                                                <label htmlFor="resumeFileUpload" className="change-file-btn">
                                                    Change Resume
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Mandatory Declaration Checkbox */}
                                <div style={{
                                    padding: "12px 14px",
                                    borderRadius: "8px",
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px"
                                }}>
                                    <input 
                                        type="checkbox"
                                        id="termsCheckbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        style={{ marginTop: "3px", cursor: "pointer", width: "16px", height: "16px" }}
                                    />
                                    <label htmlFor="termsCheckbox" style={{ fontSize: "12.5px", color: "#334155", lineHeight: "1.4", cursor: "pointer" }}>
                                        I confirm that I have reviewed the job specifications, compensation, and eligibility criteria for <strong>{applyModalDrive.company}</strong>, and certify that all details submitted with my resume are accurate.
                                    </label>
                                </div>

                                {/* Modal Footer */}
                                <div className="apply-modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn-cancel" 
                                        onClick={closeApplyModal}
                                        disabled={submittingApply}
                                    >
                                        Cancel
                                    </button>
                                    
                                    <button 
                                        type="submit" 
                                        className="btn-submit-apply"
                                        disabled={submittingApply || !uploadedFile || !agreedToTerms}
                                        style={{
                                            opacity: (submittingApply || !uploadedFile || !agreedToTerms) ? 0.6 : 1,
                                            cursor: (submittingApply || !uploadedFile || !agreedToTerms) ? "not-allowed" : "pointer"
                                        }}
                                    >
                                        {submittingApply ? "Submitting Application..." : "Submit Application with Resume →"}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                );
            })()}

        </div>
    );
}

export default Drives;