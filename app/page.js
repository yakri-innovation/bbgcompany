import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HeroSection from "@/components/HeroSection";
import ServiceCards from "@/components/ServiceCards";
import ReassuranceSection from "@/components/ReassuranceSection";
import TimelineSection from "@/components/TimelineSection";
import GestionSection from "@/components/GestionSection";
import CreationSection from "@/components/CreationSection";
import AnnonceSection from "@/components/AnnonceSection";
import PlatformSection from "@/components/PlatformSection";
import ContactSection from "@/components/ContactSection";
import { groupAnnouncementsForPublic } from "@/lib/announcements";

export const dynamic = "force-dynamic";

async function getPublicAnnouncements() {
  if (process.env.DISABLE_PUBLIC_ANNOUNCEMENTS === "1") {
    return groupAnnouncementsForPublic([]);
  }
  try {
    const { prisma } = await import("@/lib/prisma");

    const announcements = await prisma.announcement.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
    });

    return groupAnnouncementsForPublic(announcements);
  } catch (error) {
    console.warn("[HomePage] Failed to load public announcements", error);
    return groupAnnouncementsForPublic([]);
  }
}

export default async function HomePage() {
  const announcements = await getPublicAnnouncements();

  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <ServiceCards />
        <ReassuranceSection />
        <TimelineSection />
        <GestionSection />
        <CreationSection />
        <AnnonceSection announcements={announcements} />
        <PlatformSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
