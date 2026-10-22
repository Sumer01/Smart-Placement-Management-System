import { useState, useEffect } from "react";
import {
    Search,
    Download,
    CheckCircle2,
    Clock,
    Award,
    PlusCircle,
    Trash2,
    Eye,
    X,
    User,
    GraduationCap
} from "lucide-react";
import { 
    getStoredStudents, 
    addStudentToStore, 
    deleteStudentFromStore, 
    toggleVerification, 
    resetStudentsStore,
    saveStudents 
} from "../../utils/studentsStore";
import { getStudentProfile, getProfileCompletion } from "../../utils/drivesStore";
import API from "../../services/api";
import "./AdminStudents.css";

function AdminStudents() {
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [degreeFilter, setDegreeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [notification, setNotification] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Form state for adding a student
    const [studentForm, setStudentForm] = useState({
        name: "",
        rollNo: "",
        email: "",
        phone: "",
        gender: "",
        location: "",
        degree: "MCA",
        department: "Computer Applications",
        college: "",
        semester: "",
        cgpa: "",
        backlogs: "0",
        skills: ""
    });

    // Load students once when this page mounts.
    // loadStudents is defined below and is intentionally not a dependency here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
      loadStudents();
    }, []);

    const processStudentsList = (rawStudents) => {
        const enriched = rawStudents.map(student => {
            const prof = getStudentProfile({ email: student.email, name: student.name }) || {};
            const skills = (Array.isArray(student.skills) && student.skills.length > 0)
                ? student.skills
                : (Array.isArray(prof.skills) ? prof.skills : []);
            
            const merged = {
                ...student,
                fullName: student.name || prof.fullName || "Student",
                name: student.name || prof.fullName || "Student",
                email: student.email || prof.email || "",
                phone: student.phone || prof.phone || "",
                gender: student.gender || prof.gender || "",
                location: student.location || prof.location || student.address || "",
                rollNo: (student.rollNo && student.rollNo !== "Not Assigned") ? student.rollNo : (prof.rollNo || "Not Assigned"),
                degree: student.degree || prof.degree || "MCA",
                department: student.department || prof.department || "Computer Applications",
                college: student.college || prof.college || "",
                semester: student.semester || prof.semester || "",
                cgpa: (student.cgpa !== undefined && student.cgpa !== "" && student.cgpa !== 0 && student.cgpa !== "0") 
                    ? String(student.cgpa) 
                    : (prof.cgpa ? String(prof.cgpa) : "8.5"),
                backlogs: student.backlogs !== undefined 
                    ? String(student.backlogs) 
                    : (prof.backlogs !== undefined ? String(prof.backlogs) : "0"),
                skills: skills
            };

            const completion = getProfileCompletion(merged);
            return {
                ...merged,
                completion
            };
        });

        setStudents(enriched);
    };

    const loadStudents = () => {
        // First display local cache if available
        const local = getStoredStudents();
        if (local && local.length > 0) {
            processStudentsList(local);
        }

        // Fetch fresh source of truth from MySQL Database
        API.get("/admin/students")
            .then(res => {
                if (res.data && Array.isArray(res.data.students)) {
                    const dbStudents = res.data.students;
                    saveStudents(dbStudents);
                    processStudentsList(dbStudents);
                }
            })
            .catch(err => {
                console.warn("Could not fetch students from MySQL backend, using local store:", err);
                if (!local || local.length === 0) {
                    processStudentsList([]);
                }
            });
    };

    const handleToggleVerification = (id, name) => {
        const student = students.find(s => s.id === id);
        const newVerified = !student?.verified;

        // 1. Update UI state immediately
        const updatedLocal = toggleVerification(id);
        processStudentsList(updatedLocal);
        setNotification(`Student ${name} status updated: ${newVerified ? "VERIFIED ✓" : "PENDING"}`);
        setTimeout(() => setNotification(""), 4000);

        // 2. Persist to MySQL Backend
        API.put(`/admin/students/${id}/verify`, { verified: newVerified }).catch(err => {
            console.warn("Could not sync verification to MySQL:", err);
        });
    };

    const handleDeleteStudent = (id, name) => {
        if (window.confirm(`Are you sure you want to remove student "${name}"? This will permanently delete them from MySQL database and revoke their login access.`)) {
            // 1. Remove locally
            deleteStudentFromStore(id);
            const remaining = students.filter(s => s.id !== id);
            processStudentsList(remaining);
            if (selectedStudent && selectedStudent.id === id) {
                setSelectedStudent(null);
            }
            setNotification(`Removed student "${name}" from MySQL database.`);
            setTimeout(() => setNotification(""), 4000);

            // 2. Delete permanently from MySQL Database
            API.delete(`/admin/students/${id}`).catch(err => {
                console.warn("Could not delete student from MySQL backend:", err);
            });
        }
    };

    const handleClearAll = () => {
        if (window.confirm("Are you sure you want to remove ALL students? This will give you an empty student directory.")) {
            resetStudentsStore();
            setStudents([]);
            setSelectedStudent(null);
            setNotification("Student directory cleared.");
            setTimeout(() => setNotification(""), 4000);
        }
    };

    const handleAddStudentSubmit = (e) => {
        e.preventDefault();
        if (!studentForm.name || !studentForm.rollNo) {
            alert("Please provide at least a Student Name and Roll Number.");
            return;
        }

        addStudentToStore({
            ...studentForm,
            cgpa: parseFloat(studentForm.cgpa) || 0,
            backlogs: parseInt(studentForm.backlogs, 10) || 0
        });

        loadStudents();
        setShowAddModal(false);
        setNotification(`✓ Student "${studentForm.name}" added successfully!`);
        setTimeout(() => setNotification(""), 4000);

        // Reset form
        setStudentForm({
            name: "",
            rollNo: "",
            email: "",
            phone: "",
            gender: "",
            location: "",
            degree: "MCA",
            department: "Computer Applications",
            college: "",
            semester: "",
            cgpa: "",
            backlogs: "0",
            skills: ""
        });
    };

    const handleExportCSV = () => {
        const headers = "RollNo,Name,Email,Phone,Gender,Location,Degree,Department,College,Semester,CGPA,Backlogs,Completion,Status,Verified\n";
        const rows = students.map(s => 
            `"${s.rollNo}","${s.name}","${s.email}","${s.phone || 'N/A'}","${s.gender || 'N/A'}","${s.location || 'N/A'}","${s.degree}","${s.department}","${s.college || 'N/A'}","${s.semester || 'N/A'}",${s.cgpa || 0},${s.backlogs || 0},"${s.completion?.percentage || 0}%","${s.status}",${s.verified}`
        ).join("\n");

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + headers + rows);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "SPMS_Student_Management_2026.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter students
    const filteredStudents = students.filter(s => {
        const studentSkills = Array.isArray(s.skills) ? s.skills : [];
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.phone && s.phone.includes(searchQuery)) ||
            studentSkills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesDegree = degreeFilter === "All" || s.degree === degreeFilter;
        const matchesStatus = statusFilter === "All" || s.status === statusFilter;

        return matchesSearch && matchesDegree && matchesStatus;
    });

    return (
        <div className="admin-students-page">
            {/* Header */}
            <div className="admin-students-header">
                <div>
                    <h1>👥 Student Management</h1>
                    <p>Department of Computer Applications • 2024-2026 Placement Cohort</p>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button 
                        className="btn-export-csv" 
                        onClick={() => setShowAddModal(true)}
                        style={{ background: "#2563eb", color: "#fff", borderColor: "#2563eb" }}
                    >
                        <PlusCircle size={16} />
                        <span>Add Student</span>
                    </button>

                    <button className="btn-export-csv" onClick={handleExportCSV} disabled={students.length === 0}>
                        <Download size={16} />
                        <span>Export CSV</span>
                    </button>

                    {students.length > 0 && (
                        <button 
                            className="btn-export-csv" 
                            onClick={handleClearAll}
                            style={{ color: "#ef4444", borderColor: "#fecaca" }}
                            title="Clear all students"
                        >
                            <Trash2 size={15} />
                            <span>Clear All</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Notification alert */}
            {notification && (
                <div className="students-alert">
                    <CheckCircle2 size={18} color="#10b981" />
                    <span>{notification}</span>
                </div>
            )}

            {/* Search and Filters */}
            <div className="students-filter-bar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search by student name, roll no, email, skill..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-dropdowns">
                    <select value={degreeFilter} onChange={(e) => setDegreeFilter(e.target.value)}>
                        <option value="All">All Degrees</option>
                        <option value="MCA">MCA</option>
                        <option value="B.Tech">B.Tech</option>
                        <option value="B.Tech CSE">B.Tech CSE</option>
                    </select>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="All">All Statuses</option>
                        <option value="Placed">Placed</option>
                        <option value="In Process">In Process</option>
                        <option value="Unplaced">Unplaced</option>
                    </select>
                </div>
            </div>

            {/* Students Table */}
            <div className="students-table-card">
                <div className="table-header-meta">
                    <span>Showing <strong>{filteredStudents.length}</strong> Students</span>
                    <span className="info-tag">Real registered and profile-synced students</span>
                </div>

                <div className="table-wrapper">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>Roll No & Student</th>
                                <th>Program & College</th>
                                <th>Academic Performance</th>
                                <th>Profile Completion</th>
                                <th>Skills & Technologies</th>
                                <th>Placement Status</th>
                                <th>Verification</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
                                        <div style={{ fontSize: "40px", marginBottom: "10px" }}>👥</div>
                                        <h3 style={{ fontSize: "16px", color: "#1e293b", margin: "0 0 6px 0" }}>
                                            {students.length === 0 ? "No Students Registered Yet" : "No Matching Students"}
                                        </h3>
                                        <p style={{ margin: "0 0 16px 0", fontSize: "14px" }}>
                                            {students.length === 0 
                                                ? "When students register from the registration page or when you click '+ Add Student' above, they will appear here."
                                                : "Try changing your search term or filters."}
                                        </p>
                                        {students.length === 0 && (
                                            <button 
                                                onClick={() => setShowAddModal(true)}
                                                style={{
                                                    background: "#2563eb",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "8px 16px",
                                                    borderRadius: "6px",
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                + Add First Student
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map(student => {
                                    const skills = Array.isArray(student.skills) ? student.skills : [];
                                    const completionPercent = student.completion?.percentage || 0;

                                    return (
                                        <tr key={student.id}>
                                            <td>
                                                <div className="student-profile-cell">
                                                    <div className="student-avatar-badge">
                                                        {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                                                    </div>
                                                    <div>
                                                        <strong style={{ display: "block", color: "#f8fafc", fontSize: "14px", fontWeight: "700" }}>{student.name}</strong>
                                                        <small style={{ color: "#94a3b8", display: "block", fontSize: "12px", marginTop: "2px" }}>
                                                            {student.rollNo && student.rollNo !== "Not Assigned" ? student.rollNo : "Roll Pending"} • {student.email}
                                                        </small>
                                                        {(student.phone || student.gender) && (
                                                            <small style={{ color: "#60a5fa", display: "block", fontSize: "11px", marginTop: "2px", fontWeight: "500" }}>
                                                                {[student.gender, student.phone].filter(Boolean).join(" • ")}
                                                            </small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="dept-cell">
                                                    <span className="degree-badge">{student.degree || "MCA"}</span>
                                                    <small style={{ color: "#cbd5e1", fontSize: "12px", marginTop: "4px" }}>{student.department || "Computer Applications"}</small>
                                                    {student.college && (
                                                        <small style={{ color: "#94a3b8", fontSize: "11px", marginTop: "2px" }}>{student.college}</small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="academics-cell">
                                                    <span className="cgpa-highlight">
                                                        <Award size={13} style={{ marginRight: 3 }} />
                                                        {student.cgpa && student.cgpa !== "0" && student.cgpa !== 0 ? `${student.cgpa} CGPA` : "Pending CGPA"}
                                                    </span>
                                                    <small className={student.backlogs === 0 || student.backlogs === "0" ? "clean-backlog" : "has-backlog"}>
                                                        {student.backlogs === 0 || student.backlogs === "0" ? "0 Backlogs" : `${student.backlogs} Active Backlog`}
                                                    </small>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ minWidth: "125px" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                                        <span style={{ fontSize: "12px", fontWeight: "800", color: completionPercent === 100 ? "#34d399" : "#38bdf8" }}>
                                                            {completionPercent}%
                                                        </span>
                                                        <span style={{ fontSize: "11px", color: completionPercent === 100 ? "#34d399" : "#94a3b8", fontWeight: "600" }}>
                                                            {completionPercent === 100 ? "Complete" : "In Progress"}
                                                        </span>
                                                    </div>
                                                    <div style={{ width: "100%", height: "7px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "10px", overflow: "hidden" }}>
                                                        <div 
                                                            style={{ 
                                                                width: `${completionPercent}%`, 
                                                                height: "100%", 
                                                                background: completionPercent === 100 ? "#10b981" : "linear-gradient(90deg, #38bdf8, #10b981)",
                                                                borderRadius: "10px"
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="skills-cloud">
                                                    {skills.length > 0 ? (
                                                        skills.slice(0, 3).map((skill, idx) => (
                                                            <span key={idx} className="skill-chip">{skill}</span>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>No skills added</span>
                                                    )}
                                                    {skills.length > 3 && (
                                                        <span className="skill-chip more">+{skills.length - 3}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {student.status === "Placed" ? (
                                                    <div className="placed-info">
                                                        <span className="status-badge placed">Placed</span>
                                                        <strong>{student.placedCompany}</strong>
                                                        <small>₹{student.packageLpa} LPA</small>
                                                    </div>
                                                ) : student.status === "In Process" ? (
                                                    <span className="status-badge in-process">In Process</span>
                                                ) : (
                                                    <span className="status-badge unplaced">Unplaced</span>
                                                )}
                                            </td>
                                            <td>
                                                <button 
                                                    className={`btn-verify-toggle ${student.verified ? "verified" : "pending"}`}
                                                    onClick={() => handleToggleVerification(student.id, student.name)}
                                                    title="Click to toggle verification status"
                                                >
                                                    {student.verified ? (
                                                        <>
                                                            <CheckCircle2 size={14} />
                                                            <span>Verified</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock size={14} />
                                                            <span>Verify Now</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <button 
                                                        onClick={() => setSelectedStudent(student)}
                                                        title="View Complete Student Details"
                                                        style={{
                                                            background: "rgba(37, 99, 235, 0.15)",
                                                            border: "1px solid rgba(59, 130, 246, 0.35)",
                                                            color: "#60a5fa",
                                                            padding: "7px 12px",
                                                            borderRadius: "8px",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            transition: "all 0.15s ease"
                                                        }}
                                                    >
                                                        <Eye size={14} />
                                                        <span>View Details</span>
                                                    </button>

                                                    <button 
                                                        className="btn-action-icon delete"
                                                        onClick={() => handleDeleteStudent(student.id, student.name)}
                                                        title="Delete Student"
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "#ef4444",
                                                            cursor: "pointer",
                                                            padding: "6px",
                                                            display: "inline-flex",
                                                            alignItems: "center"
                                                        }}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* VIEW COMPLETE STUDENT DETAILS MODAL */}
            {selectedStudent && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(3, 7, 18, 0.75)",
                    backdropFilter: "blur(8px)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <div style={{
                        background: "#0d1b2a",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "20px",
                        width: "100%",
                        maxWidth: "820px",
                        maxHeight: "92vh",
                        overflowY: "auto",
                        padding: "30px",
                        boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
                        color: "#f8fafc"
                    }}>
                        {/* Modal Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "18px" }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.3px" }}>
                                        Student Profile Overview
                                    </h2>
                                    <span style={{
                                        fontSize: "11px",
                                        fontWeight: "700",
                                        padding: "4px 10px",
                                        borderRadius: "6px",
                                        background: selectedStudent.verified ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                                        color: selectedStudent.verified ? "#34d399" : "#fbbf24",
                                        border: `1px solid ${selectedStudent.verified ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
                                    }}>
                                        {selectedStudent.verified ? "✓ Verified Student" : "⏳ Verification Pending"}
                                    </span>
                                </div>
                                <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>
                                    Official verified student placement credentials and academic record
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedStudent(null)}
                                style={{
                                    background: "rgba(255, 255, 255, 0.06)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    borderRadius: "8px",
                                    width: "36px",
                                    height: "36px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#cbd5e1",
                                    transition: "all 0.15s"
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Top Profile Summary Card */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "20px",
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "16px",
                            padding: "22px",
                            marginBottom: "22px"
                        }}>
                            <div style={{
                                width: "70px",
                                height: "70px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "28px",
                                fontWeight: "800",
                                flexShrink: 0,
                                boxShadow: "0 0 20px rgba(16, 185, 129, 0.35)",
                                border: "2px solid rgba(255, 255, 255, 0.2)"
                            }}>
                                {selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : "S"}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#ffffff", fontWeight: "700" }}>
                                    {selectedStudent.fullName || selectedStudent.name}
                                </h3>
                                <div style={{ color: "#f59e0b", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                                    {selectedStudent.degree} • {selectedStudent.department || "Computer Applications"}
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                                    {selectedStudent.rollNo && selectedStudent.rollNo !== "Not Assigned" ? `Roll No: ${selectedStudent.rollNo}` : "Roll No: Pending"} • {selectedStudent.email}
                                </div>
                            </div>

                            {/* Profile Completion Badge */}
                            <div style={{ width: "200px", flexShrink: 0, background: "rgba(0, 0, 0, 0.2)", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                                    <span style={{ color: "#94a3b8", fontWeight: "600" }}>Completion</span>
                                    <strong style={{ color: selectedStudent.completion?.percentage === 100 ? "#34d399" : "#38bdf8" }}>
                                        {selectedStudent.completion?.percentage || 0}%
                                    </strong>
                                </div>
                                <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "10px", overflow: "hidden" }}>
                                    <div 
                                        style={{ 
                                            width: `${selectedStudent.completion?.percentage || 0}%`, 
                                            height: "100%", 
                                            background: selectedStudent.completion?.percentage === 100 ? "#10b981" : "linear-gradient(90deg, #38bdf8, #10b981)",
                                            borderRadius: "10px"
                                        }}
                                    />
                                </div>
                                <small style={{ fontSize: "11px", color: "#64748b", marginTop: "5px", display: "block" }}>
                                    {selectedStudent.completion?.percentage === 100 ? "🎉 Profile 100% Complete" : `${selectedStudent.completion?.completedCount || 0} of 10 fields filled`}
                                </small>
                            </div>
                        </div>

                        {/* Detailed Grid: Personal & Academic Information */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "22px" }}>
                            
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
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudent.fullName || selectedStudent.name || "Not Provided"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudent.email || "Not Provided"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Phone</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudent.phone || "Not Provided"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Gender</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudent.gender || "Not Specified"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Address / Location</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudent.location || "Not Provided"}</strong>
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
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudent.rollNo || "Not Assigned"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Degree Program</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudent.degree || "MCA"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Department</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudent.department || "Computer Applications"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>College / University</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudent.college || "Not Provided"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Semester / Year</span>
                                        <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{selectedStudent.semester || "Not Provided"}</strong>
                                    </div>
                                    <div style={{ display: "flex", gap: "24px", paddingTop: "4px" }}>
                                        <div>
                                            <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>CGPA</span>
                                            <strong style={{ fontSize: "14px", color: "#f97316", fontWeight: "800" }}>
                                                {selectedStudent.cgpa && selectedStudent.cgpa !== "0" ? `${selectedStudent.cgpa} CGPA` : "Pending"}
                                            </strong>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Backlogs</span>
                                            <strong style={{ fontSize: "14px", color: selectedStudent.backlogs === "0" || selectedStudent.backlogs === 0 ? "#10b981" : "#ef4444", fontWeight: "700" }}>
                                                {selectedStudent.backlogs !== undefined ? selectedStudent.backlogs : "0"}
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
                                {Array.isArray(selectedStudent.skills) && selectedStudent.skills.length > 0 ? (
                                    selectedStudent.skills.map((skill, idx) => (
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

                        {/* Modal Footer */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "18px" }}>
                            <button
                                onClick={() => handleToggleVerification(selectedStudent.id, selectedStudent.name)}
                                style={{
                                    padding: "9px 18px",
                                    borderRadius: "8px",
                                    border: selectedStudent.verified ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                                    background: selectedStudent.verified ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                    color: selectedStudent.verified ? "#f87171" : "#34d399",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease"
                                }}
                            >
                                {selectedStudent.verified ? "Revoke Verification" : "✓ Mark as Verified"}
                            </button>

                            <button
                                onClick={() => setSelectedStudent(null)}
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

            {/* ADD STUDENT MODAL */}
            {showAddModal && (
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
                        maxWidth: "520px",
                        padding: "28px",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                        color: "#1e293b"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div>
                                <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0f172a" }}>Add Student to Directory</h2>
                                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Enter real student academic details</p>
                            </div>
                            <button 
                                onClick={() => setShowAddModal(false)}
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

                        <form onSubmit={handleAddStudentSubmit}>
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Full Name *</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="e.g. John Doe"
                                    value={studentForm.name}
                                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Roll Number *</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. 24MCA001"
                                        value={studentForm.rollNo}
                                        onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Email Address</label>
                                    <input 
                                        type="email"
                                        placeholder="john@example.com"
                                        value={studentForm.email}
                                        onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Degree</label>
                                    <select 
                                        value={studentForm.degree}
                                        onChange={(e) => setStudentForm({ ...studentForm, degree: e.target.value })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    >
                                        <option value="MCA">MCA</option>
                                        <option value="B.Tech CSE">B.Tech CSE</option>
                                        <option value="B.Tech IT">B.Tech IT</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>CGPA (0 - 10)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="10"
                                        placeholder="e.g. 8.2"
                                        value={studentForm.cgpa}
                                        onChange={(e) => setStudentForm({ ...studentForm, cgpa: e.target.value })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Technical Skills (Comma separated)</label>
                                <input 
                                    type="text"
                                    placeholder="Python, React, SQL, Java"
                                    value={studentForm.skills}
                                    onChange={(e) => setStudentForm({ ...studentForm, skills: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowAddModal(false)}
                                    style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}
                                >
                                    Save Student
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminStudents;
