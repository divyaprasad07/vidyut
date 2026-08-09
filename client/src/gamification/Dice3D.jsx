// gamification/Dice3D.jsx
//
// A genuine 3D cube built from 6 CSS-transformed faces (not a flat
// unicode character swap), tumbled through a few full rotations before
// settling on the real face, for a more convincing "roll" feel.
//
// Opposite faces sum to 7, matching a real die: 1<->6, 2<->5, 3<->4.
// Each face is placed at a fixed position/rotation on the cube; landing
// on a given value rotates the whole cube by that face's inverse
// placement rotation, bringing it to face the viewer.

const SIZE = 88; // px, cube edge length
const HALF = SIZE / 2;

const FACE_PLACEMENT = {
  1: "translateZ(" + HALF + "px)",
  6: "rotateY(180deg) translateZ(" + HALF + "px)",
  3: "rotateY(90deg) translateZ(" + HALF + "px)",
  4: "rotateY(-90deg) translateZ(" + HALF + "px)",
  2: "rotateX(90deg) translateZ(" + HALF + "px)",
  5: "rotateX(-90deg) translateZ(" + HALF + "px)",
};

// The rotation that brings each face to point toward the viewer, the
// inverse of that face's own placement rotation above.
const FACE_TO_FRONT_ROTATION = {
  1: "rotateX(0deg) rotateY(0deg)",
  6: "rotateY(180deg)",
  3: "rotateY(-90deg)",
  4: "rotateY(90deg)",
  2: "rotateX(-90deg)",
  5: "rotateX(90deg)",
};

const PIP_LAYOUTS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Face({ value, transform }) {
  const lit = new Set(PIP_LAYOUTS[value]);
  return (
    <div
      className="absolute bg-paper rounded-xl grid grid-cols-3 grid-rows-3 gap-1 p-2.5"
      style={{
        width: SIZE,
        height: SIZE,
        transform,
        boxShadow: "inset 0 0 0 2px rgba(15,23,42,0.15)",
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {lit.has(i) && <div className="w-2.5 h-2.5 rounded-full bg-night" />}
        </div>
      ))}
    </div>
  );
}

/**
 * `value`: the face to show at rest (1-6), or null while still tumbling.
 * `rolling`: when true, keeps spinning continuously via CSS animation.
 */
export function Dice3D({ value, rolling }) {
  const restRotation = value ? FACE_TO_FRONT_ROTATION[value] : "rotateX(0deg) rotateY(0deg)";

  return (
    <div style={{ perspective: 500 }} className="mx-auto">
      <div
        className={rolling ? "animate-dice-tumble" : ""}
        style={{
          width: SIZE,
          height: SIZE,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: rolling ? undefined : restRotation,
          transition: rolling ? undefined : "transform 0.7s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((face) => (
          <Face key={face} value={face} transform={FACE_PLACEMENT[face]} />
        ))}
      </div>
    </div>
  );
}
