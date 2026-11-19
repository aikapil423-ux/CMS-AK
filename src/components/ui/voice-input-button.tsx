"use client";

export type VoiceInputLang = "hi-IN" | "en-IN";

export interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  fieldLabel?: string;
  className?: string;
  preferredLang?: VoiceInputLang;
  iconOnly?: boolean;
  showLangToggle?: boolean;
}

export function VoiceInputButton(_props: VoiceInputButtonProps) {
  // Voice input buttons on form fields hidden as per user requirement.
  return null;
}
