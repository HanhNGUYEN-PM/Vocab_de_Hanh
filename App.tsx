import React, { useState, useCallback, useEffect, useRef } from 'react';
import { VocabularyItem } from './types';
import VocabularyInput from './components/VocabularyInput';
import Quiz from './components/Quiz';
import VocabularyManager from './components/VocabularyManager';
import PlusIcon from './components/icons/PlusIcon';
import LearnIcon from './components/icons/LearnIcon';
import ManageIcon from './components/icons/ManageIcon';
import ChevronDownIcon from './components/icons/ChevronDownIcon';

type View = 'add' | 'learn' | 'manage';
type QuizScope = 'recent' | 'all';

type PersistedPayload = {
  vocabulary: VocabularyItem[];
  updatedAt: number;
};

const VOCAB_STORAGE_KEY = 'vocabulary-builder-data';
const REMOTE_SYNC_ENDPOINT = 'https://dweet.io/get/latest/dweet/for/vocab-de-hanh-sync';
const REMOTE_SYNC_PUBLISH_ENDPOINT = 'https://dweet.io/dweet/for/vocab-de-hanh-sync';
const REMOTE_SYNC_QUERY_KEY = 'payload';
const SYNC_POLL_INTERVAL = 15000;

type SyncStatus = 'idle' | 'syncing' | 'error';

const generateId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatRelativeTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  if (diff < 10000) {
    return 'il y a quelques secondes';
  }
  if (diff < 60000) {
    const seconds = Math.floor(diff / 1000);
    return `il y a ${seconds} seconde${seconds > 1 ? 's' : ''}`;
  }
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  }
  const days = Math.floor(diff / 86400000);
  return `il y a ${days} jour${days > 1 ? 's' : ''}`;
};

const sanitizeVocabulary = (items: VocabularyItem[]): VocabularyItem[] =>
  items
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const safeItem: VocabularyItem = {
        id: typeof item.id === 'string' && item.id.trim() ? item.id : generateId(`remote-${index}`),
        vietnamese: typeof item.vietnamese === 'string' ? item.vietnamese.trim() : '',
        chinese: typeof item.chinese === 'string' ? item.chinese.trim() : '',
        pinyin: typeof item.pinyin === 'string' ? item.pinyin.trim() : '',
        phonetic: typeof item.phonetic === 'string' ? item.phonetic.trim() : '',
        hanViet: typeof item.hanViet === 'string' ? item.hanViet.trim() : '',
        isFavorite: Boolean(item.isFavorite),
      };

      return safeItem;
    })
    .filter((item) => item.vietnamese && item.chinese && item.pinyin && item.phonetic && item.hanViet);

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
    } else {
      contextDataPosition += 1;
    }
  }

  return contextData.join('');
};

const decompress = (
  length: number,
  resetValue: number,
  getNextValue: (index: number) => number,
): string | null => {
  const dictionary: string[] = [];
  let next: number;
  let enlargeIn = 4;
  let dictSize = 4;
  let numBits = 3;
  let entry = '';
  const result: string[] = [];
  let w = '';
  let bits: number;
  let resb: number;
  let maxPower: number;
  let power: number;

  const data = {
    value: getNextValue(0),
    position: resetValue,
    index: 1,
  };

  for (let i = 0; i < 3; i += 1) {
    dictionary[i] = String.fromCharCode(i);
  }

  bits = 0;
  maxPower = 2;
  power = 1;
  while (power !== maxPower) {
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

  switch (bits) {
    case 0: {
      bits = 0;
      maxPower = 256;
      power = 1;
      while (power !== maxPower) {
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
      dictionary[3] = String.fromCharCode(bits);
      w = dictionary[3];
      break;
    }
    case 1: {
      bits = 0;
      maxPower = 65536;
      power = 1;
      while (power !== maxPower) {
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
      dictionary[3] = String.fromCharCode(bits);
      w = dictionary[3];
      break;
    }
    case 2:
      return '';
    default:
      return null;
  }

  result.push(w);

  while (true) {
    if (data.index > length) {
      return result.join('');
    }

    bits = 0;
    maxPower = 2 ** numBits;
    power = 1;
    while (power !== maxPower) {
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

    next = bits;

    if (next === 0) {
      bits = 0;
      maxPower = 256;
      power = 1;
      while (power !== maxPower) {
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
      next = dictSize - 1;
      enlargeIn -= 1;
    } else if (next === 1) {
      bits = 0;
      maxPower = 65536;
      power = 1;
      while (power !== maxPower) {
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
      next = dictSize - 1;
      enlargeIn -= 1;
    } else if (next === 2) {
      return result.join('');
    }

    if (enlargeIn === 0) {
      enlargeIn = 2 ** numBits;
      numBits += 1;
    }

    if (dictionary[next]) {
      entry = dictionary[next];
    } else if (next === dictSize) {
      entry = w + w.charAt(0);
    } else {
      return null;
    }

    result.push(entry);

    dictionary[dictSize] = w + entry.charAt(0);
    dictSize += 1;
    enlargeIn -= 1;

    w = entry;

    if (enlargeIn === 0) {
      enlargeIn = 2 ** numBits;
      numBits += 1;
    }
  }
};

const compressToBase64 = (input: string): string => {
  if (input == null) {
    return '';
  }
  const compressed = compress(input, 6, (value) => base64Characters.charAt(value));
  switch (compressed.length % 4) {
    case 0:
      return compressed;
    case 1:
      return `${compressed}===`;
    case 2:
      return `${compressed}==`;
    case 3:
      return `${compressed}=`;
    default:
      return compressed;
  }
};

const decompressFromBase64 = (input: string): string | null => {
  if (input == null || input === '') {
    return null;
  }
  const sanitized = input.replace(/[^A-Za-z0-9+/=]/g, '');
  return decompress(sanitized.length, 32, (index) => getBaseValue(base64Characters, sanitized.charAt(index)));
};

const encodeRemotePayload = (items: VocabularyItem[], revision: number): string | null => {
  try {
    const payload = JSON.stringify({ vocabulary: items, updatedAt: revision });
    return compressToBase64(payload);
  } catch (error) {
    console.error('Failed to encode remote payload:', error);
  }

  return null;
};

const decodeRemotePayload = (payload: string): PersistedPayload | null => {
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
    console.error('Failed to decode remote payload:', error);
  }

  return null;
};

const App: React.FC = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [view, setView] = useState<View>('add');
  const [isLearnDropdownOpen, setIsLearnDropdownOpen] = useState(false);
  const [quizScope, setQuizScope] = useState<QuizScope | null>(null);
  const [isSyncReady, setIsSyncReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const learnButtonRef = useRef<HTMLDivElement>(null);
  const skipNextPushRef = useRef(false);
  const localRevisionRef = useRef(0);

  const persistVocabularyLocally = useCallback((items: VocabularyItem[], revision: number) => {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const payload: PersistedPayload = {
        vocabulary: items,
        updatedAt: revision,
      };
      localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to save vocabulary to local storage:', error);
    }
  }, []);

  const pushRemoteVocabulary = useCallback(
    async (items: VocabularyItem[], revision: number) => {
      if (!isSyncReady) {
        return;
      }

      try {
        const encoded = encodeRemotePayload(items, revision);
        if (!encoded) {
          throw new Error('Encoded payload is empty');
        }

        setSyncStatus('syncing');
        setSyncError(null);
        const url = `${REMOTE_SYNC_PUBLISH_ENDPOINT}?${REMOTE_SYNC_QUERY_KEY}=${encodeURIComponent(encoded)}&stamp=${revision}`;
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        await response.json().catch(() => null);
        setSyncStatus('idle');
        setLastSyncedAt(Date.now());
      } catch (error) {
        console.error('Failed to sync vocabulary to remote storage:', error);
        setSyncStatus('error');
        setSyncError('La synchronisation automatique a échoué. Vos données sont enregistrées localement.');
      }
    },
    [isSyncReady],
  );

  const applyRemoteVocabulary = useCallback(
    (items: VocabularyItem[], revision: number) => {
      const sanitized = sanitizeVocabulary(items);
      skipNextPushRef.current = true;
      localRevisionRef.current = revision;
      persistVocabularyLocally(sanitized, revision);
      setVocabulary(sanitized);
      setLastSyncedAt(Date.now());
      setSyncStatus('idle');
      setSyncError(null);

      setView((previousView) => {
        if (sanitized.length === 0) {
          return 'add';
        }
        if (sanitized.length < 3 && previousView === 'learn') {
          return 'add';
        }
        if (sanitized.length >= 3 && previousView === 'add') {
          return 'learn';
        }
        return previousView;
      });

      setQuizScope((previousScope) => {
        if (sanitized.length < 3) {
          return null;
        }
        return previousScope ?? 'all';
      });
    },
    [persistVocabularyLocally],
  );

  const fetchRemoteVocabulary = useCallback(async () => {
    if (!isSyncReady) {
      return;
    }

    try {
      const response = await fetch(REMOTE_SYNC_ENDPOINT, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json().catch(() => null);
      if (!payload) {
        return;
      }

      const remotePayload =
        payload && typeof payload === 'object' && Array.isArray((payload as { with?: unknown[] }).with)
          ? (payload as { with: Array<{ content?: Record<string, unknown> }> }).with[0]?.content ?? null
          : null;

      if (!remotePayload || typeof remotePayload !== 'object') {
        return;
      }

      const encodedContent = (remotePayload as Record<string, unknown>)[REMOTE_SYNC_QUERY_KEY];
      if (typeof encodedContent !== 'string' || !encodedContent.trim()) {
        return;
      }

      const decoded = decodeRemotePayload(encodedContent.trim());
      if (!decoded) {
        return;
      }

      const remoteItems = Array.isArray(decoded.vocabulary) ? decoded.vocabulary : [];
      const sanitized = sanitizeVocabulary(remoteItems);
      if (sanitized.length === 0) {
        return;
      }

      const effectiveRevision =
        typeof decoded.updatedAt === 'number' && decoded.updatedAt > 0 ? decoded.updatedAt : Date.now();

      if (
        effectiveRevision > localRevisionRef.current ||
        (localRevisionRef.current === 0 && vocabulary.length === 0)
      ) {
        applyRemoteVocabulary(sanitized, effectiveRevision);
      }
    } catch (error) {
      console.error('Failed to pull vocabulary from remote storage:', error);
      setSyncError((previous) => previous ?? "Impossible de contacter le service de synchronisation automatique pour l'instant.");
    }
  }, [applyRemoteVocabulary, isSyncReady, vocabulary]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let initialVocabulary: VocabularyItem[] = [];
    let initialRevision = 0;

    try {
      const storedData = localStorage.getItem(VOCAB_STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData) as unknown;
        if (Array.isArray(parsed)) {
          initialVocabulary = sanitizeVocabulary(parsed as VocabularyItem[]);
          initialRevision = Date.now();
          persistVocabularyLocally(initialVocabulary, initialRevision);
        } else if (
          parsed &&
          typeof parsed === 'object' &&
          Array.isArray((parsed as PersistedPayload).vocabulary)
        ) {
          initialVocabulary = sanitizeVocabulary((parsed as PersistedPayload).vocabulary);
          initialRevision =
            typeof (parsed as PersistedPayload).updatedAt === 'number'
              ? (parsed as PersistedPayload).updatedAt
              : Date.now();
        }
      }
    } catch (error) {
      console.error('Failed to load vocabulary from local storage:', error);
    }

    if (initialVocabulary.length > 0) {
      setVocabulary(initialVocabulary);
      if (initialVocabulary.length >= 3) {
        setView('learn');
        setQuizScope('all');
      }
    }

    skipNextPushRef.current = true;
    localRevisionRef.current = initialRevision;
    setIsSyncReady(true);
  }, [persistVocabularyLocally]);

  useEffect(() => {
    if (!isSyncReady) {
      return;
    }

    void fetchRemoteVocabulary();
    const interval = window.setInterval(() => {
      void fetchRemoteVocabulary();
    }, SYNC_POLL_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchRemoteVocabulary, isSyncReady]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (learnButtonRef.current && !learnButtonRef.current.contains(event.target as Node)) {
        setIsLearnDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSaveVocabulary = useCallback(
    (newItems: VocabularyItem[]) => {
      if (newItems.length === 0) {
        return;
      }

      let shouldSwitchToLearn = false;

      setVocabulary((previousVocabulary) => {
        const updatedVocabulary = [...previousVocabulary, ...newItems];
        shouldSwitchToLearn = updatedVocabulary.length >= 3;
        const revision = Date.now();
        persistVocabularyLocally(updatedVocabulary, revision);
        localRevisionRef.current = revision;

        if (skipNextPushRef.current) {
          skipNextPushRef.current = false;
        } else {
          void pushRemoteVocabulary(updatedVocabulary, revision);
        }

        return updatedVocabulary;
      });

      if (shouldSwitchToLearn) {
        setView('learn');
        setQuizScope('recent');
      }
    },
    [persistVocabularyLocally, pushRemoteVocabulary],
  );

  const handleDeleteVocabularyItem = useCallback(
    (idToDelete: string) => {
      let updatedLength = 0;
      let changed = false;

      setVocabulary((previousVocabulary) => {
        const updatedVocabulary = previousVocabulary.filter((item) => item.id !== idToDelete);
        if (updatedVocabulary.length === previousVocabulary.length) {
          updatedLength = previousVocabulary.length;
          return previousVocabulary;
        }

        changed = true;
        updatedLength = updatedVocabulary.length;
        const revision = Date.now();
        persistVocabularyLocally(updatedVocabulary, revision);
        localRevisionRef.current = revision;

        if (skipNextPushRef.current) {
          skipNextPushRef.current = false;
        } else {
          void pushRemoteVocabulary(updatedVocabulary, revision);
        }

        return updatedVocabulary;
      });

      if (!changed) {
        return;
      }

      setView((previousView) => {
        if (updatedLength === 0) {
          return 'add';
        }
        if (updatedLength < 3 && previousView === 'learn') {
          return 'add';
        }
        return previousView;
      });

      setQuizScope((previousScope) => (updatedLength < 3 ? null : previousScope));
    },
    [persistVocabularyLocally, pushRemoteVocabulary],
  );

  const handleUpdateVocabularyItem = useCallback(
    (updatedItem: VocabularyItem) => {
      let changed = false;

      setVocabulary((previousVocabulary) => {
        const updatedVocabulary = previousVocabulary.map((item) => {
          if (item.id === updatedItem.id) {
            changed = true;
            return {
              ...item,
              ...updatedItem,
            };
          }
          return item;
        });

        if (!changed) {
          return previousVocabulary;
        }

        const revision = Date.now();
        persistVocabularyLocally(updatedVocabulary, revision);
        localRevisionRef.current = revision;

        if (skipNextPushRef.current) {
          skipNextPushRef.current = false;
        } else {
          void pushRemoteVocabulary(updatedVocabulary, revision);
        }

        return updatedVocabulary;
      });
    },
    [persistVocabularyLocally, pushRemoteVocabulary],
  );

  const handleStartQuiz = (scope: QuizScope) => {
    setQuizScope(scope);
    setView('learn');
    setIsLearnDropdownOpen(false);
  };

  const hasEnoughVocabularyForQuiz = vocabulary.length >= 3;
  const hasAnyVocabulary = vocabulary.length > 0;

  const renderContent = () => {
    switch (view) {
      case 'add':
        return <VocabularyInput onSave={handleSaveVocabulary} existingVocabulary={vocabulary} />;
      case 'learn':
        if (!quizScope || !hasEnoughVocabularyForQuiz) {
          return (
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-slate-700 mb-4">Bienvenue !</h2>
              <p className="text-slate-600">Ajoutez au moins 3 mots de vocabulaire pour démarrer un quiz.</p>
              <p className="text-slate-600">Rendez-vous dans l'onglet « Ajouter des mots » pour compléter votre liste.</p>
            </div>
          );
        }
        const quizTitle = quizScope === 'recent' ? 'Quiz : 30 derniers mots' : 'Quiz : Tous les mots';
        const quizVocabulary = quizScope === 'recent' ? vocabulary.slice(-30) : vocabulary;
        return <Quiz vocabulary={quizVocabulary} title={quizTitle} />;
      case 'manage':
        return hasAnyVocabulary ? (
          <VocabularyManager vocabulary={vocabulary} onUpdate={handleUpdateVocabularyItem} onDelete={handleDeleteVocabularyItem} />
        ) : (
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Aucun mot à gérer</h2>
            <p className="text-slate-600">Votre collection de vocabulaire est vide.</p>
            <p className="text-slate-600">Ajoutez quelques mots dans l'onglet « Ajouter des mots ».</p>
          </div>
        );
      default:
        return null;
    }
  };

  const syncStatusLabel = (() => {
    if (syncStatus === 'syncing') {
      return 'Synchronisation automatique en cours…';
    }
    if (syncError) {
      return syncError;
    }
    if (lastSyncedAt) {
      return `Synchronisé automatiquement ${formatRelativeTime(lastSyncedAt)}`;
    }
    return 'Synchronisation automatique activée';
  })();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-700 tracking-tight">Vocabulary Builder</h1>
            <p className={`text-xs mt-1 ${syncStatus === 'error' ? 'text-red-600' : 'text-slate-500'}`}>{syncStatusLabel}</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <button
              onClick={() => setView('add')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'add' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PlusIcon className="w-5 h-5" />
              <span>Ajouter des mots</span>
            </button>
            <div className="relative" ref={learnButtonRef}>
              <button
                onClick={() => hasEnoughVocabularyForQuiz && setIsLearnDropdownOpen((previous) => !previous)}
                disabled={!hasEnoughVocabularyForQuiz}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'learn' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={!hasEnoughVocabularyForQuiz ? 'Ajoutez au moins 3 mots pour démarrer un quiz' : 'Commencer un quiz'}
              >
                <LearnIcon className="w-5 h-5" />
                <span>Réviser</span>
                <ChevronDownIcon
                  className="w-4 h-4 ml-1 transition-transform"
                  style={{ transform: isLearnDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              {isLearnDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                  <button
                    onClick={() => handleStartQuiz('recent')}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    30 derniers mots
                  </button>
                  <button
                    onClick={() => handleStartQuiz('all')}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Tous les mots
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => hasAnyVocabulary && setView('manage')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'manage' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={!hasAnyVocabulary}
              title={!hasAnyVocabulary ? 'Ajoutez des mots avant de pouvoir les gérer' : 'Gérer votre collection'}
            >
              <ManageIcon className="w-5 h-5" />
              <span>Gérer</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {syncError && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
              {syncError}
            </div>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
