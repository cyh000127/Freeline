FROM jenkins/ssh-agent:6.11.2-jdk21

USER root

RUN apt-get update \
    && apt-get install -y curl bash sudo \
    && curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | bash \
    && apt-get install -y infisical \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER jenkins
