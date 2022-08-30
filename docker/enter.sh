#! /bin/bash
docker run -it -v ${PWD}:/node/app -w /node/app  common-build-agent-dev:latest /bin/bash
