import crypto from "crypto";

export function decryptSecret(encryptedSecret: string): string {
  const key = getEncryptionKey();

  const [ivBase64, authTagBase64, encryptedBase64] =
    encryptedSecret.split(".");

  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Invalid encrypted secret format");
  }

  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

function getEncryptionKey(): Buffer {
  const key = Buffer.from(process.env.INTEGRATION_ENCRYPTION_KEY!, "base64");

  if (key.length !== 32) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY must decode to exactly 32 bytes"
    );
  }

  return key;
}