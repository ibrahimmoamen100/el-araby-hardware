import React, { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Topbar } from "@/components/Topbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Phone, Clock, AlertCircle, Truck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { STORE_LOCATIONS } from "@/constants/store";

export default function Locations() {
  return (
    <div className="min-h-screen flex flex-col">


      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">اماكن فروعنا</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium text-lg">معلومات التوصيل</h3>
                    <p className="text-muted-foreground">
                      المنتج متاح من خلال شركائنا المحليين، والتوصيل خلال 48
                      ساعة
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {STORE_LOCATIONS.map((location) => (
              <Card key={location.id} className="mb-4">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h3 className="font-medium text-lg">{location.name}</h3>
                        <p className="text-muted-foreground">
                          {location.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">اتصل بنا</p>
                        <a
                          href={`tel:${location.phone}`}
                          className="text-muted-foreground hover:text-primary"
                        >
                          {location.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">ساعات العمل</p>
                        <p className="text-muted-foreground">{location.hours}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="h-[400px] md:h-auto">
            <div className="border rounded-lg h-full">
              <iframe
                src={STORE_LOCATIONS.find(loc => loc.isMain)?.googleMapsUrl || STORE_LOCATIONS[0].googleMapsUrl}
                title="موقع المتجر"
                className="w-full h-full rounded-lg"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
