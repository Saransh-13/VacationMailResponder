const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');
const util = require('util');

const readFileAsync = util.promisify(fs.readFile);

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

async function getAuthenticatedClient() {
  const credentials = await readFileAsync('./credentials.json');
  const { client_secret, client_id, redirect_uris } = JSON.parse(credentials).web;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = await readFileAsync('./token.json');
    oAuth2Client.setCredentials(JSON.parse(token));
  } catch (error) {
    await getNewAccessToken(oAuth2Client);
  }

  return oAuth2Client;
}

async function getNewAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this URL:', authUrl);

  const code = await askForAuthorizationCode();

  try {
    const token = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(token.tokens);
    await saveToken(token.tokens);
  } catch (error) {
    console.error('Error while retrieving access token:', error);
  }
}

function askForAuthorizationCode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter the authorization code: ', (code) => {
      rl.close();
      resolve(code);
    });
  });
}

async function saveToken(token) {
  await fs.promises.writeFile('./token.json', JSON.stringify(token));
  console.log('Token stored successfully!');
}


module.exports = {
    getAuthenticatedClient
  };
