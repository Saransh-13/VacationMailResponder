require("dotenv").config();
const express = require("express");
const routes = require("./routes/routes");
const axios = require("axios");
const schedule = require("node-schedule");

const app = express();

app.listen(process.env.PORT, () => {
  console.log("listening on port " + process.env.PORT);
});

(function () {
  const rule = new schedule.RecurrenceRule();
  rule.second = 45;

  const job = schedule.scheduleJob(rule, async function () {
    try {
      const response = await axios.get('http://localhost:8000/api/mail/checkNewMail');
      console.log(response.data);
  } catch (error) {
      console.error(error);
  }
  console.log("ok")
  });
})();

app.use("/api", routes);
app.get("/", async (req, res) => {
  // const result=await sendMail();
  res.send("Welcome to Gmail API with NodeJS");
});
