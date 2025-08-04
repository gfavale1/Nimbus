# Nimbus - Cloud Productivity Platform

Nimbus is a cloud-native platform designed to manage notes, tasks, documents, and activities with a strong focus on productivity and real-time collaboration. This project was developed for the **Cloud Computing (6 ECTS)** course at the University of Salerno.

---

## Features

- Note management with dynamic tagging and file attachments (images, PDFs)
- Task management with deadlines, priorities, and reminders
- Real-time collaboration with version history
- Customizable dashboard with metrics, goals, and recent activity
- Push and email notifications to keep users updated
- Automated backup and data synchronization

---

## Azure Services Used

| Service                      | Purpose                                                                |
|------------------------------|------------------------------------------------------------------------|
| Azure App Service            | Hosts the frontend (React.js) and backend (Node.js)                    |
| Azure Database for MySQL     | Stores structured data such as notes, tasks, and user information      |
| Azure Blob Storage           | Secure storage for user-uploaded files                                 |
| Azure Entra ID               | User authentication and role management                                |
| Azure Functions              | Serverless logic for notifications and scheduled backups               |
| Azure Notification Hubs      | Push/email notifications for users                                     |
| Azure Monitor & App Insights | Application performance monitoring and diagnostics                     |
| Azure CDN                    | Optimizes static file distribution and performance                     |

---

## Project Structure

```
project-root/
|
├── backend/       # REST API - Node.js + Express + Azure SDK
├── frontend/      # User Interface - React.js + Context API
├── deploy/        # Deployment scripts and configuration for Azure
└── README.md      # Project documentation (this file)
```

---

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/gfavale1/Nimbus
cd nimbus
```

### 2. Start the backend
```bash
cd backend
npm install
npm start
```

### 3. Start the frontend
```bash
cd frontend
npm install
npm start
```

---

## Main Technologies

- **Frontend**: React.js, Axios, React Router, Context API
- **Backend**: Node.js, Express, Azure Blob SDK, MySQL2
- **Cloud**: Azure App Service, MySQL, Blob Storage, Notification Hub, Entra ID, Functions, Monitor

---

## Security

- Authentication and role management via Azure Entra ID
- Secure file access using signed SAS tokens from Azure Blob
- Monitoring and diagnostics through Azure Application Insights

---

## Author

Developed by Giacomo Favale  
MSc in Cloud Computing — University of Salerno
