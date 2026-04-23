import { promises as fs } from "fs";

import xnxx from "xnxx-dl";

import axios from "axios";

export async function dlxnxx(jid, msg, bot, text) {

  

  const imageDir = './Downloads/XNXX';

  

  

  await fs.mkdir(imageDir, { recursive: true });

  

  const query = text.replace(/xnxx/i, '').trim();

  

  const result = await xnxx.search(query);

  for (let i = 0; i < result.length; i++) {

    

    const data = await xnxx.getInfo(result[i].url);

    

    console.log(data);
      
      const info = "*Caption:* "+`${data.title}`+"\n\n *Duration:* "+`${data.duration}`;
    

    await bot.sendMessage(jid, {

      image: { url: `${data.thumbnail}` },

      caption: `${info}`,

      contextInfo: {

        isForwarded: true,

        forwardingScore: 999

      }

    }, {

      quoted: msg

    });

     
      await bot.sendMessage(jid,{
        video:{url: `${data.dlink}`}
    });

  }

}