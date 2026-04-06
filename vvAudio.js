import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { promises as fs } from "fs";
import chalk from "chalk";

export async function Audio(quotedMessage, jid, msg, bot) {
  const audioDir = './Downloads/Audios';
  
  await fs.mkdir(audioDir, { recursive: true });
  
  const fakeMsg = { message: quotedMessage };
  
  console.log("Downloading ...");
  
  const buffer = await downloadMediaMessage(fakeMsg, 'buffer');
  
  const Mtype = quotedMessage?.audioMessage?.mimetype ?? 'audio/mp3';
  
  const ext = "opus";
  
  const filename = `${audioDir}/audio-${Date.now()}.${ext}`;
  
  // await fs.writeFile(filename, buffer);  // Uncomment to save to disk
  
  console.log("Audio Saved Successfully:", filename);
  
  await bot.sendMessage(jid, {
    audio: buffer,
    caption: "View Once Media Downloaded! \n\n{@Kifayatullah}",
    contextInfo: { isForwarded: true, forwardingScore: 999 }
  }, {
    quoted: msg
  });
  
  console.log(chalk.red("Media Sent Successfully."));
}