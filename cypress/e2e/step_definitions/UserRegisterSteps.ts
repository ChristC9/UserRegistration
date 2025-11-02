import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import UserRegisterPage from "../pages/UserRegisterPage";
import { LOGIN_URL, REGISTER_URL } from "../../constants/CommonConstants";
const registerPage = UserRegisterPage;

Given("user is on login page", () => {
  cy.clearLocalStorage();
  cy.visit(LOGIN_URL);
});

When("the user clicks on {string} link", (linkText: string) => {
  registerPage.getCreateAccountLink(linkText).click();
});

Then("the user should be on the Register Type page", () => {
  registerPage.getRegisterOptions();
});

Given("the user is on the Register Type page", () => {
  cy.visit(REGISTER_URL);
});

Then(
  "the user should see the following register options {string} and {string}",
  (individualText: string, corporateText: string) => {
    registerPage.isLabelPresent(individualText, corporateText);
  }
);

When(
  "the user clicks the {string} button under join us as an individual",
  (buttonText: string) => {
    registerPage.getJoinNowButton(buttonText).click();
  }
);

Then(
  "the user should see the Individual registration form with the following fields {string}",
  (field: string) => {
    registerPage.assertFieldVisible(field);
  }
);

When("the user selects create new account for company", () => {
  registerPage.checkCreateNewCompanyAccount();
});

When("the user selects exisiting company account", () => {
  registerPage.checkExistingCompanyAccount();
});

Then(
  "the {string} button under join as a Corporate should be enabled",
  (buttonText: string) => {
    registerPage.checkJoinNowBtnEnabled(buttonText);
  }
);

When(
  "the user clicks the {string} button under join as a Corporate",
  (buttonText: string) => {
    registerPage.getJoinNowBtnUnderCorporate(buttonText);
  }
);

Then(
  "the user should see the Corporate registration form with the following fields {string}",
  (field: string) => {
    registerPage.assertFieldVisibleCorporate(field);
  }
);

When(
  "the user fills the form with {string} and {string} and {string} and {string}",
  (fullName: string, email: string, password: string, confirm: string) => {
    registerPage.userFillRegistrationFields(fullName, email, password, confirm);
  }
);

Then("the user clicks on {string} button", (buttonText: string) => {
  registerPage.getSubmitBtn(buttonText).click();
});

Then("the user needs to fill the OTP received in email", () => {
  registerPage.getOTPFromEmail();
});

Then("the user should see the success message {string}", (message: string) => {
  registerPage.verifySuccessMessage(message);
});

Then(
  "the user clicks {string} in Location Access page",
  (buttonText: string) => {
    registerPage.clickLocationAccessSkip(buttonText);
  }
);

Then("the user should be redirected to login page", () => {
  registerPage.getLoginPage();
});
