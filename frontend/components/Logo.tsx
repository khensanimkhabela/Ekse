import { MicIcon } from "./icons";

/**
 * The Ekse blob-mark: a soft, irregular "squircle" (asymmetric border-radius,
 * not a plain circle) in primary blue, holding a green mic glyph, the
 * blocky "EKSE" wordmark and the "SHINE YAKITHI." tagline — per
 * design-reference/af82402d-login_page.png.
 */
export function Logo({ size = 260 }: { size?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center bg-primary shadow-lg"
      style={{
        width: size,
        height: size * 0.86,
        borderRadius: "58% 42% 52% 48% / 58% 48% 52% 42%",
      }}
    >
      <MicIcon className="text-brandGreen" style={{ width: size * 0.22, height: size * 0.22 }} />
      <span
        className="font-heading font-extrabold tracking-wider mt-1"
        style={{
          fontSize: size * 0.19,
          color: "transparent",
          WebkitTextStroke: `1.5px #73EF59`,
        }}
      >
        EKSE
      </span>
      <span className="font-heading font-bold text-brandGreen tracking-wide" style={{ fontSize: size * 0.06 }}>
        SHINE YAKITHI.
      </span>
    </div>
  );
}
