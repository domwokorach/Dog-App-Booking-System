const nodemailer = require("nodemailer");

// create transporter (using Gmail as example - can be configured for other email providers )
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || "your-email@gmail.com",
      pass: process.env.EMAIL_PASS || "your-app-password",
    },
  });
};

const getClientAppBaseUrl = () => {
  const baseUrl = process.env.CLIENT_URL || process.env.SECONDARY_URL || "http://localhost:5173";
  return baseUrl.replace(/\/$/, "");
};

// send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${getClientAppBaseUrl()}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
      to: email,
      subject: "Password Reset Request - Furkids",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>You requested a password reset for your Furkids account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email from Furkids. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// send booking confirmation
const sendBookingConfirmationEmail = async (
  userEmail,
  userName,
  appointmentDetails,
  isRescheduled = false
) => {
  try {
    const transporter = createTransporter();
    const clientAppBaseUrl = getClientAppBaseUrl();

    const {
      bookingReference,
      petName,
      petBreed,
      groomerName,
      serviceType,
      startTime,
      endTime,
      duration,
    } = appointmentDetails;

    // format the date and time
    const appointmentDate = new Date(startTime);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const endDateTime = new Date(endTime);
    const formattedEndTime = endDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const serviceDisplayName = serviceType === "basic" ? "Basic Grooming" : "Full Service Grooming";

    // customize content based on whether it's a reschedule or new booking
    const headerTitle = isRescheduled ? "🙌 Appointment Rescheduled!" : "🎉 Booking Confirmed!";
    const headerSubtitle = isRescheduled
      ? "Your pet grooming appointment has been successfully rescheduled"
      : "Your pet grooming appointment has been successfully booked";
    const mainMessage = isRescheduled
      ? `Your grooming appointment for <strong>${petName}</strong> has been rescheduled. Here are your updated booking details:`
      : `Great news! We've confirmed your grooming appointment for <strong>${petName}</strong>. Here are your booking details:`;

    const mailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
      to: userEmail,
      subject: isRescheduled
        ? `Appointment Rescheduled - Booking reference ${bookingReference}`
        : `Booking Confirmed - Booking reference ${bookingReference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
          <!-- Header -->
          <div style="background-color: ${
            isRescheduled ? "#3b82f6" : "#10b981"
          }; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">${headerTitle}</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              ${headerSubtitle}
            </p>
          </div>

          <!-- Main Content -->
          <div style="background-color: white; padding: 30px 20px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Hello ${userName},
            </p>
            <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
              ${mainMessage}
            </p>

            <!-- Booking Reference -->
            <div style="background-color: #f3f4f6; border-left: 4px solid ${
              isRescheduled ? "#3b82f6" : "#10b981"
            }; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Booking Reference
              </h3>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: ${
                isRescheduled ? "#3b82f6" : "#10b981"
              }; font-family: monospace;">
                #${bookingReference}
              </p>
            </div>

            <!-- Appointment Details -->
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">
                📅 ${isRescheduled ? "Updated " : ""}Appointment Details
              </h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 30%;">Date:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Time:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${formattedTime} - ${formattedEndTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Duration:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${duration} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Service:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${serviceDisplayName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Pet:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${petName} (${petBreed})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Groomer:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${groomerName}</td>
                </tr>
              </table>
            </div>

            <!-- Important Notes -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">
                ⚠️ Important Reminders
              </h4>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>Please arrive 10 minutes early for your appointment</li>
                <li>Ensure your pet is clean and has been fed at least 2 hours before</li>
                <li>Bring any special instructions or preferences for your pet</li>
                <li>You can reschedule or cancel up to 24 hours before your appointment</li>
              </ul>
            </div>

            <!-- Contact Information -->
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #6b7280; margin-bottom: 15px;">
                Need to make changes to your appointment?
              </p>
              <a href="${clientAppBaseUrl}/appointments" 
                 style="background-color: ${
                   isRescheduled ? "#3b82f6" : "#10b981"
                 }; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Manage Appointment
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              Questions? Contact us at furkidshome1@gmail.com or call +65 9123 4567
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated email from Furkids. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `${
        isRescheduled ? "Rescheduled appointment" : "Booking"
      } confirmation email sent successfully to:`,
      userEmail
    );
    return true;
  } catch (error) {
    console.error(
      `Error sending ${isRescheduled ? "rescheduled appointment" : "booking"} confirmation email:`,
      error
    );
    throw new Error(
      `Failed to send ${isRescheduled ? "rescheduled appointment" : "booking"} confirmation email`
    );
  }
};

// send groomer notification email when a new appointment is booked
const sendGroomerNotificationEmail = async (groomerEmail, groomerName, appointmentDetails) => {
  try {
    const transporter = createTransporter();
    const clientAppBaseUrl = getClientAppBaseUrl();

    const {
      bookingReference,
      petName,
      petBreed,
      ownerName,
      serviceType,
      startTime,
      endTime,
      duration,
    } = appointmentDetails;

    // format date and time
    const appointmentDate = new Date(startTime);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const endDateTime = new Date(endTime);
    const formattedEndTime = endDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const serviceDisplayName = serviceType === "basic" ? "Basic Grooming" : "Full Service Grooming";

    // check if it's same-day appointment
    const today = new Date();
    const isToday = appointmentDate.toDateString() === today.toDateString();
    const urgencyNote = isToday ? "⚡ This is a same-day appointment!" : "";

    const mailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
      to: groomerEmail,
      subject: `New Appointment Booked - ${formattedDate} at ${formattedTime}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
          <!-- Header -->
          <div style="background-color: #2563eb; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📅 New Appointment Scheduled</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              A client has booked an appointment with you
            </p>
            ${
              urgencyNote
                ? `<div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 10px; margin-top: 15px; font-weight: bold;">${urgencyNote}</div>`
                : ""
            }
          </div>

          <!-- Main Content -->
          <div style="background-color: white; padding: 30px 20px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Hello ${groomerName},
            </p>
            <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
              A new appointment has been scheduled for you. Please review the details below:
            </p>

            <!-- Booking Reference -->
            <div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Booking Reference
              </h3>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #2563eb; font-family: monospace;">
                #${bookingReference}
              </p>
            </div>

            <!-- Appointment Details -->
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">
                📋 Appointment Details
              </h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 30%;">Date:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Time:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${formattedTime} - ${formattedEndTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Duration:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${duration} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Service:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${serviceDisplayName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Pet:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${petName} (${petBreed})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Owner:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${ownerName}</td>
                </tr>
              </table>
            </div>

            <!-- Action Items -->
            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 16px;">
                📝 Next Steps
              </h4>
              <ul style="margin: 0; padding-left: 20px; color: #0c4a6e;">
                <li>Please acknowledge this appointment in your dashboard</li>
                <li>Review any special pet care instructions</li>
                <li>Prepare the necessary grooming supplies for the service type</li>
                <li>Contact the owner if you have any questions or need to reschedule</li>
              </ul>
            </div>

            <!-- Quick Actions -->
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #6b7280; margin-bottom: 15px;">
                Access your dashboard to manage this appointment
              </p>
                    <a href="${clientAppBaseUrl}/dashboard" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                View Details
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              Questions? Contact us at furkidshome1@gmail.com or call +65 9123 4567
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated email from Furkids. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Groomer notification email sent successfully to:", groomerEmail);
    return true;
  } catch (error) {
    console.error("Error sending groomer notification email:", error);
    throw new Error("Failed to send groomer notification email");
  }
};

// send cancellation notification email
const sendCancellationEmails = async (
  ownerEmail,
  ownerName,
  groomerEmail,
  groomerName,
  appointmentDetails
) => {
  try {
    const transporter = createTransporter();
    const clientAppBaseUrl = getClientAppBaseUrl();

    const { bookingReference, petName, petBreed, serviceType, startTime, endTime, duration } =
      appointmentDetails;

    // format date and time
    const appointmentDate = new Date(startTime);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const endDateTime = new Date(endTime);
    const formattedEndTime = endDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const serviceDisplayName = serviceType === "basic" ? "Basic Grooming" : "Full Service Grooming";

    // Send email to owner
    const ownerMailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
      to: ownerEmail,
      subject: `Appointment Cancelled - Booking reference ${bookingReference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
          <!-- Header -->
          <div style="background-color: #ef4444; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">❌ Appointment Cancelled</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              Your pet grooming appointment has been cancelled
            </p>
          </div>

          <!-- Main Content -->
          <div style="background-color: white; padding: 30px 20px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Hello ${ownerName},
            </p>
            <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
              Your grooming appointment for <strong>${petName}</strong> has been cancelled. Here are the details:
            </p>

            <!-- Booking Reference -->
            <div style="background-color: #f3f4f6; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Booking Reference
              </h3>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #ef4444; font-family: monospace;">
                #${bookingReference}
              </p>
            </div>

            <!-- Cancelled Appointment Details -->
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">
                📅 Cancelled Appointment Details
              </h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 30%;">Date:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Time:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${formattedTime} - ${formattedEndTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Service:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${serviceDisplayName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Pet:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${petName} (${petBreed})</td>
                </tr>
              </table>
            </div>

            <!-- Book New Appointment -->
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #6b7280; margin-bottom: 15px;">
                Would you like to book a new appointment?
              </p>
                    <a href="${clientAppBaseUrl}/appointments" 
                 style="background-color: #ef4444; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Book New Appointment
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              Questions? Contact us at furkidshome1@gmail.com or call +65 9123 4567
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated email from Furkids. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    // send email to groomer
    const groomerMailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
      to: groomerEmail,
      subject: `Appointment Cancelled - ${formattedDate} at ${formattedTime}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
          <!-- Header -->
          <div style="background-color: #ef4444; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">❌ Appointment Cancelled</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              A client has cancelled their appointment
            </p>
          </div>

          <!-- Main Content -->
          <div style="background-color: white; padding: 30px 20px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Hello ${groomerName},
            </p>
            <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
              An appointment has been cancelled. Here are the details:
            </p>

            <!-- Booking Reference -->
            <div style="background-color: #f3f4f6; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Booking Reference
              </h3>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #ef4444; font-family: monospace;">
                #${bookingReference}
              </p>
            </div>

            <!-- Cancelled Appointment Details -->
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">
                📅 Cancelled Appointment Details
              </h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 30%;">Date:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Time:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${formattedTime} - ${formattedEndTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Service:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${serviceDisplayName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Pet:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${petName} (${petBreed})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Owner:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${ownerName}</td>
                </tr>
              </table>
            </div>

            <!-- View Schedule -->
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #6b7280; margin-bottom: 15px;">
                View your updated schedule
              </p>
                    <a href="${clientAppBaseUrl}/dashboard" 
                 style="background-color: #ef4444; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                View Schedule
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              Questions? Contact us at furkidshome1@gmail.com or call +65 9123 4567
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated notification from Furkids. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    // send emails to both parties
    await transporter.sendMail(ownerMailOptions);
    await transporter.sendMail(groomerMailOptions);

    console.log("Cancellation emails sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending cancellation emails:", error);
    throw new Error("Failed to send cancellation emails");
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendGroomerNotificationEmail,
  sendCancellationEmails,
};
