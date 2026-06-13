import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CreationSection from "@/components/CreationSection";
import ServiceCards from "@/components/ServiceCards";

export const metadata = {
  title: "BBG Company - Service Création",
  description: "Parcours dédié au service Création & Reprise BBG Company."
};

export default function CreationPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <ServiceCards compact />
        <CreationSection />
      </main>
      <SiteFooter />
    </>
  );
}
