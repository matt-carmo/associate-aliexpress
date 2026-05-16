import crypto from 'crypto';

export const signRequest = (parameters: {[key: string]: any}, appSecret: string) => {
    const sortObject = (obj:{[key: string]: any}) => {
      return Object.keys(obj)
        .sort()
        .reduce((result:{[key: string]: any}, key:string) => {
          result[key] = obj[key];
          return result;
        }, {});
    };
    const sortedParams = sortObject(parameters);
    const sortedString = Object.keys(sortedParams).reduce((acc, key) => {
        return `${acc}${key}${sortedParams[key]}`;
    }, "");
    const signBaseString = `${appSecret}${sortedString}${appSecret}`;
    const signedString = crypto.createHash("md5").update(signBaseString, "utf8").digest("hex");
    return signedString.toUpperCase();
  };