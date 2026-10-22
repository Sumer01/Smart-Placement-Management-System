# Smart Placement Management System (SPMS)

A web-based placement portal designed to help students explore campus recruitment opportunities and manage placement-related activities through a centralized interface.

## Overview

The project includes a React-based frontend and a Python Flask backend. It provides interfaces for student accounts, profiles, connected companies, placement drives, and application tracking. Database configuration depends on the backend setup.

## Screenshots

### Landing Page
Introduces the placement portal and highlights its main capabilities.

![SPMS landing page](screenshots/landing-page.png)

### Login Page
The sign-in interface for portal users.

![SPMS login page](screenshots/login-page.png)

### Student Dashboard
A summary of placement readiness, applications, connected companies, and upcoming drives.

![SPMS student dashboard](screenshots/student-dashboard.png)

### Connected Companies
A searchable view of companies and their hiring status.

![SPMS connected companies](screenshots/connected-companies.png)

### Placement Drives
Displays opportunities, job roles, eligibility information, locations, and application actions.

![SPMS placement drives](screenshots/placement-drives.png)

## Key Features

- Student login and registration interfaces
- Student profile and academic information views
- Connected company listings and hiring status
- Placement drive discovery and eligibility details
- Application status and history interface
- Placement administration interfaces

*Feature availability depends on the current implementation and backend configuration.*

## Technology Stack

- **Frontend:** React.js, JavaScript, HTML, CSS
- **Backend:** Python, Flask
- **Database:** Use the database configured in the backend; confirm the project configuration before documenting a specific database engine.

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3 and pip
- The database service/configuration required by the backend

### Frontend

From the frontend project directory, install dependencies and start the development server:

```bash
npm install
npm start
```

### Backend

From the backend project directory, create and activate a virtual environment, install dependencies, configure environment variables, and run the application's entry point. For example, if `run.py` is the configured entry point:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

Adjust commands to match the actual folder layout and configuration in this repository. Never commit `.env` files, credentials, API keys, or real student data.

## Author

**Sumer Raj**

- GitHub: [@Sumer01](https://github.com/Sumer01)
- LinkedIn: [Sumer Raj](https://linkedin.com/in/sumerraj01)

---

*Academic project focused on streamlining campus placement workflows.*
