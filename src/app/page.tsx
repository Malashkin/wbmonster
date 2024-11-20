"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveAs } from "file-saver";

// Расширение интерфейса Window для поддержки showSaveFilePicker
declare global {
  interface Window {
    showSaveFilePicker?: (
      options?: SaveFilePickerOptions
    ) => Promise<FileSystemFileHandle>;
  }

  interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: { [mimeType: string]: string[] };
    }>;
  }
}

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
      const author = review.userName || "Unknown";
      const verified = review.wasViewed || false;
      const date = review.createdDate
        ? new Date(review.createdDate).toISOString()
        : "";
      const rating = review.productValuation || 0;

      if (text) {
        totalNonEmptyTexts++;
        nmIdTextCounts[nmId] = (nmIdTextCounts[nmId] || 0) + 1;
      }

      return {
        nmId,
        text,
        author,
        verified,
        date,
        rating,
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
      skip: 0, // Начинаем с 0 для корректной пагинации
      order: "dateDesc",
      dateFrom: Math.floor(startDate.getTime() / 1000),
      dateTo: Math.floor(now.getTime() / 1000),
    };

    let totalReviewsProcessed = 0;
    let uniqueNmIdsSet = new Set<string>();
    let totalNonEmptyTexts = 0;
    let nmIdTextCounts: { [key: string]: number } = {};

    // Обновлённый заголовок CSV с нужными полями
    let csvContent = "PRODUCT ID,BODY,AUTHOR,Verified,CREATED AT,RATING\n";

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

            // Обновлённые строки данных CSV с запятыми
            processedData.forEach((review) => {
              const verifiedStr = review.verified ? "TRUE" : "FALSE";
              const formattedDate = review.date;
              const escapedText = review.text.replace(/"/g, '""');
              const escapedAuthor = review.author.replace(/"/g, '""');
              csvContent += `"${review.nmId}","${escapedText}","${escapedAuthor}",${verifiedStr},"${formattedDate}",${review.rating}\n`;
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

          // Обновлённые строки данных CSV с запятыми
          processedData.forEach((review) => {
            const verifiedStr = review.verified ? "TRUE" : "FALSE";
            const formattedDate = review.date;
            const escapedText = review.text.replace(/"/g, '""');
            const escapedAuthor = review.author.replace(/"/g, '""');
            csvContent += `"${review.nmId}","${escapedText}","${escapedAuthor}",${verifiedStr},"${formattedDate}",${review.rating}\n`;
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
      console.error("Нет данных для сохранения");
      return;
    }

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const fileName = `wildberries_feedback_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    if (window.showSaveFilePicker) {
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
        console.log("Файл успешно сохранен");
      } catch (err) {
        console.log(
          "Пользователь отменил действие или произошла ошибка, используем saveAs"
        );
        saveAs(blob, fileName);
      }
    } else {
      // Альтернативный вариант для браузеров, не поддерживающих File System Access API
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
              placeholder="Введите ваш API ключ"
            />
          </div>
          <div>
            <label
              htmlFor="daysCount"
              className="block text-sm font-medium text-gray-700"
            >
              Количество дней
            </label>
            <Input
              id="daysCount"
              type="number"
              value={daysCount}
              onChange={(e) => setDaysCount(Number(e.target.value))}
              placeholder="Введите количество дней"
            />
          </div>
          <div>
            <label
              htmlFor="nmidList"
              className="block text-sm font-medium text-gray-700"
            >
              Список NMID (через запятую, опционально)
            </label>
            <div className="flex gap-2">
              <Textarea
                id="nmidList"
                value={nmidList}
                onChange={(e) => setNmidList(e.target.value)}
                placeholder="Введите список NMID (опционально)"
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
                Форматировать ID
              </Button>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleFetch} disabled={isLoading}>
              {isLoading ? "Загрузка..." : "Получить отзывы"}
            </Button>
            {csvData && (
              <Button onClick={handleSaveFile}>
                Сохранить результаты в CSV
              </Button>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium">Результаты:</h3>
            <pre className="mt-2 p-4 bg-gray-100 rounded-md overflow-auto max-h-96">
              {results.join("\n")}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
