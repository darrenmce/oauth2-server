## Express MFA oauth

handlers and middleware for JWT-based oauth with a [QRcode based MFA](https://git.coolaj86.com/coolaj86/node-authenticator.js)

try it out with:

`npm run example`

then

1) register (in browser, you will get a 1-time QRCode):
   - `localhost:8080/register?account=myTestAccount` <-- scan code with your authenticator app
2) get your oauth/jwt token:
   - `localhost:8080/login?account=myTestAccount&token=123456` <-- 6 digits from the authenicator app
3) now hit the app with your oauth token:
   - `curl -H 'X-Token: <your token here>' localhost:8080/test'`
