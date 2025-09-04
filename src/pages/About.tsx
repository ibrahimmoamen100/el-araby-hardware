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

        {/* Store Owner Section */}
        <div className="container py-20">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-16 border-gray-200 border p-4 rounded-lg">
              {/* Profile Image Container */}
              <div className="relative">
                <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-primary/10 shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <img
                    src={STORE_OWNER.image}
                    alt={STORE_OWNER.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <FaStore className="w-7 h-7 text-primary" />
                </div>
              </div>

              {/* Content Container */}
              <div className="text-center md:text-right flex-1 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {STORE_OWNER.name}
                  </h3>
                  <p className="text-primary font-medium text-xl">
                    {STORE_OWNER.title}
                  </p>
                </div>

                <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto md:mx-0">
                  {STORE_OWNER.bio}
                </p>

                {/* Contact Information */}
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-6 pt-6">
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    <FaPhone className="w-6 h-6 text-primary" />
                    <span className="font-medium text-xl">
                      {STORE_OWNER.phone}
                    </span>
                  </div>
                  <button
                    onClick={handleWhatsAppClick}
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                  >
                    <FaWhatsapp className="text-2xl" />
                    <span className="font-medium text-xl">
                      {t("about.contactWhatsApp")}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
