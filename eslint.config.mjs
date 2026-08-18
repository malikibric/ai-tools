import nextConfig from "eslint-config-next/core-web-vitals";

const config = [{ ignores: [".next/**", "node_modules/**"] }, ...nextConfig];

export default config;
