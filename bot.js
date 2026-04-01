import {

  makeWASocket,

  useMultiFileAuthState,

  Browsers,

  DisconnectReason,

  downloadMediaMessage,

  fetchLatestBaileysVersion

} from "@whiskeysockets/baileys";

import { promises as fs } from "fs";

import pino from "pino";

import chalk from "chalk";

import { connect } from './auth.js';

import { Image } from './vvImage.js';

import { Video } from './vvVideo.js';

import { Audio } from './vvAudio.js';

import { dlxnxx } from './xnxx.js';

import { dltiktok } from './tiktok.js'

console.log(chalk.blue("Starting Bot ... \n \n"));

async function start() {

  const session = await useMultiFileAuthState("session");

  

  const { version } = await fetchLatestBaileysVersion();

  

  const bot = makeWASocket({

    

    version,

    

    logger: pino({ level: "silent" }),

    

    printQRInTerminal: false,

    

    auth: session.state,

    

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

        

      }

    }

    

    if (connection === "open") {

      

      console.log(chalk.bold.red.bgGreen("Connected Successfully with: +" + bot.user.id.split(":")[0]));

      

    }

    

  });

  

  bot.ev.on("messages.upsert", async ({ type, messages }) => {

    

    

    

    const msg = messages[0];

    

    const jid = msg.key.remoteJid;

    

    

    

    

    

    const text = msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || "";

    

    

    

    const quotedMessage = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    

    

    

    const isImg = quotedMessage?.imageMessage?.viewOnce === true;

    

    

    

    const isVideo = quotedMessage?.videoMessage?.viewOnce === true;

    

    

    

    const isVoice = quotedMessage?.audioMessage?.viewOnce === true;

    

    const isXnxx = text.toLowerCase().startsWith("xnxx");

    

    const isTikTok = text.includes(".tiktok.com/");

    

    if (type !== "notify") return;

    

    

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

    

    if (isXnxx) {

      console.log("XNXX");

      await dlxnxx(jid, msg, bot, text);

    }

  });

  

  bot.ev.on("creds.update", session.saveCreds);

  

}

start();