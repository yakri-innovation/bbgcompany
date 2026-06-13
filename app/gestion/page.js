import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GestionSection from "@/components/GestionSection";
import ServiceCards from "@/components/ServiceCards";

export const metadata = {
  title: "BBG Company - Service Gestion",
  description: "Parcours dédié au service Gestion RH & Comptabilité BBG Company."
};

export default function GestionPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <ServiceCards compact />
        <GestionSection />
      </main>
      <SiteFooter />
    </>
  );
}
