import { useState, useEffect } from "react";
import {
    Search,
    Calendar,
    Users,
    Trash2,
    CheckCircle2,
    X,
    Download,
    Building2,
    FileText,
    Eye,
    User,
    GraduationCap
} from "lucide-react";
import { 
    getStoredDrives, 
    addDrive, 
    deleteDrive, 
    saveDrives,
    getDriveApplicants, 
    updateApplicationStatus,
    removeApplicationFromDrive,
    getStudentProfile,
    getProfileCompletion
} from "../../utils/drivesStore";
import {
    getStoredStudents,
    saveStudents
} from "../../utils/studentsStore";
import "./AdminDrives.css";

function AdminDrives() {
    const [drives, setDrives] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showApplicantsModal, setShowApplicantsModal] = useState(false);
    const [selectedDrive, setSelectedDrive] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [toastMessage, setToastMessage] = useState("");
    const [selectedStudentForView, setSelectedStudentForView] = useState(null);

    // Form state for creating a new drive
    const [formData, setFormData] = useState({
        company: "",
        industry: "Information Technology",
        role: "",
        packageLpa: "",
        location: "Bangalore",
        status: "Active",
        minCgpa: "6.5",
        maxBacklogs: "0",
        driveDate: "2026-09-20",
        deadline: "2026-09-15",
        aboutCompany: "",
        jobDescription: "",
        requiredSkills: "",
        selectionProcess: ""
    });

    useEffect(() => {
        loadDrives();
    }, []);

    const loadDrives = () => {
        setDrives(getStoredDrives());
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreateDrive = (e) => {
        e.preventDefault();
        if (!formData.company || !formData.role || !formData.packageLpa) {
            alert("Please fill in company name, role, and package.");
            return;
        }

        const newDrive = addDrive({
            ...formData,
            packageLpa: parseFloat(formData.packageLpa),
            minCgpa: parseFloat(formData.minCgpa),
            maxBacklogs: parseInt(formData.maxBacklogs)
        });

        loadDrives();
        setShowCreateModal(false);
        setToastMessage(`🎉 Drive for "${newDrive.company}" posted successfully! It is now live on the Student Portal.`);
        setTimeout(() => setToastMessage(""), 6000);

        // Reset form
        setFormData({
            company: "",
            industry: "Information Technology",
            role: "",
            packageLpa: "",
            location: "Bangalore",
            status: "Active",
            minCgpa: "6.5",
            maxBacklogs: "0",
            driveDate: "2026-09-20",
            deadline: "2026-09-15",
            aboutCompany: "",
            jobDescription: "",
            requiredSkills: "",
            selectionProcess: ""
        });
    };

    const handleDelete = (id, company) => {
        if (window.confirm(`Are you sure you want to delete the drive for ${company}?`)) {
            deleteDrive(id);
            loadDrives();
            setToastMessage(`Drive for "${company}" removed.`);
            setTimeout(() => setToastMessage(""), 4000);
        }
    };

    const handleClearAllDrives = () => {
        if (window.confirm("Are you sure you want to remove ALL placement drives? This will give you a clean, empty drives list.")) {
            saveDrives([]);
            loadDrives();
            setToastMessage("All placement drives cleared.");
            setTimeout(() => setToastMessage(""), 4000);
        }
    };

    const handleOpenApplicants = (drive) => {
        setSelectedDrive(drive);
        setApplicants(getDriveApplicants(drive.id));
        setShowApplicantsModal(true);
    };

    const handleUpdateStatus = (appId, newStatus) => {
        updateApplicationStatus(appId, newStatus);
        if (selectedDrive) {
            const updatedApps = getDriveApplicants(selectedDrive.id);
            setApplicants(updatedApps);

            // Synchronize placement status with Student Directory if student is in directory
            const targetApp = updatedApps.find(a => a.id === appId);
            if (targetApp) {
                const currentDirectory = getStoredStudents();
                const cleanEmail = targetApp.studentEmail ? targetApp.studentEmail.toLowerCase().trim() : "";
                const cleanRoll = targetApp.rollNo ? targetApp.rollNo.trim().toLowerCase() : "";
                const existing = currentDirectory.find(s => {
                    if (cleanEmail && s.email && s.email.toLowerCase().trim() === cleanEmail) return true;
                    if (cleanRoll && cleanRoll !== "not assigned" && cleanRoll !== "n/a" && s.rollNo && s.rollNo.toLowerCase().trim() === cleanRoll) return true;
                    return false;
                });
                if (existing) {
                    const isSelected = newStatus === "Selected";
                    const updatedDirectory = currentDirectory.map(s => {
                        if (s.id === existing.id) {
                            return {
                                ...s,
                                status: isSelected ? "Placed" : s.status === "Placed" && s.placedCompany === selectedDrive.company ? "Unplaced" : s.status,
                                placedCompany: isSelected ? selectedDrive.company : s.placedCompany === selectedDrive.company ? null : s.placedCompany,
                                packageLpa: isSelected ? selectedDrive.packageLpa : s.placedCompany === selectedDrive.company ? null : s.packageLpa
                            };
                        }
                        return s;
                    });
                    saveStudents(updatedDirectory);
                }
            }
        }
        setToastMessage(`Application status updated to "${newStatus}"!`);
        setTimeout(() => setToastMessage(""), 4000);
    };

    // Remove student application from company
    const handleRemoveApplicant = (app) => {
        if (!window.confirm(`Are you sure you want to remove ${app.studentName || 'this student'}'s application for ${selectedDrive.company}?`)) {
            return;
        }

        removeApplicationFromDrive(app.id);
        if (selectedDrive) {
            const updated = getDriveApplicants(selectedDrive.id);
            setApplicants(updated);
        }
        loadDrives();
        setToastMessage(`Removed ${app.studentName || 'student'} from ${selectedDrive.company} drive.`);
        setTimeout(() => setToastMessage(""), 4000);
    };

    // Open student's detailed academic and personal profile
    const handleViewStudentProfile = (app) => {
        const allStudents = getStoredStudents();
        const cleanEmail = (app.studentEmail || "").toLowerCase().trim();
        const cleanRoll = (app.rollNo || "").trim().toLowerCase();

        const found = allStudents.find(s => {
            if (cleanEmail && s.email && s.email.toLowerCase().trim() === cleanEmail) return true;
            if (cleanRoll && cleanRoll !== "not assigned" && cleanRoll !== "n/a" && s.rollNo && s.rollNo.toLowerCase().trim() === cleanRoll) return true;
            return false;
        });

        const prof = getStudentProfile({ email: cleanEmail, name: app.studentName }) || {};
        const skills = (found && Array.isArray(found.skills) && found.skills.length > 0)
            ? found.skills
            : (Array.isArray(prof.skills) ? prof.skills : []);

        const completeProfile = {
            id: found ? found.id : ("stu_" + Date.now()),
            name: prof.fullName || app.studentName || (found ? found.name : "Student"),
            fullName: prof.fullName || app.studentName || (found ? found.name : "Student"),
            email: cleanEmail || prof.email || (found ? found.email : ""),
            phone: prof.phone || (found ? found.phone : ""),
            gender: prof.gender || (found ? found.gender : ""),
            location: prof.location || (found ? (found.location || found.address) : ""),
            rollNo: (app.rollNo && app.rollNo !== "N/A" && app.rollNo !== "Not Assigned")
                ? app.rollNo
                : (prof.rollNo || (found ? found.rollNo : "Not Assigned")),
            degree: app.degree || prof.degree || (found ? found.degree : "MCA"),
            department: prof.department || (found ? found.department : "Computer Applications"),
            college: prof.college || (found ? found.college : ""),
            semester: prof.semester || (found ? found.semester : ""),
            cgpa: app.cgpa && app.cgpa !== "N/A" ? app.cgpa : (prof.cgpa || (found ? found.cgpa : "")),
            backlogs: prof.backlogs !== undefined ? prof.backlogs : (found ? found.backlogs : "0"),
            skills: skills,
            verified: found ? found.verified : false,
            status: found ? found.status : "Applied",
            resumeName: app.resumeName || prof.resumeName || null,
            resumeData: app.resumeData || prof.resumeData || null
        };

        const completion = getProfileCompletion(completeProfile);
        completeProfile.completion = completion;

        setSelectedStudentForView(completeProfile);
    };

    const handleExportCSV = (companyName) => {
        if (!selectedDrive) return;
        const applicants = getDriveApplicants(selectedDrive.id);
        const headers = "RollNo,Name,Degree,CGPA,Status,AppliedDate\n";
        const rows = applicants.map(a => 
            `"${a.rollNo || 'N/A'}","${a.studentName || 'Student'}","${a.degree || 'MCA'}","${a.cgpa || 'N/A'}","${a.status || 'Applied'}","${a.appliedDate || ''}"`
        ).join("\n");

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + headers + rows);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${companyName}_Applicants_List.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter drives
    const filteredDrives = drives.filter(d => {
        const matchesSearch = d.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.role.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="admin-drives-page">
            {/* Header */}
            <div className="admin-drives-header">
                <div>
                    <h1>💼 Placement Drives Management</h1>
                    <p>Create, manage eligibility criteria, and track campus recruitment drives.</p>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button 
                        className="btn-primary-action"
                        onClick={() => window.location.href = "/admin/companies"}
                        style={{ display: "flex", alignItems: "center", gap: "8px" }}
                        title="Add company or move partner companies to placement drives"
                    >
                        <Building2 size={17} />
                        <span>Manage Recruiters & Companies →</span>
                    </button>

                    {drives.length > 0 && (
                        <button 
                            onClick={handleClearAllDrives}
                            style={{
                                background: "#fff",
                                border: "1px solid #fecaca",
                                color: "#ef4444",
                                borderRadius: "8px",
                                padding: "10px 14px",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                            title="Clear all drives"
                        >
                            <Trash2 size={16} />
                            <span>Clear All</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Success Toast */}
            {toastMessage && (
                <div className="admin-toast">
                    <div className="toast-content">
                        <CheckCircle2 size={20} color="#10b981" />
                        <span>{toastMessage}</span>
                    </div>
                    <button onClick={() => setToastMessage("")} className="toast-close">✕</button>
                </div>
            )}

            {/* Filter Bar */}
            <div className="admin-drives-controls">
                <div className="search-bar-box">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search drives by company or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="status-filter-pills">
                    {["All", "Active", "Upcoming", "Not Active"].map(status => (
                        <button
                            key={status}
                            className={`filter-pill ${statusFilter === status ? "active" : ""}`}
                            onClick={() => setStatusFilter(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Drives Table Card */}
            <div className="drives-list-card">
                <div className="table-meta-bar">
                    <span>Showing <strong>{filteredDrives.length}</strong> Placement Drives</span>
                    <span className="live-badge">✓ Linked with Student Eligibility Engine</span>
                </div>

                <div className="table-responsive">
                    <table className="drives-master-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Role</th>
                                <th>Package (CTC)</th>
                                <th>Eligibility Criteria</th>
                                <th>Drive Date & Deadline</th>
                                <th>Applicants</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDrives.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
                                        <div style={{ fontSize: "40px", marginBottom: "10px" }}>💼</div>
                                        <h3 style={{ fontSize: "16px", color: "#1e293b", margin: "0 0 6px 0" }}>No Placement Drives Posted Yet</h3>
                                        <p style={{ margin: "0 0 16px 0", fontSize: "14px" }}>
                                            Add partner companies in Recruiters & Companies and launch them into Placement Drives.
                                        </p>
                                        <button 
                                            onClick={() => window.location.href = "/admin/companies"}
                                            style={{
                                                background: "#10b981",
                                                color: "#fff",
                                                border: "none",
                                                padding: "9px 18px",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontWeight: "600",
                                                fontSize: "13px"
                                            }}
                                        >
                                            Go to Recruiters & Companies →
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                filteredDrives.map(drive => (
                                    <tr key={drive.id}>
                                        <td>
                                            <div className="company-info-flex">
                                                <div className="drive-logo-avatar">
                                                    {drive.logoLetter || drive.company.charAt(0)}
                                                </div>
                                            <div>
                                                <strong>{drive.company}</strong>
                                                <small>{drive.industry}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="role-cell">
                                            <span>{drive.role}</span>
                                            <small>{drive.location}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="package-highlight">₹{drive.packageLpa} LPA</span>
                                    </td>
                                    <td>
                                        <div className="criteria-tag-box">
                                            <span className="cgpa-tag">Min {drive.minCgpa} CGPA</span>
                                            <span className="backlog-tag">
                                                {drive.maxBacklogs === 0 ? "0 Backlogs" : `≤ ${drive.maxBacklogs} Backlogs`}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <span><Calendar size={13} /> Drive: {drive.driveDate}</span>
                                            <small className="deadline-alert">Last Date: {drive.deadline}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <button 
                                            className="applicants-count-btn"
                                            onClick={() => handleOpenApplicants(drive)}
                                            title="View student applicants"
                                        >
                                            <Users size={14} />
                                            <span>{getDriveApplicants(drive.id).length} applied</span>
                                        </button>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${drive.status.toLowerCase().replace(" ", "-")}`}>
                                            {drive.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-cluster">
                                            <button 
                                                className="btn-action-icon delete"
                                                onClick={() => handleDelete(drive.id, drive.company)}
                                                title="Delete Drive"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* =========================================================================
                CREATE DRIVE MODAL
            ========================================================================= */}
            {showCreateModal && (
                <div className="modal-backdrop">
                    <div className="modal-box create-drive-modal">
                        <div className="modal-header">
                            <div className="modal-title-flex">
                                <div className="modal-icon-badge">
                                    <Building2 size={22} />
                                </div>
                                <div>
                                    <h2>Post New Placement Drive</h2>
                                    <p>Published drives will automatically enforce eligibility criteria on student portals</p>
                                </div>
                            </div>
                            <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDrive} className="modal-form">
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>Company Name *</label>
                                    <input 
                                        type="text" 
                                        name="company" 
                                        placeholder="e.g. Google, Amazon, Cisco"
                                        value={formData.company}
                                        onChange={handleFormChange}
                                        required 
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Industry Domain</label>
                                    <select name="industry" value={formData.industry} onChange={handleFormChange}>
                                        <option value="Information Technology">Information Technology</option>
                                        <option value="Cloud & AI">Cloud & AI</option>
                                        <option value="Consulting & Analytics">Consulting & Analytics</option>
                                        <option value="Financial Technology">Financial Technology</option>
                                        <option value="E-Commerce">E-Commerce</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>Job Profile / Role *</label>
                                    <input 
                                        type="text" 
                                        name="role" 
                                        placeholder="e.g. Software Engineer / SDE-1"
                                        value={formData.role}
                                        onChange={handleFormChange}
                                        required 
                                    />
                                </div>

                                <div className="form-group">
                                    <label>CTC Package (₹ in LPA) *</label>
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        name="packageLpa" 
                                        placeholder="e.g. 12.5"
                                        value={formData.packageLpa}
                                        onChange={handleFormChange}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>Min CGPA Cutoff (out of 10) *</label>
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        min="0" 
                                        max="10" 
                                        name="minCgpa" 
                                        value={formData.minCgpa}
                                        onChange={handleFormChange}
                                        required 
                                    />
                                    <small className="form-hint">Students below this CGPA will see "Criteria Not Met"</small>
                                </div>

                                <div className="form-group">
                                    <label>Max Allowed Active Backlogs *</label>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max="10" 
                                        name="maxBacklogs" 
                                        value={formData.maxBacklogs}
                                        onChange={handleFormChange}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>Drive Assessment Date</label>
                                    <input 
                                        type="date" 
                                        name="driveDate" 
                                        value={formData.driveDate}
                                        onChange={handleFormChange}
                                        required 
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Application Deadline</label>
                                    <input 
                                        type="date" 
                                        name="deadline" 
                                        value={formData.deadline}
                                        onChange={handleFormChange}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>Job Location</label>
                                    <input 
                                        type="text" 
                                        name="location" 
                                        placeholder="e.g. Bangalore / Kochi / Remote"
                                        value={formData.location}
                                        onChange={handleFormChange} 
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Hiring Status</label>
                                    <select 
                                        name="status" 
                                        value={formData.status} 
                                        onChange={handleFormChange}
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)", background: "#1e293b", color: "#fff", fontSize: "14px" }}
                                    >
                                        <option value="Active">Active (Hiring Now)</option>
                                        <option value="Upcoming">Upcoming (Scheduled)</option>
                                        <option value="Not Active">Not Active (Closed / Inactive)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>About Company (Optional)</label>
                                <textarea 
                                    name="aboutCompany" 
                                    placeholder="Brief intro about company culture, domain, or website..."
                                    value={formData.aboutCompany || ""}
                                    onChange={handleFormChange}
                                    rows="2"
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(255, 255, 255, 0.05)", color: "#fff", fontSize: "13px", resize: "vertical", boxSizing: "border-box" }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Job Description / Key Responsibilities (Optional)</label>
                                <textarea 
                                    name="jobDescription" 
                                    placeholder="Describe the role responsibilities or day-to-day work..."
                                    value={formData.jobDescription || ""}
                                    onChange={handleFormChange}
                                    rows="2"
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(255, 255, 255, 0.05)", color: "#fff", fontSize: "13px", resize: "vertical", boxSizing: "border-box" }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Required Skills (Optional - comma separated)</label>
                                <input 
                                    type="text" 
                                    name="requiredSkills" 
                                    placeholder="e.g. Java, Python, SQL, React"
                                    value={formData.requiredSkills || ""}
                                    onChange={handleFormChange} 
                                />
                            </div>

                            <div className="form-group">
                                <label>Interview / Selection Process (Optional)</label>
                                <input 
                                    type="text" 
                                    name="selectionProcess" 
                                    placeholder="e.g. Online Assessment -> Technical Interview -> HR Round"
                                    value={formData.selectionProcess || ""}
                                    onChange={handleFormChange} 
                                />
                            </div>

                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn-modal-cancel" 
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-modal-submit">
                                    🚀 Publish Drive Now
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================================================
                VIEW APPLICANTS MODAL
            ========================================================================= */}
            {showApplicantsModal && selectedDrive && (
                <div className="modal-backdrop">
                    <div className="modal-box applicants-modal">
                        <div className="modal-header">
                            <div className="modal-title-flex">
                                <div className="modal-icon-badge">
                                    <Users size={22} />
                                </div>
                                <div>
                                    <h2>Applicants for {selectedDrive.company}</h2>
                                    <p>Role: {selectedDrive.role} • Min Criteria: {selectedDrive.minCgpa} CGPA</p>
                                </div>
                            </div>
                            <button className="modal-close-btn" onClick={() => setShowApplicantsModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="applicants-modal-body">
                            <div className="applicants-summary-box">
                                <div>
                                    <span>Total Applicants:</span>
                                    <strong>{applicants.length} {applicants.length === 1 ? "Student" : "Students"}</strong>
                                </div>
                                <button 
                                    className="btn-download-csv"
                                    onClick={() => handleExportCSV(selectedDrive.company)}
                                    disabled={applicants.length === 0}
                                    style={applicants.length === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                                >
                                    <Download size={15} />
                                    <span>Download Shortlist (.CSV)</span>
                                </button>
                            </div>

                            {applicants.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
                                    <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.4, display: "block" }} />
                                    <h3 style={{ fontSize: "16px", color: "#1e293b", margin: "0 0 6px 0" }}>No Applicants Yet</h3>
                                    <p style={{ margin: 0, fontSize: "14px" }}>
                                        No students have submitted applications for this placement drive yet.
                                    </p>
                                </div>
                            ) : (
                                <table className="applicants-table">
                                    <thead>
                                        <tr>
                                            <th>Roll Number</th>
                                            <th>Student Name</th>
                                            <th>Program</th>
                                            <th>CGPA</th>
                                            <th>Resume</th>
                                            <th>Status</th>
                                            <th>Update Stage</th>
                                            <th style={{ textAlign: "center" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applicants.map((app) => {
                                            return (
                                                <tr key={app.id}>
                                                <td style={{ color: "#ffffff", fontWeight: "700" }}>{app.rollNo || "N/A"}</td>
                                                <td style={{ color: "#ffffff", fontWeight: "600" }}>{app.studentName || "Student"}</td>
                                                <td style={{ color: "#cbd5e1" }}>{app.degree || "MCA"}</td>
                                                <td>
                                                    <span style={{
                                                        padding: "4px 10px",
                                                        borderRadius: "6px",
                                                        background: "rgba(255, 255, 255, 0.12)",
                                                        color: "#ffffff",
                                                        fontWeight: "700",
                                                        display: "inline-block"
                                                    }}>
                                                        {app.cgpa || "N/A"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {app.resumeData ? (
                                                        <a
                                                            href={app.resumeData}
                                                            download={app.resumeName || `${app.studentName || 'Student'}_Resume.pdf`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                fontSize: "12px",
                                                                color: "#6ee7b7",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "5px",
                                                                background: "rgba(16, 185, 129, 0.18)",
                                                                border: "1px solid rgba(16, 185, 129, 0.4)",
                                                                padding: "4px 10px",
                                                                borderRadius: "6px",
                                                                maxWidth: "160px",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                                textDecoration: "none",
                                                                fontWeight: "600",
                                                                cursor: "pointer"
                                                            }}
                                                            title={`Download / View: ${app.resumeName || 'Resume'}`}
                                                        >
                                                            <FileText size={13} /> {app.resumeName || "View Resume"}
                                                        </a>
                                                    ) : app.resumeName ? (
                                                        <span style={{
                                                            fontSize: "12px",
                                                            color: "#6ee7b7",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            background: "rgba(16, 185, 129, 0.15)",
                                                            padding: "3px 8px",
                                                            borderRadius: "4px",
                                                            maxWidth: "140px",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap"
                                                        }} title={app.resumeName}>
                                                            <FileText size={13} /> {app.resumeName}
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Profile Resume</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span 
                                                        style={{
                                                            display: "inline-block",
                                                            padding: "4px 10px",
                                                            borderRadius: "20px",
                                                            fontSize: "11px",
                                                            fontWeight: "700",
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.5px",
                                                            background: app.status === "Selected" 
                                                                ? "rgba(16, 185, 129, 0.2)" 
                                                                : app.status === "Shortlisted" 
                                                                    ? "rgba(168, 85, 247, 0.2)" 
                                                                    : app.status === "Interview Scheduled"
                                                                        ? "rgba(245, 158, 11, 0.2)"
                                                                        : app.status === "Rejected"
                                                                            ? "rgba(239, 68, 68, 0.2)"
                                                                            : "rgba(56, 189, 248, 0.2)",
                                                            color: app.status === "Selected"
                                                                ? "#34d399"
                                                                : app.status === "Shortlisted"
                                                                    ? "#c084fc"
                                                                    : app.status === "Interview Scheduled"
                                                                        ? "#fbbf24"
                                                                        : app.status === "Rejected"
                                                                            ? "#f87171"
                                                                            : "#38bdf8",
                                                            border: "1px solid currentColor"
                                                        }}
                                                    >
                                                        {app.status || "Applied"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <select
                                                        value={app.status || "Applied"}
                                                        onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                                        style={{
                                                            padding: "6px 10px",
                                                            borderRadius: "8px",
                                                            border: "1px solid #475569",
                                                            fontSize: "13px",
                                                            background: "#1e293b",
                                                            color: "#ffffff",
                                                            cursor: "pointer",
                                                            fontWeight: "600"
                                                        }}
                                                    >
                                                        <option value="Applied">Applied</option>
                                                        <option value="Shortlisted">Shortlisted</option>
                                                        <option value="Interview Scheduled">Interview Scheduled</option>
                                                        <option value="Selected">Selected</option>
                                                        <option value="Rejected">Rejected</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleViewStudentProfile(app)}
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "5px",
                                                                background: "rgba(59, 130, 246, 0.15)",
                                                                border: "1px solid rgba(59, 130, 246, 0.4)",
                                                                color: "#93c5fd",
                                                                padding: "6px 10px",
                                                                borderRadius: "6px",
                                                                fontSize: "12px",
                                                                fontWeight: "600",
                                                                cursor: "pointer",
                                                                transition: "all 0.15s ease"
                                                            }}
                                                            title="View Student Profile & Academic Details"
                                                        >
                                                            <Eye size={14} />
                                                            <span>View Details</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveApplicant(app)}
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "5px",
                                                                background: "rgba(239, 68, 68, 0.15)",
                                                                border: "1px solid rgba(239, 68, 68, 0.4)",
                                                                color: "#f87171",
                                                                padding: "6px 10px",
                                                                borderRadius: "6px",
                                                                fontSize: "12px",
                                                                fontWeight: "600",
                                                                cursor: "pointer",
                                                                transition: "all 0.15s ease"
                                                            }}
                                                            title={`Remove ${app.studentName || 'student'} from this company drive`}
                                                        >
                                                            <Trash2 size={14} />
                                                            <span>Remove</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================================
                STUDENT COMPLETE PROFILE MODAL (From Applicants List)
            ========================================================================= */}
            {selectedStudentForView && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(5px)",
                    zIndex: 10000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <div style={{
                        background: "#0f172a",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "20px",
                        width: "100%",
                        maxWidth: "680px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        padding: "30px",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                        color: "#f8fafc"
                    }}>
                        {/* Modal Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", paddingBottom: "18px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                <div style={{
                                    width: "56px",
                                    height: "56px",
                                    borderRadius: "16px",
                                    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "22px",
                                    fontWeight: "800",
                                    color: "#ffffff",
                                    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.3)"
                                }}>
                                    {(selectedStudentForView.fullName || selectedStudentForView.name || "S").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#f8fafc", fontWeight: "700" }}>
                                        {selectedStudentForView.fullName || selectedStudentForView.name}
                                    </h2>
                                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                                            Roll No: <strong style={{ color: "#38bdf8" }}>{selectedStudentForView.rollNo || "Not Assigned"}</strong>
                                        </span>
                                        <span style={{
                                            padding: "2px 8px",
                                            borderRadius: "12px",
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            background: selectedStudentForView.verified ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                            color: selectedStudentForView.verified ? "#34d399" : "#fbbf24",
                                            border: `1px solid ${selectedStudentForView.verified ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
                                        }}>
                                            {selectedStudentForView.verified ? "VERIFIED ✓" : "PENDING VERIFICATION"}
                                        </span>
                                        {selectedStudentForView.completion && (
                                            <span style={{
                                                padding: "2px 8px",
                                                borderRadius: "12px",
                                                fontSize: "11px",
                                                fontWeight: "700",
                                                background: "rgba(99, 102, 241, 0.15)",
                                                color: "#a5b4fc",
                                                border: "1px solid rgba(99, 102, 241, 0.3)"
                                            }}>
                                                Profile: {selectedStudentForView.completion.percentage}% Complete
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedStudentForView(null)}
                                style={{
                                    background: "rgba(255, 255, 255, 0.05)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    borderRadius: "10px",
                                    width: "34px",
                                    height: "34px",
                                    cursor: "pointer",
                                    color: "#94a3b8",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.15s ease"
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body: Information Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "22px" }}>
                            {/* Personal Information */}
                            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "12px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", marginBottom: "14px" }}>
                                    <User size={18} color="#60a5fa" />
                                    <h4 style={{ margin: 0, fontSize: "14px", color: "#60a5fa", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Personal Information
                                    </h4>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Full Name</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudentForView.fullName || selectedStudentForView.name || "Not Provided"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudentForView.email || "Not Provided"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Phone</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudentForView.phone || "Not Provided"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Gender</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudentForView.gender || "Not Specified"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Address / Location</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudentForView.location || "Not Provided"}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Academic Information */}
                            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "12px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", marginBottom: "14px" }}>
                                    <GraduationCap size={18} color="#34d399" />
                                    <h4 style={{ margin: 0, fontSize: "14px", color: "#34d399", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Academic Record
                                    </h4>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Roll Number</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudentForView.rollNo || "Not Assigned"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Degree Program</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudentForView.degree || "MCA"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Department</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudentForView.department || "Computer Applications"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>College / University</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudentForView.college || "Not Provided"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Semester / Year</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudentForView.semester || "Not Provided"}</strong>
                                    </div>
                                    <div style={{ display: "flex", gap: "24px", paddingTop: "4px" }}>
                                        <div>
                                            <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>CGPA</span>
                                            <strong style={{ fontSize: "14px", color: "#f97316", fontWeight: "800" }}>
                                                {selectedStudentForView.cgpa && selectedStudentForView.cgpa !== "0" ? `${selectedStudentForView.cgpa} CGPA` : "Pending"}
                                            </strong>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Backlogs</span>
                                            <strong style={{ fontSize: "14px", color: selectedStudentForView.backlogs === "0" || selectedStudentForView.backlogs === 0 ? "#10b981" : "#ef4444", fontWeight: "700" }}>
                                                {selectedStudentForView.backlogs !== undefined ? selectedStudentForView.backlogs : "0"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skills & Technologies */}
                        <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "18px", marginBottom: "22px" }}>
                            <div style={{ paddingBottom: "12px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", marginBottom: "14px" }}>
                                <h4 style={{ margin: 0, fontSize: "14px", color: "#f59e0b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    Skills & Verified Technologies
                                </h4>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {Array.isArray(selectedStudentForView.skills) && selectedStudentForView.skills.length > 0 ? (
                                    selectedStudentForView.skills.map((skill, idx) => (
                                        <span 
                                            key={idx}
                                            style={{
                                                padding: "6px 14px",
                                                borderRadius: "20px",
                                                background: "rgba(59, 130, 246, 0.15)",
                                                color: "#93c5fd",
                                                border: "1px solid rgba(59, 130, 246, 0.3)",
                                                fontSize: "12px",
                                                fontWeight: "600"
                                            }}
                                        >
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{ color: "#64748b", fontSize: "13px" }}>No technical skills added yet.</span>
                                )}
                            </div>
                        </div>

                        {/* Resume Attachment */}
                        {selectedStudentForView.resumeData && (
                            <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "14px", padding: "16px", marginBottom: "22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <strong style={{ fontSize: "13px", color: "#34d399", display: "block" }}>📄 Attached Resume File</strong>
                                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>{selectedStudentForView.resumeName || "Student_Resume.pdf"}</span>
                                </div>
                                <a
                                    href={selectedStudentForView.resumeData}
                                    download={selectedStudentForView.resumeName || "Student_Resume.pdf"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        background: "#10b981",
                                        color: "#ffffff",
                                        textDecoration: "none",
                                        padding: "8px 16px",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: "600"
                                    }}
                                >
                                    <Download size={14} /> Download Resume
                                </a>
                            </div>
                        )}

                        {/* Modal Footer */}
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "18px" }}>
                            <button
                                onClick={() => setSelectedStudentForView(null)}
                                style={{
                                    padding: "9px 24px",
                                    borderRadius: "8px",
                                    border: "none",
                                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                    color: "#ffffff",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDrives;
