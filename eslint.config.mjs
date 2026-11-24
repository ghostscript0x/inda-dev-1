import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";

const config = [
  ...next,
  ...ts,
  { ignores: ["node_modules/**", ".next/**", "src/generated/**", "next-env.d.ts", "public/**"] },
];
export default config;
