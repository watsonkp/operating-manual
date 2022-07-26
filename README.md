# Operating Manual

Dissatisfaction with note taking apps lead me to this experiment. My use case is to incrementally develop procedures from references to written documentaiton, images, and books. Data is stored in PostgreSQL, accessed through an API written in Ruby using the Sinatra library. A single page web application written in JavaScript without a framework consumes the API.

The web application was written without a framework to explore how modern frameworks can manipulate the DOM to build single page web applications.

## Deployment
There are two Docker containers. One contains the PostgreSQL database while the other contains the Ruby web server. The two containers communicate through a Docker network. See `run-db.sh` and `run-api.sh`.

To build the containers see `build-db.sh` and `build-api.sh`.

## Usage
Notes are written in markdown. The web application will parse and transform markdown into html.

## Backup

## Development
Connect directly to the database using a PostgreSQL container running the psql command. See `run-api.sh`.

# When running (docker ps)
CONTAINER ID   IMAGE                         COMMAND                  CREATED        STATUS        PORTS                       NAMES
e51150ca1a6d   sulliedeclat/manual-api:0.1   "./api.rb"               8 months ago   Up 8 months   0.0.0.0:4567->4567/tcp      manual-api
974c58542e13   sulliedeclat/manual-db:0.1    "docker-entrypoint.s…"   8 months ago   Up 8 months   5432/tcp                    manual-db
