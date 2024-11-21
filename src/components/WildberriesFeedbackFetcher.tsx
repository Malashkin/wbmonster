"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveAs } from "file-saver";

export default function WildberriesFeedbackFetcher() {
  const [apiKey, setApiKey] = useState("");
  const [daysCount, setDaysCount] = useState(35);
  const [nmidList, setNmidList] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false); // Управление модальным окном

  const handleFetch = async () => {
    setIsLoading(true);
    setResults([]);
    setCsvData("");
    // Логика обработки
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

    saveAs(blob, fileName);
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
              className=" mt-2 mb-2"
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
              className=" mt-2 mb-2"
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
            {/* Кнопка для открытия модального окна */}
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
              Инструкции
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-medium">Результаты:</h3>
            <pre className="mt-2 p-4 bg-gray-100 rounded-md overflow-auto max-h-96">
              {results.join("\n")}
            </pre>
          </div>
        </div>
      </CardContent>

      {/* Модальное окно */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Интеграция с помощью API Wildberries</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                  углу, в появившемся меню нажмите
                  <strong> «Настройки»</strong>.
                </li>
                <li>
                  Затем выберите раздел <strong>«Доступ к API»</strong>.
                </li>
                <li>
                  Нажмите <strong>«Создать новый токен»</strong>.
                </li>
                <li>
                  Задайте имя токена <strong>anyFeedback</strong>. Предоставьте
                  ему доступ к категориям <strong>«Контент»</strong> и{" "}
                  <strong>«Отзывы и Вопросы»</strong>.
                </li>
                <li>
                  Не ставьте галочку в опции{" "}
                  <strong>«Только для чтения»</strong>, иначе Spix не сможет
                  отправлять ответы на отзывы.
                </li>
                <li>
                  Нажмите кнопку <strong>«Создать токен»</strong>.
                </li>
              </ol>
              <p>
                Ключ создан, теперь скопируйте его через кнопку{" "}
                <strong>«Скопировать»</strong>. Вставьте его в поле для ввода
                API ключа на странице.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsModalOpen(false)}
              >
                Закрыть
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
