import type { VocabularyItem } from '../types';

declare global {
  interface Window {
    __VOCAB_CLOUD_THING__?: string;
  }
}

const DEFAULT_CLOUD_STORAGE_THING = 'vocab-de-hanh-database';

const resolveCloudStorageThing = (): string => {
  if (typeof window !== 'undefined' && typeof window.__VOCAB_CLOUD_THING__ === 'string') {
    const fromWindow = window.__VOCAB_CLOUD_THING__.trim();
    if (fromWindow) {
      return fromWindow;
    }
  }

  const envThing =
    typeof import.meta !== 'undefined'
      ? ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_CLOUD_STORAGE_THING ?? '').trim()
      : '';

  return envThing || DEFAULT_CLOUD_STORAGE_THING;
};

type PersistedPayload = {
  vocabulary: VocabularyItem[];
  updatedAt: number;
};

const CLOUD_STORAGE_THING = resolveCloudStorageThing();
const CLOUD_QUERY_KEY = 'payload';
const CLOUD_READ_ENDPOINT = `https://dweet.io/get/latest/dweet/for/${CLOUD_STORAGE_THING}`;
const CLOUD_WRITE_ENDPOINT = `https://dweet.io/dweet/for/${CLOUD_STORAGE_THING}`;

const base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const baseReverseDictionary: Record<string, Record<string, number>> = {};

const getBaseValue = (alphabet: string, character: string): number => {
  if (!baseReverseDictionary[alphabet]) {
    baseReverseDictionary[alphabet] = {};
    for (let index = 0; index < alphabet.length; index += 1) {
      baseReverseDictionary[alphabet][alphabet.charAt(index)] = index;
    }
  }
  return baseReverseDictionary[alphabet][character] ?? 0;
};

const compress = (
  uncompressed: string,
  bitsPerChar: number,
  getCharFromInt: (value: number) => string,
): string => {
  if (uncompressed == null) {
    return '';
  }

  let value: number;
  const contextDictionary: Record<string, number> = {};
  const contextDictionaryToCreate: Record<string, boolean> = {};
  let contextC = '';
  let contextWC = '';
  let contextW = '';
  let contextEnlargeIn = 2;
  let contextDictSize = 3;
  let contextNumBits = 2;
  const contextData: string[] = [];
  let contextDataVal = 0;
  let contextDataPosition = 0;

  for (let ii = 0; ii < uncompressed.length; ii += 1) {
    contextC = uncompressed.charAt(ii);
    if (!Object.prototype.hasOwnProperty.call(contextDictionary, contextC)) {
      contextDictionary[contextC] = contextDictSize;
      contextDictSize += 1;
      contextDictionaryToCreate[contextC] = true;
    }

    contextWC = contextW + contextC;

    if (Object.prototype.hasOwnProperty.call(contextDictionary, contextWC)) {
      contextW = contextWC;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(contextDictionaryToCreate, contextW)) {
      const charCode = contextW.charCodeAt(0);
      if (charCode < 256) {
        for (let i = 0; i < contextNumBits; i += 1) {
          contextDataVal <<= 1;
          if (contextDataPosition === bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition += 1;
          }
        }
        let valueToStore = charCode;
        for (let i = 0; i < 8; i += 1) {
          contextDataVal = (contextDataVal << 1) | (valueToStore & 1);
          if (contextDataPosition === bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition += 1;
          }
          valueToStore >>= 1;
        }
      } else {
        value = 1;
        for (let i = 0; i < contextNumBits; i += 1) {
          contextDataVal = (contextDataVal << 1) | value;
          if (contextDataPosition === bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition += 1;
          }
          value = 0;
        }
        let valueToStore = contextW.charCodeAt(0);
        for (let i = 0; i < 16; i += 1) {
          contextDataVal = (contextDataVal << 1) | (valueToStore & 1);
          if (contextDataPosition === bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition += 1;
          }
          valueToStore >>= 1;
        }
      }
      contextEnlargeIn -= 1;
      if (contextEnlargeIn === 0) {
        contextEnlargeIn = 2 ** contextNumBits;
        contextNumBits += 1;
      }
      delete contextDictionaryToCreate[contextW];
    } else {
      value = contextDictionary[contextW];
      for (let i = 0; i < contextNumBits; i += 1) {
        contextDataVal = (contextDataVal << 1) | (value & 1);
        if (contextDataPosition === bitsPerChar - 1) {
          contextDataPosition = 0;
          contextData.push(getCharFromInt(contextDataVal));
          contextDataVal = 0;
        } else {
          contextDataPosition += 1;
        }
        value >>= 1;
      }
    }

    contextEnlargeIn -= 1;
    if (contextEnlargeIn === 0) {
      contextEnlargeIn = 2 ** contextNumBits;
      contextNumBits += 1;
    }

    contextDictionary[contextWC] = contextDictSize;
    contextDictSize += 1;
    contextW = String(contextC);
  }

  if (contextW !== '') {
    if (Object.prototype.hasOwnProperty.call(contextDictionaryToCreate, contextW)) {
      const charCode = contextW.charCodeAt(0);
      if (charCode < 256) {
        for (let i = 0; i < contextNumBits; i += 1) {
          contextDataVal <<= 1;
          if (contextDataPosition === bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition += 1;
          }
        }
        let valueToStore = charCode;
        for (let i = 0; i < 8; i += 1) {
          contextDataVal = (contextDataVal << 1) | (valueToStore & 1);
          if (contextDataPosition === bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition += 1;
          }
          valueToStore >>= 1;
        }
      } else {
        value = 1;
        for (let i = 0; i < contextNumBits; i += 1) {
          contextDataVal = (contextDataVal << 1) | value;
          if (contextDataPosition === bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition += 1;
          }
          value = 0;
        }
        let valueToStore = contextW.charCodeAt(0);
        for (let i = 0; i < 16; i += 1) {
          contextDataVal = (contextDataVal << 1) | (valueToStore & 1);
          if (contextDataPosition === bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition += 1;
          }
          valueToStore >>= 1;
        }
      }
      contextEnlargeIn -= 1;
      if (contextEnlargeIn === 0) {
        contextEnlargeIn = 2 ** contextNumBits;
        contextNumBits += 1;
      }
      delete contextDictionaryToCreate[contextW];
    } else {
      value = contextDictionary[contextW];
      for (let i = 0; i < contextNumBits; i += 1) {
        contextDataVal = (contextDataVal << 1) | (value & 1);
        if (contextDataPosition === bitsPerChar - 1) {
          contextDataPosition = 0;
          contextData.push(getCharFromInt(contextDataVal));
          contextDataVal = 0;
        } else {
          contextDataPosition += 1;
        }
        value >>= 1;
      }
    }

    contextEnlargeIn -= 1;
    if (contextEnlargeIn === 0) {
      contextEnlargeIn = 2 ** contextNumBits;
      contextNumBits += 1;
    }
  }

  value = 2;
  for (let i = 0; i < contextNumBits; i += 1) {
    contextDataVal = (contextDataVal << 1) | (value & 1);
    if (contextDataPosition === bitsPerChar - 1) {
      contextDataPosition = 0;
      contextData.push(getCharFromInt(contextDataVal));
      contextDataVal = 0;
    } else {
      contextDataPosition += 1;
    }
    value >>= 1;
  }

  while (true) {
    contextDataVal <<= 1;
    if (contextDataPosition === bitsPerChar - 1) {
      contextData.push(getCharFromInt(contextDataVal));
      break;
    }
    contextDataPosition += 1;
  }

  return contextData.join('');
};

const decompress = (
  length: number,
  resetValue: number,
  getNextValue: (index: number) => number,
): string | null => {
  const dictionary: Record<number, string> = {};
  let next;
  let enlargeIn = 4;
  let dictSize = 4;
  let numBits = 3;
  let entry = '';
  const result: string[] = [];
  let w;
  let bits;
  let resb;
  let maxpower;
  let power;
  let c;

  const data = {
    value: getNextValue(0),
    position: resetValue,
    index: 1,
  };

  for (next = 0; next < 3; next += 1) {
    dictionary[next] = String(next);
  }

  bits = 0;
  maxpower = 2 ** 2;
  power = 1;
  while (power !== maxpower) {
    resb = data.value & data.position;
    data.position >>= 1;
    if (data.position === 0) {
      data.position = resetValue;
      data.value = getNextValue(data.index);
      data.index += 1;
    }
    bits |= (resb > 0 ? 1 : 0) * power;
    power <<= 1;
  }

  switch (next = bits) {
    case 0:
      bits = 0;
      maxpower = 2 ** 8;
      power = 1;
      while (power !== maxpower) {
        resb = data.value & data.position;
        data.position >>= 1;
        if (data.position === 0) {
          data.position = resetValue;
          data.value = getNextValue(data.index);
          data.index += 1;
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }
      c = String.fromCharCode(bits);
      break;
    case 1:
      bits = 0;
      maxpower = 2 ** 16;
      power = 1;
      while (power !== maxpower) {
        resb = data.value & data.position;
        data.position >>= 1;
        if (data.position === 0) {
          data.position = resetValue;
          data.value = getNextValue(data.index);
          data.index += 1;
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }
      c = String.fromCharCode(bits);
      break;
    case 2:
      return '';
    default:
      return null;
  }

  dictionary[3] = c;
  w = c;
  result.push(c);

  while (true) {
    if (data.index > length) {
      return '';
    }

    bits = 0;
    maxpower = 2 ** numBits;
    power = 1;
    while (power !== maxpower) {
      resb = data.value & data.position;
      data.position >>= 1;
      if (data.position === 0) {
        data.position = resetValue;
        data.value = getNextValue(data.index);
        data.index += 1;
      }
      bits |= (resb > 0 ? 1 : 0) * power;
      power <<= 1;
    }

    switch ((c = bits)) {
      case 0:
        bits = 0;
        maxpower = 2 ** 8;
        power = 1;
        while (power !== maxpower) {
          resb = data.value & data.position;
          data.position >>= 1;
          if (data.position === 0) {
            data.position = resetValue;
            data.value = getNextValue(data.index);
            data.index += 1;
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }

        dictionary[dictSize] = String.fromCharCode(bits);
        dictSize += 1;
        c = dictSize - 1;
        enlargeIn -= 1;
        break;
      case 1:
        bits = 0;
        maxpower = 2 ** 16;
        power = 1;
        while (power !== maxpower) {
          resb = data.value & data.position;
          data.position >>= 1;
          if (data.position === 0) {
            data.position = resetValue;
            data.value = getNextValue(data.index);
            data.index += 1;
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        dictionary[dictSize] = String.fromCharCode(bits);
        dictSize += 1;
        c = dictSize - 1;
        enlargeIn -= 1;
        break;
      case 2:
        return result.join('');
      default:
        if (!dictionary[c]) {
          if (c === dictSize) {
            dictionary[c] = w + w.charAt(0);
          } else {
            return null;
          }
        }
        entry = dictionary[c];
    }

    result.push(entry ?? '');

    dictionary[dictSize] = (w ?? '') + (entry?.charAt(0) ?? '');
    dictSize += 1;
    enlargeIn -= 1;

    w = entry;

    if (enlargeIn === 0) {
      enlargeIn = 2 ** numBits;
      numBits += 1;
    }
  }
};

const compressToBase64 = (input: string): string | null => {
  if (!input) {
    return null;
  }

  const result = compress(input, 6, (value) => base64Characters.charAt(value));
  const padLength = (4 - (result.length % 4)) % 4;

  return `${result}${'='.repeat(padLength)}`;
};

const decompressFromBase64 = (input: string): string | null => {
  if (!input) {
    return null;
  }

  const sanitized = input.replace(/[^A-Za-z0-9+/=]/g, '');
  if (!sanitized) {
    return null;
  }

  return decompress(sanitized.length, 32, (index) => getBaseValue(base64Characters, sanitized.charAt(index)));
};

export const encodeCloudPayload = (items: VocabularyItem[], revision: number): string | null => {
  try {
    const payload: PersistedPayload = {
      vocabulary: items,
      updatedAt: revision,
    };

    return compressToBase64(JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to encode cloud payload:', error);
    return null;
  }
};

export const decodeCloudPayload = (payload: string): PersistedPayload | null => {
  try {
    const jsonText = decompressFromBase64(payload);
    if (!jsonText) {
      return null;
    }

    const parsed = JSON.parse(jsonText) as PersistedPayload;
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.vocabulary) &&
      typeof parsed.updatedAt === 'number'
    ) {
      return parsed;
    }
  } catch (error) {
    console.error('Failed to decode cloud payload:', error);
  }

  return null;
};

const extractPayloadFromDweet = (dweet: unknown): string | null => {
  if (!dweet || typeof dweet !== 'object') {
    return null;
  }

  const content = (dweet as { with?: Array<{ content?: Record<string, unknown> }> }).with;
  if (!Array.isArray(content) || content.length === 0) {
    return null;
  }

  const firstEntry = content[0];
  if (!firstEntry || typeof firstEntry !== 'object' || !firstEntry.content) {
    return null;
  }

  const stored = firstEntry.content as Record<string, unknown>;
  const encoded = stored[CLOUD_QUERY_KEY];
  return typeof encoded === 'string' ? encoded : null;
};

export type CloudSnapshot = PersistedPayload;

export const fetchCloudSnapshot = async (): Promise<CloudSnapshot | null> => {
  try {
    const response = await fetch(CLOUD_READ_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json().catch(() => null);
    if (!payload) {
      return null;
    }

    const encoded = extractPayloadFromDweet(payload);
    if (!encoded) {
      return null;
    }

    return decodeCloudPayload(encoded);
  } catch (error) {
    console.error('Failed to fetch cloud snapshot:', error);
    return null;
  }
};

export const saveCloudSnapshot = async (
  items: VocabularyItem[],
  revision: number,
): Promise<boolean> => {
  try {
    const encoded = encodeCloudPayload(items, revision);
    if (!encoded) {
      throw new Error('Encoded payload is empty');
    }

    const response = await fetch(CLOUD_WRITE_ENDPOINT, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: `${CLOUD_QUERY_KEY}=${encodeURIComponent(encoded)}&stamp=${revision}`,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    await response.json().catch(() => null);
    return true;
  } catch (error) {
    console.error('Failed to save cloud snapshot:', error);
    return false;
  }
};

export const cloudConfig = {
  queryKey: CLOUD_QUERY_KEY,
  readEndpoint: CLOUD_READ_ENDPOINT,
  writeEndpoint: CLOUD_WRITE_ENDPOINT,
};

