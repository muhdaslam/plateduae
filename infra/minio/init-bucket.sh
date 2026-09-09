#!/bin/sh
# One-shot job (run by the `minio-init` service in docker-compose.yml):
# creates the dev artefacts bucket if it doesn't already exist.
set -eu

mc alias set local "$S3_ENDPOINT" "$S3_ACCESS_KEY" "$S3_SECRET_KEY"
mc mb --ignore-existing "local/$S3_BUCKET"
echo "Bucket $S3_BUCKET ready."
