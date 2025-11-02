import { defineConfig } from "cypress";
import { BASEURL } from "./cypress/constants/CommonConstants";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";

async function findLatestEmailBySubject(
  ms: any,
  {
    inboxId,
    subject,
    timeoutMs = 120000,
    pageSize = 20,
    pollMs = 3000,
  }: {
    inboxId: string;
    subject: string;
    timeoutMs?: number;
    pageSize?: number;
    pollMs?: number;
  }
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const page = await ms.inboxController.getInboxEmailsPaginated({
      inboxId,
      page: 0,
      size: pageSize,
      sort: "DESC",
    });

    const items = page?.content ?? [];
    const meta =
      items.find((it: any) => (it.subject ?? "") === subject) ||
      items.find((it: any) => (it.subject ?? "").includes(subject));

    if (meta) {
      return await ms.emailController.getEmail({ emailId: meta.id });
    }

    await new Promise((r) => setTimeout(r, pollMs));
  }
  throw new Error(
    `Timed out waiting for latest email with subject "${subject}".`
  );
}

function extractOtpFromEmail({
  body,
  regex,
}: {
  subject?: string;
  body?: string;
  html?: string;
  regex?: string;
}) {
  const s = (v: any) => (v == null ? "" : String(v));
  const html = s(body);
  const stripBlocks = (h: string) =>
    h
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ");
  const stripTags = (h: string) => h.replace(/<[^>]+>/g, " ");
  const visibleText = stripTags(stripBlocks(html));

  if (regex) {
    const r = new RegExp(regex, "m");
    const m = visibleText.match(r);
    if (m) return m[1] ?? m[0];
  }

  const underlineSpan =
    /<span[^>]*style="[^"]*text-decoration\s*:\s*underline[^"]*"[^>]*>\s*([0-9]{6})\s*<\/span>/i;
  const u = html.match(underlineSpan);
  if (u) return u[1];

  const tagOnlyDigits = />\s*([0-9]{6})\s*</g;
  let m: RegExpExecArray | null;
  while ((m = tagOnlyDigits.exec(html)) !== null) {
    return m[1];
  }

  const phrase =
    /(?:enter|use|following)[^\n]{0,200}?(?:six|6)[-\s]?(?:digit|digits)[^\n]{0,200}?(?:code|otp)/i;
  const p = phrase.exec(visibleText);
  if (p) {
    const windowText = visibleText.slice(p.index, p.index + 800);
    const near = windowText.match(/\b\d{6}\b/);
    if (near) return near[0];
  }

  const all = [...visibleText.matchAll(/\b\d{6}\b/g)];
  for (const hit of all) {
    const i = hit.index ?? 0;
    const before = visibleText[i - 1] || "";
    if (before !== "#") return hit[0];
  }

  throw new Error("OTP not found in email content.");
}

export default defineConfig({
  reporter: "mochawesome",
  reporterOptions: {
    reportDir: "cypress/results",
    overwrite: false,
    html: false,
    json: true,
  },
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
        /** Create a fresh MailSlurp inbox */
        async "mailslurp:createInbox"() {
          const { MailSlurp } = await import("mailslurp-client");
          const apiKey = (config.env as any).MAILSLURP_API_KEY;
          if (!apiKey) throw new Error("MAILSLURP_API_KEY not set");
          const ms = new MailSlurp({ apiKey });
          const inbox = await ms.inboxController.createInbox({});
          return { id: inbox.id, emailAddress: inbox.emailAddress };
        },

        /** Return newest email metadata (no subject filter) */
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

        /** Fetch an email by id */
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

        /** Generic extractor (kept for compatibility) */
        "mailslurp:extractOtp"(args: {
          text?: string;
          html?: string;
          regex?: string;
        }) {
          return extractOtpFromEmail({
            body: args.text,
            html: args.html,
            regex: args.regex,
          });
        },

        async "mailslurp:waitForOtp"(args: {
          inboxId: string;
          timeoutMs?: number;
          regex?: string;
          subject?: string; // optional override
        }) {
          const { MailSlurp } = await import("mailslurp-client");
          const apiKey = (config.env as any).MAILSLURP_API_KEY;
          if (!apiKey) throw new Error("MAILSLURP_API_KEY not set");
          const ms = new MailSlurp({ apiKey });

          const timeout = Number(
            args.timeoutMs ?? config.env.OTP_TIMEOUT_MS ?? 120000
          );
          const subject =
            args.subject ??
            (config.env as any).MAILSLURP_SUBJECT ??
            "Yoma Car Share | Verify your email";

          const email = await findLatestEmailBySubject(ms, {
            inboxId: args.inboxId,
            subject,
            timeoutMs: timeout,
          });

          const otp = extractOtpFromEmail({
            subject: email.subject ?? "",
            body: email.body ?? "",
            html: email.html ?? "",
            regex: args.regex ?? (config.env as any).OTP_REGEX,
          });

          return {
            otp,
            emailId: email.id,
            subject: email.subject ?? "",
            createdAt: email.createdAt,
            body: email.body ?? "",
          };
        },

        /** If you just want the latest email (meta) for that subject */
        async "mailslurp:waitForLatestEmailBySubjectMeta"(args: {
          inboxId: string;
          subject?: string;
          timeoutMs?: number;
        }) {
          const { MailSlurp } = await import("mailslurp-client");
          const apiKey = (config.env as any).MAILSLURP_API_KEY;
          if (!apiKey) throw new Error("MAILSLURP_API_KEY not set");
          const ms = new MailSlurp({ apiKey });

          const timeout = Number(
            args.timeoutMs ?? config.env.OTP_TIMEOUT_MS ?? 120000
          );
          const subject =
            args.subject ??
            (config.env as any).MAILSLURP_SUBJECT ??
            "Yoma Car Share | Verify your email";

          const email = await findLatestEmailBySubject(ms, {
            inboxId: args.inboxId,
            subject,
            timeoutMs: timeout,
          });

          return {
            id: email.id,
            subject: email.subject ?? "",
            html: email.html ?? "",
            body: email.body ?? "",
            createdAt: email.createdAt,
          };
        },
      });

      return config;
    },

    chromeWebSecurity: false,
  },

  env: {
    stepDefinitions: "cypress/e2e/step_definitions/**/*.ts",
    MAILSLURP_SUBJECT: "Yoma Car Share | Verify your email",
    OTP_REGEX: "\\b\\d{6}\\b",
    OTP_TIMEOUT_MS: 120000,
  },

  viewportWidth: 1408,
  viewportHeight: 768,
});
