const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'salmansajeer7@gmail.com',
      password: 'password123'
    });
    console.log('Login success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Login failed:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();
