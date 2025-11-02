import {
  REGISTER_URL,
  LOGIN_URL,
  REGISTER_SUCCESS_URL,
} from "../../constants/CommonConstants";

let inboxId = "";
let inboxEmail = "";

const FIELD_ID_MAP: Record<string, string> = {
  "full name": "#fullName",
  email: "#username",
  password: "#password",
  "confirm password": "#confirmPassword",
};

const FIELD_ID_MAP_CORPORATE: Record<string, string> = {
  "inquiry type": ".select__input",
  "company name": "#company_name",
  industry: "#react-select-industry-input",
  "contact person": "#contact_person",
  "job title": "#job_title",
  "phone number": "#react-select-country_code-input",
  email: "#email",
};

const idForCorporate = (field: string) => {
  const key = field.trim().toLowerCase();
  const sel = FIELD_ID_MAP_CORPORATE[key];
  if (!sel)
    throw new Error(`Unknown field "${field}". Add it to FIELD_ID_MAP.`);
  return sel;
};

const idFor = (field: string) => {
  const key = field.trim().toLowerCase();
  const sel = FIELD_ID_MAP[key];
  if (!sel)
    throw new Error(`Unknown field "${field}". Add it to FIELD_ID_MAP.`);
  return sel;
};

class UserRegisterPage {
  getSignUpButton(buttonText: string) {
    return cy
      .contains(
        "header a, header button",
        new RegExp(`^\\s*${buttonText}\\s*$`, "i")
      )
      .filter(":visible");
  }

  getCreateAccountLink(linkText: string) {
    return cy.get("a").contains(linkText);
  }

  getRegisterOptions() {
    return cy.url().should("eq", `${Cypress.config("baseUrl")}${REGISTER_URL}`);
  }

  getLoginPage() {
    return cy.url().should("eq", `${Cypress.config("baseUrl")}${LOGIN_URL}`);
  }

  getIndividualForm() {
    return cy.get("form#individual-register");
  }

  getCorporateForm() {
    return cy.get("form#corporate-register");
  }

  isLabelPresent(labelText1: string, labelText2: string) {
    return (
      cy
        .get(".m-auto > .self-center > .w-auto")
        .contains(labelText1)
        .should("exist") &&
      cy
        .get(".self-center > :nth-child(5)")
        .contains(labelText2)
        .should("exist")
    );
  }

  getJoinNowButton(buttonName: string) {
    return cy.get("button").contains(buttonName);
  }

  assertFieldVisible(field: string) {
    const selector = idFor(field);
    cy.get(selector).should("exist");
  }

  checkCreateNewCompanyAccount() {
    cy.contains("label", "I want to create a new account for my company")
      .should("be.visible")
      .within(() => {
        cy.get('input[type="checkbox"], input[type="radio"]').check({
          force: true,
        });
      });
  }

  checkExistingCompanyAccount() {
    cy.contains("label", "I want to join my company existing account")
      .should("be.visible")
      .within(() => {
        cy.get('input[type="checkbox"], input[type="radio"]').check({
          force: true,
        });
      });
  }

  checkJoinNowBtnEnabled(buttonText: string) {
    this.getJoinNowButton(buttonText).should("be.enabled");
  }

  getJoinNowBtnUnderCorporate(buttonText: string) {
    cy.get(
      `div:has(h2:contains("Join as a Corporate")) button:contains(${buttonText})`
    )
      .should("exist")
      .eq(1)
      .click({ force: true, multiple: true });
  }

  assertFieldVisibleCorporate(field: string) {
    const selector = idForCorporate(field);
    cy.get(selector).should("exist");
  }

  userFillRegistrationFields(
    fullName: string,
    inboxEmail: string,
    password: string,
    confirm: string
  ) {
    cy.task("mailslurp:createInbox").then((inbox: any) => {
      inboxId = inbox.id;
      inboxEmail = inbox.emailAddress as string;

      cy.log(`Using test email: ${inboxEmail}`);

      cy.get("#fullName").clear().type(fullName);
      cy.get("#username").clear().type(inboxEmail);
      cy.get("#password").clear().type(password);
      cy.get("#confirmPassword").clear().type(confirm);
    });
  }

  userFillCorporateRegistrationFields(
    inquiryType: string,
    companyName: string,
    industry: string,
    contactPerson: string,
    jobTitle: string,
    countryCode: string,
    phoneNumber: string,
    email: string
  ) {
    cy.contains("label", "Inquiry Type")
      .parent()
      .find(".select__control")
      .click();

    cy.get(".select__menu").should("be.visible");
    cy.get("#react-select-type-option-0").click();

    cy.get("#company_name").clear().type(companyName);
    cy.contains("label", "Industry").parent().find(".select__control").click();
    cy.get(".select__menu").should("be.visible");
    cy.get("#react-select-industry-option-0").click();

    cy.get("#contact_person").clear().type(contactPerson);
    cy.get("#job_title").clear().type(jobTitle);

    cy.get(".select__input").eq(2).click();

    cy.get(".select__menu").should("be.visible");
    cy.get("#react-select-country_code-option-219").click();

    cy.get("#national_number").clear().type(phoneNumber);
    cy.get("#email").clear().type(email);
  }

  getOTPFromEmail() {
    cy.task<{ otp: string }>("mailslurp:waitForOtp", { inboxId }).then(
      ({ otp }) => {
        expect(otp, "OTP code from email").to.match(/^\d{6}$/);

        const splitInputs =
          'input[aria-label*="verification code"][maxlength="1"], ' +
          'input[type="tel"][maxlength="1"], ' +
          '[data-otp] input, .otp input, input[name^="otp"]';

        const singleInput =
          'input[name="otp"], input[name="code"], input[type="tel"]:not([maxlength="1"]), ' +
          'input[aria-label*="verification code"]:not([maxlength])';

        cy.document().then((doc) => {
          const hasSplit = doc.querySelectorAll(splitInputs).length > 1;

          if (hasSplit) {
            cy.get(splitInputs)
              .should("have.length.greaterThan", 1)
              .then(($inputs) => {
                const digits = otp.split("");
                const count = Math.min(digits.length, $inputs.length);
                for (let i = 0; i < count; i++) {
                  cy.wrap($inputs[i]).clear().type(digits[i], { force: true });
                }
                cy.wrap($inputs[count - 1]).blur();
              });
          } else {
            cy.get(singleInput)
              .first()
              .clear()
              .type(otp, { force: true })
              .blur();
          }
        });
      }
    );
  }

  getSubmitBtn(buttonText: string) {
    return cy.get("button").contains(buttonText);
  }

  verifySuccessMessage(message: string) {
    cy.get(".swal2-html-container").contains(message).should("be.visible");
    cy.get(".swal2-confirm").contains("OK").click();
  }

  clickLocationAccessSkip(btnText: string) {
    cy.get("button").contains(btnText).click();
  }

  verifySuccessMessageCorporate(message: string) {
    cy.get(".swal2-title").contains(message).should("be.visible");
  }

  clickOKBtn(buttonText: string) {
    cy.get(".swal2-confirm").contains(buttonText).click();
  }

  getMembershipRegistrationPage() {
    return cy
      .url()
      .should("eq", `${Cypress.config("baseUrl")}${REGISTER_SUCCESS_URL}`);
  }
}
export default new UserRegisterPage();
