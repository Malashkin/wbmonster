"use client";

import { useState, useEffect } from "react";
import { useAppState } from "@/app/context/StateContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import InstructionModal from "@/components/InstructionModal";
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

  // Загружаем данные из localStorage при монтировании компонента
  useEffect(() => {
    const savedCsvData = localStorage.getItem("csvData");
    if (savedCsvData) {
      setCsvData(savedCsvData);
    }

    const savedResults = localStorage.getItem("results");
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    }
  }, []);

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

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleFetch = async () => {
    setIsLoading(true);
    setResults([]);
    setCsvData("");
    localStorage.removeItem("csvData");
    localStorage.removeItem("results");

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

      const concurrencyLimit = 5; // Максимум одновременных запросов
      const delayMs = 5000; // Задержка между запросами в миллисекундах
      const batches = [];

      // Разбиваем на батчи по 1000
      for (let i = 0; i < nmids.length; i += 1000) {
        batches.push(nmids.slice(i, i + 1000));
      }

      for (const batch of batches) {
        setResults((prev) => {
          const updatedResults = [
            ...prev,
            `Обработка новой пачки из ${batch.length} NMID`,
          ];
          localStorage.setItem("results", JSON.stringify(updatedResults));
          return updatedResults;
        });

        const { results: batchResults, errors } =
          await processBatchConcurrently(
            batch,
            concurrencyLimit,
            baseParams,
            delayMs,
            (processedId) => {
              // Обновляем результаты и сохраняем в localStorage
              setResults((prev) => {
                const updatedResults = [
                  ...prev,
                  `Обработан nmId: ${processedId}`,
                ];
                localStorage.setItem("results", JSON.stringify(updatedResults));
                return updatedResults;
              });
            }
          );

        if (errors.length > 0) {
          setResults((prev) => {
            const updatedResults = [...prev, ...errors];
            localStorage.setItem("results", JSON.stringify(updatedResults));
            return updatedResults;
          });
        }

        batchResults.forEach((review) => {
          const nmId = String(review.productDetails.nmId);
          const text = review.text || "";
          const author = review.userName || "Unknown";
          const verifiedStr = review.wasViewed ? "TRUE" : "FALSE";
          const formattedDate = review.createdDate
            ? new Date(review.createdDate).toISOString()
            : "";
          const rating = review.productValuation || 0;

          if (text) {
            totalNonEmptyTexts++;
            nmIdTextCounts[nmId] = (nmIdTextCounts[nmId] || 0) + 1;
          }

          csvContent += `"${nmId}","${text.replace(
            /"/g,
            '""'
          )}","${author.replace(
            /"/g,
            '""'
          )}",${verifiedStr},"${formattedDate}",${rating}\n`;
          uniqueNmIdsSet.add(nmId);
        });

        totalReviewsProcessed += batchResults.length;

        // Сохраняем текущий csvContent в localStorage
        setCsvData(csvContent);
        localStorage.setItem("csvData", csvContent);

        setResults((prev) => {
          const updatedResults = [
            ...prev,
            `Обработано ${totalReviewsProcessed} отзывов в текущей пачке.`,
          ];
          localStorage.setItem("results", JSON.stringify(updatedResults));
          return updatedResults;
        });
      }

      const nmIdMoreThan5Texts = Object.values(nmIdTextCounts).filter(
        (count) => count > 5
      ).length;

      const finalResults = [
        `Общее количество уникальных NmId: ${uniqueNmIdsSet.size}`,
        `Общее количество отзывов с непустым текстом: ${totalNonEmptyTexts}`,
        `Количество NmId с более чем 5 текстовыми отзывами: ${nmIdMoreThan5Texts}`,
      ];

      setResults((prev) => {
        const updatedResults = [...prev, ...finalResults];
        localStorage.setItem("results", JSON.stringify(updatedResults));
        return updatedResults;
      });
    } catch (error) {
      setResults((prev) => {
        const updatedResults = [...prev, `Произошла ошибка: ${error}`];
        localStorage.setItem("results", JSON.stringify(updatedResults));
        return updatedResults;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processBatchConcurrently = async (
    batch: string[],
    concurrency: number,
    baseParams: FeedbackParams,
    delayMs: number,
    onProcessedId: (id: string) => void
  ) => {
    const results: Review[] = [];
    const errors: string[] = [];

    let index = 0;
    const total = batch.length;

    const startNext = async () => {
      if (index >= total) return;
      const nmid = batch[index];
      index++;
      await delay(delayMs);

      const params: FeedbackParams = { ...baseParams, nmId: nmid };
      let skip = 0;
      let allReviews: Review[] = [];

      try {
        while (true) {
          const reviews = await fetchReviews({ ...params, skip });
          if (reviews.length === 0) break;
          allReviews = [...allReviews, ...reviews];
          skip += reviews.length;
        }
        results.push(...allReviews);

        // Вызываем коллбэк для обновления результатов
        onProcessedId(nmid);
      } catch (error) {
        errors.push(`Ошибка при обработке nmId: ${nmid}, ${error}`);
      }

      // Запускаем следующий запрос
      await startNext();
    };

    // Запускаем первоначальные задачи
    const tasks = [];
    for (let i = 0; i < concurrency && i < total; i++) {
      tasks.push(startNext());
    }

    await Promise.all(tasks);

    return { results, errors };
  };

  const handleSaveFile = async () => {
    if (!csvData) return;

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const fileName = `wildberries_feedback_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    saveAs(blob, fileName);

    // Очищаем сохраненные данные после сохранения файла
    localStorage.removeItem("csvData");
    localStorage.removeItem("results");
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
