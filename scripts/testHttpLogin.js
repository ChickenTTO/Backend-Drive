async function testLogin() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'driver1', password: 'password123' })
    });
    const json = await res.json();
    console.log('HTTP Login Status:', res.status);
    console.log('HTTP Login Response:', json);
  } catch (err) {
    console.error('Login request failed:', err);
  }
}

testLogin();
