declare module 'segmentit' {
  export interface SegmentOptions {
    simple?: boolean;
  }

  export interface Segment {
    doSegment(text: string, options?: SegmentOptions): string[];
    loadDict(name: string): void;
    use(name: string): void;
  }

  export interface SegmentConstructor {
    new (): Segment;
    (): Segment;
  }

  export const Segment: SegmentConstructor;
  export function useDefault(segment: Segment): void;
}
