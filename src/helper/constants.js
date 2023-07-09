require("dotenv").config();

const auth = {
  type: "OAuth2",
  user: "pythonztm17@gmail.com",
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  refreshToken: process.env.REFRESH_TOKEN,
};

const mailoptions = {
  from: "Siddhant <pythonztm17@gmail.com>",
  to: "pythonztm17@gmail.com",
  subject: "Gmail API NodeJS",
};

module.exports = {
  auth,
  mailoptions,
};