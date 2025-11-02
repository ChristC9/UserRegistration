Feature: User Registration
    As a visitor
    The user wants to register as an Individual or as a Corporate
    So that the user can sign up and use the app

    Background:
        Given user is on login page

    Scenario: Redirect to register type page via "Create an Account" link
        When the user clicks on "Create an Account" link
        Then the user should be on the Register Type page

    Scenario: Registration Type page shows Individual and Corporate options
        Given the user is on the Register Type page
        Then the user should see the following register options "<option1>" and "<option2>"

        Examples:
            | option1                  | option2             |
            | Join us as an individual | Join as a Corporate |

    Scenario: Selecting Individual shows the Individual registration form
        Given the user is on the Register Type page
        When the user clicks the "Join Now" button under join us as an individual
        Then the user should see the Individual registration form with the following fields "<field>"

        Examples:
            | field            |
            | Full Name        |
            | Email            |
            | Password         |
            | Confirm password |

    @positive @Register_TC_005
    Scenario: Selecting Corporate shows the Corporate registration form
        Given the user is on the Register Type page
        When the user selects create new account for company
        Then the "Join Now" button under join as a Corporate should be enabled
        When the user clicks the "Join Now" button under join as a Corporate
        Then the user should see the Corporate registration form with the following fields "<field>"

        Examples:
            | field          |
            | Inquiry Type   |
            | Company Name   |
            | Industry       |
            | Contact person |
            | Job Title      |
            | Phone Number   |
            | Email          |


    Scenario: Selecting Corporate shows the Corporate registration form
        Given the user is on the Register Type page
        When the user selects exisiting company account
        Then the "Join Now" button under join as a Corporate should be enabled
        When the user clicks the "Join Now" button under join as a Corporate
        Then the user should see the Corporate registration form with the following fields "<field>"

        Examples:
            | field          |
            | Inquiry Type   |
            | Company Name   |
            | Industry       |
            | Contact person |
            | Job Title      |
            | Phone Number   |
            | Email          |

    Scenario: Successful Individual registration
        Given the user is on the Register Type page
        When the user clicks the "Join Now" button under join us as an individual
        When the user fills the form with "<Full Name>" and "<Email>" and "<Password>" and "<Confirm password>"
        And the user clicks on "SUBMIT" button
        Then the user needs to fill the OTP received in email
        Then the user should see the success message "Account verified"
        Then the user clicks "SKIP" in Location Access page
        And the user should be redirected to login page

        Examples:
            | Full Name | Email              | Password  | Confirm password |
            | New User  | auto+{uuid}@ex.com | Abc@12345 | Abc@12345        |

    Scenario: Successful Corporate registration
        Given the user is on the Register Type page
        When the user selects create new account for company
        Then the "Join Now" button under join as a Corporate should be enabled
        When the user clicks the "Join Now" button under join as a Corporate
        When the user fills the form with "<Inquiry Type>" and "<Company name>" and "<Industry>" and "<Contact person>" and "<Job Title>" and "<Country Code>" and "<Phone Number>" and "<Email>":
        And the user clicks on "SUBMIT" button
        Then the user should see a success message "Successful"
        Then the user clicks "OK" in the success message dialog
        And the user should be redirected to membership registeration success page

        Examples:
            | Inquiry Type                 | Company name   | Industry | Contact person | Job Title | Country Code | Phone Number | Email             |
            | Open A New Corporate Account | Tech Solutions | IT       | John Doe       | Manager   | +66          | 979431187    | admin@company.com |

    Scenario: Successful Corporate registration
        Given the user is on the Register Type page
        When the user selects exisiting company account
        Then the "Join Now" button under join as a Corporate should be enabled
        When the user clicks the "Join Now" button under join as a Corporate
        When the user fills the form with "<Inquiry Type>" and "<Company name>" and "<Industry>" and "<Contact person>" and "<Job Title>" and "<Country Code>" and "<Phone Number>" and "<Email>":
        And the user clicks on "SUBMIT" button
        Then the user should see a success message "Successful"
        Then the user clicks "OK" in the success message dialog
        And the user should be redirected to membership registeration success page

        Examples:
            | Inquiry Type                 | Company name   | Industry | Contact person | Job Title | Country Code | Phone Number | Email             |
            | Open A New Corporate Account | Tech Solutions | IT       | John Doe       | Manager   | +66          | 979431187    | admin@company.com |
