// Smart Placement Management System - Placement Drives & Applications Store
// 100% Clean State - Only Real Drives Added by User

import API from "../services/api";
import { addCompany } from "./companiesStore.js";
import { getStoredStudents, saveStudents } from "./studentsStore.js";

const DRIVES_STORAGE_KEY = "spms_v3_drives";
const ALL_APPLICATIONS_KEY = "spms_v3_all_applications";

// Clean initial state (no dummy drives)
export const INITIAL_DRIVES = [];

// Helper to filter out any mock drive remnants
function isRealDrive(d) {
    if (!d || !d.id) return false;
    const mockIds = ["drive_tcs", "drive_infy", "drive_wipro", "drive_amzn", "drive_accenture"];
    if (mockIds.includes(d.id)) return false;
    return true;
}

// Read drives from storage
export function getStoredDrives() {
    try {
        // Purge legacy mock drives if present
        if (localStorage.getItem("spms_placement_drives")) {
            try {
                const legacy = JSON.parse(localStorage.getItem("spms_placement_drives"));
                if (Array.isArray(legacy) && legacy.some(d => !isRealDrive(d))) {
                    localStorage.removeItem("spms_placement_drives");
                }
            } catch (e) {
                localStorage.removeItem("spms_placement_drives");
            }
        }

        const stored = localStorage.getItem(DRIVES_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed.filter(isRealDrive);
            }
        }
    } catch (e) {
        console.warn("Could not read drives from localStorage:", e);
    }
    return [];
}

// Save drives array to storage
export function saveDrives(drives) {
    try {
        const clean = (drives || []).filter(isRealDrive);
        localStorage.setItem(DRIVES_STORAGE_KEY, JSON.stringify(clean));
    } catch (e) {
        console.warn("Could not save drives to localStorage:", e);
    }
}

// Add a new drive (by TPO/Admin)
export function addDrive(driveData) {
    const drives = getStoredDrives();
    const newDrive = {
        id: "drive_" + Date.now(),
        logoLetter: driveData.company ? driveData.company.charAt(0).toUpperCase() : "C",
        applicantsCount: 0,
        status: driveData.status || "Active",
        minCgpa: Number(driveData.minCgpa) || 6.0,
        maxBacklogs: Number(driveData.maxBacklogs) || 0,
        packageLpa: Number(driveData.packageLpa) || 0,
        ...driveData
    };
    const updated = [newDrive, ...drives];
    saveDrives(updated);

    // Also auto-register company in partner companies directory
    if (driveData.company) {
        addCompany({
            name: driveData.company,
            industry: driveData.industry || "Information Technology",
            location: driveData.location || "India",
            status: driveData.status || "Active",
            rolesCount: 1
        });
    }

    return newDrive;
}

// Delete a drive
export function deleteDrive(id) {
    const drives = getStoredDrives();
    const updated = drives.filter(d => d.id !== id);
    saveDrives(updated);
    return updated;
}

// Update existing drive
export function updateDrive(id, updatedFields) {
    const drives = getStoredDrives();
    const index = drives.findIndex(d => d.id === id);
    if (index === -1) return null;

    const current = drives[index];
    const updated = {
        ...current,
        ...updatedFields,
        company: updatedFields.company ? updatedFields.company.trim() : current.company,
        packageLpa: updatedFields.packageLpa !== undefined && updatedFields.packageLpa !== "" ? parseFloat(updatedFields.packageLpa) : current.packageLpa,
        minCgpa: updatedFields.minCgpa !== undefined && updatedFields.minCgpa !== "" ? parseFloat(updatedFields.minCgpa) : current.minCgpa,
        maxBacklogs: updatedFields.maxBacklogs !== undefined && updatedFields.maxBacklogs !== "" ? parseInt(updatedFields.maxBacklogs, 10) : current.maxBacklogs
    };

    const newDrives = [...drives];
    newDrives[index] = updated;
    saveDrives(newDrives);
    return updated;
}

// ==========================================
// STUDENT PROFILE
// ==========================================
export function getStudentProfile(user) {
    if (!user) return null;
    const email = user.email ? user.email.toLowerCase().trim() : "";

    let profile = null;

    try {
        // 1. Check primary versioned profile key
        if (email) {
            const v3Stored = localStorage.getItem(`spms_v3_profile_${email}`);
            if (v3Stored) {
                try { profile = JSON.parse(v3Stored); } catch (e) {}
            }

            if (!profile) {
                const legStored = localStorage.getItem(`spms_student_profile_${email}`);
                if (legStored) {
                    try { profile = JSON.parse(legStored); } catch (e) {}
                }
            }
        }

        if (!profile) {
            const reg = localStorage.getItem("spms_registered_student");
            if (reg) {
                try {
                    const parsed = JSON.parse(reg);
                    if (!email || (parsed.email && parsed.email.toLowerCase().trim() === email)) {
                        profile = parsed;
                    }
                } catch (e) {}
            }
        }

        // 2. Cross-reference with Student Directory
        const allStudents = getStoredStudents();
        const foundInDir = allStudents.find(s => 
            (email && s.email && s.email.toLowerCase().trim() === email) ||
            (profile?.rollNo && s.rollNo && s.rollNo !== "Not Assigned" && s.rollNo.trim().toLowerCase() === profile.rollNo.trim().toLowerCase())
        );

        // Merge fields so phone, location/address, and skills are NEVER wiped out by blank directory records
        const fullName = profile?.fullName || profile?.name || foundInDir?.name || user?.name || "Student";
        const studentEmail = email || profile?.email || foundInDir?.email || user?.email || "";
        const phone = profile?.phone || foundInDir?.phone || "";
        const gender = profile?.gender || foundInDir?.gender || "";
        const location = profile?.location || profile?.address || foundInDir?.location || foundInDir?.address || "";
        const rollNo = profile?.rollNo || foundInDir?.rollNo || "";
        const degree = profile?.degree || foundInDir?.degree || "MCA";
        const department = profile?.department || foundInDir?.department || "Computer Applications";
        const college = profile?.college || foundInDir?.college || "";
        const semester = profile?.semester || foundInDir?.semester || "";
        const cgpa = (profile?.cgpa !== undefined && profile?.cgpa !== "") ? String(profile.cgpa) : (foundInDir?.cgpa ? String(foundInDir.cgpa) : "");
        const backlogs = (profile?.backlogs !== undefined && profile?.backlogs !== "") ? String(profile.backlogs) : (foundInDir ? String(foundInDir.backlogs || 0) : "0");
        const skills = (Array.isArray(profile?.skills) && profile.skills.length > 0)
            ? profile.skills
            : (foundInDir && Array.isArray(foundInDir.skills) ? foundInDir.skills : []);
        const resumeName = profile?.resumeName || null;
        let resumeData = profile?.resumeData || null;
        let resumeType = profile?.resumeType || (resumeName?.toLowerCase().endsWith(".pdf") ? "application/pdf" : null);
        let resumeSize = profile?.resumeSize || null;
        let resumeUploadedAt = profile?.resumeUploadedAt || null;

        if (!resumeData && (email || studentEmail)) {
            const k = email || studentEmail;
            try {
                resumeData = localStorage.getItem(`spms_resume_data_${k}`) || sessionStorage.getItem(`spms_resume_data_${k}`);
                resumeType = localStorage.getItem(`spms_resume_type_${k}`) || resumeType;
                resumeSize = localStorage.getItem(`spms_resume_size_${k}`) || resumeSize;
                resumeUploadedAt = localStorage.getItem(`spms_resume_uploaded_at_${k}`) || resumeUploadedAt;
            } catch (e) {}
        }

        return {
            fullName,
            email: studentEmail,
            phone,
            gender,
            location,
            rollNo,
            degree,
            department,
            college,
            semester,
            cgpa,
            backlogs,
            skills,
            resumeName,
            resumeData,
            resumeType,
            resumeSize,
            resumeUploadedAt
        };
    } catch (e) {
        console.warn("Could not read student profile:", e);
    }

    return {
        fullName: user.name || "Student",
        email: email || user.email || "",
        phone: "",
        gender: "",
        location: "",
        rollNo: "",
        degree: "MCA",
        department: "Computer Applications",
        cgpa: "",
        backlogs: "0",
        skills: [],
        resumeName: null,
        resumeData: null,
        resumeType: null,
        resumeSize: null,
        resumeUploadedAt: null
    };
}

// Save student profile and synchronize with both localStorage and Student Directory
export function saveStudentProfile(userEmail, profileData) {
    if (!profileData) return null;
    const emailKey = (userEmail || profileData.email || "").toLowerCase().trim();

    const resumeData = profileData.resumeData || null;
    const resumeType = profileData.resumeType || (profileData.resumeName?.toLowerCase().endsWith(".pdf") ? "application/pdf" : null);
    const resumeSize = profileData.resumeSize || null;
    const resumeUploadedAt = profileData.resumeUploadedAt || null;

    const formatted = {
        fullName: profileData.fullName ? profileData.fullName.trim() : (profileData.name || "Student"),
        email: emailKey,
        phone: profileData.phone ? profileData.phone.trim() : "",
        gender: profileData.gender ? profileData.gender.trim() : "",
        location: profileData.location ? profileData.location.trim() : (profileData.address ? profileData.address.trim() : ""),
        rollNo: profileData.rollNo ? profileData.rollNo.trim() : "",
        degree: profileData.degree ? profileData.degree.trim() : "MCA",
        department: profileData.department ? profileData.department.trim() : "Computer Applications",
        college: profileData.college ? profileData.college.trim() : "",
        semester: profileData.semester ? profileData.semester.trim() : "",
        cgpa: profileData.cgpa !== undefined ? String(profileData.cgpa).trim() : "",
        backlogs: profileData.backlogs !== undefined ? String(profileData.backlogs).trim() : "0",
        skills: Array.isArray(profileData.skills) 
            ? profileData.skills 
            : typeof profileData.skills === "string" 
                ? profileData.skills.split(",").map(s => s.trim()).filter(Boolean) 
                : [],
        resumeName: profileData.resumeName || null,
        resumeData: resumeData,
        resumeType: resumeType,
        resumeSize: resumeSize,
        resumeUploadedAt: resumeUploadedAt
    };

    try {
        // 1. Save to primary profile key and legacy key
        if (emailKey) {
            localStorage.setItem(`spms_v3_profile_${emailKey}`, JSON.stringify(formatted));
            localStorage.setItem(`spms_student_profile_${emailKey}`, JSON.stringify(formatted));

            if (resumeData) {
                try {
                    localStorage.setItem(`spms_resume_data_${emailKey}`, resumeData);
                    if (resumeType) localStorage.setItem(`spms_resume_type_${emailKey}`, resumeType);
                    if (resumeSize) localStorage.setItem(`spms_resume_size_${emailKey}`, resumeSize);
                    if (resumeUploadedAt) localStorage.setItem(`spms_resume_uploaded_at_${emailKey}`, resumeUploadedAt);
                } catch (quotaErr) {
                    try {
                        sessionStorage.setItem(`spms_resume_data_${emailKey}`, resumeData);
                        if (resumeType) sessionStorage.setItem(`spms_resume_type_${emailKey}`, resumeType);
                    } catch (se) {}
                }
            }
        }
        // Sync with Flask MySQL backend
        try {
            API.put("/students/profile", formatted).catch(err => {
                console.warn("Backend profile sync notice:", err.message);
            });
        } catch (apiErr) {}

        // 2. Synchronize spms_user in localStorage so session & navigation stay in sync
        const userStored = localStorage.getItem("spms_user");
        if (userStored) {
            try {
                const u = JSON.parse(userStored);
                localStorage.setItem("spms_user", JSON.stringify({
                    ...u,
                    name: formatted.fullName,
                    phone: formatted.phone,
                    location: formatted.location
                }));
            } catch (e) {}
        }

        // 3. Synchronize with Student Directory (studentsStore) if student exists
        const allStudents = getStoredStudents();
        const existingIdx = allStudents.findIndex(s => 
            (emailKey && s.email && s.email.toLowerCase().trim() === emailKey) ||
            (formatted.rollNo && s.rollNo && s.rollNo !== "Not Assigned" && s.rollNo.trim().toLowerCase() === formatted.rollNo.toLowerCase())
        );

        if (existingIdx >= 0) {
            allStudents[existingIdx] = {
                ...allStudents[existingIdx],
                name: formatted.fullName,
                phone: formatted.phone,
                gender: formatted.gender || allStudents[existingIdx].gender || "",
                location: formatted.location,
                rollNo: formatted.rollNo || allStudents[existingIdx].rollNo,
                degree: formatted.degree || allStudents[existingIdx].degree,
                department: formatted.department || allStudents[existingIdx].department,
                cgpa: formatted.cgpa !== "" ? parseFloat(formatted.cgpa) : allStudents[existingIdx].cgpa,
                backlogs: parseInt(formatted.backlogs, 10) || 0,
                skills: formatted.skills
            };
            saveStudents(allStudents);
        }
    } catch (e) {
        console.error("Could not save student profile:", e);
    }

    return formatted;
}

// ==========================================
// APPLICATIONS (PER STUDENT & ALL)
// ==========================================

export function getAllApplications() {
    try {
        const stored = localStorage.getItem(ALL_APPLICATIONS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                const activeDrives = getStoredDrives();
                const activeDriveIds = new Set(activeDrives.map(d => String(d.id)));
                const activeCompanyNames = new Set(activeDrives.map(d => (d.company || "").toLowerCase().trim()));

                // An application is strictly valid ONLY if its drive still exists in Placement Drives
                const validApps = parsed.filter(a => {
                    if (!a || !a.id) return false;
                    const driveIdMatch = a.driveId && activeDriveIds.has(String(a.driveId));
                    const companyMatch = a.company && activeCompanyNames.has(a.company.toLowerCase().trim());
                    return driveIdMatch || companyMatch;
                });

                // Deduplicate per student + company to prevent any duplicate cards or rows
                const dedupMap = new Map();
                validApps.forEach(app => {
                    const studentKey = (app.studentEmail || "").toLowerCase().trim();
                    const compKey = (app.company || "").toLowerCase().trim();
                    const key = `${studentKey}_${compKey}`;
                    if (!dedupMap.has(key)) {
                        dedupMap.set(key, app);
                    } else {
                        const existing = dedupMap.get(key);
                        if (app.status === "Selected" || (app.status === "Shortlisted" && existing?.status !== "Selected")) {
                            dedupMap.set(key, app);
                        }
                    }
                });

                return Array.from(dedupMap.values());
            }
        }
    } catch (e) {
        console.warn("Could not read all applications:", e);
    }
    return [];
}

export function saveAllApplications(apps) {
    try {
        localStorage.setItem(ALL_APPLICATIONS_KEY, JSON.stringify(apps));
    } catch (e) {
        console.warn("Could not save all applications:", e);
    }
}

// Get applications submitted by a specific student, strictly validated against real active drives
export function getStudentApplications(userEmail) {
    let emailKey = (userEmail || "").toLowerCase().trim();
    if (!emailKey) {
        try {
            const storedUser = JSON.parse(localStorage.getItem("spms_user") || "{}");
            if (storedUser && storedUser.email) {
                emailKey = storedUser.email.toLowerCase().trim();
            }
        } catch (e) {}
    }

    const activeDrives = getStoredDrives();
    const activeDriveIds = new Set(activeDrives.map(d => String(d.id)));
    const activeCompanyNames = new Set(activeDrives.map(d => (d.company || "").toLowerCase().trim()));
    const driveMap = new Map();
    activeDrives.forEach(d => {
        if (d.id) driveMap.set(String(d.id), d);
        if (d.company) driveMap.set(d.company.toLowerCase().trim(), d);
    });

    const appsMap = new Map();

    // 1. Read from personal student key and purge deleted drives
    if (emailKey) {
        try {
            const key = `spms_v3_apps_${emailKey}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    parsed.forEach(a => {
                        if (!a || !a.id) return;
                        const hasDriveId = a.driveId && activeDriveIds.has(String(a.driveId));
                        const hasCompany = a.company && activeCompanyNames.has(a.company.toLowerCase().trim());
                        if (hasDriveId || hasCompany) {
                            // Synchronize company role and package with current drive data
                            const matchedDrive = (a.driveId && driveMap.get(String(a.driveId))) || (a.company && driveMap.get(a.company.toLowerCase().trim()));
                            if (matchedDrive) {
                                a.role = matchedDrive.role || a.role;
                                a.packageLpa = matchedDrive.packageLpa !== undefined ? matchedDrive.packageLpa : a.packageLpa;
                                a.company = matchedDrive.company || a.company;
                            }
                            appsMap.set(a.id, a);
                        }
                    });
                }
            }
        } catch (e) {
            console.warn("Could not read student applications:", e);
        }
    }

    // 2. Also cross-reference global applications list (spms_v3_all_applications)
    try {
        const allApps = getAllApplications();
        if (emailKey) {
            allApps.forEach(a => {
                if (a && a.studentEmail && a.studentEmail.toLowerCase().trim() === emailKey) {
                    const hasDriveId = a.driveId && activeDriveIds.has(String(a.driveId));
                    const hasCompany = a.company && activeCompanyNames.has(a.company.toLowerCase().trim());
                    if (hasDriveId || hasCompany) {
                        const matchedDrive = (a.driveId && driveMap.get(String(a.driveId))) || (a.company && driveMap.get(a.company.toLowerCase().trim()));
                        if (matchedDrive) {
                            a.role = matchedDrive.role || a.role;
                            a.packageLpa = matchedDrive.packageLpa !== undefined ? matchedDrive.packageLpa : a.packageLpa;
                            a.company = matchedDrive.company || a.company;
                        }
                        if (!appsMap.has(a.id)) {
                            appsMap.set(a.id, a);
                        } else {
                            const existing = appsMap.get(a.id);
                            appsMap.set(a.id, { ...existing, status: a.status || existing.status });
                        }
                    }
                }
            });
        }
    } catch (e) {}

    // Deduplicate strictly by company name so the student NEVER sees duplicate entries for the same company
    const deduplicatedByCompany = new Map();
    Array.from(appsMap.values()).forEach(app => {
        const key = app.company ? app.company.toLowerCase().trim() : (app.driveId ? String(app.driveId) : app.id);
        if (!deduplicatedByCompany.has(key)) {
            deduplicatedByCompany.set(key, app);
        } else {
            // Keep the one with higher status or newer appliedDate / full resume
            const existing = deduplicatedByCompany.get(key);
            const statusPriority = { "Selected": 4, "Offer": 4, "Interview Scheduled": 3, "Interview": 3, "Shortlisted": 2, "Under Review": 1, "Applied": 0 };
            const appScore = (statusPriority[app.status] || 0) + (app.resumeName ? 0.5 : 0);
            const existingScore = (statusPriority[existing.status] || 0) + (existing.resumeName ? 0.5 : 0);
            if (appScore >= existingScore) {
                deduplicatedByCompany.set(key, { ...existing, ...app });
            }
        }
    });

    const finalValidApps = Array.from(deduplicatedByCompany.values());

    // Update localStorage to clean up purged records so stale items never re-appear
    if (emailKey) {
        try {
            localStorage.setItem(`spms_v3_apps_${emailKey}`, JSON.stringify(finalValidApps));
        } catch (e) {}
    }

    return finalValidApps;
}

// Check if student has applied to a specific drive
export function isStudentApplied(userEmail, drive) {
    if (!drive) return false;
    const apps = getStudentApplications(userEmail);
    const driveCompany = drive.company ? drive.company.toLowerCase().trim() : "";
    return apps.some(a => {
        const idMatch = a.driveId && String(a.driveId) === String(drive.id);
        const compMatch = driveCompany && a.company && a.company.toLowerCase().trim() === driveCompany;
        return idMatch || compMatch;
    });
}

// Get all applicants for a specific drive (for Admin)
export function getDriveApplicants(driveId) {
    const all = getAllApplications();
    return all.filter(a => a.driveId === driveId);
}

// Calculate dynamic profile completion percentage and missing items
export function getProfileCompletion(profile, user) {
    const prof = profile || getStudentProfile(user) || {};

    const items = [
        {
            key: "fullName",
            label: "Full Name",
            isFilled: Boolean(prof.fullName && prof.fullName.trim() && prof.fullName !== "Student"),
            weight: 10
        },
        {
            key: "email",
            label: "Email Address",
            isFilled: Boolean(prof.email && prof.email.trim()),
            weight: 10
        },
        {
            key: "phone",
            label: "Phone Number",
            isFilled: Boolean(prof.phone && prof.phone.trim() && prof.phone !== "Not Provided"),
            weight: 10
        },
        {
            key: "location",
            label: "Location / City",
            isFilled: Boolean(prof.location && prof.location.trim() && prof.location !== "Not Provided"),
            weight: 10
        },
        {
            key: "rollNo",
            label: "Roll Number",
            isFilled: Boolean(prof.rollNo && prof.rollNo.trim() && prof.rollNo !== "Not Assigned" && prof.rollNo !== "Not Provided"),
            weight: 10
        },
        {
            key: "degree",
            label: "Degree Program",
            isFilled: Boolean(prof.degree && prof.degree.trim() && prof.degree !== "Not Provided"),
            weight: 10
        },
        {
            key: "department",
            label: "Department",
            isFilled: Boolean(prof.department && prof.department.trim() && prof.department !== "Not Provided"),
            weight: 10
        },
        {
            key: "cgpa",
            label: "Current CGPA",
            isFilled: Boolean(prof.cgpa !== undefined && prof.cgpa !== null && String(prof.cgpa).trim() !== "" && prof.cgpa !== "0" && prof.cgpa !== 0 && String(prof.cgpa) !== "Not Provided"),
            weight: 10
        },
        {
            key: "skills",
            label: "Technical Skills",
            isFilled: Boolean(Array.isArray(prof.skills) && prof.skills.length > 0),
            weight: 10
        },
        {
            key: "gender",
            label: "Gender",
            isFilled: Boolean(prof.gender && prof.gender.trim() && prof.gender !== "Not Specified" && prof.gender !== "Not Provided"),
            weight: 10
        }
    ];

    const completed = items.filter(i => i.isFilled);
    const missing = items.filter(i => !i.isFilled);
    const percentage = Math.min(100, completed.reduce((sum, i) => sum + i.weight, 0));

    return {
        percentage,
        isComplete: percentage === 100,
        completedCount: completed.length,
        totalCount: items.length,
        completed,
        missing
    };
}

// Submit application
export function submitStudentApplication(userEmail, drive, studentProfile, applicationResume) {
    if (!userEmail || !drive) return [];
    const emailKey = userEmail.toLowerCase().trim();
    const apps = getStudentApplications(emailKey);

    if (apps.some(a => a.driveId === drive.id)) {
        return apps;
    }

    const profile = studentProfile || getStudentProfile({ email: emailKey }) || {};

    const resumeName = applicationResume?.resumeName || null;
    const resumeData = applicationResume?.resumeData || null;
    const resumeType = applicationResume?.resumeType || null;
    const resumeSize = applicationResume?.resumeSize || null;

    const newApp = {
        id: "app_" + Date.now(),
        driveId: drive.id,
        company: drive.company,
        logoLetter: drive.logoLetter || (drive.company ? drive.company[0] : "C"),
        role: drive.role,
        packageLpa: drive.packageLpa,
        appliedDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        status: "Applied",
        studentEmail: emailKey,
        studentName: profile.fullName || "Student",
        rollNo: (profile.rollNo && profile.rollNo !== "Not Assigned") ? profile.rollNo : "N/A",
        degree: profile.degree || "MCA",
        cgpa: profile.cgpa || "N/A",
        resumeName: resumeName,
        resumeData: resumeData,
        resumeType: resumeType,
        resumeSize: resumeSize
    };

    // 1. Save to student's personal list
    const updatedStudentApps = [newApp, ...apps];
    try {
        localStorage.setItem(`spms_v3_apps_${emailKey}`, JSON.stringify(updatedStudentApps));
    } catch (e) {}

    // 2. Save to global applications list (for Admin)
    const allApps = getAllApplications();
    saveAllApplications([newApp, ...allApps]);

    // 3. Update applicantsCount in drive
    const drives = getStoredDrives();
    const driveIdx = drives.findIndex(d => d.id === drive.id);
    if (driveIdx >= 0) {
        drives[driveIdx].applicantsCount = (drives[driveIdx].applicantsCount || 0) + 1;
        saveDrives(drives);
    }

    return updatedStudentApps;
}

// Update application status by Admin
export function updateApplicationStatus(appId, newStatus) {
    const all = getAllApplications();
    const updated = all.map(a => {
        if (a.id === appId) {
            return { ...a, status: newStatus };
        }
        return a;
    });
    saveAllApplications(updated);

    // Sync student personal application
    const targetApp = all.find(a => a.id === appId);
    if (targetApp && targetApp.studentEmail) {
        const studentApps = getStudentApplications(targetApp.studentEmail);
        const updatedStudentApps = studentApps.map(a => {
            if (a.id === appId || a.driveId === targetApp.driveId) {
                return { ...a, status: newStatus };
            }
            return a;
        });
        localStorage.setItem(`spms_v3_apps_${targetApp.studentEmail.toLowerCase()}`, JSON.stringify(updatedStudentApps));
    }

    return updated;
}

// Remove an application submitted by a student for a drive (Admin action)
export function removeApplicationFromDrive(appId) {
    const all = getAllApplications();
    const targetApp = all.find(a => a.id === appId);
    if (!targetApp) return all;

    const updated = all.filter(a => a.id !== appId);
    saveAllApplications(updated);

    // Sync student's personal applications
    if (targetApp.studentEmail) {
        const studentApps = getStudentApplications(targetApp.studentEmail);
        const updatedStudentApps = studentApps.filter(a => a.id !== appId && a.driveId !== targetApp.driveId);
        try {
            localStorage.setItem(`spms_v3_apps_${targetApp.studentEmail.toLowerCase()}`, JSON.stringify(updatedStudentApps));
        } catch (e) {}
    }

    // Decrement applicantsCount on drive if applicable
    if (targetApp.driveId) {
        const drives = getStoredDrives();
        const driveIdx = drives.findIndex(d => d.id === targetApp.driveId);
        if (driveIdx >= 0) {
            drives[driveIdx].applicantsCount = Math.max(0, (drives[driveIdx].applicantsCount || 1) - 1);
            saveDrives(drives);
        }
    }

    return updated;
}

// Check eligibility
export function evaluateEligibility(drive, student) {
    if (!student || !drive) {
        return { isEligible: true, reason: "" };
    }
    const studentCgpa = parseFloat(student.cgpa || 0);
    const studentBacklogs = parseInt(student.backlogs || 0, 10);
    const minCgpa = Number(drive.minCgpa) || 0;
    const maxBacklogs = Number(drive.maxBacklogs) || 0;

    const cgpaOk = !student.cgpa || studentCgpa >= minCgpa;
    const backlogsOk = studentBacklogs <= maxBacklogs;
    const isEligible = cgpaOk && backlogsOk;

    let reason = "";
    if (student.cgpa && !cgpaOk) {
        reason = `CGPA ${studentCgpa} below cutoff (${minCgpa})`;
    } else if (!backlogsOk) {
        reason = `Active backlogs (${studentBacklogs}) exceed max allowed (${maxBacklogs})`;
    }

    return {
        isEligible,
        reason
    };
}

// Generate clear, genuine company and drive specifications for student view
export function getDriveSpecifications(drive) {
    if (!drive) return null;

    const company = drive.company || "Partner Company";
    const role = drive.role || "Software Engineer";
    const packageLpa = drive.packageLpa || 0;
    const minCgpa = drive.minCgpa !== undefined ? drive.minCgpa : 6.0;
    const maxBacklogs = drive.maxBacklogs !== undefined ? drive.maxBacklogs : 0;
    const location = drive.location || "Bangalore";
    const industry = drive.industry || "Information Technology";
    const driveDate = drive.driveDate || "TBA";
    const deadline = drive.deadline || "TBA";

    // Only include details entered by admin or clean concise information
    const aboutCompany = drive.aboutCompany || "";
    const jobDescription = drive.jobDescription || "";
    const requiredSkills = Array.isArray(drive.requiredSkills) 
        ? drive.requiredSkills 
        : typeof drive.requiredSkills === "string" && drive.requiredSkills.trim()
            ? drive.requiredSkills.split(",").map(s => s.trim()).filter(Boolean)
            : [];
    const selectionProcess = drive.selectionProcess || "";

    const eligibleBranches = Array.isArray(drive.eligibleBranches) && drive.eligibleBranches.length > 0 
        ? drive.eligibleBranches 
        : ["MCA", "B.Tech CSE / IT"];

    const batch = drive.batch || "2026 Batch";
    const bond = drive.bond || "";

    return {
        ...drive,
        company,
        role,
        packageLpa,
        minCgpa,
        maxBacklogs,
        location,
        industry,
        driveDate,
        deadline,
        aboutCompany,
        jobDescription,
        requiredSkills,
        selectionProcess,
        eligibleBranches,
        batch,
        bond
    };
}

// Reset ALL storage for a 100% fresh start across the entire web
export function resetAllData() {
    try {
        const keysToClear = [
            DRIVES_STORAGE_KEY,
            ALL_APPLICATIONS_KEY,
            "spms_v3_students",
            "spms_v3_partner_companies",
            "spms_placement_drives",
            "spms_students_data",
            "spms_all_applications",
            "spms_companies",
            "spms_registered_student"
        ];
        keysToClear.forEach(k => localStorage.removeItem(k));

        const dynamicKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith("spms_v3_") || 
                key.startsWith("spms_applications_") || 
                key.startsWith("spms_student_profile_")
            )) {
                dynamicKeys.push(key);
            }
        }
        dynamicKeys.forEach(k => localStorage.removeItem(k));
    } catch (e) {
        console.warn("Could not reset all storage:", e);
    }
}
