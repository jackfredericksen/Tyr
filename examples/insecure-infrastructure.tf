# Example Terraform Configuration (Intentionally Insecure for Testing)
# DO NOT USE IN PRODUCTION - For threat modeling demonstration only

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "demo-vpc"
  }
}

# Public Subnet (ISSUE: No flow logs)
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true # ISSUE: Auto-assign public IPs

  tags = {
    Name = "public-subnet"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security Group (ISSUE: Too permissive)
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  # ISSUE: Allow all inbound traffic
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all TCP"
  }

  # ISSUE: SSH open to internet
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH from anywhere"
  }

  # ISSUE: RDP open to internet
  ingress {
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "RDP from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "web-security-group"
  }
}

# EC2 Instance (Multiple Issues)
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0" # Amazon Linux 2
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.public.id

  vpc_security_group_ids = [aws_security_group.web.id]

  # ISSUE: No encrypted root volume
  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = false # ISSUE: Unencrypted
  }

  # ISSUE: Metadata service v1 (allows SSRF)
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "optional" # ISSUE: Should be "required" for IMDSv2
  }

  # ISSUE: No monitoring enabled
  monitoring = false

  # ISSUE: Hardcoded credentials in user data
  user_data = <<-EOF
              #!/bin/bash
              echo "DB_PASSWORD=SuperSecret123!" >> /etc/environment
              echo "API_KEY=1234567890abcdef" >> /etc/environment
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              EOF

  tags = {
    Name = "web-server"
  }
}

# S3 Bucket (ISSUE: Public access)
resource "aws_s3_bucket" "data" {
  bucket = "demo-company-data-bucket-12345"

  tags = {
    Name = "data-bucket"
  }
}

# ISSUE: Public access not blocked
resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = false # ISSUE: Should be true
  block_public_policy     = false # ISSUE: Should be true
  ignore_public_acls      = false # ISSUE: Should be true
  restrict_public_buckets = false # ISSUE: Should be true
}

# ISSUE: No encryption configuration
# Missing: aws_s3_bucket_server_side_encryption_configuration

# ISSUE: No versioning enabled
# Missing: aws_s3_bucket_versioning

# ISSUE: No logging enabled
# Missing: aws_s3_bucket_logging

# RDS Database (Multiple Issues)
resource "aws_db_instance" "main" {
  identifier     = "demo-db"
  engine         = "postgres"
  engine_version = "14.7"
  instance_class = "db.t3.micro"

  allocated_storage = 20
  storage_type      = "gp2"
  storage_encrypted = false # ISSUE: Unencrypted

  db_name  = "myapp"
  username = "admin"
  password = "Password123!" # ISSUE: Hardcoded password

  publicly_accessible = true # ISSUE: Database exposed to internet
  skip_final_snapshot = true # ISSUE: No backup on deletion

  vpc_security_group_ids = [aws_security_group.web.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # ISSUE: No automated backups
  backup_retention_period = 0

  # ISSUE: No multi-AZ
  multi_az = false

  # ISSUE: No enhanced monitoring
  enabled_cloudwatch_logs_exports = []

  tags = {
    Name = "main-database"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "main-db-subnet-group"
  subnet_ids = [aws_subnet.public.id]

  tags = {
    Name = "Main DB subnet group"
  }
}

# IAM Role (ISSUE: Too permissive)
resource "aws_iam_role" "ec2_role" {
  name = "ec2-full-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# ISSUE: Administrator access for EC2 instance
resource "aws_iam_role_policy_attachment" "ec2_admin" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-instance-profile"
  role = aws_iam_role.ec2_role.name
}

# CloudWatch Log Group (ISSUE: No encryption, no retention)
resource "aws_cloudwatch_log_group" "app_logs" {
  name = "/aws/application/demo"

  retention_in_days = 0 # ISSUE: Logs kept forever (cost) or no retention policy

  # ISSUE: No KMS encryption
  # kms_key_id = ""

  tags = {
    Name = "app-logs"
  }
}

# Outputs (ISSUE: Exposing sensitive data)
output "database_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "Database endpoint"
  # ISSUE: Sensitive output not marked as sensitive
}

output "database_password" {
  value       = aws_db_instance.main.password
  description = "Database password"
  # ISSUE: Password exposed in state file and console
}

output "instance_public_ip" {
  value       = aws_instance.web.public_ip
  description = "Web server public IP"
}
