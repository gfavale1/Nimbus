# Deploy – Nimbus

Questa cartella contiene i file e gli script utilizzati per la gestione del deploy e dell’esecuzione dell’applicazione nei diversi ambienti (sviluppo locale e produzione).

L’obiettivo è, o almeno ci ho provato, di mantenere una chiara separazione tra ambiente di sviluppo (DEV) e ambiente di produzione (PROD), utilizzando gli strumenti ed i meccanismi appropriati per ciascun contesto visti durante altri corsi
del curriculum Cloud Computing.

## Contenuto della cartella

deploy/
- docker-compose.yml
- start_backend.sh
- start_frontend.sh
- README_DEPLOY.md

## Ambienti supportati

### Ambiente di sviluppo (DEV)

In ambiente di sviluppo viene utilizzato Docker Compose. Il frontend è eseguito tramite Vite Dev Server, il backend come applicazione Node.js ed il database MySQL è containerizzato.

### Ambiente di produzione (PROD)

In produzione backend e frontend vengono eseguiti su Azure App Service Linux. Il frontend è servito come contenuto statico e l’avvio delle applicazioni è gestito tramite script shell. Azure Static Web App e Azure Functions sono gestite separatamente.

## Docker Compose (Sviluppo locale)

Il file docker-compose.yml è pensato esclusivamente per lo sviluppo locale.

Servizi inclusi:
- db: MySQL 8.0 con volume persistente
- backend: Node.js / Express
- frontend: Vite Dev Server

Avvio dell’ambiente di sviluppo:

docker compose up

Accesso ai servizi:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Database MySQL: localhost:3306

In questo ambiente non vengono utilizzati gli script start_backend.sh e start_frontend.sh, dato che Docker usa solo direttamente i Dockerfile e i comandi definiti al loro interno (quelli presenti nelle cartelle di frontend e backend).

## Script di avvio per Produzione (Azure App Service)

Gli script shell presenti in questa cartella sono destinati all’ambiente Azure App Service Linux e vengono utilizzati come Startup Command. Non sono utilizzati da Docker Compose.

### start_backend.sh

Questo script avvia il backend in produzione. Utilizza il filesystem di Azure (/home/site/wwwroot/backend), verifica la presenza di Node.js e npm, installa solo le dipendenze di produzione e avvia il server Node.js tramite npm start. La porta utilizzata dal backend è la 5000. La directory del backend può essere sovrascritta tramite la variabile d’ambiente BACKEND_DIR.

### start_frontend.sh

Questo script avvia il frontend in produzione. Utilizza il filesystem di Azure (/home/site/wwwroot/frontend), verifica la presenza della build dist, la genera se assente e serve i file statici tramite il pacchetto serve. La porta utilizzata è la 8080, che viene poi esposta da Azure verso l’utente finale tramite HTTPS.

## Differenza DEV vs PROD (Frontend)

In sviluppo locale e con Docker Compose il frontend utilizza Vite Dev Server sulla porta 5173. In produzione il frontend è servito come applicazione statica su Azure App Service, che utilizza internamente la porta 8080 e viene esposto all’utente finale tramite HTTPS sulla porta 443.

## Verifica degli script shell

Gli script start_backend.sh e start_frontend.sh sono stati testati in un container Linux che simula l’ambiente Azure App Service (linux ma per intenderci WSL su Visual Studio Code ovviamente).

Comando di test utilizzato:

docker run -it --rm \
  -v "$(pwd)/backend:/home/site/wwwroot/backend" \
  -v "$(pwd)/frontend:/home/site/wwwroot/frontend" \
  -v "$(pwd)/deploy:/deploy" \
  node:18 bash

All’interno del container:

bash /deploy/start_backend.sh
bash /deploy/start_frontend.sh

Questo approccio consente di validare la compatibilità Linux, il corretto uso del filesystem Azure e l’avvio corretto delle applicazioni; ho provato ad utilizzare questo approccio per lo piu per fini universitari.
