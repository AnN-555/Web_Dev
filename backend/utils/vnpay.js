import crypto from "crypto";

export const sortObject = (obj) => {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
        sorted[key] = obj[key];
      }
    });
  return sorted;
};

export const buildQueryString = (obj) => {
  return Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join("&");
};

export const hmacSHA512 = (secret, data) => {
  return crypto.createHmac("sha512", secret).update(Buffer.from(data, "utf-8")).digest("hex");
};

export const verifyVnpaySignature = ({ vnpParams, hashSecret }) => {
  const params = { ...vnpParams };
  const secureHash = params.vnp_SecureHash;
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sorted = sortObject(params);
  const signData = buildQueryString(sorted);
  const expected = hmacSHA512(hashSecret, signData);
  return { ok: expected === secureHash, expected, secureHash };
};

