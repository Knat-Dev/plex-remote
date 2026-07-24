/**
 * The /player/timeline/poll endpoint always replies in XML, ignoring the JSON
 * Accept header. Rather than pull in a full XML parser for a flat, attribute-only
 * document, we extract each <Timeline .../> element's attributes directly.
 */
export interface TimelineAttributes {
  state: string | undefined;
  type: string | undefined;
  time: number | undefined;
  duration: number | undefined;
  ratingKey: string | undefined;
  volume: number | undefined;
  muted: string | undefined;
  repeat: string | undefined;
  shuffle: string | undefined;
}

export function parseTimelines(xml: string): TimelineAttributes[] {
  const elements = xml.match(/<Timeline\b[^>]*\/?>/g) ?? [];
  return elements.map((element) => ({
    state: attr(element, 'state'),
    type: attr(element, 'type'),
    time: num(element, 'time'),
    duration: num(element, 'duration'),
    ratingKey: attr(element, 'ratingKey'),
    volume: num(element, 'volume'),
    muted: attr(element, 'muted'),
    repeat: attr(element, 'repeat'),
    shuffle: attr(element, 'shuffle'),
  }));
}

function attr(element: string, name: string): string | undefined {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(element)?.[1];
}

function num(element: string, name: string): number | undefined {
  const raw = attr(element, name);
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}
