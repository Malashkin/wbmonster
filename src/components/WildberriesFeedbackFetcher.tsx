"use client";

import { useState } from "react";
import { useAppState } from "@/app/context/StateContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import InstructionModal  from "@/components/InstructionModal";
import { saveAs } from "file-saver";
 

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
  const { apiKey, setApiKey, daysCount, setDaysCount, nmidList, setNmidList } =
    useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      skip: 0,
      order: "dateDesc",
      dateFrom: Math.floor(startDate.getTime() / 1000),
      dateTo: Math.floor(now.getTime() / 1000),
    };

    let totalReviewsProcessed = 0;
    let uniqueNmIdsSet = new Set<string>();
    let totalNonEmptyTexts = 0;
    let nmIdTextCounts: { [key: string]: number } = {};

    let csvContent = "PRODUCT ID,BODY,AUTHOR,Verified,CREATED AT,RATING\n";

    try {
      const nmids = nmidList ? nmidList.split(",").map((id) => id.trim()) : [];

      if (nmids.length > 0) {
        for (const nmid of nmids) {
          const params: FeedbackParams = { ...baseParams, nmId: nmid };
          setResults((prev) => [...prev, `Обработка nmId: ${nmid}`]);

          let skip = 0;
          while (true) {
            const reviews = await fetchReviews({ ...params, skip });
            if (reviews.length === 0) break;

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
              const verifiedStr = review.verified ? "TRUE" : "FALSE";
              const formattedDate = review.date;
              const escapedText = review.text.replace(/"/g, '""');
              const escapedAuthor = review.author.replace(/"/g, '""');
              csvContent += `"${review.nmId}","${escapedText}","${escapedAuthor}",${verifiedStr},"${formattedDate}",${review.rating}\n`;
            });

            skip += reviews.length;
            setResults((prev) => [
              ...prev,
              `Общее количество обработанных отзывов: ${totalReviewsProcessed}`,
            ]);
          }
        }
      } else {
        let skip = 0;
        while (true) {
          const reviews = await fetchReviews({ ...baseParams, skip });
          if (reviews.length === 0) break;

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
            const verifiedStr = review.verified ? "TRUE" : "FALSE";
            const formattedDate = review.date;
            const escapedText = review.text.replace(/"/g, '""');
            const escapedAuthor = review.author.replace(/"/g, '""');
            csvContent += `"${review.nmId}","${escapedText}","${escapedAuthor}",${verifiedStr},"${formattedDate}",${review.rating}\n`;
          });

          skip += reviews.length;
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

      setResults((prev) => [...prev, ...finalResults]);
      setCsvData(csvContent);
    } catch (error) {
      setResults((prev) => [...prev, `Произошла ошибка: ${error}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFile = async () => {
    if (!csvData) return;

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const fileName = `wildberries_feedback_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    saveAs(blob, fileName);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Wildberries Feedback Fetcher</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-gray-700"
              >
                API Key
              </label>
              <Tooltip content="Нажмите на значок, чтобы открыть инструкцию">
                <button
                  className="text-black text-sm border-2 border-black rounded-full w-5 h-5 flex items-center justify-center font-bold hover:bg-gray-200 transition duration-200 shadow-sm"
                  onClick={() => setIsModalOpen(true)}
                  aria-label="Инструкция"
                  style={{ color: "#374151", borderColor: "#e5e7eb" }}
                >
                  i
                </button>
              </Tooltip>
            </div>

            <Input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Введите ваш API ключ"
              className="mt-2 mb-2"
            />
          </div>
          <div>
            <label
              htmlFor="daysCount"
              className="block text-sm font-medium text-gray-700"
            >
              Days
            </label>
            <Input
              id="daysCount"
              type="number"
              value={daysCount}
              onChange={(e) => setDaysCount(Number(e.target.value))}
              placeholder="Введите количество дней"
              className="mt-2 mb-2"
            />
          </div>
          <div>
            <label
              htmlFor="nmidList"
              className="block text-sm font-medium text-gray-700"
            >
              List NMID (optional)
            </label>
            <div className="flex gap-2 mt-2 mb-2">
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
                Format IDs
              </Button>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleFetch} disabled={isLoading}>
              {isLoading ? "Loading..." : "Fetch reviews"}
            </Button>
            {csvData && (
              <Button onClick={handleSaveFile}>Save Results to CSV</Button>
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
      <InstructionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={
          <div>
            <ol className="list-decimal pl-4 space-y-2 text-sm">
              <li>
                Зайдите в ваш{" "}
                <a
                  href="https://seller.wildberries.ru/"
                  target="_blank"
                  className="text-blue-500 underline"
                >
                  Личный Кабинет Wildberries
                </a>
                .
              </li>
              <li>
                Поднесите курсор к названию вашей компании в верхнем правом
                углу, в появившемся меню нажмите <strong>«Настройки»</strong>.
              </li>
              <li>
                Затем выберите раздел <strong>«Доступ к API»</strong>.
              </li>
              <li>
                Нажмите <strong>«Создать новый токен»</strong>.
              </li>
              <li>
                Задайте имя токена <strong>anyFeedback</strong>. Предоставьте
                ему доступ к категориям <strong>«Отзывы и Вопросы»</strong> и{" "}
                <strong>«Контент»</strong>.
              </li>
              <li>
                Не ставьте галочку в опции <strong>«Только для чтения»</strong>.
              </li>
              <li>
                Нажмите кнопку <strong>«Создать токен»</strong>.
              </li>
            </ol>
            <p>
              Ключ создан, теперь скопируйте его через кнопку{" "}
              <strong>«Скопировать»</strong>. Вставьте его в поле для ввода API
              ключа на странице.
            </p>
          </div>
        }
      />
    </Card>
  );
}

