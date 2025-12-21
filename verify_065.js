const puppeteer = require('puppeteer');

async function test() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login');
    
    console.log('Logging in...');
    await page.type('input[name="email"]', 'admin@example.com');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation();
    
    console.log('Navigating to /predictions/knockout...');
    await page.goto('http://localhost:3000/predictions/knockout');
    
    await page.waitForSelector('h2'); // Wait for some header
    
    console.log('Taking screenshot of knockout bracket...');
    await page.screenshot({ path: 'knockout_bracket.png', fullPage: true });
    
    // Check for Round of 32, 16, etc. headers
    const content = await page.evaluate(() => document.body.innerText);
    const hasR32 = content.includes('Round of 32');
    const hasR16 = content.includes('Round of 16');
    const hasQuarter = content.includes('Quarter-finals');
    const hasSemi = content.includes('Semi-finals');
    const hasFinal = content.includes('Final');
    
    console.log('Headers found:', { hasR32, hasR16, hasQuarter, hasSemi, hasFinal });
    
    if (hasR32 && hasR16 && hasQuarter && hasSemi && hasFinal) {
      console.log('VERIFICATION SUCCESSFUL');
    } else {
      console.log('VERIFICATION FAILED: Some headers missing');
    }
    
  } catch (err) {
    console.error('Error during test:', err);
    await page.screenshot({ path: 'error_065.png' });
  } finally {
    await browser.close();
  }
}

test();
