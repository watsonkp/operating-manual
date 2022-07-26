#!/bin/bash

docker run -it --rm --network platform-network postgres:13 psql -h manual-db -U postgres -d operating_manual
