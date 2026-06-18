/**
 * testComplaint.js
 * Test script to verify POST /api/complaints endpoint.
 */

require("dotenv").config();
const axios = require("axios");

const API_BASE = "https://civix-backend-8grk.onrender.com/api";
const EMAIL = "vishwasrudrramurthy.2004@gmail.com";
const PASS = "12345678";

async function runTest() {
  console.log("1. Logging in...");
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: EMAIL,
    password: PASS,
  });
  const token = loginRes.data.token;
  console.log("Logged in successfully. Token length:", token.length);

  const authHeaders = { Authorization: `Bearer ${token}` };

  console.log("\n2. Submitting complaint without photo...");
  try {
    const res1 = await axios.post(`${API_BASE}/complaints`, {
      title: "Test Local Complaint",
      description: "This is a test complaint submitted via test script.",
      category: "Roads",
      location: "Indiranagar, Bengaluru"
    }, { headers: authHeaders });
    console.log("Success! Status:", res1.status, "ID:", res1.data._id);
  } catch (err) {
    console.error("Failed without photo:", err.response?.data || err.message);
  }
}

runTest();
