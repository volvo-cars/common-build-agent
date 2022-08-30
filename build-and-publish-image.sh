#! /bin/bash
secretsExternal=/tmp/cb-secrets
secretsInternal=/secrets
out=/tmp/cb-out

rm -rf $secretsExternal
mkdir -p $secretsExternal
rm -rf $out
mkdir -p $out

docker run -v $PWD:/work -v $secretsExternal:$secretsInternal -v $out:/out -w /work common-build-agent-dev:latest sh -c "npm run build && NODE_PATH=\$PWD/node_modules;node build/tests/dev/build-image.js --secretsPaths $secretsExternal:$secretsInternal > /out/build.sh && chmod +x /out/build.sh"
$out/build.sh