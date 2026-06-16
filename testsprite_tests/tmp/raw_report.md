
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** Coturne
- **Date:** 2026-06-16
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Log in and reach the home feed
- **Test Code:** [TC001_Log_in_and_reach_the_home_feed.py](./TC001_Log_in_and_reach_the_home_feed.py)
- **Test Error:** TEST FAILURE

Login did not work — the email and password were not accepted.

Observations:
- The login form shows the error message 'E-mail ou mot de passe incorrect'.
- The page remained on the login screen and did not navigate to an authenticated home feed.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/d2872731-b9e0-4184-a3aa-6d999688ef3b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Handle invalid login credentials
- **Test Code:** [TC002_Handle_invalid_login_credentials.py](./TC002_Handle_invalid_login_credentials.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/cb5f55c0-3d45-44a5-8795-4b507463cf2c
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Register a new account successfully
- **Test Code:** [TC003_Register_a_new_account_successfully.py](./TC003_Register_a_new_account_successfully.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/c4014efb-245a-46ff-b0dd-3473f4cb6eec
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Logged-in users can access the home feed
- **Test Code:** [TC006_Logged_in_users_can_access_the_home_feed.py](./TC006_Logged_in_users_can_access_the_home_feed.py)
- **Test Error:** TEST BLOCKED

The test could not be run — a valid authenticated session could not be established because the provided fallback credentials were rejected.

Observations:
- The login page showed the inline error message: 'E-mail ou mot de passe incorrect'.
- Two login attempts were made using example@gmail.com / password123 and both failed; the app remained on the sign-in form.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/5601f5c8-5469-4116-9466-d4ae9ed14c28
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Complete onboarding and reach discovery
- **Test Code:** [TC008_Complete_onboarding_and_reach_discovery.py](./TC008_Complete_onboarding_and_reach_discovery.py)
- **Test Error:** TEST BLOCKED

The registration flow could not be completed — the app prevents creating a user account and external OAuth is misconfigured.

Observations:
- Email signup attempts were rejected by server-side password validation and did not create an account despite multiple strong passwords being tried.
- The Google sign-up attempt navigated to the OAuth authorize endpoint which returned: {"code":400,"error_code":"validation_failed","msg":"Unsupported provider: missing OAuth secret"} indicating the provider is not configured.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/e6a48312-3c96-4562-baeb-f9387c67f65b
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Direct visits to the home feed require authentication
- **Test Code:** [TC009_Direct_visits_to_the_home_feed_require_authentication.py](./TC009_Direct_visits_to_the_home_feed_require_authentication.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/4d8d9630-a661-4000-9912-efc2d855859e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Complete the onboarding flow
- **Test Code:** [TC011_Complete_the_onboarding_flow.py](./TC011_Complete_the_onboarding_flow.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/3769dac1-45c5-44f3-abc7-fada0bf2742f
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Logged-in users see the home feed as the post-login landing page
- **Test Code:** [TC013_Logged_in_users_see_the_home_feed_as_the_post_login_landing_page.py](./TC013_Logged_in_users_see_the_home_feed_as_the_post_login_landing_page.py)
- **Test Error:** TEST FAILURE

Login did not succeed — submitting credentials did not navigate the user to the main home feed.

Observations:
- The login form remains visible and shows the error message 'E-mail ou mot de passe incorrect' in red.
- The E-mail input contains 'example@gmail.com' and the password field is populated, but the app did not navigate to the main home feed after three submit attempts.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/b177e376-0c1e-488a-8ec3-37ec35889ccf
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Read and reply in a chat thread
- **Test Code:** [TC015_Read_and_reply_in_a_chat_thread.py](./TC015_Read_and_reply_in_a_chat_thread.py)
- **Test Error:** TEST BLOCKED

The test could not be run to completion because valid user authentication could not be achieved with the provided/default credentials.

Observations:
- The login page shows the error 'E-mail ou mot de passe incorrect'.
- The page remained on the login screen with the email and password fields and the 'Se connecter par e-mail' button visible after two login attempts.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/fae20e93-be14-4935-b0ac-9f1c22933a97
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Browse roommate candidates and like a profile
- **Test Code:** [TC016_Browse_roommate_candidates_and_like_a_profile.py](./TC016_Browse_roommate_candidates_and_like_a_profile.py)
- **Test Error:** TEST BLOCKED

The test could not be run because login failed with invalid credentials, preventing access to the Discover feature.

Observations:
- After submitting credentials, the login page displayed the error message: 'E-mail ou mot de passe incorrect'.
- The Discover page was not reached because authentication did not succeed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/5b692941-25a9-4a4a-bcf7-fe93ad96521b
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 View and update profile details
- **Test Code:** [TC017_View_and_update_profile_details.py](./TC017_View_and_update_profile_details.py)
- **Test Error:** TEST BLOCKED

The test could not be run — an authenticated session could not be obtained because account creation or login did not complete through the UI.

Observations:
- Submitting the signup form returned to the login page with no visible confirmation or success message.
- Login attempts for the newly created credentials show the inline error 'E-mail ou mot de passe incorrect'.
- No authenticated navigation to the profile page was possible from the UI in this session.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/0956bd2a-04a0-4e17-86df-56f61ddcae42
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Signed-in users can return to the home feed from another app area
- **Test Code:** [TC018_Signed_in_users_can_return_to_the_home_feed_from_another_app_area.py](./TC018_Signed_in_users_can_return_to_the_home_feed_from_another_app_area.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the UI requires successful authentication but the provided/default credentials were rejected and no valid credentials are available to continue.

Observations:
- The login form displayed the inline error message: 'E-mail ou mot de passe incorrect'.
- The page remains on the login screen and the app is not authenticated, so the home feed cannot be reached.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/72b80b84-8013-44a3-bbc8-0607e5775cda
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Send a message to a matched roommate
- **Test Code:** [TC019_Send_a_message_to_a_matched_roommate.py](./TC019_Send_a_message_to_a_matched_roommate.py)
- **Test Error:** TEST BLOCKED

The test could not be run — login credentials were rejected, preventing access to the chat features required by the test.

Observations:
- The login page displayed the error 'E-mail ou mot de passe incorrect'.
- The application remained on the login screen and no chat area was accessible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/a3418872-9d78-4120-91a9-b54c49538ac3
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC021 Browse roommate candidates and pass on a profile
- **Test Code:** [TC021_Browse_roommate_candidates_and_pass_on_a_profile.py](./TC021_Browse_roommate_candidates_and_pass_on_a_profile.py)
- **Test Error:** TEST BLOCKED

The test could not be run — login failed with the provided credentials, preventing access to the Discover feature required by the test.

Observations:
- The login form displayed the error message: 'E-mail ou mot de passe incorrect'.
- The session remained on the login page and the Discover page was not reachable because authentication did not succeed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/33c577f8-07cb-4c31-8815-bc88003e836c
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC022 Open the chat inbox
- **Test Code:** [TC022_Open_the_chat_inbox.py](./TC022_Open_the_chat_inbox.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the login credentials were not accepted, preventing access to the chat inbox.

Observations:
- The login form displayed the error 'E-mail ou mot de passe incorrect'.
- Two sign-in attempts with the provided credentials (example@gmail.com / password123) failed and the page remained on the login screen.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9ed52a46-2b1d-4199-a43c-1781af375c0a/6fafbc4a-78f3-4c89-bd78-e1bb7a8f34b1
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **26.67** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---