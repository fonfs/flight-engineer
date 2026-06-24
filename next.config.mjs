/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@classic-flight-engineer/aviation-domain',
    '@classic-flight-engineer/performance-engine',
    '@classic-flight-engineer/aircraft-data',
    '@classic-flight-engineer/simbrief-adapter',
    '@classic-flight-engineer/ui',
    '@classic-flight-engineer/unit-system',
    '@classic-flight-engineer/validation'
  ]
};

export default nextConfig;
