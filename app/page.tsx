"use client";

import Script from "next/script";
import { FormEvent, useCallback, useEffect, useState } from "react";

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  requestWriteAccess?: (callback?: (granted: boolean) => void) => void;
  MainButton?: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
  };
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const questions = [
  {
    id: "experience",
    label: "Был ли у тебя опыт в тату/рисовании?",
    placeholder: "Например: рисую для себя, тату не пробовал(а), уже делал(а) эскизы",
  },
  {
    id: "goal",
    label: "Хотел бы сделать тату основным доходом или хобби?",
    placeholder: "Например: хочу выйти в профессию или оставить как творческое хобби",
  },
  {
    id: "learningPriority",
    label: "Что для тебя важно в обучении?",
    placeholder:
      "Личные критерии, конкретный навык, доход, обратная связь, практика",
  },
  {
    id: "wowResult",
    label: "Какой реальный результат будет вау через 4 месяца?",
    placeholder:
      "Например: зарабатывать на тату, работать в студии, полностью себя обеспечивать",
  },
] as const;

const initialAnswers = Object.fromEntries(questions.map((question) => [question.id, ""]));

export default function Home() {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [contacts, setContacts] = useState({ name: "", email: "", phone: "" });
  const [writeAccess, setWriteAccess] = useState<"idle" | "requested" | "granted" | "denied" | "unavailable">("idle");
  const [submitted, setSubmitted] = useState(false);

  const initTelegram = useCallback(() => {
    const app = window.Telegram?.WebApp;

    if (!app) {
      setWriteAccess("unavailable");
      return;
    }

    app.ready();
    app.expand();

    if (typeof app.requestWriteAccess === "function") {
      setWriteAccess("requested");
      app.requestWriteAccess((granted) => {
        setWriteAccess(granted ? "granted" : "denied");
      });
    } else {
      setWriteAccess("unavailable");
    }
  }, []);

  function submitForm(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const payload = {
      type: "discount_request",
      answers,
      contacts,
      writeAccess,
      submittedAt: new Date().toISOString(),
    };

    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
    window.Telegram?.WebApp?.sendData(JSON.stringify(payload));
    setSubmitted(true);
  }

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    const button = app?.MainButton;

    if (!button) return;

    button.text = "Забрать скидку";
    button.show();
    button.onClick(submitForm);

    return () => {
      button.offClick(submitForm);
      button.hide();
    };
  });

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onLoad={initTelegram}
        onReady={initTelegram}
      />

      <main className="min-h-screen bg-[#f4f0ea] px-4 py-5 text-[#201c18]">
        <form
          onSubmit={submitForm}
          className="mx-auto flex w-full max-w-[560px] flex-col gap-4 pb-8"
        >
          <section className="overflow-hidden rounded-[8px] bg-[#171311] text-white shadow-[0_18px_45px_rgb(38_29_20/16%)]">
            <div className="relative min-h-[140px] border-b border-white/10 bg-[#2b2420] p-5">
              <div aria-hidden="true" className="absolute right-4 top-4 grid grid-cols-3 gap-1.5 opacity-50">
                {Array.from({ length: 18 }).map((_, index) => (
                  <span key={index} className="h-3 w-3 rounded-full border border-[#d8b15f]" />
                ))}
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8b15f]">
                Мини-анкета
              </p>
              <h1 className="mt-3 max-w-[360px] text-[28px] font-semibold leading-[1.05]">
                Давай чуть глубже разберем твою ситуацию
              </h1>
              <p className="mt-3 max-w-[420px] text-[15px] leading-6 text-white/75">
                Расскажи немного о себе и ответь на вопросы ниже.
              </p>
            </div>

            <div className="space-y-4 p-4">
              {questions.map((question, index) => (
                <label key={question.id} className="block">
                  <span className="mb-2 flex gap-2 text-[15px] font-medium leading-5">
                    <span className="text-[#d8b15f]">{index + 1}</span>
                    <span>{question.label}</span>
                  </span>
                  <textarea
                    value={answers[question.id]}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: event.target.value,
                      }))
                    }
                    placeholder={question.placeholder}
                    rows={3}
                    className="min-h-[92px] w-full resize-y rounded-[8px] border border-white/10 bg-white/[0.07] px-4 py-3 text-[16px] leading-6 text-white outline-none transition placeholder:text-white/35 focus:border-[#d8b15f] focus:bg-white/[0.1]"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[8px] border border-[#e2d7c8] bg-white p-4 shadow-[0_12px_32px_rgb(38_29_20/10%)]">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#856f47]">
                Контакты
              </p>
              <h2 className="mt-2 text-[23px] font-semibold leading-tight">
                Оставляй свои данные, чтобы получить обратную связь
              </h2>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Имя</span>
                <input
                  value={contacts.name}
                  onChange={(event) =>
                    setContacts((current) => ({ ...current, name: event.target.value }))
                  }
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Как к тебе обращаться"
                  className="h-12 w-full rounded-[8px] border border-[#dacfc0] bg-[#fbfaf7] px-4 text-[16px] outline-none transition placeholder:text-[#9f9383] focus:border-[#201c18] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Почта</span>
                <input
                  value={contacts.email}
                  onChange={(event) =>
                    setContacts((current) => ({ ...current, email: event.target.value }))
                  }
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="mail@example.com"
                  className="h-12 w-full rounded-[8px] border border-[#dacfc0] bg-[#fbfaf7] px-4 text-[16px] outline-none transition placeholder:text-[#9f9383] focus:border-[#201c18] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Номер</span>
                <input
                  value={contacts.phone}
                  onChange={(event) =>
                    setContacts((current) => ({ ...current, phone: event.target.value }))
                  }
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="+7 999 000-00-00"
                  className="h-12 w-full rounded-[8px] border border-[#dacfc0] bg-[#fbfaf7] px-4 text-[16px] outline-none transition placeholder:text-[#9f9383] focus:border-[#201c18] focus:bg-white"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-5 flex h-[52px] w-full items-center justify-center rounded-[8px] bg-[#201c18] px-5 text-[16px] font-semibold text-white transition active:scale-[0.99]"
            >
              Забрать скидку
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-[#7c7165]">
              {submitted
                ? "Готово. Данные отправлены в Telegram-бот."
                : writeAccess === "granted"
                  ? "Разрешение на сообщения получено."
                  : writeAccess === "denied"
                    ? "Разрешение можно будет выдать в Telegram при следующем открытии."
                    : writeAccess === "unavailable"
                      ? "Открой страницу внутри Telegram, чтобы активировать подписку."
                      : "Запрашиваем разрешение на сообщения в Telegram."}
            </p>
          </section>
        </form>
      </main>
    </>
  );
}
