"use client";

import Script from "next/script";

import {
  VLIBRAS_APP_URL,
  VLIBRAS_SCRIPT_URL,
  createVlibrasWidget,
  vlibrasEnabled,
} from "./vlibras-config";

export function VlibrasProvider() {
  if (!vlibrasEnabled) {
    return null;
  }

  return (
    <>
      <div {...{ vw: "" }} className="enabled">
        <div {...{ "vw-access-button": "" }} className="active" />
        <div {...{ "vw-plugin-wrapper": "" }}>
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>
      <Script
        id="vlibras-plugin"
        src={VLIBRAS_SCRIPT_URL}
        strategy="afterInteractive"
        onReady={() => {
          createVlibrasWidget(VLIBRAS_APP_URL);
        }}
      />
    </>
  );
}