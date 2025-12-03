import { notFound } from "next/navigation";
import LessonPageClient from "../LessonPageClient";
import { lessonsByTrack, type TrackId } from "../../../lessonsMap";
import { arcsByTrack } from "../../arcs";
import { allPaths } from "../../index";

type PageProps = {
  params: { lessonId: string };
};

export default async function LessonPage({ params }: PageProps) {
  const { lessonId } = params;

  if (!lessonId) {
    notFound();
  }

  const allLessonIds = Object.values(lessonsByTrack).flatMap((trackLessons) =>
    trackLessons.map((lesson) => lesson.id)
  );

  if (!allLessonIds.includes(lessonId)) {
    notFound();
  }

  const trackId = (Object.keys(lessonsByTrack) as TrackId[]).find((track) =>
    lessonsByTrack[track].some((lesson) => lesson.id === lessonId)
  );

  if (!trackId) {
    notFound();
  }

  const path = allPaths[trackId];
  const arcs = arcsByTrack[trackId];

  if (!path || !arcs) {
    notFound();
  }

  return (
    <LessonPageClient
      trackId={trackId}
      path={path}
      arcs={arcs}
      lessonId={lessonId}
    />
  );
}
