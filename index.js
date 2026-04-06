import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from "chalk";

const __dirname = dirname(fileURLToPath(import.meta.url));

function startBot() {
  const botProcess = spawn('node', [join(__dirname, 'bot.js')], { stdio: 'inherit' });
  
  botProcess.on('close', (code) => {
    console.log(chalk.red("Bot Crashed, Restarting..."));
    setTimeout(startBot, 2000);
  });
  
  botProcess.on('error', (err) => {
    console.error(chalk.red("Error: ",err));
    setTimeout(startBot, 2000);
  });
}

startBot();