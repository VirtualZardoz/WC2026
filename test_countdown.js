const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  
  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login');
  
  console.log('Entering credentials...');
  await page.type('input[name="email"]', 'admin@example.com');
  await page.type('input[name="password"]', 'admin123');
  
  console.log('Clicking login...');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation(),
  ]);
  
  console.log('Current URL:', page.url());
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Days match:', text.includes('days'));
  console.log('Hours match:', text.includes('hours'));
  console.log('Minutes match:', text.includes('minutes'));
  
  if (text.toLowerCase().includes('deadline') || text.includes('remaining')) {
      console.log('Countdown found!');
  } else {
      console.log('Countdown NOT found');
      // console.log('Full text:', text);
  }
  
  await page.screenshot({ path: 'predictions.png' });
  await browser.close();
})();
