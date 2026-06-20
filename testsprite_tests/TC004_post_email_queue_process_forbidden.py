import requests

def test_post_email_queue_process_forbidden():
    base_url = "http://localhost:8081"
    endpoint = "/lovable/email/queue/process"
    url = base_url + endpoint

    # Use an invalid or insufficient Authorization token
    headers = {
        "Authorization": "Bearer invalid_or_insufficient_permission_token"
    }

    try:
        response = requests.post(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}"
    assert "forbidden" in response.text.lower() or response.text.strip() == "", "Response text should indicate forbidden access or be empty"

test_post_email_queue_process_forbidden()