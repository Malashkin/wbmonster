"use client";

import { useState } from "react";
import WildberriesFeedbackFetcher from "@/components/WildberriesFeedbackFetcher";
import OzonFeedbackFetcher from "@/components//OzonFeedbackFetcher";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [activeComponent, setActiveComponent] = useState<
    "feedback" | "another"
  >("feedback");

  return (
    <div className="w-full max-w-4xl mx-auto mt-12">
      <div className="flex justify-center gap-4 mb-6">
        <Button
          variant={activeComponent === "feedback" ? "default" : "outline"}
          onClick={() => setActiveComponent("feedback")}
        >
          Wildberries
        </Button>
        <Button
          variant={activeComponent === "another" ? "default" : "outline"}
          onClick={() => setActiveComponent("another")}
        >
          Ozon
        </Button>
      </div>

      {activeComponent === "feedback" && <WildberriesFeedbackFetcher />}
      {activeComponent === "another" && <OzonFeedbackFetcher />}
    </div>
  );
}
