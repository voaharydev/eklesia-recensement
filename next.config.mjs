import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/annonces/soumettre",
        destination: "/mg/annonces/soumettre",
        permanent: false,
      },
      {
        source: "/annonces",
        destination: "/mg/annonces/soumettre",
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
