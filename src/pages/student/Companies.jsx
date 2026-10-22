import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PlusCircle, Trash2, Rocket, CheckCircle2, Eye, Edit, X } from "lucide-react";
import { getStoredCompanies, saveCompanies, addCompany, updateCompany, deleteCompany } from "../../utils/companiesStore";
import { getStoredDrives, addDrive, updateDrive } from "../../utils/drivesStore";
import API from "../../services/api";
import "./Companies.css";

function Companies() {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = location.pathname.startsWith("/admin");

    const [companies, setCompanies] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [industryFilter, setIndustryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [showAddModal, setShowAddModal] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [selectedCompanyForView, setSelectedCompanyForView] = useState(null);
    const [editingCompany, setEditingCompany] = useState(null);
    const [editForm, setEditForm] = useState({
        name: "",
        industry: "Information Technology",
        location: "Bangalore",
        status: "Active",
        role: "",
        packageLpa: "",
        minCgpa: "6.5",
        maxBacklogs: "0",
        driveDate: "2026-09-20",
        deadline: "2026-09-15",
        aboutCompany: "",
        jobDescription: "",
        requiredSkills: "",
        selectionProcess: ""
    });

    // Form state for adding partner company with complete placement drive details
    const [companyForm, setCompanyForm] = useState({
        name: "",
        industry: "Information Technology",
        location: "Bangalore",
        status: "Active",
        role: "",
        packageLpa: "",
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
        loadAllCompanies();
    }, []);

    const processMergedCompanies = (baseCompanies) => {
        const drives = getStoredDrives();
        const map = new Map();

        // 1. Direct companies
        baseCompanies.forEach(c => {
            const key = (c.name || c.company_name || "").toLowerCase().trim();
            if (key) {
                map.set(key, {
                    ...c,
                    name: c.name || c.company_name,
                    rolesCount: 0
                });
            }
        });

        // 2. Drives companies
        drives.forEach(d => {
            const key = (d.company || "").toLowerCase().trim();
            if (!key) return;
            if (map.has(key)) {
                const existing = map.get(key);
                existing.rolesCount = (existing.rolesCount || 0) + 1;
                existing.industry = d.industry || existing.industry;
                existing.location = d.location || existing.location;
                existing.hasDrive = true;
                existing.driveId = d.id;
            } else {
                map.set(key, {
                    id: "comp_drive_" + d.id,
                    name: d.company,
                    logoLetter: d.logoLetter || d.company.charAt(0).toUpperCase(),
                    industry: d.industry || "Information Technology",
                    location: d.location || "India",
                    status: d.status || "Active",
                    rolesCount: 1,
                    isFromDrive: true,
                    hasDrive: true,
                    driveId: d.id,
                    role: d.role,
                    packageLpa: d.packageLpa,
                    minCgpa: d.minCgpa,
                    maxBacklogs: d.maxBacklogs,
                    driveDate: d.driveDate,
                    deadline: d.deadline,
                    aboutCompany: d.aboutCompany,
                    jobDescription: d.jobDescription,
                    requiredSkills: d.requiredSkills,
                    selectionProcess: d.selectionProcess
                });
            }
        });

        setCompanies(Array.from(map.values()));
    };

    const loadAllCompanies = () => {
        const localComps = getStoredCompanies();
        if (localComps && localComps.length > 0) {
            processMergedCompanies(localComps);
        }

        // Fetch source of truth from MySQL Database
        API.get("/companies")
            .then(res => {
                if (res.data && Array.isArray(res.data.companies)) {
                    saveCompanies(res.data.companies);
                    processMergedCompanies(res.data.companies);
                }
            })
            .catch(err => {
                console.warn("Could not fetch companies from MySQL backend, using local store:", err);
            });
    };

    const handleAddCompanySubmit = (e, andMoveToDrives = false) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!companyForm.name.trim()) {
            alert("Please enter a company name.");
            return;
        }

        // Add to partner companies directory
        addCompany({
            name: companyForm.name.trim(),
            industry: companyForm.industry,
            location: companyForm.location,
            status: companyForm.status,
            role: companyForm.role || "Software Engineer",
            packageLpa: companyForm.packageLpa || 10,
            minCgpa: companyForm.minCgpa || 6.5,
            maxBacklogs: companyForm.maxBacklogs || 0,
            driveDate: companyForm.driveDate || "2026-09-20",
            deadline: companyForm.deadline || "2026-09-15",
            aboutCompany: companyForm.aboutCompany || "",
            jobDescription: companyForm.jobDescription || "",
            requiredSkills: companyForm.requiredSkills || "",
            selectionProcess: companyForm.selectionProcess || ""
        });

        // Persist directly to MySQL Database
        API.post("/companies", {
            name: companyForm.name.trim(),
            industry: companyForm.industry,
            location: companyForm.location,
            status: companyForm.status,
            role: companyForm.role || "Software Engineer",
            packageLpa: companyForm.packageLpa || 10,
            minCgpa: companyForm.minCgpa || 6.5,
            maxBacklogs: companyForm.maxBacklogs || 0,
            driveDate: companyForm.driveDate || "2026-09-20",
            deadline: companyForm.deadline || "2026-09-15",
            aboutCompany: companyForm.aboutCompany || "",
            jobDescription: companyForm.jobDescription || "",
            requiredSkills: companyForm.requiredSkills || "",
            selectionProcess: companyForm.selectionProcess || "",
            isInDrives: andMoveToDrives
        }).then(() => {
            loadAllCompanies();
        }).catch(err => {
            console.warn("Could not sync added company to MySQL backend:", err);
        });

        if (andMoveToDrives) {
            // Only if admin explicitly wants to move to Placement Drives
            addDrive({
                company: companyForm.name.trim(),
                industry: companyForm.industry,
                role: companyForm.role || "Software Engineer",
                packageLpa: parseFloat(companyForm.packageLpa) || 10,
                location: companyForm.location || "Bangalore",
                status: companyForm.status || "Active",
                minCgpa: parseFloat(companyForm.minCgpa) || 6.5,
                maxBacklogs: parseInt(companyForm.maxBacklogs, 10) || 0,
                driveDate: companyForm.driveDate || "2026-09-20",
                deadline: companyForm.deadline || "2026-09-15",
                aboutCompany: companyForm.aboutCompany || "",
                jobDescription: companyForm.jobDescription || "",
                requiredSkills: companyForm.requiredSkills || "",
                selectionProcess: companyForm.selectionProcess || ""
            });
        }

        loadAllCompanies();
        setShowAddModal(false);
        if (andMoveToDrives) {
            setToastMessage(`🎉 "${companyForm.name}" added to Recruiters and moved to Placement Drives! (Synced with MySQL)`);
        } else {
            setToastMessage(`🏢 "${companyForm.name}" saved to Partner Companies directory! (Synced with MySQL)`);
        }
        setTimeout(() => setToastMessage(""), 5000);

        setCompanyForm({
            name: "",
            industry: "Information Technology",
            location: "Bangalore",
            status: "Active",
            role: "",
            packageLpa: "",
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

    // Move an existing partner company to Placement Drives with 1 click
    const handleMoveToDrives = (company) => {
        const drives = getStoredDrives();
        const alreadyInDrive = drives.some(d => d.company.toLowerCase().trim() === company.name.toLowerCase().trim());

        if (alreadyInDrive) {
            setToastMessage(`ℹ️ "${company.name}" is already active in Placement Drives! Redirecting...`);
            setTimeout(() => {
                navigate(isAdmin ? "/admin/drives" : "/student/drives");
            }, 1000);
            return;
        }

        // Add to Placement Drives
        addDrive({
            company: company.name,
            industry: company.industry || "Information Technology",
            role: company.role || "Software Engineer",
            packageLpa: parseFloat(company.packageLpa) || 10,
            location: company.location || "Bangalore",
            status: company.status || "Active",
            minCgpa: parseFloat(company.minCgpa) || 6.5,
            maxBacklogs: parseInt(company.maxBacklogs, 10) || 0,
            driveDate: company.driveDate || "2026-09-20",
            deadline: company.deadline || "2026-09-15",
            aboutCompany: company.aboutCompany || "",
            jobDescription: company.jobDescription || "",
            requiredSkills: company.requiredSkills || "",
            selectionProcess: company.selectionProcess || ""
        });

        loadAllCompanies();
        setToastMessage(`🚀 "${company.name}" successfully moved to Placement Drives!`);
        setTimeout(() => setToastMessage(""), 4500);
    };

    const handleDelete = (company) => {
        if (window.confirm(`Are you sure you want to remove "${company.name}" from partner companies? This will permanently delete it from the MySQL database.`)) {
            deleteCompany(company.id);
            loadAllCompanies();
            setToastMessage(`Removed company "${company.name}" from MySQL.`);
            setTimeout(() => setToastMessage(""), 4000);

            // Delete permanently from MySQL Database
            API.delete(`/companies/${company.id}`).catch(err => {
                console.warn("Could not delete company from MySQL backend:", err);
            });
        }
    };

    // Open View Details Modal
    const handleViewCompanyModal = (company) => {
        setSelectedCompanyForView(company);
    };

    // Open Edit Modal with company's current details prefilled
    const handleOpenEditModal = (company) => {
        setEditingCompany(company);
        setEditForm({
            name: company.name || "",
            industry: company.industry || "Information Technology",
            location: company.location || "Bangalore",
            status: company.status || "Active",
            role: company.role || "Software Engineer",
            packageLpa: company.packageLpa !== undefined ? String(company.packageLpa) : "",
            minCgpa: company.minCgpa !== undefined ? String(company.minCgpa) : "6.5",
            maxBacklogs: company.maxBacklogs !== undefined ? String(company.maxBacklogs) : "0",
            driveDate: company.driveDate || "2026-09-20",
            deadline: company.deadline || "2026-09-15",
            aboutCompany: company.aboutCompany || "",
            jobDescription: company.jobDescription || "",
            requiredSkills: company.requiredSkills || "",
            selectionProcess: company.selectionProcess || ""
        });
    };

    // Save Edit changes to both companiesStore and linked drivesStore
    const handleSaveEditSubmit = (e) => {
        e.preventDefault();
        if (!editForm.name.trim()) {
            alert("Please enter a company name.");
            return;
        }

        const updatedData = {
            name: editForm.name.trim(),
            industry: editForm.industry,
            location: editForm.location,
            status: editForm.status,
            role: editForm.role || "Software Engineer",
            packageLpa: editForm.packageLpa ? parseFloat(editForm.packageLpa) : 10,
            minCgpa: editForm.minCgpa ? parseFloat(editForm.minCgpa) : 6.5,
            maxBacklogs: editForm.maxBacklogs ? parseInt(editForm.maxBacklogs, 10) : 0,
            driveDate: editForm.driveDate || "2026-09-20",
            deadline: editForm.deadline || "2026-09-15",
            aboutCompany: editForm.aboutCompany || "",
            jobDescription: editForm.jobDescription || "",
            requiredSkills: editForm.requiredSkills || "",
            selectionProcess: editForm.selectionProcess || ""
        };

        // 1. Update in partner companies store
        if (editingCompany.id && !editingCompany.id.startsWith("comp_drive_")) {
            updateCompany(editingCompany.id, updatedData);
            API.put(`/companies/${editingCompany.id}`, updatedData).catch(err => {
                console.warn("Could not sync updated company to MySQL backend:", err);
            });
        } else {
            // Also store as partner company if it was only in drives
            addCompany(updatedData);
            API.post("/companies", updatedData).catch(err => {
                console.warn("Could not sync new company to MySQL backend:", err);
            });
        }

        // 2. Synchronize with any corresponding drive in Placement Drives
        if (editingCompany.driveId || editingCompany.hasDrive) {
            const drives = getStoredDrives();
            const targetDrive = drives.find(d => 
                (editingCompany.driveId && d.id === editingCompany.driveId) ||
                (d.company && d.company.toLowerCase().trim() === editingCompany.name.toLowerCase().trim())
            );
            if (targetDrive) {
                updateDrive(targetDrive.id, {
                    company: updatedData.name,
                    industry: updatedData.industry,
                    role: updatedData.role,
                    packageLpa: updatedData.packageLpa,
                    location: updatedData.location,
                    status: updatedData.status,
                    minCgpa: updatedData.minCgpa,
                    maxBacklogs: updatedData.maxBacklogs,
                    driveDate: updatedData.driveDate,
                    deadline: updatedData.deadline,
                    aboutCompany: updatedData.aboutCompany,
                    jobDescription: updatedData.jobDescription,
                    requiredSkills: updatedData.requiredSkills,
                    selectionProcess: updatedData.selectionProcess
                });
            }
        }

        loadAllCompanies();
        setEditingCompany(null);
        if (selectedCompanyForView && selectedCompanyForView.name === editingCompany.name) {
            setSelectedCompanyForView({ ...selectedCompanyForView, ...updatedData });
        }
        setToastMessage(`✅ Successfully updated "${updatedData.name}" details!`);
        setTimeout(() => setToastMessage(""), 4500);
    };

    // Filter companies
    const filteredCompanies = companies.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.industry.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesIndustry = !industryFilter || c.industry.toLowerCase().includes(industryFilter.toLowerCase());
        
        let matchesStatus = true;
        if (statusFilter === "Active") {
            matchesStatus = ["active", "hiring"].includes((c.status || "").toLowerCase());
        } else if (statusFilter === "Upcoming") {
            matchesStatus = (c.status || "").toLowerCase() === "upcoming";
        } else if (statusFilter === "Not Active") {
            matchesStatus = ["not active", "inactive", "closed"].includes((c.status || "").toLowerCase());
        }
        return matchesSearch && matchesIndustry && matchesStatus;
    });

    // Counts for status
    const totalCount = companies.length;
    const activeCount = companies.filter(c => ["active", "hiring"].includes((c.status || "").toLowerCase())).length;
    const upcomingCount = companies.filter(c => (c.status || "").toLowerCase() === "upcoming").length;
    const notActiveCount = companies.filter(c => ["not active", "inactive", "closed"].includes((c.status || "").toLowerCase())).length;

    return (
        <div className="companies-page">
            {/* Page Header */}
            <div className="companies-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h1>{isAdmin ? "🏢 Partner Companies Directory" : "Connected Companies"}</h1>
                    <p>
                        {isAdmin 
                            ? "Manage verified recruiting partner companies participating in campus placements."
                            : "Explore organizations connected with our campus, see active hiring, upcoming drives, and past partners."}
                    </p>
                </div>

                {isAdmin && (
                    <button 
                        onClick={() => setShowAddModal(true)}
                        style={{
                            background: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px 18px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        <PlusCircle size={17} />
                        <span>Add Partner Company</span>
                    </button>
                )}
            </div>

            {/* Notification alert */}
            {toastMessage && (
                <div style={{
                    padding: "12px 18px",
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
                    <span>{toastMessage}</span>
                    <button onClick={() => setToastMessage("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#065f46" }}>✕</button>
                </div>
            )}

            {/* Overview Metric Bar */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                marginBottom: "24px"
            }}>
                <div 
                    onClick={() => setStatusFilter("All")}
                    style={{
                        background: "#ffffff",
                        padding: "16px 20px",
                        borderRadius: "14px",
                        border: statusFilter === "All" ? "2px solid #173b32" : "1px solid #e5ebe8",
                        boxShadow: "0 4px 14px rgba(20, 55, 47, 0.05)",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                    }}
                >
                    <span style={{ fontSize: "12px", color: "#7a8984", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Connected Companies</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
                        <h2 style={{ margin: 0, fontSize: "26px", color: "#173b32", fontWeight: "800" }}>{totalCount}</h2>
                        <small style={{ color: "#7a8984", fontSize: "12px" }}>Total Organizations</small>
                    </div>
                </div>

                <div 
                    onClick={() => setStatusFilter("Active")}
                    style={{
                        background: "#ffffff",
                        padding: "16px 20px",
                        borderRadius: "14px",
                        border: statusFilter === "Active" ? "2px solid #059669" : "1px solid #e5ebe8",
                        boxShadow: "0 4px 14px rgba(20, 55, 47, 0.05)",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                    }}
                >
                    <span style={{ fontSize: "12px", color: "#059669", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>🟢 Active for Hiring</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
                        <h2 style={{ margin: 0, fontSize: "26px", color: "#059669", fontWeight: "800" }}>{activeCount}</h2>
                        <small style={{ color: "#7a8984", fontSize: "12px" }}>Open Positions</small>
                    </div>
                </div>

                <div 
                    onClick={() => setStatusFilter("Upcoming")}
                    style={{
                        background: "#ffffff",
                        padding: "16px 20px",
                        borderRadius: "14px",
                        border: statusFilter === "Upcoming" ? "2px solid #2563eb" : "1px solid #e5ebe8",
                        boxShadow: "0 4px 14px rgba(20, 55, 47, 0.05)",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                    }}
                >
                    <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>🔵 Upcoming Drives</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
                        <h2 style={{ margin: 0, fontSize: "26px", color: "#2563eb", fontWeight: "800" }}>{upcomingCount}</h2>
                        <small style={{ color: "#7a8984", fontSize: "12px" }}>Scheduled Soon</small>
                    </div>
                </div>

                <div 
                    onClick={() => setStatusFilter("Not Active")}
                    style={{
                        background: "#ffffff",
                        padding: "16px 20px",
                        borderRadius: "14px",
                        border: statusFilter === "Not Active" ? "2px solid #64748b" : "1px solid #e5ebe8",
                        boxShadow: "0 4px 14px rgba(20, 55, 47, 0.05)",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                    }}
                >
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>⚪ Not Active</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
                        <h2 style={{ margin: 0, fontSize: "26px", color: "#64748b", fontWeight: "800" }}>{notActiveCount}</h2>
                        <small style={{ color: "#7a8984", fontSize: "12px" }}>Inactive / Past</small>
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="companies-tools" style={{ flexWrap: "wrap" }}>
                <div className="search-box">
                    <span>🔍</span>
                    <input
                        type="text"
                        placeholder="Search companies by name or industry..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <select 
                    className="industry-filter"
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                >
                    <option value="">All Industries</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Healthcare">Healthcare</option>
                </select>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    {[
                        { label: "All", value: "All" },
                        { label: "Active Hiring", value: "Active" },
                        { label: "Upcoming", value: "Upcoming" },
                        { label: "Not Active", value: "Not Active" }
                    ].map(st => (
                        <button
                            key={st.value}
                            type="button"
                            onClick={() => setStatusFilter(st.value)}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "20px",
                                border: statusFilter === st.value ? "1px solid #173b32" : "1px solid #e0e8e4",
                                background: statusFilter === st.value ? "#173b32" : "#ffffff",
                                color: statusFilter === st.value ? "#ffffff" : "#4a5a54",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                            }}
                        >
                            {st.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Companies Grid */}
            <div className="companies-grid">
                {filteredCompanies.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", gridColumn: "1 / -1", color: "#64748b" }}>
                        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏢</div>
                        <h3 style={{ fontSize: "18px", color: "#1e293b", marginBottom: "6px" }}>
                            {companies.length === 0 ? "No Partner Companies Added Yet" : "No Companies Match Your Search / Filter"}
                        </h3>
                        <p style={{ maxWidth: "450px", margin: "0 auto 20px auto", fontSize: "14px" }}>
                            {companies.length === 0 
                                ? "Companies registered by the placement office will appear here with real-time hiring status." 
                                : "Try switching status filter to 'All' or clearing your search."}
                        </p>
                        {companies.length === 0 && isAdmin && (
                            <button 
                                onClick={() => setShowAddModal(true)}
                                style={{
                                    background: "#2563eb",
                                    color: "#fff",
                                    border: "none",
                                    padding: "10px 20px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "14px"
                                }}
                            >
                                + Add First Partner Company
                            </button>
                        )}
                    </div>
                ) : (
                    filteredCompanies.map((company, index) => {
                        const statusLower = (company.status || "active").toLowerCase();
                        const isUpcoming = statusLower === "upcoming";
                        const isNotActive = ["not active", "inactive", "closed"].includes(statusLower);
                        const statusClass = isUpcoming ? "upcoming" : isNotActive ? "not-active" : "active";
                        const statusLabel = isUpcoming ? "Upcoming" : isNotActive ? "Not Active" : "Active";

                        return (
                            <div className="company-card" key={company.id || index}>
                                <div className="company-card-top">
                                    <div className="company-logo-large">
                                        {company.logoLetter || company.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <span className={`company-status ${statusClass}`}>
                                            {statusLabel}
                                        </span>
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDelete(company)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "#94a3b8",
                                                    cursor: "pointer",
                                                    padding: "4px"
                                                }}
                                                title="Delete Company"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                            <h2>{company.name}</h2>
                            <p className="company-industry">{company.industry}</p>

                            <div className="company-details">
                                <span>📍 {company.location}</span>
                                <span>💼 {company.rolesCount || 0} {company.rolesCount === 1 ? "Open Role" : "Open Roles"}</span>
                                {company.packageLpa && (
                                    <span>💰 ₹{company.packageLpa} LPA CTC</span>
                                )}
                            </div>

                            {isAdmin ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            type="button"
                                            onClick={() => handleViewCompanyModal(company)}
                                            style={{
                                                flex: 1,
                                                padding: "8px 12px",
                                                borderRadius: "8px",
                                                border: "1px solid #cbd5e1",
                                                background: "#ffffff",
                                                color: "#1e293b",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "5px",
                                                transition: "all 0.15s ease"
                                            }}
                                            title="View full details of company and job profile"
                                        >
                                            <Eye size={14} color="#2563eb" />
                                            <span>View Details</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenEditModal(company)}
                                            style={{
                                                flex: 1,
                                                padding: "8px 12px",
                                                borderRadius: "8px",
                                                border: "1px solid #cbd5e1",
                                                background: "#f8fafc",
                                                color: "#0f172a",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "5px",
                                                transition: "all 0.15s ease"
                                            }}
                                            title="Edit company details, CTC, criteria, or role"
                                        >
                                            <Edit size={14} color="#059669" />
                                            <span>Edit Details</span>
                                        </button>
                                    </div>

                                    <button 
                                        className="company-details-btn" 
                                        onClick={() => handleMoveToDrives(company)}
                                        style={{
                                            margin: 0,
                                            width: "100%",
                                            background: company.hasDrive ? "#059669" : "#2563eb",
                                            borderColor: company.hasDrive ? "#059669" : "#2563eb",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "6px"
                                        }}
                                        title={company.hasDrive ? "Already in Placement Drives (Click to view)" : "Move to Placement Drives"}
                                    >
                                        {company.hasDrive ? (
                                            <>
                                                <CheckCircle2 size={14} />
                                                <span>In Placement Drives ✓</span>
                                            </>
                                        ) : (
                                            <>
                                                <Rocket size={14} />
                                                <span>Move to Drives →</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                                    <button 
                                        type="button"
                                        className="company-details-btn" 
                                        onClick={() => handleViewCompanyModal(company)}
                                        style={{
                                            flex: 1,
                                            margin: 0,
                                            background: "#f1f5f9",
                                            border: "1px solid #cbd5e1",
                                            color: "#1e293b",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "5px"
                                        }}
                                        title="View company profile and hiring details"
                                    >
                                        <Eye size={14} color="#2563eb" />
                                        <span>Company Details</span>
                                    </button>
                                    {company.hasDrive ? (
                                        <button 
                                            type="button"
                                            className="company-details-btn" 
                                            onClick={() => navigate("/student/drives")}
                                            style={{
                                                flex: 1,
                                                margin: 0,
                                                background: "#173b32",
                                                borderColor: "#173b32",
                                                color: "#ffffff",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "5px"
                                            }}
                                            title="View active drive and apply"
                                        >
                                            <Rocket size={14} />
                                            <span>View Drive →</span>
                                        </button>
                                    ) : (
                                        <button 
                                            type="button"
                                            className="company-details-btn" 
                                            disabled
                                            style={{
                                                flex: 1,
                                                margin: 0,
                                                background: "#f8fafc",
                                                border: "1px solid #e2e8f0",
                                                color: "#94a3b8",
                                                cursor: "default"
                                            }}
                                        >
                                            No Active Drive
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        );
                    })
                )}
            </div>

            {/* ADD PARTNER COMPANY MODAL (ADMIN ONLY) */}
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
                        maxWidth: "640px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        padding: "28px",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                        color: "#1e293b"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div>
                                <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0f172a" }}>Add Partner Company & Launch Drive</h2>
                                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Register organization details & auto-link to placement drives</p>
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

                        <form onSubmit={handleAddCompanySubmit}>
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Company Name *</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="e.g. Google, Microsoft, Tech Mahindra, Cisco"
                                    value={companyForm.name}
                                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Industry Domain</label>
                                    <select 
                                        value={companyForm.industry}
                                        onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    >
                                        <option value="Information Technology">Information Technology</option>
                                        <option value="Cloud & AI">Cloud & AI</option>
                                        <option value="Consulting & Analytics">Consulting & Analytics</option>
                                        <option value="Financial Technology">Financial Technology</option>
                                        <option value="Healthcare & BioTech">Healthcare & BioTech</option>
                                        <option value="Core Engineering">Core Engineering</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Primary Location</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Bangalore / Kochi / Remote"
                                        value={companyForm.location}
                                        onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Hiring Status</label>
                                    <select 
                                        value={companyForm.status}
                                        onChange={(e) => setCompanyForm({ ...companyForm, status: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    >
                                        <option value="Active">Active (Hiring Now)</option>
                                        <option value="Upcoming">Upcoming (Scheduled)</option>
                                        <option value="Not Active">Not Active (Closed / Inactive)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Job Role / Position *</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. Software Engineer / SDE-1"
                                        value={companyForm.role}
                                        onChange={(e) => setCompanyForm({ ...companyForm, role: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>CTC Package (₹ in LPA) *</label>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        required
                                        placeholder="e.g. 12.5"
                                        value={companyForm.packageLpa}
                                        onChange={(e) => setCompanyForm({ ...companyForm, packageLpa: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Min CGPA Cutoff *</label>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        required
                                        value={companyForm.minCgpa}
                                        onChange={(e) => setCompanyForm({ ...companyForm, minCgpa: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Max Allowed Active Backlogs *</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        max="10"
                                        required
                                        value={companyForm.maxBacklogs}
                                        onChange={(e) => setCompanyForm({ ...companyForm, maxBacklogs: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Assessment / Drive Date</label>
                                    <input 
                                        type="date"
                                        required
                                        value={companyForm.driveDate}
                                        onChange={(e) => setCompanyForm({ ...companyForm, driveDate: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Application Deadline</label>
                                <input 
                                    type="date"
                                    required
                                    value={companyForm.deadline}
                                    onChange={(e) => setCompanyForm({ ...companyForm, deadline: e.target.value })}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>About Company (Optional)</label>
                                <textarea 
                                    rows="2"
                                    placeholder="Brief background about company domain and culture..."
                                    value={companyForm.aboutCompany}
                                    onChange={(e) => setCompanyForm({ ...companyForm, aboutCompany: e.target.value })}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", resize: "vertical", boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Job Description / Key Responsibilities (Optional)</label>
                                <textarea 
                                    rows="2"
                                    placeholder="Key responsibilities, expectations, and role description..."
                                    value={companyForm.jobDescription}
                                    onChange={(e) => setCompanyForm({ ...companyForm, jobDescription: e.target.value })}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", resize: "vertical", boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Required Skills (Optional)</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Java, Python, SQL, React"
                                        value={companyForm.requiredSkills}
                                        onChange={(e) => setCompanyForm({ ...companyForm, requiredSkills: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Selection Process (Optional)</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Assessment -> Tech -> HR"
                                        value={companyForm.selectionProcess}
                                        onChange={(e) => setCompanyForm({ ...companyForm, selectionProcess: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "16px", flexWrap: "wrap" }}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowAddModal(false)}
                                    style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#334155", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={(e) => handleAddCompanySubmit(e, false)}
                                    style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #059669", background: "#ecfdf5", color: "#059669", cursor: "pointer", fontWeight: 700, fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                    title="Save to Recruiters & Companies only (will not show in Placement Drives until you choose to move it)"
                                >
                                    <span>💾 Save to Companies Only</span>
                                </button>
                                <button 
                                    type="submit" 
                                    onClick={(e) => handleAddCompanySubmit(e, true)}
                                    style={{ padding: "10px 22px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                    title="Save company and immediately move/publish to Placement Drives"
                                >
                                    <span>🚀 Save & Move to Drives</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================================================
                VIEW COMPANY DETAILS MODAL (ADMIN ONLY)
            ========================================================================= */}
            {selectedCompanyForView && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(5px)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <div style={{
                        background: "#ffffff",
                        borderRadius: "20px",
                        width: "100%",
                        maxWidth: "680px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        padding: "30px",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        color: "#1e293b"
                    }}>
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px", paddingBottom: "18px", borderBottom: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                <div style={{
                                    width: "56px",
                                    height: "56px",
                                    borderRadius: "16px",
                                    background: "linear-gradient(135deg, #173b32, #23594c)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "24px",
                                    fontWeight: "800",
                                    color: "#ffffff",
                                    boxShadow: "0 4px 14px rgba(23, 59, 50, 0.2)"
                                }}>
                                    {selectedCompanyForView.logoLetter || selectedCompanyForView.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "#0f172a", fontWeight: "800" }}>
                                        {selectedCompanyForView.name}
                                    </h2>
                                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                                        <span style={{ fontSize: "13px", color: "#64748b" }}>
                                            Industry: <strong style={{ color: "#0f172a" }}>{selectedCompanyForView.industry || "Information Technology"}</strong>
                                        </span>
                                        <span style={{
                                            padding: "2px 10px",
                                            borderRadius: "12px",
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            textTransform: "uppercase",
                                            background: (selectedCompanyForView.status || "").toLowerCase() === "active" ? "#dcfce7" : (selectedCompanyForView.status || "").toLowerCase() === "upcoming" ? "#dbeafe" : "#f1f5f9",
                                            color: (selectedCompanyForView.status || "").toLowerCase() === "active" ? "#15803d" : (selectedCompanyForView.status || "").toLowerCase() === "upcoming" ? "#1d4ed8" : "#475569"
                                        }}>
                                            {selectedCompanyForView.status || "Active"}
                                        </span>
                                        {selectedCompanyForView.hasDrive && (
                                            <span style={{
                                                padding: "2px 10px",
                                                borderRadius: "12px",
                                                fontSize: "11px",
                                                fontWeight: "700",
                                                background: "#ecfdf5",
                                                color: "#059669",
                                                border: "1px solid #a7f3d0"
                                            }}>
                                                In Placement Drives ✓
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedCompanyForView(null)}
                                style={{
                                    background: "#f1f5f9",
                                    border: "none",
                                    borderRadius: "10px",
                                    width: "36px",
                                    height: "36px",
                                    cursor: "pointer",
                                    color: "#64748b",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "bold"
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Specifications Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                            <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Job Role</span>
                                <h4 style={{ margin: "4px 0 0 0", fontSize: "15px", color: "#0f172a" }}>{selectedCompanyForView.role || "Software Engineer"}</h4>
                            </div>

                            <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>CTC Package (LPA)</span>
                                <h4 style={{ margin: "4px 0 0 0", fontSize: "15px", color: "#059669", fontWeight: "800" }}>₹{selectedCompanyForView.packageLpa || 10} LPA</h4>
                            </div>

                            <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Job Location</span>
                                <h4 style={{ margin: "4px 0 0 0", fontSize: "15px", color: "#0f172a" }}>📍 {selectedCompanyForView.location || "Bangalore"}</h4>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Cutoff CGPA</span>
                                    <h4 style={{ margin: "4px 0 0 0", fontSize: "15px", color: "#d97706" }}>{selectedCompanyForView.minCgpa || "6.5"} CGPA</h4>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Max Backlogs</span>
                                    <h4 style={{ margin: "4px 0 0 0", fontSize: "15px", color: selectedCompanyForView.maxBacklogs > 0 ? "#dc2626" : "#059669" }}>{selectedCompanyForView.maxBacklogs !== undefined ? selectedCompanyForView.maxBacklogs : "0"}</h4>
                                </div>
                            </div>

                            <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Drive Date</span>
                                <h4 style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#0f172a" }}>📅 {selectedCompanyForView.driveDate || "Scheduled Soon"}</h4>
                            </div>

                            <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Application Deadline</span>
                                <h4 style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#dc2626" }}>⏳ {selectedCompanyForView.deadline || "TBA"}</h4>
                            </div>
                        </div>

                        {/* About Company */}
                        {selectedCompanyForView.aboutCompany && (
                            <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
                                    About Company
                                </span>
                                <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: "1.5" }}>
                                    {selectedCompanyForView.aboutCompany}
                                </p>
                            </div>
                        )}

                        {/* Job Description */}
                        {selectedCompanyForView.jobDescription && (
                            <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
                                    Job Description & Responsibilities
                                </span>
                                <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: "1.5" }}>
                                    {selectedCompanyForView.jobDescription}
                                </p>
                            </div>
                        )}

                        {/* Required Skills Badges */}
                        {selectedCompanyForView.requiredSkills && (
                            <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px", display: "block", marginBottom: "10px" }}>
                                    Required Skills & Technologies
                                </span>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {selectedCompanyForView.requiredSkills.split(",").map((s, idx) => (
                                        <span 
                                            key={idx}
                                            style={{
                                                padding: "4px 12px",
                                                borderRadius: "16px",
                                                background: "#eff6ff",
                                                color: "#2563eb",
                                                border: "1px solid #bfdbfe",
                                                fontSize: "12px",
                                                fontWeight: "600"
                                            }}
                                        >
                                            {s.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Selection Process */}
                        {selectedCompanyForView.selectionProcess && (
                            <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
                                    Selection & Interview Process
                                </span>
                                <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: "1.5" }}>
                                    {selectedCompanyForView.selectionProcess}
                                </p>
                            </div>
                        )}

                        {/* Modal Footer Actions */}
                        <div style={{ display: "flex", justifyContent: isAdmin ? "space-between" : "flex-end", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "18px" }}>
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const comp = selectedCompanyForView;
                                        setSelectedCompanyForView(null);
                                        handleOpenEditModal(comp);
                                    }}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "9px 18px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        background: "#f8fafc",
                                        color: "#0f172a",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        cursor: "pointer"
                                    }}
                                >
                                    <Edit size={14} color="#059669" />
                                    <span>Edit Company Details</span>
                                </button>
                            )}

                            <div style={{ display: "flex", gap: "10px" }}>
                                {isAdmin && !selectedCompanyForView.hasDrive && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const comp = selectedCompanyForView;
                                            setSelectedCompanyForView(null);
                                            handleMoveToDrives(comp);
                                        }}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "9px 18px",
                                            borderRadius: "8px",
                                            border: "none",
                                            background: "#2563eb",
                                            color: "#ffffff",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            cursor: "pointer"
                                        }}
                                    >
                                        <Rocket size={14} />
                                        <span>Move to Placement Drives</span>
                                    </button>
                                )}
                                {!isAdmin && selectedCompanyForView.hasDrive && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedCompanyForView(null);
                                            navigate("/student/drives");
                                        }}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "9px 18px",
                                            borderRadius: "8px",
                                            border: "none",
                                            background: "#173b32",
                                            color: "#ffffff",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            cursor: "pointer"
                                        }}
                                    >
                                        <Rocket size={14} />
                                        <span>View Drive & Apply →</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setSelectedCompanyForView(null)}
                                    style={{
                                        padding: "9px 22px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: "#1e293b",
                                        color: "#ffffff",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        cursor: "pointer"
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================================
                EDIT COMPANY DETAILS MODAL (ADMIN ONLY)
            ========================================================================= */}
            {editingCompany && (
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
                        maxWidth: "640px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        padding: "28px",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                        color: "#1e293b"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{
                                    width: "42px",
                                    height: "42px",
                                    borderRadius: "10px",
                                    background: "#059669",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff"
                                }}>
                                    <Edit size={20} />
                                </div>
                                <div>
                                    <h2 style={{ margin: "0 0 2px 0", fontSize: "19px", color: "#0f172a" }}>Edit Company Details</h2>
                                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Update company information, CTC criteria, and drive specifications</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setEditingCompany(null)}
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

                        <form onSubmit={handleSaveEditSubmit}>
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Company Name *</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="e.g. Google, Microsoft, TCS"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Industry Domain</label>
                                    <select
                                        value={editForm.industry}
                                        onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    >
                                        <option value="Information Technology">Information Technology</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Consulting">Consulting</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="E-Commerce">E-Commerce</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Office / Job Location</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Bangalore, Hyderabad, Remote"
                                        value={editForm.location}
                                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Job Role / Designation</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Software Engineer / SDE-1"
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>CTC Package (₹ in LPA)</label>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 12.5"
                                        value={editForm.packageLpa}
                                        onChange={(e) => setEditForm({ ...editForm, packageLpa: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Status</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    >
                                        <option value="Active">Active (Hiring Now)</option>
                                        <option value="Upcoming">Upcoming (Scheduled)</option>
                                        <option value="Not Active">Not Active (Closed / Inactive)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Min CGPA Cutoff</label>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        value={editForm.minCgpa}
                                        onChange={(e) => setEditForm({ ...editForm, minCgpa: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Max Backlogs</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={editForm.maxBacklogs}
                                        onChange={(e) => setEditForm({ ...editForm, maxBacklogs: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Drive Date</label>
                                    <input 
                                        type="date"
                                        value={editForm.driveDate}
                                        onChange={(e) => setEditForm({ ...editForm, driveDate: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Application Deadline</label>
                                    <input 
                                        type="date"
                                        value={editForm.deadline}
                                        onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>About Company (Optional)</label>
                                <textarea 
                                    rows="2"
                                    placeholder="Brief background about company domain and culture..."
                                    value={editForm.aboutCompany}
                                    onChange={(e) => setEditForm({ ...editForm, aboutCompany: e.target.value })}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", resize: "vertical", boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Job Description / Key Responsibilities (Optional)</label>
                                <textarea 
                                    rows="2"
                                    placeholder="Key responsibilities, expectations, and role description..."
                                    value={editForm.jobDescription}
                                    onChange={(e) => setEditForm({ ...editForm, jobDescription: e.target.value })}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", resize: "vertical", boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Required Skills (Optional)</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Java, Python, SQL, React"
                                        value={editForm.requiredSkills}
                                        onChange={(e) => setEditForm({ ...editForm, requiredSkills: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Selection Process (Optional)</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Assessment -> Tech -> HR"
                                        value={editForm.selectionProcess}
                                        onChange={(e) => setEditForm({ ...editForm, selectionProcess: e.target.value })}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                                <button 
                                    type="button" 
                                    onClick={() => setEditingCompany(null)}
                                    style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    style={{ padding: "10px 22px", borderRadius: "8px", border: "none", background: "#059669", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                >
                                    <span>💾 Save Changes</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Companies;