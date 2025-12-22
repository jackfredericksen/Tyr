# Tyr Example Files

This directory contains **intentionally insecure** example files for testing Tyr's threat modeling capabilities.

## ⚠️ WARNING

**DO NOT USE THESE FILES IN PRODUCTION!**

These files are deliberately created with security vulnerabilities for demonstration and testing purposes. They contain common security anti-patterns and misconfigurations that Tyr is designed to detect.

## Files

### 1. `ecommerce-architecture.md`
A high-level architecture description of an e-commerce platform with various security concerns.

**Use case**: Test threat modeling on system architecture
```bash
tyr analyze -i examples/ecommerce-architecture.md -f console
```

**What Tyr should find**:
- Unencrypted inter-service communication
- Weak session management
- Missing WAF
- Hardcoded credentials in various places
- Insufficient monitoring and logging
- No disaster recovery plan

---

### 2. `insecure-infrastructure.tf`
Terraform configuration with multiple AWS security misconfigurations.

**Use case**: Test infrastructure-as-code security scanning
```bash
tyr analyze -i examples/insecure-infrastructure.tf -t terraform -f html -o tf-report.html
```

**What Tyr should find**:
- Overly permissive security groups (0.0.0.0/0)
- SSH/RDP exposed to internet
- Unencrypted storage (S3, RDS, EBS)
- Hardcoded credentials in user data and variables
- Public database access
- Missing encryption at rest
- No MFA, no logging, no monitoring
- IAM roles with excessive permissions
- Sensitive outputs not marked as sensitive

---

### 3. `insecure-k8s.yaml`
Kubernetes manifest with container security issues.

**Use case**: Test Kubernetes security analysis
```bash
tyr analyze -i examples/insecure-k8s.yaml -t kubernetes -f console
```

**What Tyr should find**:
- Containers running as root
- Privileged containers
- No resource limits
- Secrets stored as base64 (not encrypted at rest)
- Using `latest` image tags
- Missing pod security policies/standards
- Host network/PID/IPC access
- Overly permissive RBAC
- Missing network policies
- No security context
- Hardcoded credentials
- Mounting Docker socket
- No health checks

---

## All Files Are Sanitized

**Important**: All credentials, API keys, and sensitive data in these examples are:
- ✅ Fake/placeholder values only
- ✅ Safe to commit to version control
- ✅ For demonstration purposes only
- ✅ Not connected to any real systems

### Examples of sanitized data:
- Database passwords: `SuperSecret123!` (obviously fake)
- API keys: `1234567890abcdef` (placeholder)
- Stripe keys: `sk_test_1234567890` (test mode placeholder)
- AWS AMIs: Generic/old AMI IDs
- Domain names: `example.com`, `demo-company`
- IP addresses: RFC 1918 private ranges

## Using These Files

### Quick Test
```bash
# Test the quickstart script
cd /path/to/tyr
./quickstart.sh
```

### Individual Analysis
```bash
# Architecture analysis
tyr analyze -i examples/ecommerce-architecture.md -f console

# Terraform analysis with HTML report
tyr analyze -i examples/insecure-infrastructure.tf -t terraform -f html -o tf-report.html

# Kubernetes analysis with JSON output
tyr analyze -i examples/insecure-k8s.yaml -t kubernetes -f json -o k8s-threats.json
```

### Batch Scanning
```bash
# Scan all example files
tyr scan -d examples/ -f console
```

### Interactive Mode
```bash
# Load architecture as context and ask questions
tyr interactive --context examples/ecommerce-architecture.md

# Then ask:
# - "What are the top 3 critical risks?"
# - "How should I secure the database?"
# - "Explain the authentication vulnerabilities"
```

## Creating Your Own Test Files

When creating test files:

1. **Never include real credentials**
   - Use obviously fake passwords like `Password123!`
   - Use placeholder API keys like `1234567890abcdef`
   - Use test mode keys for payment processors

2. **Use placeholder domains/IPs**
   - Domains: `example.com`, `demo.local`, `test.internal`
   - IPs: Private ranges (10.x.x.x, 192.168.x.x, 172.16.x.x)

3. **Mark intentional vulnerabilities**
   - Add comments like `# ISSUE: Description of the problem`
   - This helps verify Tyr finds the expected threats

4. **Keep it realistic**
   - Use real-world anti-patterns
   - Include common misconfigurations
   - Reference actual technologies and services

## Expected Results

When running these examples through Tyr, you should see:

- **Multiple STRIDE categories**: Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege
- **Various risk levels**: Critical, High, Medium, Low
- **Actionable mitigations**: Specific fixes for each threat
- **Educational context**: Explanations of why each threat matters

## Troubleshooting

### "File not found" error
Make sure you're running from the Tyr root directory:
```bash
cd /path/to/tyr
./target/release/tyr analyze -i examples/ecommerce-architecture.md
```

### No threats detected
If Tyr doesn't find threats in these files, check:
1. AI provider is configured correctly (Claude or Ollama)
2. API key is set (for Claude)
3. Ollama is running and has the model loaded
4. Check error logs for API issues

## License

These example files are part of the Tyr project and are provided under the same MIT license.

---

**Remember**: These files are learning tools. Real security requires proper architecture, regular audits, and defense in depth!
