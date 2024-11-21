"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructionModal({
  isOpen,
  onClose,
}: InstructionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              Поднесите курсор к названию вашей компании в верхнем правом углу,
              в появившемся меню нажмите <strong>«Настройки»</strong>.
            </li>
            <li>
              Затем выберите раздел <strong>«Доступ к API»</strong>.
            </li>
            <li>
              Нажмите <strong>«Создать новый токен»</strong>.
            </li>
            <li>
              Задайте имя токена <strong>anyFeedback</strong>. Предоставьте ему
              доступ к категориям <strong>«Отзывы и Вопросы»</strong> и{" "}
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
          <Button variant="outline" className="mt-4" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
