import { getDb } from '../config/db';
import { Person } from '../types';

export class IdentityService {

  // Normalize string for comparison (trim, lowercase, remove honorifics/punctuation)
  private static normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\b(shri|shree|smt|srimati|mr|mrs|ms|dr|late)\b/g, '')
      .replace(/[\.\,\-\_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Calculate Levenshtein distance between two strings
  private static levenshtein(s1: string, s2: string): number {
    const track = Array(s2.length + 1).fill(null).map(() =>
      Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    return track[s2.length][s1.length];
  }

  // Resolves a raw name against known database persons for a specific parcel
  // or generally, returning the best match and confidence.
  public static async resolveIdentity(
    rawName: string,
    parcelId?: string
  ): Promise<{
    matchedPersonId: string | null;
    confidence: number;
    explanation: string;
    normalizedInput: string;
  }> {
    const db = await getDb();
    const normalizedInput = this.normalizeName(rawName);

    if (!normalizedInput) {
      return {
        matchedPersonId: null,
        confidence: 0,
        explanation: "Input name is empty or invalid.",
        normalizedInput: ""
      };
    }

    // 1. Fetch persons to match against.
    // If a parcelId is provided, prioritize matching current owners of that parcel first
    let candidates: Person[] = [];
    if (parcelId) {
      candidates = await db.all(`
        SELECT p.* FROM persons p
        JOIN ownership_states os ON p.id = os.person_id
        WHERE os.parcel_id = ?
      `, parcelId);
    }

    // If no candidates found for the parcel, match against all persons
    if (candidates.length === 0) {
      candidates = await db.all('SELECT * FROM persons');
    }

    let bestMatch: Person | null = null;
    let maxConfidence = 0;
    let matchExplanation = "No matching profile found.";

    for (const candidate of candidates) {
      const normalizedCandidate = this.normalizeName(candidate.name);
      
      // Case A: Exact Match after normalization
      if (normalizedInput === normalizedCandidate) {
        bestMatch = candidate;
        maxConfidence = 100;
        matchExplanation = `Exact match found for normalized name '${candidate.name}'.`;
        break; // Can't get better than 100%
      }

      // Tokenize both names
      const inputTokens = normalizedInput.split(' ');
      const candTokens = normalizedCandidate.split(' ');

      // Case B: Initial matching (e.g., "Ramesh Kumar" vs "Ramesh K.")
      // Check if one name matches another with abbreviation/initial
      let initialMatch = false;
      let reason = "";

      if (inputTokens.length > 0 && candTokens.length > 0 && inputTokens[0] === candTokens[0]) {
        // First name matches. Check remaining tokens.
        if (inputTokens.length === 2 && candTokens.length === 2) {
          const t1 = inputTokens[1];
          const t2 = candTokens[1];
          // Check if one is an initial of another (length 1)
          if ((t1.length === 1 && t2.startsWith(t1)) || (t2.length === 1 && t1.startsWith(t2))) {
            initialMatch = true;
            reason = `Resolved via name initial matching: '${t1}' is consistent with '${t2}'.`;
          }
        } else if (inputTokens.length === 3 && candTokens.length === 3) {
          // Ramesh Kumar Singh vs Ramesh K. Singh
          const mid1 = inputTokens[1];
          const mid2 = candTokens[1];
          const last1 = inputTokens[2];
          const last2 = candTokens[2];
          if (last1 === last2 && ((mid1.length === 1 && mid2.startsWith(mid1)) || (mid2.length === 1 && mid1.startsWith(mid2)))) {
            initialMatch = true;
            reason = `Resolved middle initial match: '${mid1}' matches middle name '${mid2}' and last names match.`;
          }
        } else if (inputTokens.length === 2 && candTokens.length === 3) {
          // Ramesh Kumar vs Ramesh Kumar S.
          if (candTokens[1] === inputTokens[1]) {
            initialMatch = true;
            reason = `Resolved via suffix initial: input '${rawName}' matches candidate '${candidate.name}' minus initial.`;
          }
        }
      }

      if (initialMatch) {
        const confidence = 92;
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          bestMatch = candidate;
          matchExplanation = reason;
        }
        continue;
      }

      // Case C: Fuzzy Edit Distance similarity
      const maxLen = Math.max(normalizedInput.length, normalizedCandidate.length);
      const distance = this.levenshtein(normalizedInput, normalizedCandidate);
      const similarity = 1 - distance / maxLen;
      const fuzzyConfidence = Math.round(similarity * 100);

      // We only consider fuzzy matches with confidence > 70%
      if (fuzzyConfidence > 70 && fuzzyConfidence > maxConfidence) {
        maxConfidence = fuzzyConfidence;
        bestMatch = candidate;
        matchExplanation = `Fuzzy name matching similarity of ${fuzzyConfidence}% (edit distance ${distance}).`;
      }
    }

    if (maxConfidence >= 50 && bestMatch) {
      return {
        matchedPersonId: bestMatch.id,
        confidence: maxConfidence,
        explanation: matchExplanation,
        normalizedInput
      };
    }

    // No confident match
    return {
      matchedPersonId: null,
      confidence: maxConfidence, // could be low
      explanation: maxConfidence > 0 
        ? `Potential match '${bestMatch?.name || ''}' has low confidence of ${maxConfidence}%.` 
        : "No matching names found in historical logs.",
      normalizedInput
    };
  }
}
