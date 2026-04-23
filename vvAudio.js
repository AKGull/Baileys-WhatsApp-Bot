import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { promises as fs } from "fs";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));

export async function Audio(quotedMessage, jid, msg, bot) {
  const audioDir = './Downloads/Audios';
  
  await fs.mkdir(path.resolve(__dirname, audioDir), { recursive: true });
  
  const fakeMsg = { message: quotedMessage };
  
  console.log("Downloading ...");
  
  const buffer = await downloadMediaMessage(fakeMsg, 'buffer');
  
  const ext = "opus";
  
  const filename = `${audioDir}/audio-${Date.now()}.${ext}`;
  
  // await fs.writeFile(filename, buffer);  // Uncomment to save to disk
  
  console.log("Audio Saved Successfully:", filename);
  
  await bot.sendMessage(jid, {
    audio: buffer,
    mimetype: "audio/ogg; codecs=opus",
    ptt: true,
    contextInfo: { isForwarded: true, forwardingScore: 999 }
  }, {
    quoted: msg
  });
  
  console.log(chalk.red("Media Sent Successfully."));
}