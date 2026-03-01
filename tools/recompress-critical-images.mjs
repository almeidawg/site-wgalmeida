#!/usr/bin/env node

// Fallback script: keeps build pipeline stable when no image recompression
// task is configured in this workspace snapshot.
console.log("[perf:images] recompress-critical-images: skipped (no-op).");
