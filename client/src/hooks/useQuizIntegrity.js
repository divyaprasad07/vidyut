// hooks/useQuizIntegrity.js
//
// TIER 1 — Quiz-integrity (anti-cheating) system.
// Watches for a tab switch/window blur (visibilitychange) or entry into
// Picture-in-Picture during an active quiz.
//
// Two warnings, then auto-submit: the first two times this happens, the
// student gets a clearly visible warning and the quiz continues normally.
// Only the THIRD occurrence actually auto-submits with whatever's been
// answered so far. This exists because leaving the screen can easily
// happen by accident (a notification, a misclick, briefly checking
// something) rather than genuine cheating, so it shouldn't cost a
// student their attempt on the very first slip.
//
// Honesty note (also surfaced in the UI): browsers cannot reliably detect
// split-screen or multi-window arrangement. That is a real platform
// limitation, not a bug, and this hook does not attempt it. Tab switch,
// window blur, and PiP are the realistic vectors a browser can actually
// see.
//
// Every browser API here is wrapped so a browser that doesn't support one
// (e.g. no PiP) degrades to just not watching for that vector, rather than
// crashing the quiz.

import { useEffect, useRef } from "react";

const WARNINGS_ALLOWED = 2; // occurrences 1 and 2 warn; occurrence 3 submits

export function useQuizIntegrity(active, { onWarning, onViolation } = {}) {
  // Both refs live outside the effect so they persist for the whole quiz
  // attempt, not just one question, and survive the effect re-attaching
  // its listeners if `active` or the callbacks' identities ever change.
  const violationCountRef = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    const registerViolation = (violationType) => {
      if (submittedRef.current) return; // already auto-submitted, ignore anything further
      violationCountRef.current += 1;
      const count = violationCountRef.current;

      if (count > WARNINGS_ALLOWED) {
        submittedRef.current = true;
        onViolation?.(violationType, count);
      } else {
        onWarning?.(violationType, count, WARNINGS_ALLOWED - count);
      }
    };

    let handleVisibility, handleEnterPip;

    try {
      handleVisibility = () => {
        if (document.hidden) registerViolation("tab_switch");
      };
      document.addEventListener("visibilitychange", handleVisibility);
    } catch (err) {
      console.warn("visibilitychange not available, tab-switch detection disabled:", err);
    }

    try {
      handleEnterPip = () => registerViolation("picture_in_picture");
      document.addEventListener("enterpictureinpicture", handleEnterPip, true);
    } catch (err) {
      console.warn("Picture-in-Picture events not available, PiP detection disabled:", err);
    }

    return () => {
      if (handleVisibility) document.removeEventListener("visibilitychange", handleVisibility);
      if (handleEnterPip) document.removeEventListener("enterpictureinpicture", handleEnterPip, true);
    };
  }, [active, onWarning, onViolation]);
}
