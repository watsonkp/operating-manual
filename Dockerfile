# docker build -t sulliedeclat/manual-db:0.1 .
FROM postgres:13
ADD docker-entrypoint-initdb.d/*.sql /docker-entrypoint-initdb.d/
