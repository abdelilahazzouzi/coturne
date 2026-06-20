import requests
import xml.etree.ElementTree as ET

def test_get_sitemap_xml_success():
    base_url = "http://localhost:8081"
    url = f"{base_url}/sitemap.xml"
    headers = {
        "Accept": "application/xml"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate status code
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    content_type = response.headers.get('Content-Type', '')
    assert 'xml' in content_type.lower(), f"Expected XML content-type, got '{content_type}'"

    # Parse XML and check for URLs
    try:
        root = ET.fromstring(response.content)
    except ET.ParseError as e:
        assert False, f"Response is not valid XML: {e}"

    # Basic sitemap XML structure check: urlset with at least one url child and loc element
    # Sitemap XML namespace standard: http://www.sitemaps.org/schemas/sitemap/0.9
    namespace = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

    if root.tag.endswith("urlset"):
        urls = root.findall("sm:url", namespace)
        assert len(urls) > 0, "Sitemap XML does not contain any <url> entries"
        for url_entry in urls:
            loc = url_entry.find("sm:loc", namespace)
            assert loc is not None and loc.text, "A <url> entry is missing a <loc> element or it is empty"
    else:
        # If no namespace or different root, still check for url elements
        urls = root.findall("url")
        assert len(urls) > 0, "Sitemap XML does not contain any <url> entries"
        for url_entry in urls:
            loc = url_entry.find("loc")
            assert loc is not None and loc.text, "A <url> entry is missing a <loc> element or it is empty"

test_get_sitemap_xml_success()