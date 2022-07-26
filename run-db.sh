#!/bin/bash

docker run --name manual-db --network platform-network -v /home/sulliedeclat/platform/data:/var/lib/postgresql/data -e 'POSTGRES_PASSWORD='' -e POSTGRES_DB=operating_manual -d sulliedeclat/manual-db:0.1
