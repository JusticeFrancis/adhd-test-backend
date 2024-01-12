var express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const stripe = require("stripe");
app.use(express.json({ limit: "50mb" })); // for parsing application/json
app.use(express.urlencoded({ limit: "50mb", extended: true })); // for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
require("dotenv").config();
const nodemailer = require("nodemailer");

const jwt = require("jsonwebtoken");

const Stripe = stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
});

// allowing cors
app.use(cors());
const httpServer = require("http").createServer(app);
const PORT = "7000";

app.listen(process.env.PORT || PORT, () => {
  console.log(`Server Listening`);
});

const secretKey = "secret";

//pay customer
app.post("/pay", async (req, res) => {
  const { email, first_name, last_name, score, result, interpretation } =
    req.body;

  // Replace with your actual secret key

  const payload = {
    // Add any additional claims or data you want in the token
    email,
    first_name,
    last_name,
    score,
    result,
    interpretation,
  };

  const expirationTime = 60; // Token expiration time in seconds (1 minute)

  const token = jwt.sign(payload, secretKey, { expiresIn: expirationTime });

  try {
    const session = await Stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "ADHD/ADD Test Result Information", // Replace with your product name
            },
            unit_amount: 700, // Amount in cents (7 USD)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://test.adhdwell.com/success/" + token, // Replace with your success URL
      cancel_url: "http://test.adhdwell.com/cancel/" + token, // Replace with your cancel URL
      billing_address_collection: "auto",
      customer_email: email,
    });
    console.log(session);

    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//send email
app.post("/send-email", async (req, res) => {
  const email = req.body.email;
  const score = req.body.score;
  console.log(email);

  // Create a transporter using SMTP for GoDaddy Workspace Email
  const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net', // GoDaddy's SMTP server
    port: 465, // Port for secure (SSL/TLS) connections
    secure: true,
    auth: {
      user: process.env.EMAIL, // Your GoDaddy email address
      pass: process.env.PASS, // Your GoDaddy email password zzyxclvndoeagvmt
    },
  });

  // Email options

  let mailOptions;

  if (score >= 0 && score <= 25) {
    console.log('hi')
    mailOptions = {
      from: "help@adhdwell.com", // Sender address
      to: email, // List of recipients
      subject: "Mild ADHD/ADD PDF",
      text: "some information : https://drive.google.com/file/d/11VPDtcAjzjgdtgQAha-M7NEBpQdV6jZ8/view?usp=drivesdk ",
    };
  } else if (score >= 26 && score <= 50) {
    mailOptions = {
      from: "help@adhdwell.com", // Sender address
      to: email, // List of recipients
      subject: "Mild ADHD/ADD PDF",
      text: "some information : https://drive.google.com/file/d/11VPDtcAjzjgdtgQAha-M7NEBpQdV6jZ8/view?usp=drivesdk ",
    };
  } else if (score >= 51 && score <= 75) {
    mailOptions = {
      from: "help@adhdwell.com", // Sender address
      to: email, // List of recipients
      subject: "Moderate ADHD/ADD PDF",
      text: "some information : https://drive.google.com/file/d/1LewGFMfFmnsIQlRCq8ARInCPjP_rZWAJ/view?usp=drivesd ",
    };
  } else if (score >= 76 && score <= 100) {
    mailOptions = {
      from: "help@adhdwell.com", // Sender address
      to: email, // List of recipients
      subject: "Severe ADHD/ADD PDF",
      text: "some information : https://drive.google.com/file/d/1s0LkMfuNdDfOH5WeG9ToNQeRPl39hORX/view?usp=drivesdk ",
    };
  }

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });

  return res.json({ msg: "email sent" });
});
