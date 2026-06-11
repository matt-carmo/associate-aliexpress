import crypto from 'crypto';

export const signRequest = (parameters: Record<string, string>, appSecret: string) => {
    const sortObject = (obj: Record<string, string>): Record<string, string> => {
      return Object.keys(obj)
        .sort()
        .reduce((result: Record<string, string>, key: string) => {
          result[key] = obj[key];
          return result;
        }, {} as Record<string, string>);
    };
    const sortedParams = sortObject(parameters);
    const sortedString = Object.keys(sortedParams).reduce((acc, key) => {
        return `${acc}${key}${sortedParams[key]}`;
    }, "");
    const signBaseString = `${appSecret}${sortedString}${appSecret}`;
    const signedString = crypto.createHash("md5").update(signBaseString, "utf8").digest("hex");
    return signedString.toUpperCase();
  };
