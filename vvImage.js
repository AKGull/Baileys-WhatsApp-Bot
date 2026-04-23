import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { promises as fs } from "fs";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));

export async function Image(quotedMessage, jid, msg, bot) {
  
  const imageDir = './Downloads/Images';
  
  await fs.mkdir(path.resolve(__dirname, imageDir), { recursive: true });
  
  const fakeMsg = { message: quotedMessage };
  
  console.log("Downloading ...");
  
  const buffer = await downloadMediaMessage(fakeMsg, 'buffer');
  
  const Mtype = quotedMessage?.imageMessage?.mimetype ?? 'image/jpeg';
  
  const ext = Mtype.split('/')[1] || 'jpeg';
  
  const filename = `${imageDir}/image-${Date.now()}.${ext}`;
  
  // await fs.writeFile(filename, buffer);  // Uncomment to save to disk
  
  console.log("Image Saved Successfully", filename);
  
  await bot.sendMessage(jid, {
    image: buffer,
    caption: "View Once Media Downloaded! \n\n{@Kifayatullah}",
    contextInfo: { isForwarded: true, forwardingScore: 999 }
    
  }, {
    quoted: msg
  });
  
  console.log(chalk.red("Media Sent Successfully."));
}