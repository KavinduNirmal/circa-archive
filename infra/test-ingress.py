"""Exercise actual Nginx host routing, redirects, static files, and auth forwarding."""
import ipaddress
import json
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import uuid


def docker(*arguments):
    return subprocess.check_output(["docker", *arguments], text=True, stderr=subprocess.STDOUT).strip()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, file, code, message, headers, target):
        return None


def main():
    suffix = uuid.uuid4().hex[:10]
    network = f"circa-ingress-test-{suffix}"
    echo, gateway, meta = [f"{network}-{name}" for name in ["echo", "gateway", "meta"]]
    fixture = """
const http = require('node:http');
for (const port of [8080, 3001]) http.createServer((request, response) => {
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Set-Cookie', ['circa_at=test_access; HttpOnly; Path=/', 'circa_rt=test_refresh; HttpOnly; Path=/; SameSite=Strict']);
  response.end(JSON.stringify({port, path: request.url, headers: request.headers}));
}).listen(port, '0.0.0.0');
"""
    root = Path(__file__).resolve().parent.parent
    opener = urllib.request.build_opener(NoRedirect)
    with tempfile.TemporaryDirectory(prefix="circa-ingress-") as temporary:
        work = Path(temporary)
        public = work / "public"
        (public / "en/documentation").mkdir(parents=True)
        (public / "en/index.html").write_text("<h1>Project fixture</h1>")
        (public / "en/documentation/index.html").write_text("<h1>Documentation fixture</h1>")
        (public / "404.html").write_text("<h1>Not filed</h1>")
        config = root.joinpath("infra/nginx.conf").read_text()
        config = config.replace("${PROJECT_HOST}", "project.localhost").replace("${ARCHIVE_HOST}", "archive.localhost").replace("${PROJECT_SITE_ORIGIN}", "http://project.localhost:3001")
        (work / "gateway.conf").write_text(config)
        try:
            docker("network", "create", network)
            docker("run", "--detach", "--name", echo, "--network", network,
                   "--network-alias", "circa-api", "--network-alias", "circa-client",
                   "--memory=128m", "--cpus=0.5", "node:24-bookworm-slim",
                   "node", "--max-old-space-size=32", "-e", fixture)
            docker("run", "--detach", "--name", meta, "--network", network,
                   "--network-alias", "circa-meta", "--memory=64m", "--cpus=0.5",
                   "--volume", f"{root / 'meta/nginx.conf'}:/etc/nginx/conf.d/default.conf:ro",
                   "--volume", f"{public}:/usr/share/nginx/html:ro", "nginx:stable-alpine")
            docker("run", "--detach", "--name", gateway, "--network", network,
                   "--memory=64m", "--cpus=0.5", "--publish", "127.0.0.1::8080",
                   "--volume", f"{work / 'gateway.conf'}:/etc/nginx/conf.d/default.conf:ro",
                   "nginx:stable-alpine")
            docker("exec", gateway, "nginx", "-t")
            port = docker("port", gateway, "8080/tcp").rsplit(":", 1)[1]
            origin = f"http://127.0.0.1:{port}"

            def request(path, host="archive.localhost", extra=None):
                headers = {"Host": host, **(extra or {})}
                for attempt in range(50):
                    try:
                        return opener.open(urllib.request.Request(origin + path, headers=headers), timeout=2)
                    except urllib.error.HTTPError as response:
                        return response
                    except OSError:
                        if attempt == 49:
                            raise
                        time.sleep(0.2)

            for path, expected_port in [("/api/v1/auth/me?probe=1", 8080), ("/en/sign-in", 3001), ("/_next/static/test.js", 3001)]:
                with request(path, extra={"X-Forwarded-For": "198.51.100.99", "X-Real-IP": "198.51.100.99", "X-Forwarded-Proto": "https", "Forwarded": "for=198.51.100.99", "Origin": origin}) as response:
                    data = json.load(response)
                    assert data["port"] == expected_port and data["path"] == path
                    headers = data["headers"]
                    ipaddress.ip_address(headers["x-forwarded-for"])
                    assert headers["x-forwarded-for"] != "198.51.100.99"
                    assert headers["x-real-ip"] == headers["x-forwarded-for"]
                    assert headers["x-forwarded-proto"] == "http" and "forwarded" not in headers
                    assert headers["origin"] == origin
                    cookies = response.headers.get_all("Set-Cookie")
                    assert len(cookies) == 2 and all("HttpOnly" in cookie for cookie in cookies)
            for path in ["/en/", "/en/documentation/"]:
                with request(path, "project.localhost") as response:
                    assert response.status == 200 and "fixture" in response.read().decode(), "Project host must serve static Astro, not Next"
                    assert response.headers.get("Set-Cookie") is None
                    assert response.headers.get("Cache-Control") == "no-cache"
            for path in ["/missing/", "/api/v1/auth/me"]:
                with request(path, "project.localhost") as response:
                    assert response.status == 404, "Project origin must not expose account APIs or SPA fallback"
            for old, new in [
                ("/en/meta?from=old", "/en/?from=old"),
                ("/ko/meta/about", "/ko/about/project/"),
                ("/ko/meta/documentation", "/ko/documentation/"),
                ("/en/meta/documentation/overview", "/en/documentation/"),
                ("/ko/meta/documentation/lore-anatomy?view=1", "/ko/documentation/lore-anatomy/?view=1"),
            ]:
                with request(old) as response:
                    assert response.status == 308, f"Missing legacy redirect: {old}"
                    assert response.headers["Location"] == "http://project.localhost:3001" + new
            # The static project stays available when application services are down.
            docker("stop", echo)
            with request("/en/", "project.localhost") as response:
                assert response.status == 200
            print("Ingress verified: separate origins, static 404s, legacy redirects, API/Next routing, cookie and IP boundaries, independent project availability.")
        finally:
            subprocess.run(["docker", "rm", "--force", gateway, meta, echo], capture_output=True)
            subprocess.run(["docker", "network", "rm", network], capture_output=True)


if __name__ == "__main__":
    main()
