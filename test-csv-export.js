const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // First login as admin
    await page.goto('http://localhost:3000/login');
    await page.type('input[name="email"]', 'admin@example.com');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Go to leaderboard
    await page.goto('http://localhost:3000/leaderboard');
    await page.screenshot({ path: 'leaderboard.png' });
    
    // Check for CSV export button
    const csvButton = await page.$('button#export-csv, a#export-csv');
    console.log('CSV Export button found:', csvButton !== null);
    
    await browser.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
