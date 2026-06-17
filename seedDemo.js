/**
 * seedDemo.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Connects directly to MongoDB and DELETES every Complaint, Poll, and Petition.
 * 2. Finds (or creates) the user vishwasrudrramurthy.2004@gmail.com directly in DB.
 * 3. Uploads the demo image to Cloudinary.
 * 4. Inserts 5 demo Complaints (with Cloudinary image URL), 5 Polls, 5 Petitions.
 *
 * Usage:  node seedDemo.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

// ── Models ────────────────────────────────────────────────────────────────────
const User = require("./models/User");
const Complaint = require("./models/complaint");
const Petition = require("./models/petition");
const Poll = require("./models/polls");

// ── Cloudinary ────────────────────────────────────────────────────────────────
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Config ────────────────────────────────────────────────────────────────────
const SEED_EMAIL = "vishwasrudrramurthy.2004@gmail.com";
const SEED_PASS = "12345678";
const IMAGE_PATH = path.join(__dirname, "images.jpg");

function log(msg) {
  console.log(`[SEED] ${msg}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Connect
  log("Connecting to MongoDB…");
  await mongoose.connect(process.env.MONGODB_URI);
  log("Connected ✅");

  // 2. Wipe all existing data
  log("\nWiping all existing data…");
  const { deletedCount: dc } = await Complaint.deleteMany({});
  log(`  Complaints removed: ${dc}`);
  const { deletedCount: dp } = await Poll.deleteMany({});
  log(`  Polls removed: ${dp}`);
  const { deletedCount: dpt } = await Petition.deleteMany({});
  log(`  Petitions removed: ${dpt}`);

  // 3. Find or create seed user
  log(`\nLooking up user: ${SEED_EMAIL}…`);
  let user = await User.findOne({ email: SEED_EMAIL.toLowerCase() });
  if (user) {
    log(`  Found existing user: ${user.name} (${user.role})`);
  } else {
    log(`  User not found – creating new citizen account…`);
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(SEED_PASS, salt);
    user = await User.create({
      name: "Vishwas Rudramurthy",
      email: SEED_EMAIL.toLowerCase(),
      password: hashedPassword,
      role: "citizen",
      location: "Bengaluru, Karnataka",
      latitude: 12.9716,
      longitude: 77.5946,
    });
    log(`  Created user: ${user.name} (id: ${user._id})`);
  }

  const userId = user._id;

  // 4. Upload the demo image to Cloudinary
  log("\nUploading demo image to Cloudinary…");
  let photoUrl = null;
  if (fs.existsSync(IMAGE_PATH)) {
    try {
      const upload = await cloudinary.uploader.upload(IMAGE_PATH, {
        folder: "complaints",
        resource_type: "image",
        quality: "auto:low",
        fetch_format: "auto",
        transformation: [{ width: 1200, crop: "limit" }],
      });
      photoUrl = upload.secure_url;
      log(`  Uploaded ✅  ${photoUrl}`);
    } catch (err) {
      log(`  Cloudinary upload failed (will proceed without image): ${err.message}`);
    }
  } else {
    log(`  images.jpg not found at ${IMAGE_PATH}, skipping photo upload.`);
  }

  // ── 5. Insert 5 COMPLAINTS ──────────────────────────────────────────────────
  log("\nInserting 5 demo complaints…");
  const complaints = [
    {
      title: "Pothole on MG Road near City Mall",
      description:
        "There is a large pothole on MG Road just in front of City Mall causing accidents and traffic jams. Immediate repair is required before more vehicles are damaged.",
      category: "Roads & Infrastructure",
      location: "MG Road, Bengaluru",
      latitude: 12.9716,
      longitude: 77.5946,
      photo_url: photoUrl,
      status: "received",
      created_by: userId,
    },
    {
      title: "Overflowing garbage bins at Koramangala Market",
      description:
        "The garbage bins at Koramangala Market have been overflowing for more than 5 days. The area is extremely unhygienic, foul-smelling, and attracting stray animals.",
      category: "Sanitation",
      location: "Koramangala Market, Bengaluru",
      latitude: 12.9352,
      longitude: 77.6245,
      photo_url: photoUrl,
      status: "received",
      created_by: userId,
    },
    {
      title: "Street lights not working in HSR Layout Sector 4",
      description:
        "Multiple street lights in HSR Layout Sector 4 have been non-functional for over 2 weeks, making the area extremely dangerous for pedestrians and motorists at night.",
      category: "Electricity",
      location: "HSR Layout Sector 4, Bengaluru",
      latitude: 12.9121,
      longitude: 77.6446,
      photo_url: photoUrl,
      status: "in_review",
      created_by: userId,
    },
    {
      title: "Illegal construction blocking public footpath on 5th Main",
      description:
        "An unauthorized structure has been built on the public footpath of 5th Main, Indiranagar, forcing pedestrians to walk on the busy road and risking accidents.",
      category: "Urban Planning",
      location: "5th Main, Indiranagar, Bengaluru",
      latitude: 12.9783,
      longitude: 77.6408,
      photo_url: photoUrl,
      status: "received",
      created_by: userId,
    },
    {
      title: "Water supply disruption in Whitefield for 3 days",
      description:
        "Residents of Whitefield Extension have not received piped water for the past 3 days. The tankers deployed are insufficient for the entire locality. Children and elderly are severely affected.",
      category: "Water Supply",
      location: "Whitefield Extension, Bengaluru",
      latitude: 12.9698,
      longitude: 77.7499,
      photo_url: photoUrl,
      status: "received",
      created_by: userId,
    },
  ];

  for (let i = 0; i < complaints.length; i++) {
    const c = await Complaint.create(complaints[i]);
    log(`  [${i + 1}/5] "${c.title}"`);
  }

  // ── 6. Insert 5 POLLS ───────────────────────────────────────────────────────
  log("\nInserting 5 demo polls…");
  const polls = [
    {
      title: "Best way to improve public transport in Bengaluru?",
      description:
        "Citizens, vote on which public transport improvement you feel is most urgently needed in our city to ease daily commute.",
      options: [
        "More metro lines",
        "Electric buses on major routes",
        "Dedicated bike lanes",
        "Improved BMTC bus frequency",
      ],
      category: "Transport",
      duration: 7,
      target_location: "Bengaluru",
      targetAuthority: "BBMP / BMTC",
      created_by: userId,
    },
    {
      title: "Should city parks be open 24 hours?",
      description:
        "Do you think public parks in the city should remain open round the clock for the benefit of all citizens including night-shift workers and early risers?",
      options: [
        "Yes, open 24 hours",
        "No, maintain current timings",
        "Only on weekends",
        "Open till midnight only",
      ],
      category: "Urban Development",
      duration: 5,
      target_location: "Bengaluru",
      targetAuthority: "BBMP Parks Department",
      created_by: userId,
    },
    {
      title: "Preferred location for new community library",
      description:
        "The city is planning a new community library. Vote for the area you think needs it the most based on population density and access to education.",
      options: ["Koramangala", "Whitefield", "Hebbal", "Electronic City"],
      category: "Education",
      duration: 10,
      target_location: "Bengaluru",
      targetAuthority: "Bruhat Bengaluru Mahanagara Palike",
      created_by: userId,
    },
    {
      title: "Should plastic bags be banned in local markets?",
      description:
        "Vote on whether a strict ban on single-use plastic bags should be enforced in all local markets across the city to combat pollution.",
      options: [
        "Yes, ban completely",
        "Tax them heavily instead",
        "Promote eco-friendly alternatives only",
        "No ban needed",
      ],
      category: "Environment",
      duration: 14,
      target_location: "Bengaluru",
      targetAuthority: "Karnataka Pollution Control Board",
      created_by: userId,
    },
    {
      title: "Best time slot for scheduled power maintenance cuts?",
      description:
        "If scheduled maintenance cuts are unavoidable, which time slot causes the least disruption to your daily routine?",
      options: ["2 AM – 5 AM", "10 AM – 1 PM", "2 PM – 5 PM", "No preference"],
      category: "Electricity",
      duration: 3,
      target_location: "Bengaluru",
      targetAuthority: "BESCOM",
      created_by: userId,
    },
  ];

  for (let i = 0; i < polls.length; i++) {
    const p = await Poll.create(polls[i]);
    log(`  [${i + 1}/5] "${p.title}"`);
  }

  // ── 7. Insert 5 PETITIONS ───────────────────────────────────────────────────
  log("\nInserting 5 demo petitions…");
  const petitions = [
    {
      creator: userId,
      title: "Demand for a dedicated cycling track on Outer Ring Road",
      summary:
        "We demand the construction of a safe, dedicated cycling track along the Outer Ring Road to protect cyclists' lives.",
      description:
        "Thousands of cyclists risk their lives daily on the Outer Ring Road due to the absence of dedicated cycling infrastructure. Accidents are frequent and fatalities have been reported. We urge the BBMP to allocate space and construct a safe cycling track spanning at least 15 km along the Outer Ring Road from Marathahalli to Hebbal. This will not only save lives but also encourage eco-friendly commuting.",
      category: "Transport",
      location: "Outer Ring Road, Bengaluru",
      latitude: 12.9591,
      longitude: 77.6974,
      targetAuthority: "BBMP Commissioner",
      signatureGoal: 500,
      signaturesCount: 127,
      status: "active",
    },
    {
      creator: userId,
      title: "Install CCTV cameras in all government schools",
      summary:
        "Petition to the Education Department to install CCTV cameras in all government schools for child safety.",
      description:
        "The safety of children in government schools remains a pressing concern. Recent incidents highlight the urgent need for surveillance. We petition the Karnataka Department of Education to install functional CCTV cameras inside and around all government school premises in Bengaluru to deter criminal activity, monitor attendance, and ensure the overall safety of every student.",
      category: "Education",
      location: "Bengaluru (All Government Schools)",
      latitude: 12.9716,
      longitude: 77.5946,
      targetAuthority: "Karnataka Department of Education",
      signatureGoal: 1000,
      signaturesCount: 342,
      status: "active",
    },
    {
      creator: userId,
      title: "Preserve Bellandur Lake – Stop Industrial Dumping Now",
      summary:
        "Immediate enforcement action against industries dumping untreated effluents into Bellandur Lake.",
      description:
        "Bellandur Lake, one of Bengaluru's largest and most historically significant water bodies, is severely polluted due to unchecked dumping of industrial waste and untreated sewage from residential complexes. The lake has caught fire multiple times due to toxic foam. We demand the Karnataka Pollution Control Board take immediate, stringent enforcement action against all polluting industries and implement a comprehensive restoration plan for the lake.",
      category: "Environment",
      location: "Bellandur Lake, Bengaluru",
      latitude: 12.9247,
      longitude: 77.6737,
      targetAuthority: "Karnataka Pollution Control Board",
      signatureGoal: 2000,
      signaturesCount: 891,
      status: "under_review",
    },
    {
      creator: userId,
      title: "Establish a 24×7 Women's Safety Helpline for Bengaluru",
      summary:
        "Set up a dedicated 24×7 helpline and rapid response team specifically for women's safety in Bengaluru.",
      description:
        "Incidents of harassment, stalking, and violence against women have seen a disturbing rise in Bengaluru. Existing emergency lines are overburdened and response times are inadequate. We urge the Bengaluru City Police and the Karnataka State Commission for Women to establish a dedicated 24×7 women's safety helpline with a guaranteed response time of under 15 minutes, staffed by trained women officers. Mobile patrol units should be deployed in high-risk areas.",
      category: "Safety",
      location: "Bengaluru",
      latitude: 12.9716,
      longitude: 77.5946,
      targetAuthority: "Bengaluru City Police Commissioner",
      signatureGoal: 1500,
      signaturesCount: 678,
      status: "assigned",
    },
    {
      creator: userId,
      title: "Free High-Speed Wi-Fi at All BMTC Bus Stands & Metro Stations",
      summary:
        "Petition to BMTC and BMRCL to provide free, reliable, high-speed public Wi-Fi at all major commuter hubs.",
      description:
        "Digital connectivity is no longer a luxury—it is a necessity. Students, working professionals, and daily commuters spend significant time waiting at bus stands and metro stations. Providing free, high-speed Wi-Fi at these locations will empower citizens with internet access, enable digital services on the go, and bridge the digital divide. We petition BMTC and the Bengaluru Metro Rail Corporation Ltd (BMRCL) to implement this initiative under the Smart City Mission.",
      category: "Digital Infrastructure",
      location: "Bengaluru (All BMTC & Metro Stations)",
      latitude: 12.9716,
      longitude: 77.5946,
      targetAuthority: "BMTC & BMRCL",
      signatureGoal: 800,
      signaturesCount: 213,
      status: "active",
    },
  ];

  for (let i = 0; i < petitions.length; i++) {
    const p = await Petition.create(petitions[i]);
    log(`  [${i + 1}/5] "${p.title}"`);
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  log("\n✅ Seeding complete!");
  log("  • 5 Complaints created (with Cloudinary image)");
  log("  • 5 Polls created");
  log("  • 5 Petitions created");
  log(`  • All created as user: ${user.name} (${user.email})`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("[SEED] Fatal error:", err);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
