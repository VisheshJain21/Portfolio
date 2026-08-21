"use client";

/**
 * SoundToggle — opt-in switch for lib/sound.ts's synthesized UI tones
 * (spine-node hover ticks, the fault-and-heal "heal" beat). Default off;
 * a portfolio shouldn't make sound assumptions for the visitor. Mirrors
 * StatsWidget's fixed-corner positioning discipline on the opposite side.
 */

import { useEffect, useState } from "react";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sound";
import Icon from "./Icon";
import styles from "./SoundToggle.module.css";

export default function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isSoundEnabled());
  }, []);

  return (
    <button
      type="button"
      className={styles.btn}
      aria-pressed={on}
      aria-label={on ? "Mute interface sound" : "Enable interface sound"}
      data-cursor-hover
      onClick={() => {
        const next = !on;
        setSoundEnabled(next);
        setOn(next);
      }}
    >
      <Icon name={on ? "sound-on" : "sound-off"} className={styles.icon} />
    </button>
  );
}
