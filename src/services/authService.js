import API from "./api";

// Default demo accounts
const FALLBACK_ACCOUNTS = [
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

export const getRegisteredStudentsList = () => {
  try {
    const stored = localStorage.getItem("spms_registered_students");
    const list = stored ? JSON.parse(stored) : [];
    FALLBACK_ACCOUNTS.forEach((acc) => {
      if (!list.some((u) => u.email && u.email.toLowerCase() === acc.email.toLowerCase())) {
        list.push(acc);
      }
    });
    return list;
  } catch (e) {
    return FALLBACK_ACCOUNTS;
  }
};

export const login = async (email, password, role = "") => {
  const cleanEmail = email.trim().toLowerCase();

  // 0. Check if account was deleted/deactivated by Admin
  try {
    const deletedAccounts = JSON.parse(localStorage.getItem("spms_deleted_accounts") || "[]");
    if (Array.isArray(deletedAccounts) && deletedAccounts.includes(cleanEmail)) {
      const err = new Error("Your account has been deleted or deactivated by the Placement Office. You cannot log in.");
      err.response = {
        status: 403,
        data: {
          error: "Your account has been deactivated or removed by the Placement Office. Please contact the administrator."
        }
      };
      throw err;
    }
  } catch (err) {
    if (err.response && err.response.status === 403) throw err;
  }

  try {
    // 1. Try real Flask backend authentication first
    const response = await API.post("/auth/login", {
      email: cleanEmail,
      password,
      role: role.trim().toLowerCase()
    });

    if (response.data && response.data.access_token) {
      localStorage.setItem("spms_token", response.data.access_token);

      let userData = response.data.user || {};
      try {
        const savedProfile =
          localStorage.getItem(`spms_v3_profile_${cleanEmail}`) ||
          localStorage.getItem(`spms_student_profile_${cleanEmail}`);
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          userData = {
            ...userData,
            name: parsed.fullName || userData.name,
            phone: parsed.phone || userData.phone,
            location: parsed.location || userData.location,
          };
        }
      } catch (e) {}

      localStorage.setItem("spms_user", JSON.stringify(userData));
    }

    return response.data;
  } catch (error) {
    // If backend deliberately returned 401 or 403 (role mismatch), rethrow immediately
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      throw error;
    }

    // 2. If backend is offline or network error, fallback to local demo accounts
    console.warn("Backend API unreachable, checking offline accounts for login...", error.message);
    const allUsers = getRegisteredStudentsList();
    const matched = allUsers.find(
      (u) => u.email && u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (matched) {
      const userRole = (matched.role || "student").toLowerCase();
      const reqRole = role ? role.trim().toLowerCase() : "";

      if (reqRole && userRole !== reqRole) {
        const err = new Error(`Role mismatch: Account is '${userRole.toUpperCase()}', not '${reqRole.toUpperCase()}'`);
        err.response = {
          status: 403,
          data: {
            error: `Role mismatch: This account is registered as '${userRole.toUpperCase()}', not '${reqRole.toUpperCase()}'. Please select '${userRole.toUpperCase()}' in the 'Login As' dropdown.`
          }
        };
        throw err;
      }

      const mockToken = "spms_offline_token_" + Date.now();
      const userData = {
        name: matched.name || matched.fullName,
        email: matched.email,
        role: matched.role || "student",
        rollNo: matched.rollNo,
        degree: matched.degree,
        department: matched.department,
        cgpa: matched.cgpa,
      };

      localStorage.setItem("spms_token", mockToken);
      localStorage.setItem("spms_user", JSON.stringify(userData));

      return {
        access_token: mockToken,
        user: userData,
        message: "Logged in via offline mode",
      };
    }

    // If neither backend nor local accounts matched, rethrow
    throw error;
  }
};

export const register = async ({ name, email, password, role = "student" }) => {
  const cleanEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  try {
    const response = await API.post("/auth/register", {
      name: trimmedName,
      email: cleanEmail,
      password,
      role,
    });
    return response.data;
  } catch (error) {
    if (error.response && (error.response.status === 409 || error.response.status === 400)) {
      throw error;
    }

    console.warn("Backend registration unreachable, saving locally:", error.message);
    const list = getRegisteredStudentsList();
    if (list.some((u) => u.email && u.email.toLowerCase() === cleanEmail)) {
      const err = new Error("An account with this email is already registered.");
      err.response = { data: { error: "Email already registered." }, status: 409 };
      throw err;
    }

    const newUser = {
      name: trimmedName,
      fullName: trimmedName,
      email: cleanEmail,
      password,
      role,
    };
    list.push(newUser);
    localStorage.setItem("spms_registered_students", JSON.stringify(list));

    return {
      message: "Student registered successfully (offline mode)",
      user: newUser,
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await API.get("/auth/me");
    return response.data;
  } catch (e) {
    return getStoredUser();
  }
};

export const logout = () => {
  localStorage.removeItem("spms_token");
  localStorage.removeItem("spms_user");
};

export const getStoredUser = () => {
  const user = localStorage.getItem("spms_user");
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("spms_token");
};
