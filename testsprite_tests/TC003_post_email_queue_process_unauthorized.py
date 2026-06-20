import requests

def test_post_email_queue_process_unauthorized():
    base_url = "http://localhost:8081"
    url = f"{base_url}/lovable/email/queue/process"
    
    try:
        response = requests.post(url, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    
    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"

test_post_email_queue_process_unauthorized()