const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login');
    
    await page.type('input[name="email"]', 'admin@example.com');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation();
    console.log('Logged in, current URL:', page.url());
    
    // Navigate to predictions knockout
    await page.goto('http://localhost:3000/predictions/knockout');
    await page.waitForTimeout(2000);
    
    console.log('Page content length:', (await page.content()).length);
    
    // Check for bracket-related classes or text
    const content = await page.content();
    const hasBracket = content.toLowerCase().includes('bracket') || 
                       content.toLowerCase().includes('round of 32') ||
                       content.toLowerCase().includes('final');
    
    console.log('Has bracket-related content:', hasBracket);
    
    await page.screenshot({ path: 'knockout_view.png' });
    console.log('Screenshot saved as knockout_view.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
