FROM postgres:latest
COPY . /docker-entrypoint-initdb.d/
ENV POSTGRES_DB=cloud_storage
ENV POSTGRES_USER=admin