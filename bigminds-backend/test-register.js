const axios = require('axios');

axios.post('http://localhost:5000/api/auth/register', {
  firstName: "Test",
  lastName: "Teacher",
  email: "testteacher99@example.com",
  password: "password123",
  role: "teacher",
  city: "TestCity",
  educationLevel: "bachelor",
  targetExam: "other"
}).then(res => {
  console.log("Success! Role created as:", res.data.user.role);
}).catch(err => {
  console.error("Error:", err.response ? err.response.data : err.message);
});
