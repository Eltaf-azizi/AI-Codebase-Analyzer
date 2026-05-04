import re


class SecurityScanner:
    SECRET_PATTERNS = [
        (re.compile(r"AKIA[0-9A-Z]{16}"), "Potential AWS access key"),
        (re.compile(r"(?i)api[_-]?key\\s*[:=]\\s*[\"'][^\"']+[\"']"), "Potential hardcoded API key"),
        (re.compile(r"(?i)password\\s*[:=]\\s*[\"'][^\"']+[\"']"), "Potential hardcoded password"),
    ]

    def scan(self, files: dict[str, str]) -> list[dict]:
        findings: list[dict] = []
        for path, content in files.items():
            for pattern, detail in self.SECRET_PATTERNS:
                if pattern.search(content):
                    findings.append(
                        {
                            "type": "hardcoded_secret",
                            "severity": "high",
                            "file_path": path,
                            "detail": detail,
                        }
                    )
        return findings
