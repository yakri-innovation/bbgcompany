import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContactSection from "@/components/ContactSection";
import ServiceCards from "@/components/ServiceCards";

export const metadata = {
  title: "BBG Company - Contact",
  description: "Contactez BBG Company pour vos besoins en gestion, création et fusion acquisition."
};

export default function ContactPage() {
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
