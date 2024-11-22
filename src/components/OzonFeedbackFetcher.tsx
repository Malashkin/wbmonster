"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/app/context/StateContext";

interface ProductItem {
  product_id: string;
  // Добавьте другие необходимые поля, если нужно
}

interface ProductListResult {
  items: ProductItem[];
  // Добавьте другие необходимые поля, если нужно
}

interface ProductListResponse {
  result: ProductListResult;
  // Добавьте другие необходимые поля, если нужно
}

export default function OzonFeedbackFetcher() {
  const { clientId, setClientId, apiKey, setApiKey } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

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
              placeholder="Введите ваш Client ID"
              className="mt-2 mb-2"
            />
          </div>
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
              placeholder="Введите ваш API Key"
              className="mt-2 mb-2"
            />
          </div>
          <div className="flex space-x-2">
            <Button onClick={fetchProductIds} disabled={isButtonDisabled}>
              {isLoading ? "Загрузка..." : "Получить список товаров"}
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
    </Card>
  );
}
