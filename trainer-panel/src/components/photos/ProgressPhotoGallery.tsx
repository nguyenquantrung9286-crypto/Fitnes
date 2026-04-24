"use client";

import { useState } from "react";
import type { ProgressPhoto } from "@/lib/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Props {
  photos: (ProgressPhoto & { signedUrl?: string })[];
}

export function ProgressPhotoGallery({ photos }: Props) {
  const [open, setOpen] = useState<(ProgressPhoto & { signedUrl?: string }) | null>(null);

  if (photos.length === 0) {
    return (
      <div style={{ color: "#6B7280", fontSize: 13 }}>Фото прогресса не загружены</div>
    );
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        {photos.map((photo) => {
          const dateStr = format(new Date(photo.taken_at), "d MMM yyyy", { locale: ru });
          return (
            <div key={photo.id} onClick={() => setOpen(photo)} style={{ cursor: "pointer" }}>
              <div
                style={{
                  background: "#1a1a2e",
                  borderRadius: 10,
                  aspectRatio: "3/4",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {photo.signedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.signedUrl}
                    alt={dateStr}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                    padding: "16px 8px 8px",
                    fontSize: 11,
                    color: "#fff",
                    textAlign: "center",
                  }}
                >
                  {dateStr}
                </div>
              </div>
              {photo.note && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#6B7280",
                    marginTop: 4,
                    textAlign: "center",
                  }}
                >
                  {photo.note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {open && (
        <div
          onClick={() => setOpen(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#18181B",
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: "90%",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "#1a1a2e",
                borderRadius: 10,
                aspectRatio: "3/4",
                width: "100%",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {open.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={open.signedUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="60"
                    height="60"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1.2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
            </div>
            <div style={{ marginTop: 12, fontSize: 14, color: "#fff", fontWeight: 600 }}>
              {format(new Date(open.taken_at), "d MMM yyyy", { locale: ru })}
            </div>
            {open.note && (
              <div style={{ fontSize: 13, color: "#6B7280" }}>{open.note}</div>
            )}
            <button
              onClick={() => setOpen(null)}
              style={{
                marginTop: 16,
                width: "100%",
                padding: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}
