import crypto from "crypto";

let exports: any = {};

const getbytes = (length: number, seed: string) => {
  var chash = crypto
    .createHash("sha512")
    .update(
      "jzg4dcn0AaxK6XOe6qVxYGTXJf3Wf6LB-K9BrAZqQczH5F6TnKs4Z5jt69x44RntZ-ifjPGub4a6lZCLHoioCsp4A6SWEMQbjw"
    )
    .update(seed)
    .digest();
  var value = Buffer.alloc(0);

  while (value.length < length) {
    chash = crypto.createHash("sha512").update(chash).digest();
    value = Buffer.concat([value, chash]);
  }

  return value.slice(0, length);
};

const encrypt = (data: string, key: string, iv: Buffer) => {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let result = cipher.update(data, "utf-8", "base64");
  result += cipher.final("base64");
  return result;
};

exports.encrypt = encrypt;

const decrypt = (data: string, key: string, iv: Buffer) => {
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let result = decipher.update(data, "base64", "utf-8");
  return result + decipher.final("utf8");
};

exports.decrypt = decrypt;

const bufferToBase64 = (buffer: Buffer) => {
  return buffer.toString("base64");
};

exports.bufferToBase64 = bufferToBase64;
const base64ToBuffer = (buffer: string) => {
  return Buffer.from(buffer, "base64");
};

exports.base64ToBuffer = base64ToBuffer;

const generateKeyAndIvFromSeed = (seed: string) => {
  const iv = getbytes(16, seed);
  const key = crypto
    .scryptSync(
      seed,
      getbytes(
        16,
        crypto.createHmac("sha512", seed).update(seed, "utf-8").digest("base64")
      ),
      16
    )
    .toString("hex");

  return key + "|" + bufferToBase64(iv);
};

exports.generateKeyAndIvFromSeed = generateKeyAndIvFromSeed;

export default exports;
