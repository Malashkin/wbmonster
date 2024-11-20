"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveAs } from "file-saver";

interface FeedbackParams {
  isAnswered: string;
  take: number;
  skip: number;
  order: string;
  dateFrom: number;
  dateTo: number;
  nmId?: string;
}

interface Review {
  productDetails: { nmId: number };
  text?: string;
  userName?: string;
  wasViewed?: boolean;
  createdDate?: string;
  productValuation?: number;
}

export default function WildberriesFeedbackFetcher() {
  const [apiKey, setApiKey] = useState("");
  const [daysCount, setDaysCount] = useState(35);
  const [nmidList, setNmidList] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string>("");

  const fetchReviews = async (params: FeedbackParams): Promise<Review[]> => {
    const url = "https://feedbacks-api.wildberries.ru/api/v1/feedbacks";
    const response = await fetch(
      url + "?" + new URLSearchParams(params as any),
      {
        headers: {
          Authorization: apiKey,
        },
        method: "GET",
      }
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.data?.feedbacks || [];
  };

  const processReviews = (reviews: Review[]) => {
    let totalNonEmptyTexts = 0;
    const uniqueNmIds = new Set<string>();
    const nmIdTextCounts: { [key: string]: number } = {};

    const processedData = reviews.map((review) => {
      const nmId = String(review.productDetails.nmId);
      uniqueNmIds.add(nmId);
      const text = review.text || "";
      if (text) {
        totalNonEmptyTexts++;
        nmIdTextCounts[nmId] = (nmIdTextCounts[nmId] || 0) + 1;
      }
      return {
        nmId,
        text,
        author: review.userName || "Unknown",
        verified: review.wasViewed || false,
        date: review.createdDate || "",
        rating: review.productValuation || 0,
      };
    });

    return { processedData, totalNonEmptyTexts, uniqueNmIds, nmIdTextCounts };
  };

  const handleFetch = async () => {
    setIsLoading(true);
    setResults([]);
    setCsvData("");
    const now = new Date();
    const startDate = new Date(now.getTime() - daysCount * 24 * 60 * 60 * 1000);

    const baseParams: FeedbackParams = {
      isAnswered: "true",
      take: 10000,
      skip: 200000,
      order: "dateDesc",
      dateFrom: Math.floor(startDate.getTime() / 1000),
      dateTo: Math.floor(now.getTime() / 1000),
    };

    let totalReviewsProcessed = 0;
    let uniqueNmIdsSet = new Set<string>();
    let totalNonEmptyTexts = 0;
    let nmIdTextCounts: { [key: string]: number } = {};
    let csvContent = "NmId,Text,Author,Verified,Date,Rating\n";

    try {
      const nmids = nmidList ? nmidList.split(",").map((id) => id.trim()) : [];

      if (nmids.length > 0) {
        for (const nmid of nmids) {
          const params: FeedbackParams = { ...baseParams, nmId: nmid };
          console.log(`Обработка nmId: ${nmid}`);
          setResults((prev) => [...prev, `Обработка nmId: ${nmid}`]);

          let skip = 0;
          while (true) {
            const reviews = await fetchReviews({ ...params, skip });
            if (reviews.length === 0) {
              console.log(
                `Все данные для nmId ${nmid} успешно обработаны и сохранены.`
              );
              setResults((prev) => [
                ...prev,
                `Все данные для nmId ${nmid} успешно обработаны и сохранены.`,
              ]);
              break;
            }

            const {
              processedData,
              totalNonEmptyTexts: nonEmptyTexts,
              uniqueNmIds,
              nmIdTextCounts: textCounts,
            } = processReviews(reviews);
            totalReviewsProcessed += processedData.length;
            uniqueNmIdsSet = new Set([...uniqueNmIdsSet, ...uniqueNmIds]);
            totalNonEmptyTexts += nonEmptyTexts;
            Object.keys(textCounts).forEach((key) => {
              nmIdTextCounts[key] =
                (nmIdTextCounts[key] || 0) + textCounts[key];
            });

            processedData.forEach((review) => {
              csvContent += `${review.nmId},"${review.text.replace(
                /"/g,
                '""'
              )}",${review.author},${review.verified},${review.date},${
                review.rating
              }\n`;
            });

            skip += reviews.length;
            console.log(
              `Общее количество обработанных отзывов: ${totalReviewsProcessed}`
            );
            setResults((prev) => [
              ...prev,
              `Общее количество обработанных отзывов: ${totalReviewsProcessed}`,
            ]);
          }
        }
      } else {
        console.log("Обработка всех отзывов без фильтрации по nmId");
        setResults((prev) => [
          ...prev,
          "Обработка всех отзывов без фильтрации по nmId",
        ]);

        let skip = 0;
        while (true) {
          const reviews = await fetchReviews({ ...baseParams, skip });
          if (reviews.length === 0) {
            console.log("Все данные успешно обработаны и сохранены.");
            setResults((prev) => [
              ...prev,
              "Все данные успешно обработаны и сохранены.",
            ]);
            break;
          }

          const {
            processedData,
            totalNonEmptyTexts: nonEmptyTexts,
            uniqueNmIds,
            nmIdTextCounts: textCounts,
          } = processReviews(reviews);
          totalReviewsProcessed += processedData.length;
          uniqueNmIdsSet = new Set([...uniqueNmIdsSet, ...uniqueNmIds]);
          totalNonEmptyTexts += nonEmptyTexts;
          Object.keys(textCounts).forEach((key) => {
            nmIdTextCounts[key] = (nmIdTextCounts[key] || 0) + textCounts[key];
          });

          processedData.forEach((review) => {
            csvContent += `${review.nmId},"${review.text.replace(
              /"/g,
              '""'
            )}",${review.author},${review.verified},${review.date},${
              review.rating
            }\n`;
          });

          skip += reviews.length;
          console.log(
            `Общее количество обработанных отзывов: ${totalReviewsProcessed}`
          );
          setResults((prev) => [
            ...prev,
            `Общее количество обработанных отзывов: ${totalReviewsProcessed}`,
          ]);
        }
      }

      const nmIdMoreThan5Texts = Object.values(nmIdTextCounts).filter(
        (count) => count > 5
      ).length;

      const finalResults = [
        `Общее количество уникальных NmId: ${uniqueNmIdsSet.size}`,
        `Общее количество отзывов с непустым текстом: ${totalNonEmptyTexts}`,
        `Количество NmId с более чем 5 текстовыми отзывами: ${nmIdMoreThan5Texts}`,
      ];

      console.log(finalResults.join("\n"));
      setResults((prev) => [...prev, ...finalResults]);
      setCsvData(csvContent);
    } catch (error) {
      console.error("Произошла ошибка:", error);
      setResults((prev) => [...prev, `Произошла ошибка: ${error}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFile = async () => {
    if (!csvData) {
      console.error("No data to save");
      return;
    }

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const fileName = `wildberries_feedback_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    if ("showSaveFilePicker" in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "CSV File",
              accept: { "text/csv": [".csv"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        console.log("File saved successfully");
      } catch (err) {
        console.log("User cancelled or error occurred, falling back to saveAs");
        saveAs(blob, fileName);
      }
    } else {
      // Fallback for browsers that don't support the File System Access API
      saveAs(blob, fileName);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-24">
      <CardHeader>
        <CardTitle>Wildberries Feedback Fetcher</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="apiKey"
              className="block text-sm font-medium text-gray-700"
            >
              API Key
            </label>
            <Input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
          </div>
          <div>
            <label
              htmlFor="daysCount"
              className="block text-sm font-medium text-gray-700"
            >
              Number of Days
            </label>
            <Input
              id="daysCount"
              type="number"
              value={daysCount}
              onChange={(e) => setDaysCount(Number(e.target.value))}
              placeholder="Enter number of days"
            />
          </div>
          <div>
            <label
              htmlFor="nmidList"
              className="block text-sm font-medium text-gray-700"
            >
              NMID List (comma-separated, optional)
            </label>
            <div className="flex gap-2">
              <Textarea
                id="nmidList"
                value={nmidList}
                onChange={(e) => setNmidList(e.target.value)}
                placeholder="Enter NMID list (optional)"
              />
              <Button
                variant="outline"
                onClick={() => {
                  const processed = nmidList
                    .split(/[\n\r]+/)
                    .map((id) => id.trim())
                    .filter((id) => id)
                    .join(",");
                  setNmidList(processed);
                }}
              >
                Format IDs
              </Button>
            </div>
          </div>
          <Button onClick={handleFetch} disabled={isLoading}>
            {isLoading ? "Fetching..." : "Fetch Feedback"}
          </Button>
          {csvData && (
            <Button onClick={handleSaveFile}>Save Results to CSV</Button>
          )}
          <div>
            <h3 className="text-lg font-medium">Results:</h3>
            <pre className="mt-2 p-4 bg-gray-100 rounded-md overflow-auto max-h-96">
              {results.join("\n")}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
