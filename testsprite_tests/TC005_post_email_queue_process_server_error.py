import requests

BASE_URL = "http://localhost:8081"
TIMEOUT = 30

def test_post_email_queue_process_server_error():
    url = f"{BASE_URL}/lovable/email/queue/process"
    # Assuming that to trigger the 500 error for missing/invalid server config,
    # a valid authorization header is included (since 401 and 403 are separate errors).
    # Use a token that simulates invalid server configuration state.
    headers = {
        "Authorization": "Bearer invalid-server-config-token"
    }

    try:
        response = requests.post(url, headers=headers, timeout=TIMEOUT)
        # Assert that the server returns 500 for missing or invalid configuration
        assert response.status_code == 500, f"Expected status code 500, got {response.status_code}"
        assert "Server configuration error" in response.text or response.reason == "Internal Server Error", \
            "Response does not indicate server configuration error"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_email_queue_process_server_error()