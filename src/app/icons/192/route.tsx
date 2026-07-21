import { ImageResponse } from "next/og";

// Placeholder mark for the PWA manifest — swap out once visual design lands.
export async function GET() {
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
          fontSize: 104,
          fontWeight: 700,
        }}
      >
        $
      </div>
    ),
    { width: 192, height: 192 },
  );
}
