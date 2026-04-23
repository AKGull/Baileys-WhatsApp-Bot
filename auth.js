import chalk from "chalk";

export async function connect(bot) {
  
  if (!bot.user && !bot.authState.creds.registered) {
    const waNumber = "923408870810";
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const code = await bot.requestPairingCode(waNumber);
    
    const format = code.slice(0, 4) + "-" + code.slice(4);
    
    console.log(chalk.red("Enter this Code in Your Whatsapp > Linked Devices"));
    
    console.log(chalk.blue("Pairing code:"), chalk.bgBlue(format));
  }
}