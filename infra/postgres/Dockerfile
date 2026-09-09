# PostGIS + pgvector in one image — no official image ships both, so we
# start from pgvector's official image (pgvector precompiled against
# Postgres 16 on a maintained Debian base) and add PostGIS via apt.
# The inverse (starting from postgis/postgis and compiling pgvector from
# source) hits an archived/expired apt-security mirror on that image's
# older Debian base — this direction avoids that entirely.
FROM pgvector/pgvector:pg16

RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-16-postgis-3 \
  && rm -rf /var/lib/apt/lists/*
