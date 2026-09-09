#!/bin/bash
if [ ! -d "node_modules/" ]
then
	npm install --only=prod @hyperledger/caliper-cli@0.6.0
fi
npx caliper launch manager \
    --caliper-bind-sut fabric:fabric-gateway \
    --caliper-workspace . \
    --caliper-benchconfig benchmarks/scenario/frauds-detection/config.yaml \
    --caliper-networkconfig networks/fabric/test-network.yaml


