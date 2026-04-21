import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [
      "public/chromium-pack.tar",
      "public/pdf.worker.min.mjs",
      "public/qpdf.wasm",
    ],
  },
];

export default eslintConfig;
