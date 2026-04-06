import TikTok from '@tobyg74/tiktok-api-dl';
import { promises as fs } from 'fs';

export async function dltiktok(jid, msg, bot, text) {
  const tikTokUrl = text;
  const info = await TikTok.Downloader(tikTokUrl, { version: "v3" });
  
  
  const vidsd = `${info.result.videoSD}`;
  const vidhd = `${info.result.videoHD}`;
  
  console.log(info);
  
  await bot.sendMessage(jid, {
    video: { url: `${vidsd}` },
    caption: "*🤖 TikTok Video[SD] Downloaded Automatically*",
    contextInfo: {
      isForwarded: true,
      forwardingScore: 999
    }
  }, { quoted: msg });
  
  await bot.sendMessage(jid, {
    video: { url: `${vidhd}` },
    caption: "*🤖 TikTok Video[HD] Downloaded Automatically*",
    contextInfo: {
      isForwarded: true,
      forwardingScore: 999
    }
  }, { quoted: msg });
}