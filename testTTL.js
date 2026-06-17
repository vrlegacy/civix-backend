// testTTL.js
require("dotenv").config();
const mongoose = require("mongoose");
const PendingUser = require("./models/PendingUser");

(async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const randomSuffix = Math.floor(Math.random() * 100000);
    const testEmail = `vrlegacy.care+ttl${randomSuffix}@gmail.com`;

    console.log(`Sending signup request with unique email: ${testEmail}...`);
    const response = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "TTL Tester",
        email: testEmail,
        password: "password123",
        location: "San Jose",
        role: "citizen"
      })
    });
    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", data);

    if (response.status !== 201) {
      console.error("Signup failed. Exiting test.");
      process.exit(1);
    }

    console.log("\nStarting polling of PendingUser collection. We expect it to disappear in ~3-4 minutes (3 minutes TTL + MongoDB background deletion thread delay)...");
    const startTime = Date.now();

    const interval = setInterval(async () => {
      const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
      try {
        const doc = await PendingUser.findOne({ email: testEmail.toLowerCase() });
        if (doc) {
          console.log(`[${elapsedSeconds}s elapsed] Pending user still exists in database.`);
        } else {
          console.log(`\n🎉 SUCCESS: Pending user was deleted from the database!`);
          console.log(`Total time elapsed: ${elapsedSeconds} seconds (~${Math.round(elapsedSeconds / 60)} minutes).`);
          clearInterval(interval);
          await mongoose.disconnect();
          process.exit(0);
        }
      } catch (err) {
        console.error("Database query error:", err.message);
      }
      
      // Stop after 6 minutes (360 seconds) to prevent infinite loop
      if (elapsedSeconds > 360) {
        console.error("\n❌ FAILED: Pending user was not deleted within 6 minutes. Timeout exceeded.");
        clearInterval(interval);
        await mongoose.disconnect();
        process.exit(1);
      }
    }, 15000); // Poll every 15 seconds

  } catch (error) {
    console.error("Test error:", error);
    process.exit(1);
  }
})();
