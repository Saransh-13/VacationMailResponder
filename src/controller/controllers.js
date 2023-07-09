const axios = require("axios");
const { generateConfig } = require("../helper/util");
const nodemailer = require("nodemailer");
const CONSTANTS = require("../helper/constants");
const { google } = require("googleapis");
const Auth = require("../helper/authenticate");
require("dotenv").config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

async function sendMail(req, res) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        ...CONSTANTS.auth,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      ...CONSTANTS.mailoptions,
      text: "The Gmail API with NodeJS works",
    };

    const result = await transport.sendMail(mailOptions);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

async function getUser(req, res) {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${req.params.email}/profile`;
    const { token } = await oAuth2Client.getAccessToken();
    const config = generateConfig(url, token);
    const response = await axios(config);
    res.json(response.data);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

async function getDrafts(req, res) {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${req.params.email}/drafts`;
    const { token } = await oAuth2Client.getAccessToken();
    const config = generateConfig(url, token);
    const response = await axios(config);
    const checkmail = await checkNewEmails();
    res.json(response.data);
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function readMail(req, res) {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/pythonztm17@gmail.com/messages/${req.params.messageId}`;
    const { token } = await oAuth2Client.getAccessToken();
    const config = generateConfig(url, token);
    const response = await axios(config);
    let data = await response.data;

    res.json(data);
  } catch (error) {
    res.send(error);
  }
}

async function addLabelAndMoveEmail(messageId, labelName) {
  const auth = await Auth.getAuthenticatedClient();

  const gmail = google.gmail({ version: "v1", auth });

  const labelsResponse = await gmail.users.labels.list({ userId: "me" });
  const labels = labelsResponse.data.labels;
  const label = labels.find((l) => l.name === labelName);

  if (!label) {
    await gmail.users.labels.create({
      userId: "me",
      requestBody: { name: labelName },
    });
  }

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: { addLabelIds: [label.id] },
  });
}

async function checkNewEmails(req, res) {
  try {
    const auth = await Auth.getAuthenticatedClient();

    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.messages.list({ userId: "me" });

    const messages = response.data.messages;
    console.log(messages.length);
    for (const message of messages) {
      const messageId = message.id;

      const threadResponse = await gmail.users.threads.get({
        userId: "me",
        id: message.threadId,
      });
      const thread = threadResponse.data;
      const hasReplies = thread.messages.length > 1;
      console.log(hasReplies);
      const givenDate = new Date("2023-07-08");
      const lastReplyDate = new Date(
        parseInt(thread.messages[thread.messages.length - 1].internalDate)
      );
      // console.log(lastReplyDate);
      if (!hasReplies && lastReplyDate >= givenDate) {
        await sendEmailReply(messageId, "Reply content here", thread.threadId);
        await addLabelAndMoveEmail(messageId, "Vacation");
      }
    }
    res.json("All mails are covered");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

async function sendEmailReply(messageId, replyContent, threadId) {
  const auth = await Auth.getAuthenticatedClient();

  const gmail = google.gmail({ version: "v1", auth });

  const messageResponse = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
  });
  const originalMessage = messageResponse.data;
  // console.log(originalMessage);

  const replySubject = `${
    originalMessage.payload.headers.find((header) => header.name === "Subject")
      .value
  }`;
  // console.log(originalMessage.payload.headers);
  const replyTo = originalMessage.payload.headers.find(
    (header) => header.name === "From"
  ).value;
  let Reference  = originalMessage.payload.headers.find((header) => header.name == "Message-Id" || "Message-ID").value;
  
  const replyBody = `Hello, I hope this email finds you well. I am currently traveling for the holidays and won't have internet access while I am away, so I will not be able to read or respond to your email until after June 30. Thank you for your patience, and I will contact you as soon as I can. `;

  const replyMessage = {
    threadId: threadId,
    raw: createEmailRaw(replyTo, "me", replySubject, replyBody,originalMessage,threadId,Reference),
  };

  await gmail.users.messages.send({ userId: "me", requestBody: replyMessage });
}

function createEmailRaw(to, from, subject, body,originalMessage,threadId,Reference) {
  const emailLines = [];
  emailLines.push(`To: ${to}`);
  emailLines.push(`From: ${from}`);
  emailLines.push("Content-Type: text/html; charset=utf-8");
  emailLines.push("MIME-Version: 1.0");
  emailLines.push(`Subject: ${subject}`);
  emailLines.push(`In-Reply-To: ${originalMessage.threadId}`);
  emailLines.push(`References: ${originalMessage.threadId}`);
  emailLines.push("");
  emailLines.push(body);

  const email = emailLines.join("\r\n");
  const base64EncodedEmail = Buffer.from(email).toString("base64");

  return base64EncodedEmail;
}

module.exports = {
  getUser,
  sendMail,
  getDrafts,
  readMail,
  checkNewEmails,
};
