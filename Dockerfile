# HAL9000 Project Runtime Container
# =================================
# Provides isolated execution environment for generated projects.
# Supports web-app (Node.js), python-cli, python-lib, and api-backend project types.

ARG BASE_IMAGE=node:20-slim

FROM ${BASE_IMAGE}

# Install common development tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -s /bin/bash hal9000 \
    && mkdir -p /project \
    && chown -R hal9000:hal9000 /project

# Set working directory
WORKDIR /project

# Switch to non-root user
USER hal9000

# Environment variables
ENV HOME=/home/hal9000
ENV PATH="/home/hal9000/.local/bin:${PATH}"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=development

# Default command - keep container running
CMD ["tail", "-f", "/dev/null"]
