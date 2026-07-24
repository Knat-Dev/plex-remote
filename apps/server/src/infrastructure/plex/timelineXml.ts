import { XMLParser } from 'fast-xml-parser';

/**
 * The /player/timeline/poll endpoint always replies in XML, ignoring the JSON
 * Accept header. Parsed with fast-xml-parser; we only care about the flat
 * <Timeline .../> elements' attributes.
 */
export interface TimelineAttributes {
  state: string | undefined;
  type: string | undefined;
  time: number | undefined;
  duration: number | undefined;
  ratingKey: string | undefined;
  /** Machine id of the server the playing content belongs to. */
  machineIdentifier: string | undefined;
  volume: number | undefined;
  muted: string | undefined;
  repeat: string | undefined;
  shuffle: string | undefined;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false,
  isArray: (name) => name === 'Timeline',
});

interface ParsedDocument {
  MediaContainer?: { Timeline?: Array<Record<string, string>> };
}

export function parseTimelines(xml: string): TimelineAttributes[] {
  let doc: ParsedDocument;
  try {
    doc = parser.parse(xml) as ParsedDocument;
  } catch {
    return [];
  }
  return (doc.MediaContainer?.Timeline ?? []).map((el) => ({
    state: el.state,
    type: el.type,
    time: num(el.time),
    duration: num(el.duration),
    ratingKey: el.ratingKey,
    machineIdentifier: el.machineIdentifier,
    volume: num(el.volume),
    muted: el.muted,
    repeat: el.repeat,
    shuffle: el.shuffle,
  }));
}

function num(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}
