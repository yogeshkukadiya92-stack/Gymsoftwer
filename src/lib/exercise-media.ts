import { Exercise } from "@/lib/types";

function getGoogleDriveFileId(url: string) {
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);

  if (fileMatch?.[1]) {
    return fileMatch[1];
  }

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("id") ?? "";
  } catch {
    return "";
  }
}

function getYouTubeVideoId(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "");
    }

    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v") ?? "";
    }
  } catch {
    return "";
  }

  return "";
}

export function getEmbeddableExerciseUrl(exercise: Exercise) {
  const mediaUrl = exercise.mediaUrl.trim();

  if (!mediaUrl) {
    return "";
  }

  const googleDriveId = getGoogleDriveFileId(mediaUrl);

  if (googleDriveId) {
    return `https://drive.google.com/file/d/${googleDriveId}/preview`;
  }

  const youtubeId = getYouTubeVideoId(mediaUrl);

  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  return mediaUrl;
}

export function isEmbeddableIframe(exercise: Exercise) {
  const mediaUrl = exercise.mediaUrl.trim();

  if (!mediaUrl) {
    return false;
  }

  return Boolean(getGoogleDriveFileId(mediaUrl) || getYouTubeVideoId(mediaUrl));
}
