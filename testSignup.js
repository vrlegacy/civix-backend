(async () => {
  try {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const testEmail = `vrlegacy.care+test${randomSuffix}@gmail.com`;
    console.log(`Sending signup request with unique email: ${testEmail}...`);
    const response = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: testEmail,
        password: "password123",
        location: "San Jose",
        role: "citizen"
      })
    });
    const data = await response.json();
    console.log("✅ Response status:", response.status);
    console.log("✅ Response data:", data);
  } catch (error) {
    console.error("❌ Connection error:", error.message);
  }
})();
