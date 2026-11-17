"use client";

import React from "react";
import { CmsVoiceBadge } from "./CmsVoiceBadge";

interface JarvisStatusBadgeProps {
  className?: string;
  compact?: boolean;
}

/**
 * Backwards compatibility export: renders the native solo CmsVoiceBadge.
 * Displays "Hey CMS" voice badge and connects directly to the browser-native CmsVoiceEngine.
 */
export function JarvisStatusBadge({ className = "", compact = false }: JarvisStatusBadgeProps) {
  return <CmsVoiceBadge className={className} compact={compact} />;
}
