import type { LessonContentData } from "../lesson/lessonContent";
import { getFoundationsStudy, getFoundationsQuiz, getFoundationsPractice } from "./sections/foundations";

/**
 * Resolve content for programming lessons.
 * For now we wire the early foundations lessons (0.x) into the new LessonPage system.
 */

function lessonIdToCode(lessonId: string): string | null {
  // Expected format: "prog-0-1" → "0.1"
  if (!lessonId.startsWith("prog-")) return null;
  const parts = lessonId.split("-");
  if (parts.length !== 3) return null;
  const major = parts[1];
  const minor = parts[2];
  if (!major || !minor) return null;
  return `${major}.${minor}`;
}

export function resolveProgrammingContent(lessonId: string): LessonContentData {
  const code = lessonIdToCode(lessonId);

  if (code) {
    // Try foundations (arc 0) first – this covers lessons 0.1, 0.2, 0.3 and later 0.x
    const foundationsStudy = getFoundationsStudy(code);
    const foundationsQuiz = getFoundationsQuiz(code);
    const foundationsPractice = getFoundationsPractice(code);

    if (foundationsStudy) {
      return {
        study: foundationsStudy,
        quiz: foundationsQuiz ?? undefined,
        practice: foundationsPractice ?? undefined,
      };
    }
  }

  // Fallback for unknown / unwired lessons
  return {
    study: {
      title: "Lesson coming soon",
      paragraphs: [
        "This programming lesson is in your GAIA roadmap but has not been written here yet.",
        "You can still use the Notes tab to record what you studied elsewhere or questions you want to revisit.",
      ],
    },
  };
}
