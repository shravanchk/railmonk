const { PHASE_PRODUCTION_BUILD } = require('next/constants');

/** @type {import('next').NextConfig} */
module.exports = (phase) => ({
  reactStrictMode: true,
  ...(phase === PHASE_PRODUCTION_BUILD ? { output: 'export' } : {}),
  images: {
    unoptimized: true
  }
});
