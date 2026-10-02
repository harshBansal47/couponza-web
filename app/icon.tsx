import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        C
      </div>
    ),
    size,
  );
}
