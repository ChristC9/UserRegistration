Feature: User Registration
    As a visitor
    I want to register as an Individual or as a Corporate
    So that I can sign in and use the app

    Background:
        Given user is on login page

    # Scenario: Redirect to register type page via "Create an Account" link
    #     When the user clicks on "Create an Account" link
    #     Then the user should be on the Register Type page

    # Scenario: Registration Type page shows Individual and Corporate options
    #     Given the user is on the Register Type page
    #     Then the user should see the following register options "<option1>" and "<option2>"

    #     Examples:
    #         | option1                  | option2             |
    #         | Join us as an individual | Join as a Corporate |

    # Scenario: Selecting Individual shows the Individual registration form
    #     Given the user is on the Register Type page
    #     When the user clicks the "Join Now" button under join us as an individual
    #     Then the user should see the Individual registration form with the following fields "<field>"

    #     Examples:
    #         | field            |
    #         | Full Name        |
    #         | Email            |
    #         | Password         |
    #         | Confirm password |

    # @positive @Register_TC_005
    # Scenario: Selecting Corporate shows the Corporate registration form
    #     Given the user is on the Register Type page
    #     When the user selects create new account for company
    #     Then the "Join Now" button under join as a Corporate should be enabled
    #     When the user clicks the "Join Now" button under join as a Corporate
    #     Then the user should see the Corporate registration form with the following fields "<field>"

    #     Examples:
    #         | field          |
    #         | Inquiry Type   |
    #         | Company Name   |
    #         | Industry       |
    #         | Contact person |
    #         | Job Title      |
    #         | Phone Number   |
    #         | Email          |


    # Scenario: Selecting Corporate shows the Corporate registration form
    #     Given the user is on the Register Type page
    #     When the user selects exisiting company account
    #     Then the "Join Now" button under join as a Corporate should be enabled
    #     When the user clicks the "Join Now" button under join as a Corporate
    #     Then the user should see the Corporate registration form with the following fields "<field>"

    #     Examples:
    #         | field          |
    #         | Inquiry Type   |
    #         | Company Name   |
    #         | Industry       |
    #         | Contact person |
    #         | Job Title      |
    #         | Phone Number   |
    #         | Email          |

    # @validation @Register_TC_007
    # Scenario Outline: Invalid email format shows error
    #     Given I am on the "<form_type>" registration form
    #     When I type "<bad_email>" into the Email field
    #     And I submit the form
    #     Then I should see an invalid email error on the Email field

    #     Examples:
    #         | form_type  | bad_email       |
    #         | individual | user@           |
    #         | individual | user@domain     |
    #         | individual | user@domain,com |
    #         | corporate  | user@           |

    # @validation @Register_TC_008
    # Scenario Outline: Password policy is enforced
    #     Given I am on the "<form_type>" registration form
    #     When I type password "<password>"
    #     And I submit the form
    #     Then I should see a password policy error explaining unmet rules

    #     # Adjust rules in step definitions to match the app policy (length, number, uppercase, special char, etc.)
    #     Examples:
    #         | form_type  | password |
    #         | individual | 12345    |
    #         | individual | abcdefgh |
    #         | individual | Abcdefgh |
    #         | corporate  | Abcdefg1 |

    # @validation @Register_TC_009
    # Scenario: Confirm password mismatch shows error
    #     Given I am on the "individual" registration form
    #     When I fill the form with:
    #         | field            | value       |
    #         | Full name        | Test User   |
    #         | Email            | test@ex.com |
    #         | Password         | Abcdefg1!   |
    #         | Confirm password | Abcdefg1?   |
    #         | Accept Terms     | checked     |
    #     And I submit the form
    #     Then I should see a mismatch error on the Confirm password field

    # @negative @Register_TC_010
    # Scenario: Duplicate email shows already registered error
    #     Given an account already exists with email "dup@ex.com"
    #     And I am on the "individual" registration form
    #     When I fill the form with:
    #         | field            | value      |
    #         | Full name        | Dup User   |
    #         | Email            | dup@ex.com |
    #         | Password         | Abcdefg1!  |
    #         | Confirm password | Abcdefg1!  |
    #         | Accept Terms     | checked    |
    #     And I submit the form
    #     Then I should see an "Email already registered" error

    # @validation @Register_TC_011
    # Scenario: Must accept Terms & Conditions
    #     Given I am on the "individual" registration form
    #     When I fill the form with:
    #         | field            | value        |
    #         | Full name        | Terms User   |
    #         | Email            | terms@ex.com |
    #         | Password         | Abcdefg1!    |
    #         | Confirm password | Abcdefg1!    |
    #         | Accept Terms     | unchecked    |
    #     And I submit the form
    #     Then I should see an error asking to accept Terms and Conditions

    # @positive @Register_TC_012
    Scenario: Successful Individual registration
        Given the user is on the Register Type page
        When the user clicks the "Join Now" button under join us as an individual
        When the user fills the form with "<Full Name>" and "<Email>" and "<Password>" and "<Confirm password>"
        And the user clicks on "SUBMIT" button
        Then the user needs to fill the OTP received in email
        Then the user should see the success message "Account Verified"
        Then the user clicks "SKIP" in Location Access page
        And the user should be redirected to login page

        Examples:
            | Full Name | Email              | Password  | Confirm password |
            | New User  | auto+{uuid}@ex.com | Abc@12345 | Abc@12345        |

# @positive @Register_TC_013
# Scenario: Successful Corporate registration
#     Given I am on the "corporate" registration form
#     When I fill the form with:
#         | field            | value                |
#         | Company name     | Meta Arc Co.         |
#         | Company email    | auto+{uuid}@corp.com |
#         | Password         | Abcdefg1!            |
#         | Confirm password | Abcdefg1!            |
#         | Contact person   | Nyan Htet Aung       |
#         | Accept Terms     | checked              |
#     And I submit the form
#     Then I should see a success state
#     And I should be redirected to the post‑registration page

# @ui @Register_TC_014
# Scenario: Register Type page has navigation links
#     Given I am on the Register Type page
#     Then I should see a link back to the Sign In page
#     And the brand logo should navigate to the home page
