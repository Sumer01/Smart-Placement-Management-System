// Smart Placement Management System - Unified Authentication Service
// Connects React frontend with Flask backend API & manages local registered cohort

import axios from "axios";
import { getStoredStudents, saveStudents } from "./studentsStore";

const BACKEND_AUTH_URL = "http://127.0.0.1:5001/api/auth";

const REGISTERED_STUDENTS_KEY = "spms_registered_students";
const CURRENT_USER_KEY = "spms_current_user";
const AUTH_TOKEN_KEY = "spms_auth_token";

// Default demo accounts
const DEFAULT_ACCOUNTS = [
    {
        name: "Sumer Raj",
        fullName: "Sumer Raj",
        email: "student@cusat.ac.in",
        password: "password123",
        role: "student",
        rollNo: "24MCA089",
        degree: "MCA",
        department: "Computer Applications",
        cgpa: "6.17",
        backlogs: "0"
    },
    {
        name: "Demo Student",
        fullName: "Demo Student",
        email: "student@spms.com",
        password: "password123",
        role: "student",
        rollNo: "24MCA001",
        degree: "MCA",
        department: "Computer Applications",
        cgpa: "7.50",
        backlogs: "0"
    },
    {
        name: "Placement Officer",
        fullName: "Placement Officer",
        email: "admin@spms.com",
        password: "admin123",
        role: "admin",
        department: "Placement Cell"
    },
    {
        name: "Campus Recruiter",
        fullName: "Campus Recruiter",
        email: "recruiter@spms.com",
        password: "recruiter123",
        role: "recruiter",
        company: "Tech Mahindra"
    }
];

// Helper: Get all registered students from localStorage (including demo accounts)
export function getRegisteredStudents() {
    try {
        const stored = localStorage.getItem(REGISTERED_STUDENTS_KEY);
        let list = stored ? JSON.parse(stored) : [];

        // Migrate legacy single student if present
        const legacySingle = localStorage.getItem("spms_registered_student");
        if (legacySingle) {
            try {
                const singleObj = JSON.parse(legacySingle);
                if (singleObj && singleObj.email && !list.some(s => s.email.toLowerCase() === singleObj.email.toLowerCase())) {
                    list.push({ ...singleObj, role: "student" });
                }
            } catch (err) {
                console.error("Migration error:", err);
            }
        }

        // Ensure default accounts exist
        DEFAULT_ACCOUNTS.forEach(def => {
            if (!list.some(u => u.email.toLowerCase() === def.email.toLowerCase())) {
                list.push(def);
            }
        });

        localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(list));
        return list;
    } catch (e) {
        console.warn("Could not read registered students:", e);
        return DEFAULT_ACCOUNTS;
    }
}

// 1. REGISTER STUDENT
export async function registerStudent(studentData) {
    const email = studentData.email.trim().toLowerCase();
    const fullName = studentData.fullName.trim();
    const password = studentData.password;

    // Check if email already registered locally
    const existingList = getRegisteredStudents();
    const duplicate = existingList.find(s => s.email.toLowerCase() === email);
    if (duplicate) {
        return {
            success: false,
            message: "An account with this email is already registered. Please sign in."
        };
    }

    // Attempt to register in Flask backend database
    let backendRegistered = false;
    try {
        const res = await axios.post(`${BACKEND_AUTH_URL}/register`, {
            name: fullName,
            email: email,
            password: password,
            role: "student"
        }, { timeout: 3000 });

        if (res.status === 201 || res.status === 200) {
            backendRegistered = true;
        }
    } catch (err) {
        if (err.response && err.response.data && err.response.data.error) {
            if (err.response.status === 409 || err.response.data.error.includes("already registered")) {
                return {
                    success: false,
                    message: "Email is already registered in the system. Please sign in."
                };
            }
        }
        console.warn("Backend registration offline or skipped:", err.message);
    }

    // Save complete profile locally
    const newStudent = {
        name: fullName,
        fullName: fullName,
        email: email,
        password: password,
        role: "student",
        rollNo: studentData.rollNo || "24MCA999",
        degree: studentData.degree || "MCA",
        department: studentData.department || "Computer Applications",
        cgpa: studentData.cgpa || "7.0",
        backlogs: studentData.backlogs || "0",
        registeredAt: new Date().toISOString()
    };

    existingList.push(newStudent);
    localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(existingList));

    // Also add to Admin students cohort directory
    try {
        const currentCohort = getStoredStudents();
        const cohortMember = {
            id: `st_${Date.now()}`,
            rollNo: newStudent.rollNo,
            name: newStudent.fullName,
            email: newStudent.email,
            degree: newStudent.degree,
            department: newStudent.department,
            cgpa: parseFloat(newStudent.cgpa) || 7.0,
            backlogs: parseInt(newStudent.backlogs) || 0,
            status: "In Process",
            placedCompany: null,
            packageLpa: null,
            verified: true,
            skills: ["JavaScript", "Python", "Web Development"]
        };
        saveStudents([cohortMember, ...currentCohort]);
    } catch (e) {
        console.warn("Could not append student to cohort store:", e);
    }

    return {
        success: true,
        message: "Account created successfully! You can now log in.",
        backendRegistered
    };
}

// 2. LOGIN USER (STRICT VALIDATION)
export async function loginUser({ email, password, role }) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanRole = (role || "student").trim().toLowerCase();

    if (!cleanEmail) {
        return { success: false, message: "Email address is required." };
    }
    if (!password) {
        return { success: false, message: "Password is required." };
    }

    // 1. Try Flask Backend Login first
    try {
        const res = await axios.post(`${BACKEND_AUTH_URL}/login`, {
            email: cleanEmail,
            password: password
        }, { timeout: 3000 });

        if (res.status === 200 && res.data && res.data.access_token) {
            const backendUser = res.data.user;
            
            // Check role match
            if (backendUser.role && backendUser.role.toLowerCase() !== cleanRole) {
                return {
                    success: false,
                    message: `This account is registered as '${backendUser.role}', not '${cleanRole}'. Please switch your login role.`
                };
            }

            // Find full profile from local store
            const localList = getRegisteredStudents();
            const localProfile = localList.find(s => s.email.toLowerCase() === cleanEmail) || {};

            const finalUser = {
                ...localProfile,
                id: backendUser.id,
                name: backendUser.name || localProfile.name || "Student",
                fullName: backendUser.name || localProfile.fullName || "Student",
                email: cleanEmail,
                role: backendUser.role || cleanRole,
                token: res.data.access_token
            };

            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(finalUser));
            localStorage.setItem(AUTH_TOKEN_KEY, res.data.access_token);

            return {
                success: true,
                user: finalUser
            };
        }
    } catch (err) {
        // Backend returned specific 401 error
        if (err.response && err.response.status === 401) {
            // Check if user even exists locally to give precise feedback
            const localList = getRegisteredStudents();
            const exists = localList.find(s => s.email.toLowerCase() === cleanEmail);
            if (!exists) {
                return {
                    success: false,
                    notRegistered: true,
                    message: "No registered account found with this email. You must register as a student first before logging in!"
                };
            }
            return {
                success: false,
                message: "Incorrect password. Please verify and try again."
            };
        }
        // Backend network down/unreachable, fallback to local accounts check below
        console.warn("Backend unavailable during login, verifying with local database...");
    }

    // 2. Local Fallback Verification
    const localList = getRegisteredStudents();
    const account = localList.find(s => s.email.toLowerCase() === cleanEmail);

    if (!account) {
        return {
            success: false,
            notRegistered: true,
            message: "No registered account found with this email. You must register as a student first before logging in!"
        };
    }

    if (account.role && account.role.toLowerCase() !== cleanRole) {
        return {
            success: false,
            message: `This account is registered as '${account.role}', not '${cleanRole}'. Please select '${account.role}' above.`
        };
    }

    if (account.password !== password) {
        return {
            success: false,
            message: "Incorrect password. Please verify and try again."
        };
    }

    // Successful local login
    const finalUser = {
        ...account,
        name: account.fullName || account.name || "Student",
        email: cleanEmail,
        role: cleanRole
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(finalUser));
    return {
        success: true,
        user: finalUser
    };
}

// 3. GET CURRENT USER
export function getCurrentUser() {
    try {
        const stored = localStorage.getItem(CURRENT_USER_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error reading current user:", e);
    }
    // Default fallback student
    return DEFAULT_ACCOUNTS[0];
}

// 4. LOGOUT USER
export function logoutUser() {
    try {
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (e) {
        console.error("Error during logout:", e);
    }
}
