import puppeteer from "puppeteer";
import { Bot, InputFile } from "grammy";
import { Low, JSONFile } from "lowdb";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
console.log(__dirname);
if (!process.env.BOT_TOKEN) {
    throw new Error("No token provided");
}
const db = new Low(new JSONFile(join(__dirname, "db.json")));
await db.read();
db.data || (db.data = { users: [], lastResult: true });
const bot = new Bot(process.env.BOT_TOKEN);
bot.command("start", async (ctx) => {
    if (ctx.from) {
        db.data.users.push(ctx.from.id);
        await db.write();
        await ctx.reply("You are registered");
    }
});
setInterval(async () => {
    var _a;
    if ((_a = db.data) === null || _a === void 0 ? void 0 : _a.users.length) {
        const [result, screenshot] = await checkForSlots();
        const users = db.data.users;
        console.log(`Sending notifications for result: "${result}"...`);
        if (screenshot && db.data.lastResult !== result) {
            await Promise.all(users.map(async (userId) => {
                await bot.api.sendPhoto(userId, new InputFile(screenshot), {
                    caption: result ? "Slots are available" : "Slots are not available",
                });
            }));
        }
        db.data.lastResult = result;
    }
}, 60000);
bot.start();
console.log("Bot is started");
const checkForSlots = async () => {
    console.log("Checking slots...");
    const browser = await puppeteer.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36");
        await page.goto("https://www.vfsvisaonline.com/Netherlands-Global-Online-Appointment_Zone2/AppScheduling/AppWelcome.aspx?P=OG3X2CQ4L1NjVC94HrXIC7tGMHIlhh8IdveJteoOegY%3D");
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
            await page.waitForFunction(() => {
                const message = document.getElementById("plhMain_lblMsg");
                return (message &&
                    message.textContent === "No date(s) available for appointment.");
            }, { timeout: 10000 });
            return [false, await page.screenshot()];
        }
        catch (e) {
            console.log(e);
            return [true, await page.screenshot()];
        }
    }
    catch (e) {
        console.error("An error has occurred", e);
        return [false, undefined];
    }
    finally {
        await browser.close();
    }
};
