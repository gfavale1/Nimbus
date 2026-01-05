# Azure Functions – Nimbus

**Azure Functions** usate per gestire operazioni asincrone, pianificate e di supporto, separate dal backend principale.

Le Functions vengono utilizzate principalmente per notifiche email, promemoria automatici,
generazione del Daily Brief e task infrastrutturali.

---

## Funzioni disponibili

- **PushNotifyHttp**  
  Function HTTP utilizzata come endpoint centrale per l’invio delle notifiche email.
  Viene chiamata dal backend tramite `notifierClient`.

- **RemindersTimer**  
  Timer Trigger che controlla periodicamente i task in scadenza e invia promemoria agli utenti.

- **DailyBriefTimer**  
  Timer Trigger che genera automaticamente il *Daily Brief* giornaliero utilizzando Azure OpenAI
  e lo invia via email.

- **DbBackupNightly**  
  Timer Trigger per il backup notturno del database su Azure Blob Storage.

---

## Ruolo architetturale

Le Azure Functions sono tenute **separate dal backend** per:

- evitare carichi asincroni sull’App Service
- isolare le operazioni pianificate (timer)
- centralizzare l’invio delle email
- migliorare manutenibilità e scalabilità

Il backend Nimbus si limita a **invocare le Functions**, senza gestire direttamente
email, timer o job schedulati.

---

## Struttura della cartella

```text
functions/
├── lib/                # Moduli condivisi tra le Functions
│   ├── mailTemplates/  # Template email HTML
│   └── ...
├── PushNotifyHttp/
├── RemindersTimer/
├── DailyBriefTimer/
├── DbBackupNightly/
├── host.json
├── package-lock.json
└── package.json
