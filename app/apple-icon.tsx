import { ImageResponse } from "next/og";

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
          backgroundColor: "#1f6f4a",
          borderRadius: "50%",
          color: "#f7f6f1",
          fontSize: 96,
          fontWeight: 700,
        }}
      >
        C
      </div>
    ),
    size,
  );
}
