# Usage instructions

# build.yml

The `.common-build/build.yml` file controls build steps of your build.

```yml
toolImage: artcsp-docker.ara-artifactory.volvocars.biz/vcc/common-build-agent:0.16.0
version: 1
build:
  steps:
    - type: compose # Runs commands in docker containers
      nodes:
        nodename1:
          image: docker-image-url:revision
        nodename2:
          image: docker-image2-url:revision
      secrets?:
        local-mount-name: secret-vault-path
      commands:
        - cmd: bash command to be executed in container
          node?: nodename1 # Required if 1+ containers in build step.
        - cmd: bash command to be executed in container
          node?: nodename2  
    - type: build # Builds a docker image
      file: local-file.docker
      name: docker-image-name # Name of image in docker-registry
      target?: optional-target # If docker file contains multiple targets. 
```
At build time the cotainer workdir is set `/work` which is a mounted volume of the checked out revision of source-code repository.

The build will fail if any executed command returns an `exit-code>0`

The [latest released version](https://common-build-staging.csp-dev.net/repo/csp-gerrit.ci.common-build-agent/state) of the Common Build Agent.


## publish.yml

```yml
artifacts?:
  remote: remote-host # Ex: ara-artifactory.volvocars.biz
  repository: artifactory-repository # Ex: ARTCSP-CI
  items:
    - path: csp/nodes/lpa # The artifact path within the repository
      qualifiers:
        - src: artifacts/lpa-*.tgz # Glob pattern to identify file/files to publish in the artifact
          name?: lpa.tgz # Rename the published file.
          pack?: [no|yes|auto] defaults to auto.
images?:
  remote: remote-docker-registry # Ex: artcsp-docker.ara-artifactory.volvocars.biz
  items:
    - name: docker-image-name # The local daemon docker image name from build step type=build.
```

Notes: 

The `qualifier.src` attribute supports [glob-pattern](https://en.wikipedia.org/wiki/Glob_(programming)).

Default pack behavior:

| pattern | pattern example | `auto` pack resolution | automatic file name resolution |
| --- | --- | --- | --- |
| Pattern not containing the glob symbol `*`. | `artifacts/file.bin` | `no` | `file.bin` |
| Pattern containing the glob symbol `*` | `some-folder-name/*.bin` | `yes` | `some-folder-name.tar.gz` or `no-name.tar.gz` if at root level.


### Overriding file name

The automatically resolved file name can be overridden by the attribute `qualifier.name`. 

### How to publish a single file with dynamic file name

If you need match a single file with a dynamic file name like `artifacts/my-file-0.1.2.tgz` you need to overwride the default pack-behavior for patterns using glob-symbols:

```yml
- src: artifacts/lpa-*.tgz
  name: lpa.tgz
  pack: no
```