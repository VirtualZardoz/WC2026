async function register() {
  const response = await fetch('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'testuser_mcp@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    })
  });
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Data:', data);
}
register();
