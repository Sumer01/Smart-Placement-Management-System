// Smart Placement Management System - Real Students Data Store
// 100% Clean State - Only Real Added/Registered Students

const STUDENTS_STORAGE_KEY = "spms_v3_students";

// Clean initial students
export const INITIAL_STUDENTS = [];

// Helper to filter out any mock student remnants
function isRealStudent(s) {
    if (!s || !s.id) return false;
    const mockIds = ["st_1", "st_2", "st_3", "st_4", "st_5", "st_6"];
    if (mockIds.includes(s.id)) return false;
    return true;
}

export function getStoredStudents() {
    try {
        // Clean legacy mock key if present
        if (localStorage.getItem("spms_students_data")) {
            try {
                const legacy = JSON.parse(localStorage.getItem("spms_students_data"));
                // If it contains legacy mock IDs, remove it completely
                if (Array.isArray(legacy) && legacy.some(item => !isRealStudent(item))) {
                    localStorage.removeItem("spms_students_data");
                }
            } catch (e) {
                localStorage.removeItem("spms_students_data");
            }
        }

        const stored = localStorage.getItem(STUDENTS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed.filter(isRealStudent);
            }
        }
    } catch (e) {
        console.warn("Could not read students from localStorage:", e);
    }
    return [];
}

export function saveStudents(students) {
    try {
        const clean = (students || []).filter(isRealStudent);
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(clean));
    } catch (e) {
        console.warn("Could not save students to localStorage:", e);
    }
}

// Add a student (by registration, directly by Admin, or verified from drive applicants)
export function addStudentToStore(studentData) {
    const students = getStoredStudents();
    const email = studentData.email ? studentData.email.toLowerCase().trim() : "";
    const rollNo = studentData.rollNo ? studentData.rollNo.trim().toLowerCase() : "";
    
    // Check if student already exists by email OR rollNo
    const existingIndex = students.findIndex(s => {
        if (email && s.email && s.email.toLowerCase().trim() === email) return true;
        if (rollNo && rollNo !== "not assigned" && rollNo !== "n/a" && s.rollNo && s.rollNo.toLowerCase().trim() === rollNo) return true;
        return false;
    });
    
    const formatted = {
        id: existingIndex >= 0 && students[existingIndex].id ? students[existingIndex].id : "st_" + Date.now(),
        rollNo: studentData.rollNo ? studentData.rollNo.trim() : "Not Assigned",
        name: studentData.fullName || studentData.name || "Student",
        email: email || (existingIndex >= 0 ? students[existingIndex].email : `student_${Date.now()}@spms.edu`),
        phone: studentData.phone || (existingIndex >= 0 ? students[existingIndex].phone : ""),
        gender: studentData.gender || (existingIndex >= 0 ? students[existingIndex].gender : "Not Specified"),
        degree: studentData.degree || "MCA",
        department: studentData.department || "Computer Applications",
        cgpa: parseFloat(studentData.cgpa) || 0,
        backlogs: parseInt(studentData.backlogs, 10) || 0,
        status: studentData.status || (existingIndex >= 0 ? students[existingIndex].status : "Unplaced"),
        placedCompany: studentData.placedCompany !== undefined ? studentData.placedCompany : (existingIndex >= 0 ? students[existingIndex].placedCompany : null),
        packageLpa: studentData.packageLpa !== undefined ? (studentData.packageLpa ? parseFloat(studentData.packageLpa) : null) : (existingIndex >= 0 ? students[existingIndex].packageLpa : null),
        verified: studentData.verified !== undefined ? studentData.verified : true,
        skills: Array.isArray(studentData.skills) 
            ? studentData.skills 
            : typeof studentData.skills === "string" 
                ? studentData.skills.split(",").map(s => s.trim()).filter(Boolean)
                : (existingIndex >= 0 ? students[existingIndex].skills : []),
        registeredAt: existingIndex >= 0 && students[existingIndex].registeredAt ? students[existingIndex].registeredAt : new Date().toLocaleDateString("en-GB")
    };

    let updated;
    if (existingIndex >= 0) {
        updated = [...students];
        updated[existingIndex] = { ...updated[existingIndex], ...formatted };
    } else {
        updated = [formatted, ...students];
    }

    saveStudents(updated);
    return updated;
}

// Check if student exists in store by email or roll number
export function findStudentInStore(criteria) {
    if (!criteria) return null;
    const students = getStoredStudents();
    const cleanEmail = criteria.email ? criteria.email.toLowerCase().trim() : "";
    const cleanRoll = criteria.rollNo ? criteria.rollNo.toLowerCase().trim() : "";

    return students.find(s => {
        if (cleanEmail && s.email && s.email.toLowerCase().trim() === cleanEmail) return true;
        if (cleanRoll && cleanRoll !== "not assigned" && cleanRoll !== "n/a" && s.rollNo && s.rollNo.toLowerCase().trim() === cleanRoll) return true;
        return false;
    }) || null;
}

// Delete a student (by Admin) - cleans from student store, offline auth accounts, and blocks future login
export function deleteStudentFromStore(id) {
    const students = getStoredStudents();
    const studentToDelete = students.find(s => s.id === id);
    const updated = students.filter(s => s.id !== id);
    saveStudents(updated);

    if (studentToDelete && studentToDelete.email) {
        const cleanEmail = studentToDelete.email.toLowerCase().trim();

        // 1. Add email to deleted blacklist so they cannot login again
        try {
            const blacklist = JSON.parse(localStorage.getItem("spms_deleted_accounts") || "[]");
            if (!blacklist.includes(cleanEmail)) {
                blacklist.push(cleanEmail);
                localStorage.setItem("spms_deleted_accounts", JSON.stringify(blacklist));
            }
        } catch (e) {}

        // 2. Remove from registered accounts list
        try {
            const registered = JSON.parse(localStorage.getItem("spms_registered_students") || "[]");
            const filteredReg = registered.filter(u => !u.email || u.email.toLowerCase().trim() !== cleanEmail);
            localStorage.setItem("spms_registered_students", JSON.stringify(filteredReg));
        } catch (e) {}

        // 3. Remove student profiles and tokens
        try {
            localStorage.removeItem(`spms_v3_profile_${cleanEmail}`);
            localStorage.removeItem(`spms_student_profile_${cleanEmail}`);
            localStorage.removeItem(`spms_applications_${cleanEmail}`);
            localStorage.removeItem(`spms_v3_apps_${cleanEmail}`);

            // If current logged-in user is this deleted student, clear session
            const current = JSON.parse(localStorage.getItem("spms_user") || "{}");
            if (current && current.email && current.email.toLowerCase().trim() === cleanEmail) {
                localStorage.removeItem("spms_token");
                localStorage.removeItem("spms_user");
            }
        } catch (e) {}
    }

    return updated;
}

// Remove student by roll or email
export function removeStudentByRollOrEmail(criteria) {
    if (!criteria) return getStoredStudents();
    const students = getStoredStudents();
    const cleanEmail = criteria.email ? criteria.email.toLowerCase().trim() : "";
    const cleanRoll = criteria.rollNo ? criteria.rollNo.toLowerCase().trim() : "";

    const target = students.find(s => {
        const matchEmail = cleanEmail && s.email && s.email.toLowerCase().trim() === cleanEmail;
        const matchRoll = cleanRoll && cleanRoll !== "not assigned" && cleanRoll !== "n/a" && s.rollNo && s.rollNo.toLowerCase().trim() === cleanRoll;
        return matchEmail || matchRoll;
    });

    if (target) {
        return deleteStudentFromStore(target.id);
    }
    return students;
}

export function toggleVerification(id) {
    const students = getStoredStudents();
    const updated = students.map(s => {
        if (s.id === id) {
            return { ...s, verified: !s.verified };
        }
        return s;
    });
    saveStudents(updated);
    return updated;
}

// Reset all student data
export function resetStudentsStore() {
    try {
        localStorage.removeItem(STUDENTS_STORAGE_KEY);
        localStorage.removeItem("spms_students_data");
    } catch (e) {}
    return [];
}
