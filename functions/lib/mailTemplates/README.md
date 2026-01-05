# Mail Templates

Questa cartella contiene i template HTML utilizzati per le notifiche email inviate dal progetto Nimbus.

## Template disponibili

- **baseTemplate**  
  Layout comune utilizzato da tutte le email (header, contenuto, footer).

- **dailyBriefTemplate**  
  Template per il Daily Brief generato tramite AI.

- **taskReminderTemplate**  
  Template per le email di promemoria dei task in scadenza.

## Note di sicurezza

I contenuti inseriti nei template provengono esclusivamente da fonti controllate (database applicativo e AI), pertanto non viene applicato
escaping HTML.
