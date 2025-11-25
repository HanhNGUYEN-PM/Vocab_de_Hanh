export type ActorType = 'actor' | 'participant';

export interface Actor {
  name: string;
  type: ActorType;
}

export interface Message {
  from: string;
  to: string;
  label: string;
  note?: string;
}

export interface ProcessModel {
  actors: Actor[];
  messages: Message[];
  title?: string;
}

export interface RenderedDiagram {
  plantuml: string;
  diagramUrl: string;
  encodingStrategy: 'compressed' | 'plaintext';
}

interface ActorCandidate {
  regex: RegExp;
  name: string;
  type: ActorType;
}

const ACTOR_CANDIDATES: ActorCandidate[] = [
  { regex: /\bclient(e)?\b/i, name: 'Client', type: 'actor' },
  { regex: /\bsyst[eè]me\b/i, name: 'Systeme', type: 'participant' },
  { regex: /\bbackend\b/i, name: 'Backend', type: 'participant' },
  { regex: /\bbase de donn[eé]es|bdd\b/i, name: 'BaseDeDonnees', type: 'participant' },
  { regex: /\bstock\b/i, name: 'Stock', type: 'participant' },
  { regex: /\bservice mail|email|e-mail\b/i, name: 'ServiceMail', type: 'participant' },
];

const trimLabel = (label: string): string => label.trim().replace(/^[-–]\s*/, '');

const sentenceToTitleCase = (text: string): string => {
  const cleaned = trimLabel(text);
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const buildDefaultActors = (text: string): Actor[] => {
  const detected: Actor[] = [];

  for (const candidate of ACTOR_CANDIDATES) {
    if (candidate.regex.test(text)) {
      detected.push({ name: candidate.name, type: candidate.type });
    }
  }

  if (detected.length === 0) {
    return [
      { name: 'Utilisateur', type: 'actor' },
      { name: 'Systeme', type: 'participant' },
    ];
  }

  if (!detected.some(actor => actor.name === 'Systeme')) {
    detected.push({ name: 'Systeme', type: 'participant' });
  }

  return detected;
};

const chooseActor = (actors: Actor[], preferredName: string): Actor => {
  const found = actors.find(actor => actor.name.toLowerCase() === preferredName.toLowerCase());
  return found ?? actors[0];
};

const guessMessages = (text: string, actors: Actor[]): Message[] => {
  const steps = text
    .split(/(?:\.\s+|;|,|\bpuis\b|\bensuite\b|\bthen\b)/i)
    .map(sentenceToTitleCase)
    .filter(Boolean);

  const messages: Message[] = [];
  const client = actors.find(actor => /client/i.test(actor.name)) ?? actors[0];
  const system = chooseActor(actors, 'Systeme');
  const stock = actors.find(actor => /stock/i.test(actor.name));
  const emailService = actors.find(actor => /mail/i.test(actor.name));

  for (const step of steps) {
    const lower = step.toLowerCase();

    if (/commande/.test(lower)) {
      messages.push({ from: client.name, to: system.name, label: step });
      continue;
    }

    if (/v[eé]rif/.test(lower) && stock) {
      messages.push({ from: system.name, to: stock.name, label: step });
      continue;
    }

    if (/confirm|mail|courriel|email/.test(lower)) {
      const destination = emailService ?? client;
      messages.push({ from: system.name, to: destination.name, label: step });
      continue;
    }

    const previousTarget = messages.length === 0 ? client.name : messages[messages.length - 1].to;
    const to = previousTarget === system.name ? client.name : system.name;
    messages.push({ from: previousTarget, to, label: step });
  }

  if (messages.length === 0) {
    messages.push({ from: client.name, to: system.name, label: 'Interaction' });
  }

  return messages;
};

export const parse_natural_language_to_model = (text: string): ProcessModel => {
  const normalizedText = text.trim();
  const actors = buildDefaultActors(normalizedText);
  const messages = guessMessages(normalizedText, actors);

  return {
    actors,
    messages,
    title: sentenceToTitleCase(normalizedText.split('.')[0] ?? 'Processus'),
  };
};

export const model_to_plantuml = (model: ProcessModel): string => {
  const lines: string[] = [];
  lines.push('@startuml');
  lines.push('!theme plain');
  lines.push('skinparam handwritten false');
  lines.push('skinparam sequenceMessageAlign center');
  lines.push('skinparam sequenceArrowThickness 2');
  lines.push('skinparam ParticipantPadding 20');
  lines.push('skinparam BoxPadding 10');
  lines.push('skinparam defaultFontName "Inter, Arial, sans-serif"');
  lines.push('');

  if (model.title) {
    lines.push(`title ${model.title}`);
  }

  lines.push("' Acteurs détectés automatiquement");
  for (const actor of model.actors) {
    lines.push(`${actor.type} ${actor.name}`);
  }

  lines.push('');
  lines.push("' Séquence générée depuis la description en langage naturel");
  for (const message of model.messages) {
    const arrow = message.note ? '->' : '-->';
    const label = trimLabel(message.label) || 'Interaction';
    lines.push(`${message.from} ${arrow} ${message.to}: ${label}`);
    if (message.note) {
      lines.push(`note right of ${message.to}: ${message.note}`);
    }
  }

  lines.push('@enduml');
  return lines.join('\n');
};

const encode6bit = (b: number): string => {
  if (b < 10) return String.fromCharCode(48 + b);
  b -= 10;
  if (b < 26) return String.fromCharCode(65 + b);
  b -= 26;
  if (b < 26) return String.fromCharCode(97 + b);
  b -= 26;
  if (b === 0) return '-';
  if (b === 1) return '_';
  return '?';
};

const append3bytes = (b1 = 0, b2 = 0, b3 = 0): string => {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3F;
  return encode6bit(c1 & 0x3F) + encode6bit(c2 & 0x3F) + encode6bit(c3 & 0x3F) + encode6bit(c4 & 0x3F);
};

const encodePlantUMLText = (data: Uint8Array): string => {
  let result = '';
  for (let i = 0; i < data.length; i += 3) {
    result += append3bytes(data[i], data[i + 1], data[i + 2]);
  }
  return result;
};

const compressionStreamSupported = (): boolean => typeof CompressionStream !== 'undefined';

const compressText = async (text: string): Promise<Uint8Array> => {
  if (!compressionStreamSupported()) {
    throw new Error('CompressionStream API is unavailable in this environment');
  }

  const encoder = new TextEncoder();
  const stream = new CompressionStream('deflate');
  const writer = stream.writable.getWriter();
  await writer.write(encoder.encode(text));
  await writer.close();

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
    }
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
};

export const render_plantuml_to_diagram = async (plantumlCode: string): Promise<RenderedDiagram> => {
  try {
    const compressed = await compressText(plantumlCode);
    const encoded = encodePlantUMLText(compressed);
    const diagramUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`;
    return { plantuml: plantumlCode, diagramUrl, encodingStrategy: 'compressed' };
  } catch (error) {
    const diagramUrl = `https://www.plantuml.com/plantuml/svg/~t${encodeURIComponent(plantumlCode)}`;
    return { plantuml: plantumlCode, diagramUrl, encodingStrategy: 'plaintext' };
  }
};

export const update_diagram_on_plantuml_change = async (plantuml_code_updated: string): Promise<RenderedDiagram> => {
  return render_plantuml_to_diagram(plantuml_code_updated);
};

