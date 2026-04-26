import { downloadMediaMessage, isJidGroup } from '@whiskeysockets/baileys';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { stmt } from './db.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

export async function store(bot, jid, pn, participant_jid, key, rawType, msg) {
  
  const typeMap = {
    conversation: "text",
    extendedTextMessage: "text",
    imageMessage: "image",
    videoMessage: "video",
    audioMessage: "audio",
    documentMessage: "document",
    stickerMessage: "sticker"
  };
  
  const type = typeMap[rawType] || null;
  if (!type) return;
  
  const message = msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || null;
  
  const caption = msg?.message?.[rawType]?.caption || null;
  
  const text = message || caption || "";
  
  const now = new Date();
  const sent_time = await formatTimePKT(now);
  
  await fs.mkdir(path.resolve(__dirname, "media"), { recursive: true });
  
  const mimeMap = {
    text: "text/plain",
    image: msg.message?.imageMessage?.mimetype,
    video: msg.message?.videoMessage?.mimetype,
    audio: msg.message?.audioMessage?.mimetype,
    document: msg.message?.documentMessage?.mimetype,
    sticker: "image/webp"
  };
  
  const mime = mimeMap[type] || "application/octet-stream";
  
  const ext = mime ? mime.split("/")[1].split(";")[0] : "bin";
  
  const filename = type !== "text" ?
    path.resolve(__dirname, "media", `${key}.${ext}`) : null;
  
  await saveMedia(bot, msg, filename);
  
  const proto = JSON.stringify(msg?.message);
  
  const edits = "[]";
  
  const dl_time = null;
  
  const timestamp_ms = now.getTime();
  
  stmt.insert.run({
    jid,
    key,
    pn,
    participant_jid,
    type,
    mime,
    text,
    sent_time,
    filename,
    proto,
    edits,
    dl_time,
    timestamp_ms
  });
}

async function saveMedia(bot, msg, filename) {
  
  if (!filename) return;
  
  const buffer = await downloadMediaMessage(msg, "buffer", {});
  
  await fs.writeFile(filename, buffer);
}


export async function
recordEdit(bot, jid, msgId, newText) {
  const entry = stmt.get.get(msgId);
  if (!entry) return false;
  
  const edits = JSON.parse(entry.edits || "[]");
  
  edits.push({
    edited_at: await formatTimePKT(new Date()),
    text: newText
  });
  
  stmt.updateEdits.run(JSON.stringify(edits), msgId);
  entry.edits = JSON.stringify(edits);
  
  await bot.sendMessage(jid, {
    text: `*Message Edited! ⚠*\n\n*From:* ${entry.pn}\n*Text:* ${entry.text}\n ${await EditHistory(entry)}`,
    contextInfo: { isForwarded: true, forwardingScore: 999 }
  }, { quoted: msg });
}

async function EditHistory(entry) {
  const edits = JSON.parse(entry.edits || "[]");
  return edits.length > 0 ?
    `\n\n*Edits✏️ (${edits.length}):*\n\n` +
    edits
    .map((edit, i) => `*Edit ${i + 1}* [${edit.edited_at}]:\n${edit.text}`)
    .join("\n\n") :
    "";
}


export async function DetectDeleted(bot, jid, msgId) {
  const entry = stmt.get.get(msgId);
  if (!entry) return null;
  entry.dl_time = await formatTimePKT(new Date());
  stmt.setDlTime.run(entry.dl_time, msgId);
  
  const quoted = {
    key: {
      remoteJid: entry.jid,
      fromMe: false,
      id: msgId,
      participant: entry.participant_jid ?? undefined
    },
    message: JSON.parse(entry.proto)
  };
  
  const header = `*Message Deletion Detected! ⚠*\n\n*From:* ${entry.pn}\n*Sent Time:* ${entry.sent_time}\n*Deleted Time:* ${entry.dl_time}\n*Text / Content:* 📩💌📩`;
  
  await bot.sendMessage(jid, {
    text: header,
    contextInfo: {
      stanzaId: msgId,
      isForwarded: true,
      forwardingScore: 999
    }
  }, { quoted });
  if (entry.type === "text") {
    await bot.sendMessage(jid, {
      text: `${entry.text}\n ${await EditHistory(entry)}`,
      contextInfo: { isForwarded: true, forwardingScore: 999 }
    }, { quoted });
  } else if (entry.filename) {
    const fileBuffer = await fs.readFile(entry.filename);
    
    const mediaType = entry.type === "image" ? "image" :
      entry.type === "video" ? "video" :
      entry.type === "audio" ? "audio" :
      entry.type === "sticker" ? "sticker" :
      "document";
    
    await bot.sendMessage(jid, {
      [mediaType]: fileBuffer,
      mimetype: entry.mime,
      caption: `*Caption:*\n${entry.text}`,
      contextInfo: { isForwarded: true, forwardingScore: 999 }
    }, { quoted });
    
    if (entry.filename) {
      await fs.unlink(entry.filename).catch(() => {});
    }
  }
  stmt.delete.run(msgId);
  return true;
}

export async function startCleanup() {
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
  
  async function cleanup() {
    const cutoff = Date.now() - TWO_DAYS_MS;
    const old = stmt.selectOld.all(cutoff);
    stmt.deleteOld.run(cutoff);
    for (const row of old) {
      if (row.filename) {
        await fs.unlink(entry.filename).catch(() => {});
      }
    }
  }
  await cleanup();
  setInterval(() => cleanup(), 60 * 60 * 1000)
}