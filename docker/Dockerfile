FROM artcsp-docker.ara-artifactory.volvocars.biz/vcc/common-build-dev:0.5.0


RUN curl https://storage.googleapis.com/git-repo-downloads/repo > /usr/local/bin/repo && chmod a+rx /usr/local/bin/repo

RUN mkdir /common-build
COPY node_modules /common-build/node_modules
COPY build/src /common-build/app
COPY config-local.yaml /common-build
RUN echo "#! /bin/bash \n node /common-build/app/index.js --config=/common-build/config-local.yaml \"\$@\"" > /usr/bin/common-build-tool && chmod +x /usr/bin/common-build-tool
