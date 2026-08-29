"use client";

import Script from "next/script";
import { FormEvent, useCallback, useState } from "react";

type TelegramWebApp = {
  version?: string;
  isVersionAtLeast?: (version: string) => boolean;
  initData?: string;
  initDataUnsafe?: {
    user?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  requestWriteAccess?: (callback?: (granted: boolean) => void) => void;
  MainButton?: {
    hide: () => void;
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
const proxyUrl = "https://tg-mini-app-form-proxy.vihlyanec.workers.dev";

export default function Home() {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [contacts, setContacts] = useState({ name: "", email: "", phone: "" });
  const [writeAccess, setWriteAccess] = useState<"idle" | "requested" | "granted" | "denied" | "unavailable">("idle");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "error">("idle");

  const initTelegram = useCallback(() => {
    const app = window.Telegram?.WebApp;

    if (!app) {
      setWriteAccess("unavailable");
      return;
    }

    app.ready();
    app.expand();
    app.MainButton?.hide();

    const canRequestWriteAccess =
      typeof app.requestWriteAccess === "function" &&
      (typeof app.isVersionAtLeast !== "function" || app.isVersionAtLeast("6.9"));

    if (canRequestWriteAccess) {
      try {
        setWriteAccess("requested");
        app.requestWriteAccess?.((granted) => {
          setWriteAccess(granted ? "granted" : "denied");
        });
      } catch {
        setWriteAccess("unavailable");
      }
    } else {
      setWriteAccess("unavailable");
    }
  }, []);

  const submitForm = useCallback((event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setSubmitStatus("sending");

    const app = window.Telegram?.WebApp;
    const payload = {
      type: "discount_request",
      answers,
      contacts,
      writeAccess,
      initData: app?.initData ?? "",
      telegramUser: app?.initDataUnsafe?.user ?? null,
      submittedAt: new Date().toISOString(),
    };

    fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Request failed");
        }

        app?.HapticFeedback?.notificationOccurred("success");
        app?.close();
      })
      .catch(() => {
        setSubmitStatus("error");
        app?.HapticFeedback?.notificationOccurred("error");
      });
  }, [answers, contacts, writeAccess]);

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
          <section className="rounded-[8px] border border-[#e2d7c8] bg-white p-5 shadow-[0_12px_32px_rgb(38_29_20/10%)]">
            <div className="space-y-3 text-[15px] leading-6 text-[#4f453a]">
              <p>Рада тебя видеть, вижу интерес к миру тату.</p>
              <p>
                Я ценю время каждого и консультирую лично. Чтобы я могла
                подобрать решение, которое идеально подойдет под твой запрос,
                заполни эту короткую анкету, после которой я свяжусь с тобой в
                приоритетном порядке. Кроме того, при заполнении фиксируется
                персональная скидка.
              </p>
              <p className="font-semibold text-[#201c18]">
                Ответь на несколько вопросов ниже и получи выгодные условия
                прямо сейчас.
              </p>
            </div>
          </section>

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
              disabled={submitStatus === "sending"}
              className="mt-5 flex h-[52px] w-full items-center justify-center rounded-[8px] bg-[#201c18] px-5 text-[16px] font-semibold text-white transition active:scale-[0.99]"
            >
              {submitStatus === "sending" ? "Отправляем..." : "Забрать скидку"}
            </button>

            {submitStatus === "error" && (
              <p className="mt-3 text-center text-xs leading-5 text-[#8f2b20]">
                Не получилось отправить данные. Проверь соединение и попробуй
                еще раз.
              </p>
            )}
          </section>
        </form>
      </main>
    </>
  );
}
