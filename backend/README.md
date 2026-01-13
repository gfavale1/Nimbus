# Nimbus – Backend

Backend sviluppato in **Node.js + Express**. Gestisce autenticazione, note, task, allegati, condivisioni, 
notifiche email e funzionalità AI (come Daily Brief).

---

## Stack Tecnologico

- **Node.js + Express**
- **MySQL** (Azure Database for MySQL)
- **Azure Blob Storage** (allegati)
- **Azure Entra ID**
  - Easy Auth 
- **Azure Functions**
  - Invio email
  - Reminder task
  - Daily Brief AI
- **Azure OpenAI**

---

## Struttura del progetto

```text
backend/
├── src/
│   ├── config/        # Configurazione DB e Blob Storage
│   ├── controllers/   # Logica delle API
│   ├── middleware/    # Autenticazione ed error handling
│   ├── models/        # Accesso ai dati (MySQL)
│   ├── routes/        # Definizione endpoint REST
│   └── services/      # Logica applicativa (AI, email, permessi, dashboard)
├── .env.example
├── Dockerfile
├── package.json
└── README.md
