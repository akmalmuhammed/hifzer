export type AudioSourceStatus = "available" | "not_configured" | "degraded" | "not_found";

export type PublicAudioStatus = {
  status: AudioSourceStatus;
  userMessage: string;
  diagnosticCode: string;
};

export function toPublicAudioStatus(status: AudioSourceStatus): PublicAudioStatus {
  if (status === "available") {
    return {
      status,
      userMessage: "Audio is ready.",
      diagnosticCode: "audio_available",
    };
  }
  if (status === "not_found") {
    return {
      status,
      userMessage: "This reciter does not have audio for this ayah. You can keep reading or choose another reciter.",
      diagnosticCode: "audio_source_not_found",
    };
  }
  if (status === "not_configured") {
    return {
      status,
      userMessage: "Streaming audio is not available here yet. You can keep reading or choose a local reciter.",
      diagnosticCode: "audio_streaming_unavailable",
    };
  }
  return {
    status,
    userMessage: "Audio is temporarily unavailable. You can keep reading, try again, or choose another reciter.",
    diagnosticCode: "audio_temporarily_unavailable",
  };
}
