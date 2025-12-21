const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    const baseUrl = 'http://localhost:3000';
    const testUser = {
      email: `testuser_${Date.now()}@example.com`,
      name: 'Test User',
      password: 'password123'
    };

    console.log('1. Registering test user...');
    await page.goto(`${baseUrl}/register`);
    await page.type('input[name="name"]', testUser.name);
    await page.type('input[name="email"]', testUser.email);
    await page.type('input[name="password"]', testUser.password);
    await page.type('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log('User registered.');

    // Logout
    console.log('Logging out...');
    await page.goto(`${baseUrl}/api/auth/signout`);
    // NextAuth signout page has a "Sign out" button to confirm
    const signoutBtn = await page.$('button');
    if (signoutBtn) {
        await signoutBtn.click();
        await page.waitForNavigation();
    }
    console.log('Logged out.');

    console.log('2. Login as Admin...');
    await page.goto(`${baseUrl}/login`);
    await page.type('input[name="email"]', 'admin@example.com');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log('Logged in as Admin.');

    console.log('3. Resetting user password...');
    await page.goto(`${baseUrl}/admin/users`);
    await page.waitForSelector('table');
    
    // Find the row for the test user
    const userRow = await page.evaluateHandle((email) => {
        const rows = Array.from(document.querySelectorAll('tr'));
        return rows.find(row => row.innerText.includes(email));
    }, testUser.email);

    if (!userRow) throw new Error('Test user row not found');

    // Handle the confirm dialog
    page.on('dialog', async dialog => {
        await dialog.accept();
    });

    // We need to find the "Reset Pass" button in that row
    const resetBtn = await userRow.$('button:last-child'); // It's the last button in the row
    await resetBtn.click();

    // The new password is shown in an alert. We need to catch it.
    let newPassword;
    const alertPromise = new Promise(resolve => {
        page.on('dialog', async dialog => {
            const message = dialog.message();
            if (message.includes('New password:')) {
                const match = message.match(/New password: ([a-z0-9]+)/);
                if (match) {
                    newPassword = match[1];
                    resolve(newPassword);
                }
            }
            await dialog.accept();
        });
    });

    newPassword = await alertPromise;
    console.log(`Password reset. New password: ${newPassword}`);

    // Logout admin
    console.log('Logging out admin...');
    await page.goto(`${baseUrl}/api/auth/signout`);
    const signoutBtnAdmin = await page.$('button');
    if (signoutBtnAdmin) {
        await signoutBtnAdmin.click();
        await page.waitForNavigation();
    }

    console.log('4. Login as user with NEW password...');
    await page.goto(`${baseUrl}/login`);
    await page.type('input[name="email"]', testUser.email);
    await page.type('input[name="password"]', newPassword);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    if (page.url().includes('/predictions')) {
        console.log('Login successful with reset password!');
    } else {
        throw new Error(`Login failed. URL: ${page.url()}`);
    }

    console.log('5. Changing password from profile...');
    await page.goto(`${baseUrl}/profile`);
    await page.waitForSelector('form');

    const newerPassword = 'newerPassword123';
    await page.type('#currentPassword', newPassword);
    await page.type('#newPassword', newerPassword);
    await page.type('#confirmPassword', newerPassword);
    await page.click('button[type="submit"]');

    await page.waitForSelector('.alert-success');
    console.log('Password changed successfully.');

    // Logout and verify newest password
    console.log('Logging out to verify newest password...');
    await page.goto(`${baseUrl}/api/auth/signout`);
    const signoutBtnUser = await page.$('button');
    if (signoutBtnUser) {
        await signoutBtnUser.click();
        await page.waitForNavigation();
    }

    console.log('6. Final login check with newest password...');
    await page.goto(`${baseUrl}/login`);
    await page.type('input[name="email"]', testUser.email);
    await page.type('input[name="password"]', newerPassword);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    if (page.url().includes('/predictions')) {
        console.log('All password tests passed!');
    } else {
        throw new Error(`Final login failed. URL: ${page.url()}`);
    }

  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
