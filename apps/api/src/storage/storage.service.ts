import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Thin wrapper around the S3-compatible object store (MinIO in dev, per
 * docker-compose.yml). Mirrors services/data-workers/app/storage.py's role
 * on the Python side — this is the Node-side half, needed now that a real
 * upload flow exists (menu photos/PDFs land here before POST /internal/ingest
 * enqueues extraction against them).
 */
@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>("S3_BUCKET")!;
    this.client = new S3Client({
      endpoint: this.config.get<string>("S3_ENDPOINT"),
      region: this.config.get<string>("S3_REGION"),
      credentials: {
        accessKeyId: this.config.get<string>("S3_ACCESS_KEY")!,
        secretAccessKey: this.config.get<string>("S3_SECRET_KEY")!,
      },
      // MinIO needs path-style addressing (bucket.endpoint.com doesn't
      // resolve for a local single-host dev instance); real AWS S3 doesn't
      // need this, but it's harmless there too.
      forcePathStyle: true,
    });
  }

  async uploadObject(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }
}
