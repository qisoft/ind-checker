import puppeteer from "puppeteer";
import { Bot, InputFile } from "grammy";
import { Low, JSONFile } from "lowdb";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pollInterval: number = Number(process.env.POLL_INTERVAL) || 5;

interface UserData {
  id: number;
  lastResult?: boolean;
}
interface SessionData {
  users: UserData[];
}

if (!process.env.BOT_TOKEN) {
  throw new Error("No token provided");
}

const db = new Low(new JSONFile<SessionData>(join(__dirname, "data/db.json")));
await db.read();

db.data ||= { users: [] };

const bot = new Bot(process.env.BOT_TOKEN);

bot.command("start", async (ctx) => {
  if (ctx.from) {
    db.data!.users.push({ id: ctx.from.id, lastResult: undefined });
    await db.write();
    console.log(
      `User ${ctx.from.username} with id: ${ctx.from.id} is registered`
    );
    await ctx.reply("You are registered");
  }
});

setInterval(async () => {
  if (db.data?.users.length) {
    const [result, screenshot] = await checkForSlots();
    const users = db.data.users;

    console.log(
      `Sending notifications for ${users.length} users: "${result}"...`
    );
    if (screenshot) {
      await Promise.all(
        users.map(async (user) => {
          if (user.lastResult !== result) {
            await bot.api.sendPhoto(user.id, new InputFile(screenshot), {
              caption: result
                ? "Slots are available"
                : "Slots are not available",
            });
          }
        })
      );
    }
    db.data.users = users.map((x) => ({ ...x, lastResult: result }));
  }
}, pollInterval * 60000);

bot.start();
console.log("Bot is started");
console.log("Users registered: ", db.data.users.length);
const checkForSlots = async (): Promise<
  [boolean, string | Buffer | undefined]
> => {
  console.log("Checking slots...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36"
    );
    await page.goto(
      "https://www.vfsvisaonline.com/Netherlands-Global-Online-Appointment_Zone2/AppScheduling/AppWelcome.aspx?P=OG3X2CQ4L1NjVC94HrXIC7tGMHIlhh8IdveJteoOegY%3D"
    );
    await page.click("#plhMain_lnkSchApp");
    await page.waitForSelector("#plhMain_cboVAC");
    await page.select("#plhMain_cboVAC", "72");
    await page.click("#plhMain_btnSubmit");
    await page.waitForSelector("#plhMain_tbxNumOfApplicants");
    await page.$eval("#plhMain_tbxNumOfApplicants", (input) => {
      if (input instanceof HTMLInputElement) {
        input.value = "2";
      }
    });
    await page.select("#plhMain_cboVisaCategory", "8");
    await page.click("#plhMain_btnSubmit");
    try {
      await page.waitForSelector("#plhMain_repAppVisaDetails_tbxFName_0", {
        timeout: 30000,
      });
      return [true, await page.screenshot()];
    } catch (e) {
      return [false, await page.screenshot()];
    }
  } catch (e) {
    console.error("An error has occurred", e);
    return [false, undefined];
  } finally {
    await browser.close();
  }
};
