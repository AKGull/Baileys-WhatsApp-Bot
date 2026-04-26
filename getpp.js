export async function getpp(bot, jid, msg, text) {
  const nmbr = text.split(" ")[1];
  
  const targetJid = nmbr ?
    `${nmbr.split(':')[0]}@s.whatsapp.net` :
    jid;
  
  try {
    const hd = await bot.profilePictureUrl(targetJid, 'image');
    
    await bot.sendMessage(jid, {
      image: { url: hd },
      caption: "*Profile Picture Downloaded Successfully.*",
      contextInfo: { isForwarded: true, forwardingScore: 999 }
    }, { quoted: msg });
    
  } catch (e) {
    await bot.sendMessage(jid, {
      text: "*Profile Picture Not Found or Private.*",
      contextInfo: { isForwarded: true, forwardingScore: 999 }
    }, { quoted: msg });
  }
}