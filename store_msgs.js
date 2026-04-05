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

export async function saveBackup(data) {
  await fs.writeFile(BACKUP_FILE, JSON.stringify(data, null, 2), "utf8");
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

export async function storeMessage({ jid, lid, key, text }) {
  
  const data = await loadBackup();
  
  if (data.some((msg) => msg.key === key)) return; //Prevents Duplicate
  
  const jid_nmbr = jid.split("@")[0];
  const lid_nmbr = lid.split("@")[0];
  
  const nmbr = lid_nmbr || jid_nmbr;
  
  const now = new Date();
  const sent_time = await formatTimePKT(now);
  
  const _timestamp_ms = now.getTime();
  
  data.push({
    jid,
    lid,
    nmbr,
    key,
    sent_time,
    dl_time: null,
    text,
    edits: [],
    _timestamp_ms
    
  });
  await saveBackup(data);
}

export async function recordEdit(bot, jid, msgId, newText) {
  const data = await loadBackup();
  const entry = data.find((msg) => msg.key === msgId);
  
  if (!entry) return false;
  
  if (!entry.edits) entry.edits = [];
  
  entry.edits.push({
    edited_at: await formatTimePKT(new Date()),
    text: newText
  });
  await saveBackup(data);
  
  bot.sendMessage(jid, {
    text: `*⚠️Message Edited!*\n\n*From: ${entry.nmbr}*\n\n
    *Before: * \n${entry.text}\n\n` +
      (entry.edits && entry.edits.length > 0 ?
        `*Edits (${entry.edits.length}):*\n` +
        entry.edits
        .map((edit, i) =>
          `*Edit ${i + 1}:* [${edit.edited_at}]:\n${edit.text}`
        )
        .join("\n\n") :
        "")
  });
  
  return true;
}

export async function DetectDeleted(bot, jid, msgId) {
  const data = await loadBackup();
  const entry = data.find((msg) => msg.key === msgId);
  if (!entry) return null;
  entry.dl_time = await formatTimePKT(new Date());
  await saveBackup(data);
  bot.sendMessage(jid, {
    text: `*⚠️Message Deletion Detected!*\n\n
    *Sent: * ${entry.sent_time}\n
    *Deleted: * ${entry.dl_time}\n
    *From: ${entry.nmbr}*
    *Text: * ⬇️📩⬇️`,
    contextInfo: { isForwarded: true, forwardingScore: 999 }
  });
  bot.sendMessage(jid, {
    text: `${entry.text}\n\n` +
      (entry.edits && entry.edits.length > 0 ?
        `*Edits (${entry.edits.length}):*\n` +
        entry.edits
        .map((edit, i) =>
          `*Edit ${i + 1}:* [${edit.edited_at}]:\n${edit.text}`
        )
        .join("\n\n") :
        ""
      ),
    contextInfo: { isForwarded: true, forwardingScore: 999 }
  });
  return entry;
}
setInterval(cleanOldData, 60000); //Every 1 Minute