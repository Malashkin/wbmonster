"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAppState } from "@/app/context/StateContext";

export default function YMFeedbackFetcher() {
  const {
    array1,
    setArray1,
    array2,
    setArray2,
    matches,
    setMatches,
    numbersWithDash,
    setNumbersWithDash,
    processedNumbers,
    setProcessedNumbers,
  } = useAppState();

  const handleComputeMatches = () => {
    try {
      const arr1: number[] = array1
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map((item) => Number(item));

      const arr2: number[] = array2
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map((item) => Number(item));

      const set2 = new Set<number>(arr2);
      const matched = arr1.filter((value: number) => set2.has(value));
      setMatches(matched);
    } catch (error) {
      alert("Пожалуйста, введите числа, разделенные запятыми, например: 1,2,3");
    }
  };

  const handleProcessNumbers = () => {
    try {
      const numbersArray: string[] = numbersWithDash
        .split(",")
        .map((item: string) => item.trim());
      const processed: string[] = numbersArray.map((number: string) => {
        const parts = number.split("-");
        return parts.length > 1 ? parts[0] : number;
      });
      setProcessedNumbers(processed);
    } catch (error) {
      alert(
        "Пожалуйста, введите числа в правильном формате, например: 4121225214-50, 4121225215-51"
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {})
      .catch((error) => {});
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>YM Feedback Fetcher</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Секция для поиска совпадений между массивами */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">
            Поиск совпадений между массивами
          </h2>
          <div className="mb-4">
            <label className="block mb-2">
              Введите первый массив (числа, разделенные запятыми):
            </label>
            <textarea
              className="w-full p-2 border rounded"
              value={array1}
              onChange={(e) => setArray1(e.target.value)}
              rows={4}
              placeholder="Например: 1,2,3"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">
              Введите второй массив (числа, разделенные запятыми):
            </label>
            <textarea
              className="w-full p-2 border rounded"
              value={array2}
              onChange={(e) => setArray2(e.target.value)}
              rows={4}
              placeholder="Например: 3,4,5"
            />
          </div>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleComputeMatches}
          >
            Найти совпадения
          </button>
          {matches.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-bold">Совпадения:</h2>
              <pre className="p-2 bg-gray-100 rounded">
                {matches.join(", ")}
              </pre>
              <button
                className="mt-2 px-4 py-2 bg-gray-500 text-white rounded"
                onClick={() => copyToClipboard(matches.join(", "))}
              >
                Копировать результат
              </button>
            </div>
          )}
        </div>
        {/* Секция для обработки чисел с тире */}
        <div>
          <h2 className="text-lg font-bold mb-4">
            Обрезка чисел до символа "-"
          </h2>
          <div className="mb-4">
            <label className="block mb-2">
              Введите числа с тире (разделенные запятыми):
            </label>
            <textarea
              className="w-full p-2 border rounded"
              value={numbersWithDash}
              onChange={(e) => setNumbersWithDash(e.target.value)}
              rows={4}
              placeholder="Например: 4121225214-50, 4121225215-51"
            />
          </div>
          <div className="flex gap-4">
            <button
              className="px-4 py-2 bg-green-500 text-white rounded"
              onClick={handleProcessNumbers}
            >
              Обрезать числа
            </button>
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded"
              onClick={() => copyToClipboard(processedNumbers.join(", "))}
            >
              Копировать результат
            </button>
          </div>
          {processedNumbers.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-bold">Результат:</h2>
              <pre className="p-2 bg-gray-100 rounded">
                {processedNumbers.join(", ")}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
