#! /bin/bash
PREFIX="artcsp-docker-lts.ara-artifactory.volvocars.biz/"
export CURRENT_DIR=$(pwd)
docker-compose -f ${CURRENT_DIR}/docker/docker-compose.yml down
echo Stopped containers.
docker ps
