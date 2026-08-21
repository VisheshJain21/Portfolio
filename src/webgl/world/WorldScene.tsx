"use client";

/**
 * WorldScene — the shared scene rendered inside WorldGate's canvas.
 * useSectionProgress() is called ONCE here and its stable getter passed
 * to every layer, which each read their own section's slice inside their
 * own useFrame — no React re-renders, matching webgl/work's ref-only
 * per-frame discipline.
 */

import { useSectionProgress } from "./use-section-progress";
import SpineLayer from "./layers/SpineLayer";
import ManifestoLayer from "./layers/ManifestoLayer";
import ProofLayer from "./layers/ProofLayer";
import ExperienceLayer from "./layers/ExperienceLayer";
import ProcessCapabilitiesLayer from "./layers/ProcessCapabilitiesLayer";
import ContactLayer from "./layers/ContactLayer";

export default function WorldScene() {
  const getSectionProgress = useSectionProgress();

  return (
    <>
      <SpineLayer getSectionProgress={getSectionProgress} />
      <ManifestoLayer getSectionProgress={getSectionProgress} />
      <ProofLayer getSectionProgress={getSectionProgress} />
      <ExperienceLayer getSectionProgress={getSectionProgress} />
      <ProcessCapabilitiesLayer getSectionProgress={getSectionProgress} />
      <ContactLayer getSectionProgress={getSectionProgress} />
    </>
  );
}
