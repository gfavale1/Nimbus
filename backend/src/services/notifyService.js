/**
 * notifyService
 *
 * Service centrale per la gestione delle notifiche di Nimbus.
 * Coordina:
 *  - il controllo delle preferenze utente
 *  - la generazione dei contenuti email (template)
 *  - l'invio effettivo tramite notifierClient (Azure Functions)
 *
 * Questo service contiene solo logica applicativa e NON mi effettua chiamate dirette a dei servizi esterni.
 */

const db = require("../config/db");
const { notifyByEmail } = require("./notifierClient");

const baseTemplate = require("./mailTemplates/baseTemplate");
const { dailyBriefTemplate } = require("./mailTemplates/dailyBriefTemplate");
const { noteUpdateTemplate } = require("./mailTemplates/noteUpdateTemplate");
const { reminderTemplate } = require("./mailTemplates/reminderTemplate");
const { noteSharedTemplate } = require("./mailTemplates/noteSharedTemplate");
const { taskReminderTemplate } = require("./mailTemplates/taskReminderTemplate");

/*  
 * Funzionei di supporto per il controllo delle preferenze
 * di notifica dell'utente e per l'invio centralizzato delle email.
 */

async function canNotifyEmail(userId) {
  const [rows] = await db.query(
    "SELECT notify_email FROM user_settings WHERE user_id = ?",
    [userId]
  );
  if (rows.length === 0) return true; // Default se non esistono impostazioni
  
  // Converte 0/1 o false/true in un booleano JavaScript affidabile
  return !!rows[0].notify_email;
}

async function canNotifyReminders(userId) {
  const [rows] = await db.query(
    "SELECT notify_reminders FROM user_settings WHERE user_id = ?",
    [userId]
  );
  if (rows.length === 0) return true;
  return !!rows[0].notify_reminders;
}

/**
 * Invia un'email rispettando le preferenze dell'utente.
 *
 * - Verifica se le notifiche email globali sono abilitate
 * - Verifica opzionale dei promemoria task
 * - Delega l'invio effettivo al notifierClient
 *
 * NB = Le notifiche non devono bloccare il flusso principale
 */

async function sendEmail({ userId, email, subject, html, isTask = false }) {
  // 1. Controllo generale Email
  const emailEnabled = await canNotifyEmail(userId);
  if (!emailEnabled) {
    console.log(`[notifyService] Email disabilitate (global) per user ${userId}`);
    return;
  }

  // 2. Se è un task, controllo anche il flag specifico dei promemoria
  if (isTask) {
    const remindersEnabled = await canNotifyReminders(userId);
    if (!remindersEnabled) {
      console.log(`[notifyService] Promemoria Task disabilitati per user ${userId}`);
      return;
    }
  }

  await notifyByEmail({ userEmail: email, title: subject, body: html });
  console.log(`[notifyService] Email inviata a ${email}`);
}

/* Notifiche relative alla creazione, modifica, eliminazione
 * e condivisione delle note.
 * Le notifiche vengono inviate sia al proprietario
 * che agli utenti con cui la nota è condivisa.
 */

async function notifyUserCreated(user) {
  const html = baseTemplate({
    title: "Benvenuto su Nimbus",
    content: `<p>Ciao <strong>${user.display_name}</strong>,</p><p>il tuo account Nimbus è stato creato con successo.</p>`
  });
  await sendEmail({ userId: user.id, email: user.email, subject: "Benvenuto su Nimbus", html });
}

async function notifyUserUpdated(user) {
  const html = baseTemplate({
    title: "Profilo aggiornato",
    content: `<p>Il tuo profilo Nimbus è stato aggiornato.</p><p>Nuovo nome: <strong>${user.display_name}</strong></p>`
  });
  await sendEmail({ userId: user.id, email: user.email, subject: "Profilo aggiornato", html });
}

async function notifyUserDeleted(user) {
  const html = baseTemplate({
    title: "Account eliminato",
    content: `<p>Il tuo account Nimbus è stato eliminato.</p><p>Ci dispiace vederti andare.</p>`
  });
  await sendEmail({ userId: user.id, email: user.email, subject: "Account eliminato", html });
}

async function notifyNoteShared(note, targetUser, ownerName) {
  const html = noteSharedTemplate({ noteTitle: note.title, ownerName: ownerName });
  await sendEmail({ userId: targetUser.id, email: targetUser.email, subject: `Nota condivisa: ${note.title}`, html });
}

async function notifyNoteCreated(note, owner) {
  const html = noteUpdateTemplate({ noteTitle: note.title, action: "creata" });
  await sendEmail({ userId: owner.dbId || owner.id, email: owner.email, subject: "Nota creata", html });
}

async function notifyNoteUpdated(noteId, updatedTitle) {
  const [rows] = await db.query(
    `SELECT u.id, u.email FROM notes n JOIN users u ON u.id = n.user_id WHERE n.id = ?
     UNION
     SELECT u.id, u.email FROM note_shares ns JOIN users u ON u.id = ns.shared_with_user_id WHERE ns.note_id = ?`,
    [noteId, noteId]
  );
  for (const user of rows) {
    const html = noteUpdateTemplate({ noteTitle: updatedTitle, action: "modificata" });
    await sendEmail({ userId: user.id, email: user.email, subject: "Nota aggiornata", html });
  }
}

async function notifyNoteDeleted(note, owner) {
  const html = noteUpdateTemplate({ noteTitle: note.title, action: "eliminata" });
  await sendEmail({ userId: owner.dbId || owner.id, email: owner.email, subject: "Nota eliminata", html });
}

// Controllo promemoria

async function notifyTaskCreated(task, user) {
  const html = reminderTemplate({ title: "Nuovo task creato", taskTitle: task.title, dueDate: task.due_date });
  // Passiamo isTask: true per attivare il controllo specifico del flag notify_reminders
  await sendEmail({ userId: user.dbId || user.id, email: user.email, subject: "Nuovo task", html, isTask: true });
}

async function notifyTaskUpdated(task, user) {
  const html = reminderTemplate({ title: "Task aggiornato", taskTitle: task.title, dueDate: task.due_date });
  await sendEmail({ userId: user.dbId || user.id, email: user.email, subject: "Task aggiornato", html, isTask: true });
}

async function notifyTaskDeleted(task, user) {
  const html = reminderTemplate({ title: "Task eliminato", taskTitle: task.title, dueDate: null });
  await sendEmail({ userId: user.dbId || user.id, email: user.email, subject: "Task eliminato", html, isTask: true });
}

async function notifyTaskExpiring(task, user) {
  const html = taskReminderTemplate({ 
    taskTitle: task.title, 
    dueDate: task.due_date 
  });
  await sendEmail({ userId: user.id, email: user.email, subject: `Scadenza imminente: ${task.title}`, html, isTask: true });
}

// AI

async function notifyDailyBrief(user, summary) {
  const html = dailyBriefTemplate({ name: user.display_name, summary });
  await sendEmail({ userId: user.id, email: user.email, subject: "Il tuo Daily Brief – Nimbus", html });
}

module.exports = {
  notifyUserCreated,
  notifyUserUpdated,
  notifyUserDeleted,
  notifyNoteCreated,
  notifyNoteUpdated,
  notifyNoteDeleted,
  notifyNoteShared,
  notifyTaskCreated,
  notifyTaskUpdated,
  notifyTaskDeleted,
  notifyDailyBrief,
  notifyTaskExpiring
};