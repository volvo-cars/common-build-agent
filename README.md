# Common Build Agent

The Common Build Agent (CBA) is the part of Common Build that executes on remote build nodes (Cynosure Build resource) at build time. The CBA offers a set of commands that generates plain bash scripts for the Build node to execute.

The CBA is packaged as the Docker image `common-build-agent` and requires `docker` to be installed on the build nodes.

## Build time
The CBA configures the build according to the current commit's `.common-build/build.yml`.
The CBA starts the build by calling the **Init command** and execute the generated script. 

`$(docker run common-build-agent:1.0.0 sh -c "common-build-tool generate")`

Generated CBA script sets up up full docker-compose scenario accord build configuration in `build.yml`.

## Commands

* `common-build-tool generate step?=[pre|post]` - Called by Build host to get the script to execute.

### Internal commands
The following commands are not ment to be called externally.

* `common-build-tool publish` - Publishes built artifacts according to `.common-build/publish.yml`.
* `common-build-tool dependencies` - Downloads dependencies in `.common-build/dependencies.yml` and other supported manifests such as `default.xml` (Google repo).



