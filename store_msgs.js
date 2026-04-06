import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const TZ = "Asia/Karachi";

export async function formatTimePKT(date) {
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

const BACKUP_FILE = path.resolve(__dirname, "backup_msgs.json");

export async function loadBackup() {
  const raw = (await fs.readFile(BACKUP_FILE, "utf8")).trim();
  return raw ? JSON.parse(raw) : [];
}

let _writeLock = Promise.resolve();

export async function saveBackup(data) {
  _writeLock = _writeLock.then(async () => {
    await fs.writeFile(BACKUP_FILE, JSON.stringify(data, null, 2), "utf8");
  });
  await _writeLock;
}

export async function cleanOldData() {
  const data = await loadBackup();
  const cutoff = Date.now() - 172800000; //48 hours in ms
  const before = data.length;
  const filtered = data.filter((msg) => msg._timestamp_ms >= cutoff);
  if (filtered.length !== before) {
    await saveBackup(filtered)
    
  }
}

function EditHistory(entry) {
  return entry.edits && entry.edits.length > 0 ?
    `\n\n*Edits✏️ (${entry.edits.length}):*\n\n` +
    entry.edits
    .map((edit, i) => `*Edit ${i + 1}* [${edit.edited_at}]:\n${edit.text}`)
    .join("\n\n") :
    "";
}
export async function storeMessage({ jid, pn, key, text }) {
  
  const data = await loadBackup();
  
  if (data.some((msg) => msg.key === key)) return; //Prevents Duplicate
  
  const now = new Date();
  const sent_time = await formatTimePKT(now);
  
  const _timestamp_ms = now.getTime();
  
  data.push({
    jid,
    pn,
    key,
    sent_time,
    dl_time: null,
    text,
    edits: [],
    _timestamp_ms
    
  });
  await saveBackup(data);
}

export async function
recordEdit(bot, jid, msgId, newText) {
  const data = await loadBackup();
  const entry = data.find((msg) => msg.key === msgId);
  
  if (!entry) return false;
  
  if (!entry.edits) entry.edits = [];
  
  entry.edits.push({
    edited_at: await formatTimePKT(new Date()),
    text: newText
  });
  await saveBackup(data);
  
  await bot.sendMessage(jid, {
    text: `*⚠️Message Edited!*\n\n*From:* ${entry.pn}
    \n*Text:* ${entry.text}\n ${EditHistory(entry)}`
  });
  
  return true;
}

export async function DetectDeleted(bot, jid, msgId) {
  const data = await loadBackup();
  const entry = data.find((msg) => msg.key === msgId);
  if (entry.dl_time) return null;
  if (!entry) return null;
  if (entry.dl_time) return null;
  entry.dl_time = await formatTimePKT(new Date());
  await saveBackup(data);
  await bot.sendMessage(jid, {
    text: `*⚠️ Message Deleted!*\n\n*From:* ${entry.pn}\n*Sent:* ${entry.sent_time}\n*Deleted:* ${entry.dl_time}\n*Text:* ⬇️📩⬇️`,
    contextInfo: { isForwarded: true, forwardingScore: 999 }
  });
  await bot.sendMessage(jid, {
    text: `${entry.text}\n\n ${EditHistory(entry)}`,
    contextInfo: { isForwarded: true, forwardingScore: 999 }
  });
  return entry;
}
setInterval(cleanOldData, 60000); //Every 1 Minute