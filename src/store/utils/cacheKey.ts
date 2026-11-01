export type KeyFn = (params: Record<string, any>) => string;

// Generic key creation function: drops undefined values (null is kept as 'k=null'),
// sorts by key and joins 'k=v' pairs with '&'. Used by safety, outcome, assessment, staff and classSize.
export const createOptionsKey: KeyFn = (params) => {
    const sortedParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    const keyString = sortedParams.map(([key, value]) => `${key}=${value}`).join('&');
    // Ensure we never return an empty string as a key
    return keyString || '_default';
};

// Same as createOptionsKey, but also drops null values (efa and enrollment).
export const createOptionsKeyDropNull: KeyFn = (params) => {
    const sortedParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    const keyString = sortedParams.map(([key, value]) => `${key}=${value}`).join('&');
    return keyString || '_default';
};
