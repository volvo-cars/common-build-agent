#! /bin/bash
export CURRENT_DIR=$(pwd)
docker run -it --entrypoint=/bin/bash -v ${CURRENT_DIR}:/node/app artcsp-docker-lts.ara-artifactory.volvocars.biz/onebuild-agent-dev:0.1
