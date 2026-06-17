const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected `);
    
    // Drop the old TTL index on pendingusers if it exists, so MongoDB can recreate it with new expiration time
    try {
      await mongoose.connection.db.collection('pendingusers').dropIndex('createdAt_1');
      console.log('✅ Dropped old TTL index on pendingusers');
    } catch (indexErr) {
      // Index might not exist yet or was already dropped, which is fine
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
