import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./StudentProfile.css";
import { getStoredUser } from "../../services/authService";
import { getStudentProfile, saveStudentProfile, getProfileCompletion } from "../../utils/drivesStore";
import API from "../../services/api";

function StudentProfile() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getStoredUser();
    const userEmail = user?.email ? user.email.toLowerCase().trim() : "";

    const [profile, setProfile] = useState(() => getStudentProfile(user) || {});
    const [isEditing, setIsEditing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    // Refresh profile on mount or whenever user changes
    useEffect(() => {
        const latest = getStudentProfile(getStoredUser());
        if (latest) {
            setProfile(latest);
        }

        // Fetch latest saved profile from MySQL Backend
        API.get("/students/profile")
            .then((res) => {
                if (res.data && res.data.profile) {
                    const p = res.data.profile;
                    setProfile((prev) => ({
                        ...prev,
                        fullName: p.name || prev.fullName,
                        phone: p.phone || prev.phone,
                        gender: p.gender || prev.gender,
                        location: p.location || prev.location,
                        rollNo: p.roll_no || prev.rollNo,
                        degree: p.degree || prev.degree,
                        department: p.department || prev.department,
                        college: p.college || prev.college,
                        semester: p.semester || prev.semester,
                        cgpa: p.cgpa !== undefined && p.cgpa !== null ? String(p.cgpa) : prev.cgpa,
                        backlogs: p.backlogs !== undefined && p.backlogs !== null ? String(p.backlogs) : prev.backlogs,
                        skills: Array.isArray(p.skills) ? p.skills : (p.skills ? p.skills.toString().split(",").map(s => s.trim()).filter(Boolean) : prev.skills),
                        resumeName: p.resume_name || prev.resumeName,
                    }));
                }
            })
            .catch(() => {});
    }, [userEmail]);

    const [editForm, setEditForm] = useState({
        fullName: "",
        phone: "",
        gender: "",
        location: "",
        rollNo: "",
        degree: "",
        department: "",
        college: "",
        semester: "",
        cgpa: "",
        backlogs: "0",
        skills: ""
    });

    // Check if navigated with ?edit=true
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("edit") === "true") {
            openEditModal();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    const openEditModal = () => {
        setEditForm({
            fullName: profile.fullName || user?.name || "",
            phone: profile.phone || "",
            gender: profile.gender || "",
            location: profile.location || "",
            rollNo: (profile.rollNo && profile.rollNo !== "Not Assigned" && profile.rollNo !== "Not Provided") ? profile.rollNo : "",
            degree: profile.degree || "MCA",
            department: profile.department || "Computer Applications",
            college: profile.college || "",
            semester: profile.semester || "",
            cgpa: profile.cgpa || "",
            backlogs: profile.backlogs !== undefined ? String(profile.backlogs) : "0",
            skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : ""
        });
        setIsEditing(true);
    };

    const closeEditModal = () => {
        setIsEditing(false);
        if (location.search.includes("edit=true")) {
            navigate(location.pathname, { replace: true });
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();

        const skillList = editForm.skills
            ? editForm.skills.split(",").map(s => s.trim()).filter(Boolean)
            : [];

        const updatedProfile = {
            ...profile,
            fullName: editForm.fullName.trim(),
            phone: editForm.phone.trim(),
            gender: editForm.gender ? editForm.gender.trim() : "",
            location: editForm.location.trim(),
            rollNo: editForm.rollNo.trim(),
            degree: editForm.degree.trim(),
            department: editForm.department.trim(),
            college: editForm.college.trim(),
            semester: editForm.semester.trim(),
            cgpa: editForm.cgpa.trim(),
            backlogs: editForm.backlogs.trim(),
            skills: skillList
        };

        const saved = saveStudentProfile(userEmail, updatedProfile);
        setProfile(saved || updatedProfile);

        // Synchronize with MySQL Database
        API.put("/students/profile", {
            fullName: updatedProfile.fullName,
            rollNo: updatedProfile.rollNo,
            phone: updatedProfile.phone,
            gender: updatedProfile.gender,
            location: updatedProfile.location,
            degree: updatedProfile.degree,
            department: updatedProfile.department,
            college: updatedProfile.college,
            semester: updatedProfile.semester,
            cgpa: updatedProfile.cgpa,
            backlogs: updatedProfile.backlogs,
            skills: skillList,
            resumeName: updatedProfile.resumeName || ""
        }).catch(err => {
            console.warn("Failed to sync profile to MySQL backend:", err);
        });

        closeEditModal();
        setStatusMessage("🎉 Profile updated successfully and synced to MySQL database!");
        setTimeout(() => setStatusMessage(""), 5000);
    };

    const fullName = profile.fullName || user?.name || "Student";
    const email = profile.email || user?.email || "Not Provided";
    const rollNo = (profile.rollNo && profile.rollNo !== "Not Assigned") ? profile.rollNo : "Not Provided";
    const degree = profile.degree || "Not Provided";
    const department = profile.department || "Not Provided";
    const rawCgpa = profile.cgpa !== undefined && profile.cgpa !== null ? String(profile.cgpa).replace(/\/.*$/, '').trim() : "";
    const cgpaDisplay = rawCgpa ? `${rawCgpa} / 10` : "Not Provided";
    const backlogs = profile.backlogs !== undefined && profile.backlogs !== "" ? profile.backlogs : "0";
    const phone = profile.phone || "Not Provided";
    const gender = profile.gender || "Not Specified";
    const userLocation = profile.location || "Not Provided";
    const college = profile.college || "CUSAT";
    const semester = profile.semester || "Not Provided";
    const avatarLetter = fullName ? fullName[0].toUpperCase() : "S";
    const completion = getProfileCompletion(profile, user);

    return (
        <div className="profile-page">

            {/* Status Message */}
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

            {/* Page Header */}
            <div className="profile-header">
                <div>
                    <h1>My Profile</h1>
                    <p>
                        Manage your personal and academic information.
                    </p>
                </div>

                <button className="edit-profile-btn" onClick={openEditModal}>
                    ✏️ Edit Profile
                </button>
            </div>


            {/* Profile Overview */}
            <div className="profile-overview">

                <div className="profile-avatar">
                    {avatarLetter}
                </div>

                <div className="profile-main-info">
                    <h2>{fullName}</h2>
                    <p>{degree !== "Not Provided" ? `${degree} Student` : "Student"}</p>
                    <span>{department !== "Not Provided" ? department : "Smart Placement Management System"}</span>
                </div>

                <div className="profile-completion">

                    <div className="completion-header">
                        <span>Profile Completion</span>
                        <strong style={{ color: completion.percentage === 100 ? "#10b981" : "#173b32" }}>
                            {completion.percentage}% {completion.percentage === 100 ? "✓ Complete" : ""}
                        </strong>
                    </div>

                    <div className="completion-bar">
                        <div 
                            className="completion-progress" 
                            style={{ 
                                width: `${completion.percentage}%`,
                                background: completion.percentage === 100 ? "#10b981" : "linear-gradient(90deg, #10b981, #059669)"
                            }}
                        ></div>
                    </div>

                    <small style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                        {completion.percentage === 100 
                            ? "🎉 All details completed & placement ready" 
                            : `${completion.completedCount} of ${completion.totalCount} details filled`}
                    </small>

                </div>

            </div>


            {/* Information Grid */}
            <div className="profile-grid">

                {/* Personal Information */}
                <section className="profile-card">

                    <div className="profile-card-header">
                        <h2>Personal Information</h2>
                    </div>

                    <div className="info-list">

                        <div className="info-item">
                            <span>Full Name</span>
                            <strong>{fullName}</strong>
                        </div>

                        <div className="info-item">
                            <span>Email</span>
                            <strong>{email}</strong>
                        </div>

                        <div className="info-item">
                            <span>Phone</span>
                            <strong>{phone}</strong>
                        </div>

                        <div className="info-item">
                            <span>Gender</span>
                            <strong>{gender}</strong>
                        </div>

                        <div className="info-item">
                            <span>Address / Location</span>
                            <strong>{userLocation}</strong>
                        </div>

                    </div>

                </section>


                {/* Academic Information */}
                <section className="profile-card">

                    <div className="profile-card-header">
                        <h2>Academic Information</h2>
                    </div>

                    <div className="info-list">

                        <div className="info-item">
                            <span>Roll Number</span>
                            <strong>{rollNo}</strong>
                        </div>

                        <div className="info-item">
                            <span>Degree</span>
                            <strong>{degree}</strong>
                        </div>

                        <div className="info-item">
                            <span>Department</span>
                            <strong>{department}</strong>
                        </div>

                        <div className="info-item">
                            <span>College / University</span>
                            <strong>{college}</strong>
                        </div>

                        <div className="info-item">
                            <span>Current Semester / Year</span>
                            <strong>{semester}</strong>
                        </div>

                        <div className="info-item">
                            <span>CGPA</span>
                            <strong>{cgpaDisplay}</strong>
                        </div>

                        <div className="info-item">
                            <span>Active Backlogs</span>
                            <strong>{backlogs}</strong>
                        </div>

                    </div>

                </section>

            </div>


            {/* Skills */}
            <section className="profile-card skills-card">

                <div className="profile-card-header">
                    <h2>Skills & Technologies</h2>
                </div>

                <div className="skills-list">
                    {profile.skills && profile.skills.length > 0 ? (
                        profile.skills.map((skill, index) => (
                            <span key={index}>{skill}</span>
                        ))
                    ) : (
                        <p style={{ color: "#64748b", margin: "8px 0", fontSize: "14px" }}>
                            No technical skills added yet. Click <strong>Edit Profile</strong> to add your skills.
                        </p>
                    )}
                </div>

            </section>


            {/* ========================================================= */}
            {/* EDIT PROFILE MODAL */}
            {/* ========================================================= */}
            {isEditing && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.65)",
                    backdropFilter: "blur(4px)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <div style={{
                        background: "#ffffff",
                        borderRadius: "16px",
                        width: "100%",
                        maxWidth: "560px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        padding: "28px",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                        color: "#1e293b"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div>
                                <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "#0f172a" }}>Edit Profile</h2>
                                <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Update your personal & academic details</p>
                            </div>
                            <button 
                                onClick={closeEditModal}
                                style={{
                                    background: "#f1f5f9",
                                    border: "none",
                                    borderRadius: "8px",
                                    width: "32px",
                                    height: "32px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "16px",
                                    color: "#64748b"
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile}>
                            {/* Personal Info */}
                            <h3 style={{ fontSize: "15px", color: "#2563eb", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
                                Personal Information
                            </h3>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={editForm.fullName}
                                    onChange={handleFormChange}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "14px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        name="phone"
                                        placeholder="+91 98765 43210"
                                        value={editForm.phone}
                                        onChange={handleFormChange}
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "14px",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={editForm.gender}
                                        onChange={handleFormChange}
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "14px",
                                            boxSizing: "border-box",
                                            backgroundColor: "#ffffff",
                                            color: editForm.gender ? "#1e293b" : "#94a3b8"
                                        }}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: "18px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                                    Address / Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    placeholder="e.g. MG Road, Bangalore / City, State"
                                    value={editForm.location}
                                    onChange={handleFormChange}
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "14px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            {/* Academic Info */}
                            <h3 style={{ fontSize: "15px", color: "#2563eb", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
                                Academic Information
                            </h3>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                                        Roll Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="rollNo"
                                        value={editForm.rollNo}
                                        onChange={handleFormChange}
                                        required
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "14px",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                                        Degree
                                    </label>
                                    <input
                                        type="text"
                                        name="degree"
                                        value={editForm.degree}
                                        onChange={handleFormChange}
                                        placeholder="MCA / B.Tech"
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "14px",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={editForm.department}
                                        onChange={handleFormChange}
                                        placeholder="Computer Applications"
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "14px",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                                        College / University
                                    </label>
                                    <input
                                        type="text"
                                        name="college"
                                        value={editForm.college}
                                        onChange={handleFormChange}
                                        placeholder="e.g. CUSAT / IIT / NIT"
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "14px",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                                    Current Semester / Year
                                </label>
                                <input
                                    type="text"
                                    name="semester"
                                    value={editForm.semester}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Semester 4 / Year 2"
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "14px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                                        CGPA (out of 10) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="cgpa"
                                        value={editForm.cgpa}
                                        onChange={handleFormChange}
                                        placeholder="e.g. 8.25"
                                        required
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "14px",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                                        Active Backlogs
                                    </label>
                                    <input
                                        type="number"
                                        name="backlogs"
                                        value={editForm.backlogs}
                                        onChange={handleFormChange}
                                        min="0"
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "14px",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Skills */}
                            <h3 style={{ fontSize: "15px", color: "#2563eb", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
                                Skills
                            </h3>

                            <div style={{ marginBottom: "24px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                                    Technical Skills (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    name="skills"
                                    value={editForm.skills}
                                    onChange={handleFormChange}
                                    placeholder="e.g. React.js, Python, Java, SQL, Node.js"
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "14px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            {/* Buttons */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    style={{
                                        padding: "10px 18px",
                                        background: "#f1f5f9",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        color: "#475569"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: "10px 22px",
                                        background: "#173b32",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default StudentProfile;