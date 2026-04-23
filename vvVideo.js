import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { promises as fs } from "fs";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));

export async function Video(quotedMessage, jid, msg, bot) {
  const videoDir = './Downloads/Videos';
  
  await fs.mkdir(path.resolve(__dirname, videoDir), { recursive: true });
  
  const fakeMsg = { message: quotedMessage };
  
  console.log("Downloading ...");
  
  const buffer = await downloadMediaMessage(fakeMsg, 'buffer');
  
  const Mtype = quotedMessage?.videoMessage?.mimetype ?? 'video/mp4';
  
  const ext = Mtype.split('/')[1] || 'mp4';
  
  const filename = `${videoDir}/video-${Date.now()}.${ext}`;
  
  // await fs.writeFile(filename, buffer);  // Uncomment to save to disk
  
  console.log("Video Saved Successfully:", filename);
  
  await bot.sendMessage(jid, {
    video: buffer,
    caption: "View Once Media Downloaded! \n\n{@Kifayatullah}",
    contextInfo: { isForwarded: true, forwardingScore: 999 }
  }, {
    quoted: msg
  });
  
  console.log(chalk.red("Media Sent Successfully."));
}