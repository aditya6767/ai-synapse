FROM ubuntu:22.04        

RUN apt-get -qqy update && apt-get -qqy install --no-install-recommends \
    systemd systemd-sysv


# RUN apt-get update && apt-get install -y \
#     docker.io docker-compose


RUN apt-get install -y systemd vim git curl wget net-tools iputils-ping build-essential
RUN apt-get install -y openssh-server sudo
RUN systemctl enable ssh.service

RUN curl -fsSL https://tailscale.com/install.sh | sh

RUN useradd -m -s /bin/bash ubuntu && \
    echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers


RUN chown -R ubuntu:ubuntu /home/ubuntu

# Start the systemd Init service by default
CMD [ "/sbin/init" ]
