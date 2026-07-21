import { ImageResponse } from "next/og";

// Placeholder mark — swap out once visual design direction is set.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#facc15",
          fontSize: 96,
          fontWeight: 700,
        }}
      >
        $
      </div>
    ),
    { ...size },
  );
}
