## Express MFA oauth

handlers and middleware for JWT-based oauth with a [QRcode based MFA](https://git.coolaj86.com/coolaj86/node-authenticator.js)

try it out with:

`npm run example`

then

1) register:
   - `localhost:8080/register?account=myTestAccount`
2) get your QR code (in the browser):
   - `localhost:8080/qr?account=myTestAccount` <-- use this to add this to your device
3) get your oauth/jwt token:
   - `localhost:8080/token?account=myTestAccount&token=123456` <-- 6 digits from the device
4) now hit the app with your oauth token:
   - `curl -H 'X-Token: <your token here>' localhost:8080/test'`
