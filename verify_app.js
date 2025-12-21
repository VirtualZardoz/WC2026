const puppeteer = require('puppeteer');

(async () => {
  const ports = [3000, 3001, 3002];
  let found = false;

  for (const port of ports) {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    const url = `http://localhost:${port}/login`;
    console.log(`Checking ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 5000 });
      console.log(`Port ${port} is active!`);
      const title = await page.title();
      console.log(`Page title: ${title}`);
      await page.screenshot({ path: `verify_${port}.png` });
      found = true;
      await browser.close();
      break;
    } catch (e) {
      console.log(`Port ${port} failed: ${e.message}`);
    }
    await browser.close();
  }

  if (!found) {
    console.log('No active port found');
    process.exit(1);
  }
})();
