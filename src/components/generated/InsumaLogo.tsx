import React from 'react';

// ─── InsumaLogo ───────────────────────────────────────────────────────────────
// Logotipo tipográfico SVG inline: "insuma" italic serif light
// La "i" lleva un círculo SVG especial como punto de marca

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<LogoSize, { height: number; fontSize: number; dotR: number }> = {
  sm: { height: 24,  fontSize: 18, dotR: 2.2 },
  md: { height: 36,  fontSize: 28, dotR: 3.2 },
  lg: { height: 52,  fontSize: 40, dotR: 4.4 },
  xl: { height: 72,  fontSize: 56, dotR: 6.0 },
};

interface InsumaLogoProps {
  color?: string;
  size?: LogoSize;
  className?: string;
}

export const InsumaLogo: React.FC<InsumaLogoProps> = ({
  color = '#72BDE8',
  size = 'md',
  className = '',
}) => {
  const { height, fontSize, dotR } = SIZE_MAP[size];

  // We render an SVG text element. The "i" dot is replaced by a custom circle
  // positioned above. We split the word into "i" + "nsuma" and handle the "i"
  // dot manually with a circle.
  //
  // Approach: use a foreignObject/text trick → instead, use SVG text paths.
  // Simpler: render two text chunks and a circle for the dot.

  const fontFamily = "Georgia, 'Times New Roman', serif";
  const fontStyle  = 'italic';
  const fontWeight = '300';

  // Approximate advance widths at the given fontSize for the font.
  // We'll use a viewBox that's wider than needed and let it flow.
  const viewW = fontSize * 3.8; // rough estimate for "insuma"
  const baseline = height * 0.82;

  // The dot circle sits above the "i" stem. We position it by rendering the
  // full word "insuma" with opacity:0, then on top we render "insuma" with
  // visibility but the "i" crossdot is overridden.
  // Simplest robust approach: render full word text + a white fill circle on
  // top of where the "i" dot would be, then our colored circle.

  return (
    <svg
      viewBox={`0 0 ${viewW} ${height}`}
      height={height}
      aria-label="insuma"
      role="img"
      className={className}
      style={{ display: 'inline-block', overflow: 'visible' }}
    >
      {/* Main word — the native "i" dot will be hidden by the white circle below */}
      <text
        x={0}
        y={baseline}
        fontFamily={fontFamily}
        fontStyle={fontStyle}
        fontWeight={fontWeight}
        fontSize={fontSize}
        fill={color}
        letterSpacing={fontSize * 0.01}
      >
        insuma
      </text>

      {/* White circle to erase the native "i" dot */}
      <circle
        cx={fontSize * 0.155}
        cy={baseline - fontSize * 0.72}
        r={dotR * 1.6}
        fill="currentColor"
        style={{ color: 'transparent' }}
      />

      {/* Brand dot — the custom circular dot for the "i" */}
      <circle
        cx={fontSize * 0.155}
        cy={baseline - fontSize * 0.82}
        r={dotR}
        fill={color}
      />
    </svg>
  );
};

export default InsumaLogo;
