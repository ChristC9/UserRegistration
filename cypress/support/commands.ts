/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
declare global {
  namespace Cypress {
    interface Chainable {
      mailslurp(): Chainable<any>;
      getOtpFromMailSlurp(inboxId: string): Chainable<string>;
    }
  }
}

Cypress.Commands.add("getOtpFromMailSlurp", (inboxId) => {
  return cy
    .mailslurp()
    .then((ms) => ms.waitForLatestEmail(inboxId, 60_000, true)) // unread only
    .then((email) => {
      const html = String(email.body ?? "");
      const text = html
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const m =
        /following\s*6\s*digits?\s*code.*?(\b\d{6}\b)/i.exec(text) ||
        /\b(\d{6})\b/.exec(text);

      const otp = m?.[1];
      expect(otp, "6-digit OTP").to.match(/^\d{6}$/);
      return otp;
    });
});
