FROM jenkins/ssh-agent:6.11.2-jdk21

ARG DOCKER_GID=988

USER root

RUN apt-get update && apt-get install -y \
    curl bash sudo ca-certificates gnupg \
    && install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update && apt-get install -y docker-ce-cli \
    && curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash \
    && apt-get update && apt-get install -y infisical

RUN (groupadd -g ${DOCKER_GID} docker || groupmod -g ${DOCKER_GID} docker || true) \
    && usermod -aG docker jenkins \
    && echo "jenkins ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

USER root