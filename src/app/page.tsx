"use client";

import { useState } from "react";
import WildberriesFeedbackFetcher from "@/components/WildberriesFeedbackFetcher";
import OzonFeedbackFetcher from "@/components//OzonFeedbackFetcher";
import YMFeedbackFetcher from "@/components/YMFeedbackfatcher";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [activeComponent, setActiveComponent] = useState<
    "feedback" | "ozon" | "ym" 
  >("feedback");

  return (
    <div className="w-full max-w-4xl mx-auto mt-12">
      <div className="relative  mx-auto flex justify-center mb-6">
        Выбор источника отзывов
      </div>
      <div className="flex justify-center gap-4 mb-6">
        <Button
          variant={activeComponent === "feedback" ? "default" : "outline"}
          onClick={() => setActiveComponent("feedback")}
        >
          Wildberries
        </Button>
        <Button
          variant={activeComponent === "ozon" ? "default" : "outline"}
          onClick={() => setActiveComponent("ozon")}
        >
          Ozon
        </Button>
        <Button
          variant={activeComponent === "ym" ? "default" : "outline"}
          onClick={() => setActiveComponent("ym")}
        >
          YM
        </Button>
      </div>

      {activeComponent === "feedback" && <WildberriesFeedbackFetcher />}
      {activeComponent === "ozon" && <OzonFeedbackFetcher />}
      {activeComponent === "ym" && <YMFeedbackFetcher />}
    </div>
  );
}
