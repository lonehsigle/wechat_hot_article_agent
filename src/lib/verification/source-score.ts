export type VerificationStatus = 'verified' | 'needs_review' | 'blocked';

export interface SourceScoreInput {
  urls?: string[];
  sourceType?: string;
  aiGenerated?: boolean;
  manuallyVerified?: boolean;
}

export interface SourceScoreResult {
  sourceScore: number;
  sourceType: string;
  verificationStatus: VerificationStatus;
  sourceSummary: string;
}

function uniqueHttpUrls(urls: string[] = []) {
  return Array.from(new Set(urls.filter(url => /^https?:\/\//.test(url))));
}

export function scoreMaterialSources(input: SourceScoreInput): SourceScoreResult {
  const urls = uniqueHttpUrls(input.urls);
  const sourceType = input.sourceType || (input.aiGenerated ? 'llm' : 'manual');
  const urlScore = Math.min(urls.length * 30, 70);
  const manualScore = input.manuallyVerified ? 30 : 0;
  const sourceScore = Math.min(urlScore + manualScore, 100);

  let verificationStatus: VerificationStatus = 'needs_review';
  if (input.manuallyVerified && sourceScore >= 70) {
    verificationStatus = 'verified';
  } else if (sourceScore === 0 && input.aiGenerated) {
    verificationStatus = 'needs_review';
  }

  return {
    sourceScore,
    sourceType,
    verificationStatus,
    sourceSummary: `urls=${urls.length}; sourceType=${sourceType}; manuallyVerified=${input.manuallyVerified ? 'yes' : 'no'}`,
  };
}

export function findUnverifiedGeneratedMarkers(content: string): string[] {
  const markers = ['AI生成', '待核验', '无外部文章'];
  return markers.filter(marker => content.includes(marker));
}
