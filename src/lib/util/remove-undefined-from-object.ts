export function removeUndefinedFromObject<T>(obj: T): T {
  const newObj = { ...obj };
  Object.entries(newObj).forEach(([key, val])=> {
    if (val === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
}
