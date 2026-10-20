"""Verify the actual ingress without building or starting the application stack."""
import ipaddress
import json
from pathlib import Path
import subprocess
import time
import urllib.request
import uuid


def docker(*arguments):
    return subprocess.check_output(["docker", *arguments], text=True, stderr=subprocess.STDOUT).strip()


def main():
    suffix = uuid.uuid4().hex[:10]
    network = f"circa-ingress-test-{suffix}"
    echo = f"{network}-echo"
    gateway = f"{network}-gateway"
    fixture = """
const http = require('node:http');
for (const port of [8080, 3001]) http.createServer((request, response) => {
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Set-Cookie', ['circa_at=test_access; HttpOnly; Path=/', 'circa_rt=test_refresh; HttpOnly; Path=/; SameSite=Strict']);
  response.end(JSON.stringify({port, path: request.url, headers: request.headers}));
}).listen(port, '0.0.0.0');
"""
    try:
        docker("network", "create", network)
        docker("run", "--detach", "--name", echo, "--network", network,
               "--network-alias", "circa-api", "--network-alias", "circa-client",
               "--memory=128m", "--cpus=0.5", "node:24-bookworm-slim",
               "node", "--max-old-space-size=32", "-e", fixture)
        docker("run", "--detach", "--name", gateway, "--network", network,
               "--memory=64m", "--cpus=0.5", "--publish", "127.0.0.1::8080",
               "--volume", f"{Path(__file__).with_name('nginx.conf').resolve()}:/etc/nginx/conf.d/default.conf:ro",
               "nginx:stable-alpine")
        port = docker("port", gateway, "8080/tcp").rsplit(":", 1)[1]
        origin = f"http://127.0.0.1:{port}"
        for path, expected_port in [("/api/v1/auth/me?probe=1", 8080), ("/en/sign-in", 3001)]:
            request = urllib.request.Request(origin + path, headers={
                "X-Forwarded-For": "198.51.100.99", "X-Real-IP": "198.51.100.99",
                "X-Forwarded-Proto": "https", "Forwarded": "for=198.51.100.99", "Origin": origin,
            })
            for attempt in range(50):
                try:
                    response = urllib.request.urlopen(request, timeout=2)
                    break
                except OSError:
                    if attempt == 49:
                        raise
                    time.sleep(0.2)
            with response:
                data = json.load(response)
                assert data["port"] == expected_port and data["path"] == path
                headers = data["headers"]
                ipaddress.ip_address(headers["x-forwarded-for"])
                assert headers["x-forwarded-for"] != "198.51.100.99"
                assert headers["x-real-ip"] == headers["x-forwarded-for"]
                assert headers["x-forwarded-proto"] == "http"
                assert "forwarded" not in headers
                assert headers["origin"] == origin
                cookies = response.headers.get_all("Set-Cookie")
                assert len(cookies) == 2 and all("HttpOnly" in cookie for cookie in cookies)
        print("Ingress verified: API/Next routing, spoofed IP replacement, Origin, and both HttpOnly cookies.")
    finally:
        # These names belong exclusively to this disposable verification run.
        subprocess.run(["docker", "rm", "--force", gateway, echo], capture_output=True)
        subprocess.run(["docker", "network", "rm", network], capture_output=True)


if __name__ == "__main__":
    main()
