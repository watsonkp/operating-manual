#!/bin/bash

docker run -it --rm --name manual-api --mount "type=bind,source=$(pwd)/public,destination=/usr/src/app/public" --network platform-network -p 4567:4567/tcp sulliedeclat/manual-api:0.1
