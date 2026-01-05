# Nimbus – Frontend

Frontend sviluppato in **React + Vite**; fornisce l’interfaccia utente per la gestione di **note**, **task**, **allegati**, **condivisioni** e **dashboard**, integrandosi con il backend.

---

## Stack 

- **React**
- **Vite**
- **JavaScript (ES6+)**


---

## Funzionalità Principali

- **Dashboard**
  - Statistiche su note e task
  - Distribuzione task per stato
  - Indicatori di efficienza
  - Daily Brief AI

- **Note**
  - Creazione, modifica ed eliminazione
  - Gestione tag
  - Storico versioni con ripristino
  - Allegati
  - Condivisione con ruoli (owner / editor / viewer)

- **Task**
  - Creazione e modifica
  - Stati e priorità
  - Scadenze e promemoria

- **Autenticazione**
  - Integrazione con **Azure Entra ID**
  - Gestione sessione tramite backend (Easy Auth)

---

## Struttura del progetto

```text
frontend/
├── src/
│   ├── api/            # Configurazione client HTTP (Axios)
│   ├── components/     # Componenti UI e modali
│   ├── context/        # Context (Auth)
│   ├── hooks/          # Hook personalizzati
│   ├── pages/          # Pagine principali (Dashboard, Notes, Tasks, Profile)
│   ├── services/       # Accesso alle API backend
│   ├── styles/         # Stili condivisi
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── vite.config.js
├── .env.example
├── Dockerfile
├── package.json
└── README.md
