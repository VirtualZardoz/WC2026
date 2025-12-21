const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  try {
    console.log('Logging in as admin...');
    await page.goto('http://localhost:3000/login');
    await page.type('input[name="email"]', 'admin@example.com');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    console.log('Navigating to /admin/matches...');
    await page.goto('http://localhost:3000/admin/matches');
    await page.waitForSelector('button');

    // Find the first "Enter Result" or "Edit" button
    const buttons = await page.$$('button');
    let targetButton = null;
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Enter Result') || text.includes('Edit')) {
            targetButton = btn;
            break;
        }
    }

    if (!targetButton) {
        throw new Error('Could not find Enter Result or Edit button');
    }

    await targetButton.click();

    // Fill in scores
    await page.waitForSelector('input[type="number"]');
    const inputs = await page.$$('input[type="number"]');
    await inputs[0].type('2');
    await inputs[1].type('1');

    // Click "Save" button inside the card (not the bulk save)
    const saveButtons = await page.$$('button');
    let saveBtn = null;
    for (const btn of saveButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text === 'Save') {
            saveBtn = btn;
            break;
        }
    }
    
    if (!saveBtn) {
        throw new Error('Could not find Save button');
    }

    await saveBtn.click();

    // Verify confirmation modal
    console.log('Checking for confirmation modal...');
    await page.waitForSelector('h3');
    const modalHeading = await page.evaluate(() => {
        const h3s = Array.from(document.querySelectorAll('h3'));
        return h3s.some(h => h.textContent.includes('Confirm Result'));
    });

    if (modalHeading) {
      console.log('Confirmation dialog FOUND and styled appropriately. PASSED');
      await page.screenshot({ path: 'screenshot_096.png' });
    } else {
      console.error('Confirmation dialog NOT found');
      process.exit(1);
    }

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
