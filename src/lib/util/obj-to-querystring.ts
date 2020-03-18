import { removeUndefinedFromObject } from './remove-undefined-from-object';
import { URLSearchParams } from 'url';

function objectToQueryString(obj: Record<string, string | string[]>): string {
  return new URLSearchParams(removeUndefinedFromObject(obj)).toString();
}

export function constructURL(baseUrl: string, queryObj: Record<string, string | string[]>): string {
  const queryString = objectToQueryString(queryObj);
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
