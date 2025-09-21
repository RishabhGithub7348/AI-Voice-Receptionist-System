import { Metadata } from "next";
import { FrontdeskDashboard } from "@/components/frontdesk-dashboard";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Frontdesk AI Supervisor - Human-in-the-Loop System",
    description: "AI receptionist with human supervisor escalation for Bella's Hair & Beauty Salon. Manage customer calls, help requests, and knowledge base.",
    openGraph: {
      title: "Frontdesk AI Supervisor Dashboard",
      description: "Human-in-the-Loop AI system for customer service management",
      type: "website",
      images: [
        {
          url: "/frontdesk-og.png",
          width: 1200,
          height: 676,
          type: "image/png",
          alt: "Frontdesk AI Supervisor Dashboard",
        },
      ],
    },
  };
}

export default function HomePage() {
  return (
    <div className="w-full h-full">
      <FrontdeskDashboard />
    </div>
  );
}