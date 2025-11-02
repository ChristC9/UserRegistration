import { defineConfig } from "cypress";
import { BASEURL } from "./cypress/constants/CommonConstants";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";

export default defineConfig({
  e2e: {
    baseUrl: BASEURL,
    specPattern: "**/*.feature",
    supportFile: "cypress/support/e2e.ts",
    testIsolation: false,

    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on(
        "file:preprocessor",
        createBundler({ plugins: [createEsbuildPlugin(config)] })
      );

      on("task", {
        async "mailslurp:createInbox"() {
          const { MailSlurp } = await import("mailslurp-client");
          const apiKey = (config.env as any).MAILSLURP_API_KEY;
          if (!apiKey) throw new Error("MAILSLURP_API_KEY not set");
          const ms = new MailSlurp({ apiKey });

          const inbox = await ms.inboxController.createInbox({});
          return { id: inbox.id, emailAddress: inbox.emailAddress };
        },

        /** Wait for the latest email to arrive and return its metadata/body */
        async "mailslurp:waitForLatestEmailMeta"(args: {
          inboxId: string;
          timeoutMs?: number;
        }) {
          const { MailSlurp } = await import("mailslurp-client");
          const apiKey = (config.env as any).MAILSLURP_API_KEY;
          const ms = new MailSlurp({ apiKey });

          const timeout = Number(
            args.timeoutMs ?? config.env.OTP_TIMEOUT_MS ?? 120000
          );
          const email = await ms.waitController.waitForLatestEmail({
            inboxId: args.inboxId,
            timeout,
          });

          return {
            id: email.id,
            subject: email.subject ?? "",
            html: email.html ?? "",
            body: email.body ?? "",
            createdAt: email.createdAt,
          };
        },

        /** Re-open a specific email by id (fresh fetch) */
        async "mailslurp:getEmail"(args: { emailId: string }) {
          const { MailSlurp } = await import("mailslurp-client");
          const apiKey = (config.env as any).MAILSLURP_API_KEY;
          const ms = new MailSlurp({ apiKey });

          const e = await ms.emailController.getEmail({
            emailId: args.emailId,
          });
          return {
            id: e.id,
            subject: e.subject ?? "",
            html: e.html ?? "",
            body: e.body ?? "",
            createdAt: e.createdAt,
          };
        },

        "mailslurp:extractOtp"(args: {
          text?: string;
          html?: string;
          regex?: string;
        }) {
          const source = `${args.text || ""}\n${(args.html || "").toString()}`;
          const phrase = /following\s+6\s+digits?\s+code.*?(\d{6})/i; // your screenshot wording
          const rx = new RegExp(args.regex ?? "\\b\\d{6}\\b");

          const m1 = source.match(phrase);
          if (m1) return m1[1];

          const m2 = source.match(rx);
          if (m2) return m2[0];

          throw new Error("OTP not found in email content.");
        },

        async "mailslurp:waitForOtp"(args: {
          inboxId: string;
          timeoutMs?: number;
          regex?: string;
        }) {
          const { MailSlurp } = await import("mailslurp-client");
          const apiKey = (config.env as any).MAILSLURP_API_KEY;
          const ms = new MailSlurp({ apiKey });

          const timeout = Number(
            args.timeoutMs ?? config.env.OTP_TIMEOUT_MS ?? 120000
          );
          const email = await ms.waitController.waitForLatestEmail({
            inboxId: args.inboxId,
            timeout,
          });

          const source = `${email.subject ?? ""}\n${email.body ?? ""}\n${
            email.html ?? ""
          }`;
          const phrase = /following\s+6\s+digits?\s+code.*?(\d{6})/i;
          const rx = new RegExp(
            args.regex ?? config.env.OTP_REGEX ?? "\\b\\d{6}\\b"
          );

          const m1 = source.match(phrase);
          if (m1) return m1[1];
          const m2 = source.match(rx);
          if (m2) return m2[0];

          throw new Error("OTP not found in verification email.");
        },
      });

      return config;
    },
    chromeWebSecurity: false,
  },
  env: {
    stepDefinitions: "cypress/e2e/step_definitions/**/*.ts",
  },
  viewportWidth: 1408, // try 1408x768 or even 1920x1080
  viewportHeight: 768,
});
