import "./globals.css";

export const metadata = {
  title: "BBG Company - Conseil, création et accompagnement des entreprises",
  description:
    "BBG Company accompagne les entreprises sur la gestion, la création et les projets de fusion ou acquisition avec un suivi digitalisé et un espace client sécurisé."
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
