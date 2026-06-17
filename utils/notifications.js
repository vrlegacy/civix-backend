const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // or another SMTP service
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

exports.sendComplaintConfirmation = async (email, complaintId) => {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Complaint Submitted",
    text: `Hey ${email}, this mail is from Civix platform. Your recent complaint (ID: ${complaintId}) has been submitted and is under review. You will receive a mail once it is resolved.`,
  });
};

exports.notifyVolunteerAssignment = async (email, complaintId) => {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Complaint Assigned",
    text: `Hey ${email}, this mail is from Civix platform. You have been assigned a new petition/complaint (ID: ${complaintId}). Please log in to your volunteer dashboard and handle it accordingly.`,
  });
};
