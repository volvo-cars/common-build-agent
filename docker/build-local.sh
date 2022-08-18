#! /bin/bash
PREFIX="artcsp-docker-lts.ara-artifactory.volvocars.biz/"
TARGET="dev"
#docker build -t ${PREFIX}onebuild-agent-prod:$(cat docker/Dockerfile.onebuild-agent.version) -t ${PREFIX}onebuild-agent-prod:latest -f docker/Dockerfile.onebuild-agent .

#docker build -t ${PREFIX}onebuild-agent-dev:$(cat docker/Dockerfile.onebuild-agent.version) -t ${PREFIX}onebuild-agent-dev:latest -f docker/Dockerfile.onebuild-agent-dev .

#docker build -t ${PREFIX}onebuild-agent-dev:$(cat docker/Dockerfile.common-build-agent.version) -t ${PREFIX}common-build-agent-dev:latest -f docker/Dockerfile.common-build-agent .
export CURRENT_DIR=$(pwd)
#docker-compose -f ${CURRENT_DIR}/docker/docker-compose.yml up --build --force-recreate --remove-orphans
docker build -f ${CURRENT_DIR}/docker/Dockerfile --target=${TARGET} -t onebuild-agent-dev:latest .
echo Started containers. Use docker/enter.sh container-name to enter a container
docker ps
