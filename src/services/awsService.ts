import AWS from "aws-sdk";
import crypto from "crypto";
import { KryosService } from "./kryosService";

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "demo-kryos";

// Kryos SDK client
const kryos = new KryosService(process.env.KRYOS_API_KEY || "demo-api-key");

// ----------------- AWS Service -----------------

/**
 * Upload file to S3 and send hash to Kryos
 * @param fileBuffer - Buffer of the file
 * @param fileName - Original file name
 * @param userId - User ID to associate the hash
 * @returns URL of uploaded file
 */
export const uploadFile = async (fileBuffer: Buffer, fileName: string, userId: string): Promise<string> => {
    const key = `${crypto.randomUUID()}_${fileName}`;
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer
    };

    const uploadResult = await s3.upload(params).promise();

    // Generate hash of uploaded file URL
    const fileHash = crypto.createHash("sha256").update(uploadResult.Location).digest("hex");

    // Send hash to Kryos backend
    await kryos.sendHash(fileHash, userId);

    return uploadResult.Location;
};

/**
 * Download file from S3
 * @param key - S3 key of the file
 * @returns File stream
 */
export const downloadFile = (key: string) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key
    };
    return s3.getObject(params).createReadStream();
};
