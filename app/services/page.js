import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ServiceCards from "@/components/ServiceCards";
import ContactSection from "@/components/ContactSection";

export const metadata = {
  title: "BBG Company - Services",
  description: "Découvrez les services BBG Company : Gestion, Création et Fusion / Acquisition."
};

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <ServiceCards />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
