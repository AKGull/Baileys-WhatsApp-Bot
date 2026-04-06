import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  isJidGroup
} from "@whiskeysockets/baileys";

import { promises as fs } from "fs";

import pino from "pino";

import chalk from "chalk";

import { connect } from './auth.js';

import { storeMessage, DetectDeleted, recordEdit } from "./store_msgs.js";

import { Image } from './vvImage.js';

import { Video } from './vvVideo.js';

import { Audio } from './vvAudio.js';

import { dlxnxx } from './xnxx.js';

import { dltiktok } from './tiktok.js'


console.log(chalk.blue("Starting Bot ... \n \n"));

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("session");
  const { version } = await fetchLatestBaileysVersion();
  
  const bot = makeWASocket({
    
    version,
    
    logger: pino({ level: "silent" }),
    
    printQRInTerminal: false,
    
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
    },
    
    browser: Browsers.ubuntu("Chrome"),
    
    markOnlineOnConnect: true,
    
    syncFullHistory: false,
    
  });
  
  await connect(bot);
  
  bot.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    
    
    
    if (connection === "close") {
      
      const reason = lastDisconnect?.error?.output?.statusCode;
      
      if (reason === DisconnectReason.loggedOut) {
        
        console.log(chalk.red("Logged Out !!! \n Deleting Session ..."));
        
        await fs.rm("./session", { recursive: true, force: true });
        
      } else if (reason === DisconnectReason.connectionLost) {
        
        console.log(chalk.red("No Internet Connection !"));
        setTimeout(start, 3000);
        
      } else {
        console.log(chalk.red("Error: Disconnected!"));
        setTimeout(start, 3000);
      }
    }
    
    if (connection === "open") {
      
      console.log(chalk.bold.red.bgGreen("Connected Successfully with: +" + bot.user.id.split(":")[0]));
      
    }
    
  });
  
  bot.ev.on("messages.upsert", async ({ type, messages }) => {
    
    if (type !== "notify") return;
    
    const msg = messages[0];
    
    const jid = msg.key.remoteJid;
    
    if (jid.endsWith('@newsletter')) return;
    
    const key = msg.key.id;
    
    const isGroup = isJidGroup(jid);
    
    const pn = isGroup ?
      msg.key.participant.split('@')[0].split(':')[0] :
      jid.split('@')[0].split(':')[0];
    
    const metadata = isGroup ? await bot.groupMetadata(jid) : null;
    const isPrivate = metadata?.announce ?? false;
    
    const text = msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || "";
    
    
    
    const quotedMessage = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    
    
    const isImg = quotedMessage?.imageMessage?.viewOnce === true;
    
    
    
    const isVideo = quotedMessage?.videoMessage?.viewOnce === true;
    
    
    
    const isVoice = quotedMessage?.audioMessage?.viewOnce === true;
    
    const isXnxx = text.toLowerCase().startsWith("xnxx");
    
    const isTikTok = text.includes(".tiktok.com/");
    
      if (!isPrivate) {
        await storeMessage({ jid, pn, key, text });
      }
    
    
    if (isImg) {
      await Image(quotedMessage, jid, msg, bot);
    }
    
    if (isVideo) {
      await Video(quotedMessage, jid, msg, bot);
    }
    
    if (isVoice) {
      await Audio(quotedMessage, jid, msg, bot);
    }
    
    if (isTikTok) {
      console.log("TikTok");
      await dltiktok(jid, msg, bot, text);
    }
    
    /*if (isXnxx) {
      console.log("XNXX");
      await dlxnxx(jid, msg, bot, text);
    }*/
  });
  
  bot.ev.on("messages.update", async (updates) => {
    for (const update of updates) {
      
      const jid = update.key.remoteJid;
      
      if (jid.endsWith('@newsletter')) continue;
      
      const msgId = update.key.id;
      
      const isGroup = isJidGroup(jid);
      
      const isChannel = jid.endsWith('@newsletter');
      
      const metadata = isGroup ? await bot.groupMetadata(jid) : null;
      const isPrivate = metadata?.announce ?? false;
      
      const editedMsg = update.update?.message?.editedMessage?.message;
      
      const editedText =
        editedMsg?.conversation ||
        editedMsg?.extendedTextMessage?.text ||
        null;
      
      if (update.update?.message === null) {
        await DetectDeleted(bot, jid, msgId);
        
      } else if (editedText) {
        if (!isChannel && !isPrivate) {
          await recordEdit(bot, jid, msgId, editedText);
        }
      }
      
    }
  })
  
  bot.ev.on("creds.update", saveCreds);
  
}
start();