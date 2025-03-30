FROM nvidia/cuda:12.1.0-cudnn8-devel-ubuntu22.04 AS base

RUN apt-get -qqy update && apt-get -qqy install --no-install-recommends \
    systemd systemd-sysv && \
    apt-get install -y \
    vim git curl wget net-tools iputils-ping build-essential jq tmux htop tree dnsutils libpam-systemd locales netcat \
    cmake rsync cron openssh-server openssh-client sudo nvidia-container-toolkit software-properties-common nvtop unzip \
    openssl gnupg2 \
    && rm -rf /var/cache/apt/*

RUN systemctl enable ssh.service

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf aws awscliv2.zip

RUN add-apt-repository -y ppa:deadsnakes/ppa && \
    apt-get update && \
    apt-get install -y python3.10 python3.10-venv python3.10-dev python3-pip && \
    ln -sf /usr/bin/python3.10 /usr/bin/python3 && \
    ln -sf /usr/bin/python3.10 /usr/bin/python

RUN curl -fsSL https://tailscale.com/install.sh | sh

# Install Docker following the official instructions
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add a new user and allow sudo access
RUN useradd -m -s /bin/bash ubuntu && \
    echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers && \
    usermod -aG docker ubuntu

RUN echo 'export PATH="$POETRY_HOME/bin:$VENV_PATH/bin:$PATH"' >> /home/ubuntu/.bashrc \
    && echo 'export PATH="$POETRY_HOME/bin:$VENV_PATH/bin:$PATH"' >> /home/ubuntu/.profile

# Enable and start Docker
RUN systemctl enable docker

# Start the systemd Init service by default
CMD [ "/sbin/init" ]
