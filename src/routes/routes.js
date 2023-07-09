const express = require('express');
const controllers=require('../controller/controllers');
const Auth = require("../helper/authenticate");
const router = express.Router();

router.get('/mail/user/:email',controllers.getUser);
router.get('/mail/send',controllers.sendMail);
router.get('/mail/drafts/:email', controllers.getDrafts);
router.get('/mail/read/:messageId', controllers.readMail);
router.get('mail/authenticate',Auth.getAuthenticatedClient);
router.get('/mail/checkNewMail',controllers.checkNewEmails)

module.exports = router;