
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** Coturne
- **Date:** 2026-06-20
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 get sitemap xml success
- **Test Code:** [TC001_get_sitemap_xml_success.py](./TC001_get_sitemap_xml_success.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6788ac32-5c44-49f6-b352-e403af9847cd/750a5493-dc84-4de5-90e8-b0da55d3eb4a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 post email queue process authorized
- **Test Code:** [TC002_post_email_queue_process_authorized.py](./TC002_post_email_queue_process_authorized.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 32, in <module>
  File "<string>", line 21, in test_post_email_queue_process_authorized
AssertionError: Expected status code 200 but got 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6788ac32-5c44-49f6-b352-e403af9847cd/f97ad534-b8be-4a21-a170-1c89fde199b8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 post email queue process unauthorized
- **Test Code:** [TC003_post_email_queue_process_unauthorized.py](./TC003_post_email_queue_process_unauthorized.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 14, in <module>
  File "<string>", line 12, in test_post_email_queue_process_unauthorized
AssertionError: Expected status code 401, got 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6788ac32-5c44-49f6-b352-e403af9847cd/6363149e-b87b-4400-ba12-7014c54dd118
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 post email queue process forbidden
- **Test Code:** [TC004_post_email_queue_process_forbidden.py](./TC004_post_email_queue_process_forbidden.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 21, in <module>
  File "<string>", line 18, in test_post_email_queue_process_forbidden
AssertionError: Expected 403 Forbidden, got 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6788ac32-5c44-49f6-b352-e403af9847cd/31d5342e-1a96-43f8-bee6-f362ea431fdb
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 post email queue process server error
- **Test Code:** [TC005_post_email_queue_process_server_error.py](./TC005_post_email_queue_process_server_error.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6788ac32-5c44-49f6-b352-e403af9847cd/fc41c084-4b1a-498b-8b8a-672074b52075
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **40.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---