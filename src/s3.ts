import S3 from 'aws-sdk/clients/s3';
// import { S3 } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { Readable } from 'stream';
dotenv.config();

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

function bufferToStream(binary) {
  const readableInstanceStream = new Readable({
    read() {
      this.push(binary);
      this.push(null);
    },
  });

  return readableInstanceStream;
}

export function upload(file: Express.Multer.File) {
  //   console.log(file);
  const code = Array.from(Array(8), () =>
    Math.floor(Math.random() * 36).toString(36),
  ).join('');
  return s3
    .upload({
      Bucket: bucketName,
      Body: bufferToStream(file.buffer),
      Key: code + '_' + file.originalname,
    })
    .promise();
}

export function download(fileKey: string) {
  return s3.getObject({ Key: fileKey, Bucket: bucketName }).createReadStream();
}
