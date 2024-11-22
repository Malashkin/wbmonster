"use client";

import { useAppState } from "@/app/context/StateContext";
import InstructionModal from "@/components/InstructionModal";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductItem {
  product_id: string;
}

interface ProductListResult {
  items: ProductItem[];
}

interface ProductListResponse {
  result: ProductListResult;
}

export default function OzonFeedbackFetcher() {
  const { clientId, setClientId, apiKey, setApiKey } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProductIds = async () => {
    setIsLoading(true);
    setResults([]);
    const baseUrl = "https://api-seller.ozon.ru";

    const headers = {
      "Client-Id": clientId,
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    };

    const requestBody = {
      page: 1,
      page_size: 1000,
    };

    try {
      const response = await fetch(`${baseUrl}/v2/product/list`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
      }

      const data: ProductListResponse = await response.json();

      if (data.result && Array.isArray(data.result.items)) {
        const productIds = data.result.items.map(
          (item: ProductItem) => item.product_id
        );
        setResults(productIds);
      } else {
        throw new Error("Структура ответа не соответствует ожиданиям.");
      }
    } catch (error: any) {
      console.error("Произошла ошибка при выполнении запроса:", error);
      setResults([`Произошла ошибка: ${error.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  // Проверяем, заполнены ли оба поля
  const isButtonDisabled = !clientId || !apiKey || isLoading;

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Ozon Product Fetcher</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="clientId"
              className="block text-sm font-medium text-gray-700"
            >
              Client ID
            </label>
            <Input
              id="clientId"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Введите ваш Client ID Ozon Seller"
              className="mt-2 mb-2"
            />
          </div>
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
              placeholder="Введите ваш API Key"
              className="mt-2 mb-2"
            />
          </div>
          <div className="flex space-x-2">
            <Button onClick={fetchProductIds} disabled={isButtonDisabled}>
              {isLoading ? "Загрузка..." : "Fetch results"}
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-medium">Результаты:</h3>
            <pre className="mt-2 p-4 bg-gray-100 rounded-md overflow-auto max-h-96">
              {results.length > 0 ? results.join("\n") : ""}
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
                  href="https://seller.ozon.ru/app/"
                  target="_blank"
                  className="text-blue-500 underline"
                >
                  Личный Кабинет Ozon
                </a>
                .
              </li>
              <li>
                Поднесите курсор к названию вашей компании в верхнем правом
                углу, правее расположена иконка <strong>«Пользователь»</strong>,
                наведите курсор на нее и в выполывающем окне нажмите{" "}
                <strong>«Настройки»</strong>
              </li>
              <li>
                Затем выберите раздел <strong>«Seller API»</strong>.
              </li>
              <li>
                Нажмите <strong>«Сгенерировать ключ»</strong>.
              </li>
              <li>
                Задайте имя токена <strong>anyFeedback</strong>. Предоставьте
                ему доступ <strong>«Admin read only»</strong>.
              </li>
              <li>
                Нажмите кнопку <strong>«Сгенерировать»</strong>.
              </li>
              <li>
                {""}
                Ключ создан, теперь скопируйте его через кнопку{" "}
                <strong>«Скопировать»</strong>.
              </li>
              <li>
                Вставьте его в <strong> поле для ввода API ключа </strong> на
                странице.
              </li>
            </ol>
          </div>
        }
      />
    </Card>
  );
}
