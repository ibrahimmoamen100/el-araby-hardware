import React from "react";
import { useTranslation } from "react-i18next";
import {
  FaHandshake,
  FaUsers,
  FaBalanceScale,
  FaStore,
  FaTruck,
  FaWhatsapp,
  FaLaptop,
  FaHeadphones,
  FaMobile,
  FaTools,
  FaPhone,
} from "react-icons/fa";
import Footer from "@/components/Footer";
import { STORE_OWNER, STORE_TEAM } from "@/constants/store";

const features = [
  {
    icon: FaLaptop,
    title: "about.features.computers.title",
    description: "about.features.computers.description",
  },
  {
    icon: FaHeadphones,
    title: "about.features.accessories.title",
    description: "about.features.accessories.description",
  },
  {
    icon: FaTools,
    title: "about.features.maintenance.title",
    description: "about.features.maintenance.description",
  },
  {
    icon: FaTruck,
    title: "about.features.delivery.title",
    description: "about.features.delivery.description",
  },
];

export default function About() {
  const { t } = useTranslation();

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(t("about.whatsappMessage"));
    const phoneWithCountryCode = STORE_OWNER.whatsapp;
    window.open(
      `https://wa.me/${phoneWithCountryCode}?text=${message}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-primary/5 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6">{t("about.title")}</h1>
              <p className="text-xl text-muted-foreground mb-8">
                {t("about.mission.description")}
              </p>
              <button
                onClick={handleWhatsAppClick}
                className="bg-primary text-primary-foreground py-3 px-8 rounded-full hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <FaWhatsapp className="text-xl" />
                {STORE_OWNER.phone}
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <feature.icon className="text-4xl text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {t(feature.title)}
                </h3>
                <p className="text-muted-foreground">
                  {t(feature.description)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-primary/5 py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">
                  {t("about.vision.title")}
                </h2>
                <div className="space-y-4">
                  <p className="text-lg text-muted-foreground">
                    {t("about.vision.description")}
                  </p>
                </div>
              </div>
              <div className="relative h-[500px] rounded-2xl overflow-hidden">
                <img
                  src="logo1.png"
                  alt={t("about.storeImage")}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="container py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("about.values.title")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-4">
                {t("about.values.support.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("about.values.support.description")}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-4">
                {t("about.values.affordable.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("about.values.affordable.description")}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-4">
                {t("about.values.community.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("about.values.community.description")}
              </p>
            </div>
          </div>
        </div>


      </main>

      <Footer />
    </div>
  );
}
