

export class StorageConfig {
  readonly bucket: string;
  readonly expiration: number;

  readonly maxFileSize: number;
  readonly allowedExtensions: Set<string>;
  readonly allowedContentTypes: Set<string>;

  readonly forcePathStyle:boolean;


  constructor() {
    // Storage
    this.bucket = process.env.AWS_S3_BUCKET ?? "";
    this.expiration = Number (process.env.AWS_S3_EXPIRATION ?? 300);
    this.maxFileSize = Number (process.env.AWS_S3_MAX_FILE_SIZE ?? 1024);
    this.allowedExtensions = new Set(process.env.AWS_S3_ALLOWED_EXTENSIONS?.split(","));
    this.allowedContentTypes = new Set(process.env.AWS_S3_ALLOWED_CONTENT_TYPES?.split(","));

    this.forcePathStyle = process.env.AWS_S3_FORCE_PATH_STYLE ==="true";

  }
}
