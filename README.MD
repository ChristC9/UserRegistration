# Cypress E2E Automation (Cucumber + Mochawesome + MailSlurp)

A batteries‑included setup for writing BDD‑style Cypress tests with the **@badeball/cypress-cucumber-preprocessor**, HTML reports via **mochawesome**, and **MailSlurp** for email flows (e.g., OTP/verification links). Works with **TypeScript** and the **esbuild** bundler.

---

## 🧰 Prerequisites

* Node.js **18+** (LTS recommended)
* Yarn **1.x** or **Berry**
* Git (optional)

## 🚀 Quick start

```bash
# 1) Install dependencies
yarn add -D cypress @badeball/cypress-cucumber-preprocessor \
  @bahmutov/cypress-esbuild-preprocessor typescript ts-node \
  mailslurp-client dotenv \
  mochawesome mochawesome-merge mochawesome-report-generator

# 2) Initialize Cypress folder structure (if you haven't)
yarn cypress open # or: npx cypress open

# 3) Run tests headless
yarn cy:run

# 4) Generate HTML report (mochawesome)
yarn report
```

---

## 📁 Project structure (suggested)

```
.
├─ cypress/
│  ├─ e2e/                      # step-defs or integration tests
│  ├─ fixtures/
│  ├─ support/
│  │  ├─ e2e.ts                 # global hooks & custom commands
│  │  └─ commands.ts
│  └─ downloads/                # (optional)
├─ features/                    # .feature files (BDD)
│  └─ example.feature
├─ tsconfig.json
├─ cypress.config.ts
├─ .env                         # MAILSLURP_API_KEY=...
└─ package.json
```

> If you already keep `.feature` files under `cypress/e2e`, you can do that instead—just align `specPattern` accordingly.

---

## ⚙️ TypeScript config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "commonjs",
    "types": ["cypress"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["cypress", "features", "cypress.config.ts"]
}
```

---

## 🔩 Cypress config (`cypress.config.ts`)

> This setup compiles Cucumber `.feature` files with esbuild **and** exposes two `cy.task` utilities to interact with MailSlurp using your API key.

```ts
import { defineConfig } from "cypress";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  e2e: {
    baseUrl: "https://your-base-url.example", // <- change me
    specPattern: ["features/**/*.feature", "cypress/e2e/**/*.feature"],
    supportFile: "cypress/support/e2e.ts",
    testIsolation: false,

    env: {
      // Prefer .env at runtime; fall back to Cypress env
      MAILSLURP_API_KEY: process.env.MAILSLURP_API_KEY,
    },

    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);

      // Compile TS + feature files
      on(
        "file:preprocessor",
        createBundler({ plugins: [createEsbuildPlugin(config)] })
      );

      // --- MailSlurp helper tasks (Node-side for stability) ---
      on("task", {
        async "mailslurp:createInbox"() {
          const { MailSlurp } = await import("mailslurp-client");
          const apiKey =
            (config.env as any).MAILSLURP_API_KEY || process.env.MAILSLURP_API_KEY;
          if (!apiKey) throw new Error("MAILSLURP_API_KEY not set");
          const ms = new MailSlurp({ apiKey });
          const inbox = await ms.createInbox();
          return { id: inbox.id, emailAddress: inbox.emailAddress };
        },

        async "mailslurp:getLatestEmailBySubject"({ inboxId, subject }) {
          const { MailSlurp } = await import("mailslurp-client");
          const apiKey =
            (config.env as any).MAILSLURP_API_KEY || process.env.MAILSLURP_API_KEY;
          const ms = new MailSlurp({ apiKey });

          // First wait for *any* latest mail; then, if provided, match subject
          const latest = await ms.waitForLatestEmail(inboxId, 120000, true);
          if (!subject || latest.subject?.includes(subject)) return latest;

          const [match] = await ms.waitForMatchingEmails({
            inboxId,
            count: 1,
            timeout: 120000,
            unreadOnly: true,
            matchOptions: {
              matches: [
                { field: "SUBJECT", should: "CONTAIN", value: String(subject) },
              ],
            },
          });
          return match;
        },
      });

      return config;
    },

    // --- Mochawesome reporter ---
    reporter: "mochawesome",
    reporterOptions: {
      reportDir: "mochawesome-report",
      overwrite: true,
      html: false,
      json: true,
      reportFilename: "[name]-[timestamp]",
      inlineAssets: true,
      charts: true,
    },

    // Screenshots/videos help with debugging & can be embedded in reports
    screenshotsFolder: "cypress/screenshots",
    videosFolder: "cypress/videos",
    screenshotOnRunFailure: true,
    video: false
  },
});
```

> **Why `cy.task` for MailSlurp?** Avoids bundler issues and keeps secrets (API key) on the Node side. This also sidesteps the
> `Could not resolve "mailslurp-client/cypress"` error when using esbuild.

---

## 🌱 Support file & commands (`cypress/support/e2e.ts`)

Add typed custom commands that call the tasks defined above.

```ts
// cypress/support/e2e.ts

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      createInbox(): Chainable<{ id: string; emailAddress: string }>;
      getLatestEmailBySubject(args: {
        inboxId: string;
        subject: string;
      }): Chainable<any>;
    }
  }
}

Cypress.Commands.add("createInbox", () => cy.task("mailslurp:createInbox"));
Cypress.Commands.add("getLatestEmailBySubject", (args) =>
  cy.task("mailslurp:getLatestEmailBySubject", args)
);

// Optionally handle uncaught errors to reduce flaky failures
Cypress.on("uncaught:exception", () => false);
```

> If you previously tried `import "mailslurp-client/cypress"` and saw an esbuild error, **remove that import** when using this tasks-based approach.

---

## 🧪 Example BDD feature (`features/email-verification.feature`)

```gherkin
Feature: Email verification
  As a new user
  I want to verify my email address
  So that I can activate my account

  Scenario: Receive verification email
    Given I have a fresh inbox
    When I register using that inbox address
    Then I should receive an email with subject "Yoma Car Share | Verify your email"
```

### Step definitions (TypeScript)

```ts
// cypress/e2e/email-verification.steps.ts
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

let inbox: { id: string; emailAddress: string };

Given("I have a fresh inbox", () => {
  cy.createInbox().then((i) => (inbox = i));
});

When("I register using that inbox address", () => {
  cy.visit("/register");
  cy.get("#email").type(inbox.emailAddress);
  cy.get("#password").type("Strong_Passw0rd!");
  cy.contains("button", /sign up|create account/i).click();
});

Then(
  "I should receive an email with subject {string}",
  (subject: string) => {
    cy.getLatestEmailBySubject({ inboxId: inbox.id, subject }).then((email: any) => {
      expect(email.subject).to.contain(subject);

      // Access HTML body if needed
      const html = email.body ?? email.html ?? "";
      cy.log(`Email HTML length: ${html.length}`);

      // Optionally extract and visit a verification link
      const match = html.match(/https?:\/\/[^\"'>\s]+/g);
      if (match?.length) cy.visit(match[0]);
    });
  }
);
```

---

## 🔐 MailSlurp API key & inbox ID

### Where do I get the **API key**?

1. Create a MailSlurp account → Dashboard → **API Keys**.
2. Create a key and copy its value.

### Where do I get the **inbox ID**?

* **Dynamic (recommended):** call `cy.createInbox()` (above). No manual ID required.
* **Fixed inbox:** in the MailSlurp dashboard, open an inbox → copy its **ID** (UUID). You can then pass it into tests or set it in `cypress.env.json`.

### Configure secrets

Use a local `.env` (not committed):

```
MAILSLURP_API_KEY=sk_XXXXXXXXXXXXXXXXXXXXXXXX
```

`.gitignore` should contain:

```
.env
cypress.env.json
```

> You can also place `{"MAILSLURP_API_KEY":"..."}` in `cypress.env.json`, but `.env` keeps secrets out of source by default.

---

## 📊 HTML reports with **mochawesome**

This project writes JSON per‑spec and then merges them into a single HTML report.

### 1) Reporter config (already in `cypress.config.ts`)

```ts
reporter: "mochawesome",
reporterOptions: {
  reportDir: "mochawesome-report",
  overwrite: true,
  html: false,
  json: true,
  reportFilename: "[name]-[timestamp]",
  inlineAssets: true,
  charts: true,
},
```

### 2) Package scripts (`package.json`)

```json
{
  "scripts": {
    "cy:open": "cypress open",
    "cy:run": "cypress run",
    "report:merge": "mochawesome-merge mochawesome-report/*.json > mochawesome-report/mochawesome.json",
    "report:html": "marge mochawesome-report/mochawesome.json --reportDir mochawesome-report --reportTitle 'Cypress Automation Report'",
    "report": "yarn report:merge && yarn report:html"
  }
}
```

### 3) Usage

```bash
yarn cy:run
yarn report
# Open mochawesome-report/mochawesome.html in your browser
```

> **Tip:** Enable screenshots on failure (`screenshotOnRunFailure: true`) so mochawesome can include evidence.

---

## 🪛 Troubleshooting

### ❌ `Could not resolve "mailslurp-client/cypress"`

* You imported `mailslurp-client/cypress` in your `support/e2e.ts` while using the esbuild preprocessor.
* **Fix:** remove that import and use the **`cy.task` approach** in this README (recommended). It’s compatible with TypeScript and avoids bundler externals.
* Alternative (advanced): externalize that module in your bundler if you must use it.

### ⏳ Emails not found / timeouts

* Increase `waitForLatestEmail`/`waitForMatchingEmails` timeouts.
* Ensure your app actually sends to the MailSlurp address you used.
* Check spam/filters in the MailSlurp dashboard.

### 🧪 Cucumber specs not discovered

* Verify `specPattern` includes your `.feature` location.
* Ensure step definition file names end with `.ts` and are included by `tsconfig.json`.

### 📄 Report has no data

* Ensure `json: true` in reporter options.
* Run `yarn report` **after** tests to merge JSON → HTML.

---

## 🤖 CI example (GitHub Actions)

```yml
name: e2e
on: [push, pull_request]
jobs:
  cypress:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: yarn install --frozen-lockfile
      - run: yarn cy:run
        env:
          MAILSLURP_API_KEY: ${{ secrets.MAILSLURP_API_KEY }}
      - run: yarn report
      - uses: actions/upload-artifact@v4
        with:
          name: mochawesome-report
          path: mochawesome-report
```

---

## ✅ Summary

* **Cucumber** features compiled with **esbuild**
* **Mochawesome** HTML report at `mochawesome-report/mochawesome.html`
* **MailSlurp** via `cy.task` to safely use your **API key** and retrieve emails

If you want this README adjusted to your exact folder names or to include real URLs and selectors from your app, tell me and I’ll tailor it further.
