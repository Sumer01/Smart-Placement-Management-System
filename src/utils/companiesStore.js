// Smart Placement Management System - Partner Companies Data Store
// 100% Clean State - No Dummy Data

const COMPANIES_STORAGE_KEY = "spms_v3_partner_companies";

export const INITIAL_COMPANIES = [
    {
        id: "comp_google",
        name: "Google",
        logoLetter: "G",
        industry: "Information Technology",
        location: "Bangalore / Hyderabad",
        status: "Active",
        rolesCount: 2,
        role: "Software Development Engineer (SDE-1)",
        packageLpa: 28.5,
        minCgpa: 8.0,
        maxBacklogs: 0,
        driveDate: "2026-10-15",
        deadline: "2026-10-05",
        aboutCompany: "Google is a global technology leader focusing on search, cloud computing, software, and hardware technologies.",
        jobDescription: "Design, develop, test, deploy, and maintain large-scale distributed software applications.",
        requiredSkills: "Data Structures, Algorithms, C++, Java, System Design, Distributed Systems",
        selectionProcess: "Online Coding Assessment -> Technical Round 1 -> Technical Round 2 -> Googliness & Leadership",
        addedAt: "22/10/2026"
    },
    {
        id: "comp_microsoft",
        name: "Microsoft",
        logoLetter: "M",
        industry: "Information Technology",
        location: "Hyderabad / Noida",
        status: "Active",
        rolesCount: 1,
        role: "Software Engineer",
        packageLpa: 24.0,
        minCgpa: 7.5,
        maxBacklogs: 0,
        driveDate: "2026-10-22",
        deadline: "2026-10-12",
        aboutCompany: "Microsoft enables digital transformation for the era of an intelligent cloud and an intelligent edge.",
        jobDescription: "Build world-class enterprise services and consumer applications using Azure, C#, and modern web stacks.",
        requiredSkills: "C#, .NET, Azure, Data Structures, OOP, SQL",
        selectionProcess: "Online Assessment -> Technical Interview 1 -> System Architecture -> HR Round",
        addedAt: "22/10/2026"
    },
    {
        id: "comp_amazon",
        name: "Amazon",
        logoLetter: "A",
        industry: "E-Commerce",
        location: "Bangalore / Chennai",
        status: "Active",
        rolesCount: 2,
        role: "SDE - Cloud & Backend",
        packageLpa: 22.0,
        minCgpa: 7.5,
        maxBacklogs: 0,
        driveDate: "2026-10-28",
        deadline: "2026-10-18",
        aboutCompany: "Amazon is guided by four principles: customer obsession, passion for invention, commitment to operational excellence, and long-term thinking.",
        jobDescription: "Work on high-throughput backend microservices powering AWS and core Amazon retail platform.",
        requiredSkills: "Java, AWS, Microservices, REST APIs, DynamoDB",
        selectionProcess: "Amazon Online Assessment (OA) -> Technical Round 1 -> Technical Round 2 -> Bar Raiser",
        addedAt: "22/10/2026"
    },
    {
        id: "comp_cisco",
        name: "Cisco Systems",
        logoLetter: "C",
        industry: "Information Technology",
        location: "Bangalore",
        status: "Active",
        rolesCount: 1,
        role: "Software Consulting Engineer",
        packageLpa: 16.5,
        minCgpa: 7.0,
        maxBacklogs: 0,
        driveDate: "2026-11-04",
        deadline: "2026-10-25",
        aboutCompany: "Cisco Systems is an American multinational digital communications technology corporation headquartered in San Jose, California. Cisco develops, manufactures, and sells networking hardware, software, telecommunications equipment, cybersecurity systems, and high-performance cloud connectivity products.",
        jobDescription: "As a Software Consulting Engineer, you will design, automate, and deploy mission-critical software solutions and enterprise networking systems. Responsibilities include developing automated network management scripts, integrating cloud APIs, building microservices for telemetry monitoring, and resolving complex technical issues across large-scale distributed architectures.",
        requiredSkills: "Computer Networks (TCP/IP, Routing & Switching), Python, Linux / Unix Shell Scripting, REST APIs, Docker, Data Structures & Algorithms, Network Automation",
        selectionProcess: "Round 1: Online Technical Assessment (MCQs on Networking, OS, Aptitude & 2 Coding Questions) -> Round 2: Technical Interview 1 (Core Networks, Data Structures, Problem Solving) -> Round 3: Technical & Architectural Interview 2 (System Design, Projects & Scenario-based questions) -> Round 4: Managerial & HR Behavioral Discussion",
        addedAt: "22/10/2026"
    },
    {
        id: "comp_ibm",
        name: "IBM",
        logoLetter: "I",
        industry: "Information Technology",
        location: "Bangalore / Hyderabad / Pune",
        status: "Active",
        rolesCount: 1,
        role: "Associate Software Engineer",
        packageLpa: 11.5,
        minCgpa: 7.0,
        maxBacklogs: 0,
        driveDate: "2026-10-30",
        deadline: "2026-10-20",
        aboutCompany: "International Business Machines Corporation (IBM) is a global technology and innovation leader headquartered in Armonk, New York. Operating in over 175 countries, IBM leads breakthroughs in enterprise AI (WatsonX), Hybrid Cloud platforms (Red Hat OpenShift), quantum computing, and secure enterprise digital infrastructure.",
        jobDescription: "As an Associate Software Engineer at IBM, you will be part of agile product engineering squads building scalable cloud-native applications and AI-driven solutions. You will design backend services, implement RESTful microservices, optimize database queries, write automated unit tests, and collaborate with cross-functional global teams to deliver enterprise software solutions.",
        requiredSkills: "Java / Python, Object-Oriented Programming (OOP), Data Structures & Algorithms, SQL, Git & GitHub, Cloud Computing Basics (IBM Cloud / AWS), Linux",
        selectionProcess: "Round 1: Cognitive Ability & English Assessment -> Round 2: Online Coding Assessment (HackerRank) -> Round 3: Technical Interview (Core Computer Science, Projects & Live Coding) -> Round 4: HR & Cultural Fitment Discussion",
        addedAt: "22/10/2026"
    },
    {
        id: "comp_oracle",
        name: "Oracle",
        logoLetter: "O",
        industry: "Information Technology",
        location: "Bangalore / Hyderabad",
        status: "Active",
        rolesCount: 1,
        role: "Server Technology Associate",
        packageLpa: 18.0,
        minCgpa: 7.2,
        maxBacklogs: 0,
        driveDate: "2026-11-10",
        deadline: "2026-10-30",
        aboutCompany: "Oracle offers integrated suites of applications plus secure, autonomous infrastructure in the Oracle Cloud.",
        jobDescription: "Develop scalable database systems and cloud infrastructure software with enterprise-grade durability.",
        requiredSkills: "Java, SQL, PL/SQL, Operating Systems, DBMS internals, Cloud Computing",
        selectionProcess: "Oracle Coding Challenge -> Technical Round 1 -> Technical Round 2 -> HR",
        addedAt: "22/10/2026"
    },
    {
        id: "comp_goldmansachs",
        name: "Goldman Sachs",
        logoLetter: "G",
        industry: "Finance",
        location: "Bangalore",
        status: "Upcoming",
        rolesCount: 1,
        role: "Engineering Analyst - FinTech",
        packageLpa: 25.0,
        minCgpa: 8.0,
        maxBacklogs: 0,
        driveDate: "2026-11-20",
        deadline: "2026-11-10",
        aboutCompany: "Goldman Sachs is a leading global investment banking, securities, and investment management firm.",
        jobDescription: "Build ultra-low latency transaction systems and algorithmic financial models for global trading desks.",
        requiredSkills: "C++, Java, Algorithms, Mathematics, Financial Modeling, Multithreading",
        selectionProcess: "HackerRank Coding Test -> Math & Quant Test -> 3 Technical Rounds -> HR Round",
        addedAt: "22/10/2026"
    },
    {
        id: "comp_jpmorgan",
        name: "JPMorgan Chase & Co.",
        logoLetter: "J",
        industry: "Finance",
        location: "Mumbai / Bengaluru",
        status: "Upcoming",
        rolesCount: 1,
        role: "Software Engineer Associate",
        packageLpa: 19.5,
        minCgpa: 7.5,
        maxBacklogs: 0,
        driveDate: "2026-11-25",
        deadline: "2026-11-15",
        aboutCompany: "JPMorgan Chase is one of the oldest financial institutions, offering investment banking and asset management worldwide.",
        jobDescription: "Develop digital banking software, payment gateways, and risk analytics dashboards.",
        requiredSkills: "Java, Spring Boot, React, Kafka, SQL, Cloud Architecture",
        selectionProcess: "Code for Good Hackathon / Online Assessment -> Technical Interview -> Behavioral Round",
        addedAt: "22/10/2026"
    },
    {
        id: "comp_deloitte",
        name: "Deloitte USI",
        logoLetter: "D",
        industry: "Consulting",
        location: "Hyderabad / Gurgaon",
        status: "Upcoming",
        rolesCount: 1,
        role: "Technology Consulting Analyst",
        packageLpa: 12.0,
        minCgpa: 6.8,
        maxBacklogs: 1,
        driveDate: "2026-12-02",
        deadline: "2026-11-22",
        aboutCompany: "Deloitte provides audit, consulting, financial advisory, risk management, and tax services.",
        jobDescription: "Advise enterprise clients on digital transformation, cloud migrations, and ERP modernizations.",
        requiredSkills: "Python, SQL, Business Analysis, Cloud Fundamentals, Agile, Tableau",
        selectionProcess: "Cognitive Assessment -> Tech Assessment -> Case Study Round -> Partner Interview",
        addedAt: "22/10/2026"
    },
    {
        id: "comp_sap",
        name: "SAP Labs",
        logoLetter: "S",
        industry: "Information Technology",
        location: "Bangalore",
        status: "Upcoming",
        rolesCount: 1,
        role: "Cloud Developer Associate",
        packageLpa: 15.5,
        minCgpa: 7.0,
        maxBacklogs: 0,
        driveDate: "2026-12-10",
        deadline: "2026-11-30",
        aboutCompany: "SAP is the market leader in enterprise application software, helping companies of all sizes run at their best.",
        jobDescription: "Build modern microservices on the SAP Business Technology Platform for enterprise clients worldwide.",
        requiredSkills: "Java, Node.js, Cloud Foundry, Kubernetes, REST APIs, Microservices",
        selectionProcess: "Online Coding Test -> Technical Interview 1 -> Technical Interview 2 -> Management Round",
        addedAt: "22/10/2026"
    },
    {
        id: "comp_adobe",
        name: "Adobe",
        logoLetter: "A",
        industry: "Information Technology",
        location: "Noida / Bangalore",
        status: "Upcoming",
        rolesCount: 1,
        role: "Product Quality Engineer",
        packageLpa: 21.0,
        minCgpa: 7.8,
        maxBacklogs: 0,
        driveDate: "2026-12-18",
        deadline: "2026-12-08",
        aboutCompany: "Adobe is changing the world through digital experiences, empowering creativity and digital document standards.",
        jobDescription: "Automate testing infrastructure and build test suites for Creative Cloud web applications and AI generative tools.",
        requiredSkills: "Python, JavaScript, Selenium, CI/CD, Computer Vision basics, Linux",
        selectionProcess: "Coding Assessment -> System Testing Design -> Technical Round -> HR",
        addedAt: "22/10/2026"
    },
    {
        id: "comp_tcs",
        name: "Tata Consultancy Services (TCS Digital)",
        logoLetter: "T",
        industry: "Information Technology",
        location: "Pan India",
        status: "Not Active",
        rolesCount: 0,
        role: "Digital Software Engineer",
        packageLpa: 7.5,
        minCgpa: 6.5,
        maxBacklogs: 1,
        driveDate: "2026-08-15",
        deadline: "2026-08-01",
        aboutCompany: "TCS is an Indian multinational IT services and consulting company headquartered in Mumbai.",
        jobDescription: "Develop full-stack web and enterprise solutions for international BFSI and telecom clients.",
        requiredSkills: "Java, Python, SQL, HTML/CSS, JavaScript, Git",
        selectionProcess: "TCS National Qualifier Test (NQT) -> Technical Interview -> HR Round",
        addedAt: "10/08/2026"
    },
    {
        id: "comp_infosys",
        name: "Infosys (Power Programmer)",
        logoLetter: "I",
        industry: "Information Technology",
        location: "Mysore / Bangalore",
        status: "Not Active",
        rolesCount: 0,
        role: "Specialist Programmer",
        packageLpa: 9.5,
        minCgpa: 6.5,
        maxBacklogs: 1,
        driveDate: "2026-08-22",
        deadline: "2026-08-10",
        aboutCompany: "Infosys is a global leader in next-generation digital services and consulting across 56 countries.",
        jobDescription: "Work on cutting-edge software engineering projects involving cloud architectures and full-stack solutions.",
        requiredSkills: "Data Structures, Python, Java, Competitive Coding, Problem Solving",
        selectionProcess: "HackWithInfy Contest -> Technical Interview -> HR Round",
        addedAt: "12/08/2026"
    },
    {
        id: "comp_wipro",
        name: "Wipro (Turbo Hiring)",
        logoLetter: "W",
        industry: "Information Technology",
        location: "Bangalore / Pune",
        status: "Not Active",
        rolesCount: 0,
        role: "Project Engineer - Turbo",
        packageLpa: 6.5,
        minCgpa: 6.0,
        maxBacklogs: 1,
        driveDate: "2026-08-28",
        deadline: "2026-08-16",
        aboutCompany: "Wipro is a leading technology services and consulting company focused on building innovative solutions.",
        jobDescription: "Application development, software maintenance, and testing across enterprise platforms.",
        requiredSkills: "Java, C++, SQL, Basics of OOP, Web Fundamentals",
        selectionProcess: "National Talent Hunt (NTH) -> Technical Round -> HR Round",
        addedAt: "15/08/2026"
    },
    {
        id: "comp_accenture",
        name: "Accenture",
        logoLetter: "A",
        industry: "Consulting",
        location: "Bangalore / Hyderabad",
        status: "Not Active",
        rolesCount: 0,
        role: "Advanced Application Engineering Analyst",
        packageLpa: 8.5,
        minCgpa: 6.5,
        maxBacklogs: 1,
        driveDate: "2026-09-05",
        deadline: "2026-08-25",
        aboutCompany: "Accenture is a global professional services company with leading capabilities in digital, cloud, and security.",
        jobDescription: "Develop and test custom applications for fortune 500 enterprises using cloud platforms.",
        requiredSkills: "Java, Python, Cloud Fundamentals, Agile, Software Engineering",
        selectionProcess: "Cognitive & Technical Assessment -> Coding Round -> Technical Interview -> HR",
        addedAt: "20/08/2026"
    }
];

export function getStoredCompanies() {
    try {
        const stored = localStorage.getItem(COMPANIES_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Ensure initial structured companies are present alongside any user added companies
                let wasUpdated = false;
                let merged = parsed.map(comp => {
                    const compName = (comp.name || "").toLowerCase().trim();
                    const initMatch = INITIAL_COMPANIES.find(ic => ic.name.toLowerCase().trim() === compName);
                    if (initMatch) {
                        // If aboutCompany or jobDescription or requiredSkills is missing/empty, enrich it
                        if (!comp.aboutCompany || !comp.jobDescription || !comp.requiredSkills || !comp.selectionProcess) {
                            wasUpdated = true;
                            return {
                                ...comp,
                                aboutCompany: comp.aboutCompany || initMatch.aboutCompany,
                                jobDescription: comp.jobDescription || initMatch.jobDescription,
                                requiredSkills: comp.requiredSkills || initMatch.requiredSkills,
                                selectionProcess: comp.selectionProcess || initMatch.selectionProcess,
                                role: comp.role || initMatch.role,
                                packageLpa: comp.packageLpa !== undefined ? comp.packageLpa : initMatch.packageLpa
                            };
                        }
                    }
                    return comp;
                });

                const existingNames = new Set(merged.map(c => (c.name || "").toLowerCase().trim()));
                const missing = INITIAL_COMPANIES.filter(c => !existingNames.has(c.name.toLowerCase().trim()));
                if (missing.length > 0) {
                    merged = [...merged, ...missing];
                    wasUpdated = true;
                }

                if (wasUpdated) {
                    saveCompanies(merged);
                }
                return merged;
            }
        }
    } catch (e) {
        console.warn("Could not read companies from localStorage:", e);
    }
    // Return initial structured companies if localStorage is empty
    saveCompanies(INITIAL_COMPANIES);
    return INITIAL_COMPANIES;
}

export function saveCompanies(companies) {
    try {
        localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companies));
    } catch (e) {
        console.warn("Could not save companies to localStorage:", e);
    }
}

export function addCompany(companyData) {
    const companies = getStoredCompanies();
    const name = companyData.name ? companyData.name.trim() : "";
    if (!name) return null;

    // Check if company already exists
    const existingIndex = companies.findIndex(c => c.name.toLowerCase() === name.toLowerCase());

    const newCompany = {
        id: "comp_" + Date.now(),
        name: name,
        logoLetter: name.charAt(0).toUpperCase(),
        industry: companyData.industry || "Information Technology",
        location: companyData.location || "Bangalore",
        status: companyData.status || "Active",
        rolesCount: Number(companyData.rolesCount) || 1,
        // Placement drive details entered when adding company
        role: companyData.role || "Software Engineer",
        packageLpa: companyData.packageLpa !== undefined && companyData.packageLpa !== "" ? parseFloat(companyData.packageLpa) : 10,
        minCgpa: companyData.minCgpa !== undefined && companyData.minCgpa !== "" ? parseFloat(companyData.minCgpa) : 6.5,
        maxBacklogs: companyData.maxBacklogs !== undefined && companyData.maxBacklogs !== "" ? parseInt(companyData.maxBacklogs, 10) : 0,
        driveDate: companyData.driveDate || "2026-09-20",
        deadline: companyData.deadline || "2026-09-15",
        aboutCompany: companyData.aboutCompany || "",
        jobDescription: companyData.jobDescription || "",
        requiredSkills: companyData.requiredSkills || "",
        selectionProcess: companyData.selectionProcess || "",
        addedAt: new Date().toLocaleDateString("en-GB")
    };

    let updated;
    if (existingIndex >= 0) {
        updated = [...companies];
        updated[existingIndex] = { ...updated[existingIndex], ...newCompany, id: updated[existingIndex].id };
    } else {
        updated = [newCompany, ...companies];
    }

    saveCompanies(updated);
    return newCompany;
}

export function updateCompany(id, updatedFields) {
    const companies = getStoredCompanies();
    const index = companies.findIndex(c => c.id === id);
    if (index === -1) return null;

    const current = companies[index];
    const name = updatedFields.name !== undefined ? updatedFields.name.trim() : current.name;
    const updated = {
        ...current,
        ...updatedFields,
        name: name,
        logoLetter: name ? name.charAt(0).toUpperCase() : current.logoLetter,
        rolesCount: updatedFields.rolesCount !== undefined ? Number(updatedFields.rolesCount) : current.rolesCount,
        packageLpa: updatedFields.packageLpa !== undefined && updatedFields.packageLpa !== "" ? parseFloat(updatedFields.packageLpa) : current.packageLpa,
        minCgpa: updatedFields.minCgpa !== undefined && updatedFields.minCgpa !== "" ? parseFloat(updatedFields.minCgpa) : current.minCgpa,
        maxBacklogs: updatedFields.maxBacklogs !== undefined && updatedFields.maxBacklogs !== "" ? parseInt(updatedFields.maxBacklogs, 10) : current.maxBacklogs,
        updatedAt: new Date().toLocaleDateString("en-GB")
    };

    const newCompaniesList = [...companies];
    newCompaniesList[index] = updated;
    saveCompanies(newCompaniesList);
    return updated;
}

export function deleteCompany(id) {
    const companies = getStoredCompanies();
    const updated = companies.filter(c => c.id !== id);
    saveCompanies(updated);
    return updated;
}
