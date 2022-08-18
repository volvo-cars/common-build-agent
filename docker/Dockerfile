FROM artcsp-docker.ara-artifactory.volvocars.biz/vcc/common-build-dev:0.3.0

COPY node_modules /common-build/node_modules
COPY build/src /common-build/app
COPY config-local.yaml /common-build
RUN echo "#! /bin/bash \n node /common-build/app/index.js --config=/common-build/config-local.yaml \"\$@\"" > /usr/bin/common-build-tool && chmod +x /usr/bin/common-build-tool
