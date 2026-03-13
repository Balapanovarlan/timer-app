"use client";

import { useState, useEffect, useCallback } from "react";

const TEAMS_KEY = "hackathon_teams";
const TIMER_KEY = "hackathon_timer";
const DURATION_KEY = "hackathon_duration";

interface Team {
  name: string;
  score: number;
  members: string[];
}

const TEAMS_DATA: Team[] = [
  { name: "Команда 1", score: 0, members: ["Данияр", "Гульжан М", "Артем Ю", "Нурбике", "Тамирлан", "Бактияр", "Адема"] },
  { name: "Команда 2", score: 0, members: ["Расул", "Андрей", "Диас", "Нуркен", "Амина", "Виктор Г", "Нурсипат"] },
  { name: "Команда 3", score: 0, members: ["Салима", "Нургелды", "Сымбат", "Гульжан Т", "Иван П", "Артем К", "Назира"] },
  { name: "Команда 4", score: 0, members: ["Дидар", "Сайран", "Кирилл", "Жанна", "Зарина", "Дастан", "Адлет"] },
  { name: "Команда 5", score: 0, members: ["Марат", "Кымбат", "Дамир", "Назерке", "Азамат", "Иван Г", "Сафина"] },
];

const DEFAULT_DURATION = 2 * 60 * 60;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function Home() {
  const [teams, setTeams] = useState<Team[]>(TEAMS_DATA);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [totalDuration, setTotalDuration] = useState(DEFAULT_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [editingScore, setEditingScore] = useState<number | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [editingName, setEditingName] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationInput, setDurationInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedTeams = localStorage.getItem(TEAMS_KEY);
    if (savedTeams) {
      const parsed = JSON.parse(savedTeams);
      // Restore scores/names from localStorage but keep static members
      setTeams(TEAMS_DATA.map((def, i) => ({
        ...def,
        name: parsed[i]?.name || def.name,
        score: parsed[i]?.score ?? def.score,
      })));
    }

    const savedDuration = localStorage.getItem(DURATION_KEY);
    if (savedDuration) setTotalDuration(Number(savedDuration));

    const savedTimer = localStorage.getItem(TIMER_KEY);
    if (savedTimer) {
      const { endTime, running, paused } = JSON.parse(savedTimer);
      if (running && endTime) {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining > 0) setIsRunning(true);
      } else if (paused !== undefined) {
        setTimeLeft(paused);
      }
    } else if (savedDuration) {
      setTimeLeft(Number(savedDuration));
    }
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  }, [teams, mounted]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          localStorage.setItem(TIMER_KEY, JSON.stringify({ running: false, paused: 0 }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const startTimer = useCallback(() => {
    const endTime = Date.now() + timeLeft * 1000;
    localStorage.setItem(TIMER_KEY, JSON.stringify({ endTime, running: true }));
    setIsRunning(true);
  }, [timeLeft]);

  const pauseTimer = useCallback(() => {
    localStorage.setItem(TIMER_KEY, JSON.stringify({ running: false, paused: timeLeft }));
    setIsRunning(false);
  }, [timeLeft]);

  const resetTimer = useCallback(() => {
    setTimeLeft(totalDuration);
    setIsRunning(false);
    localStorage.setItem(TIMER_KEY, JSON.stringify({ running: false, paused: totalDuration }));
  }, [totalDuration]);

  const saveDuration = () => {
    const parts = durationInput.split(":");
    const hours = parseInt(parts[0]) || 0;
    const mins = parseInt(parts[1]) || 0;
    const total = hours * 3600 + mins * 60;
    if (total > 0) {
      setTotalDuration(total);
      setTimeLeft(total);
      localStorage.setItem(DURATION_KEY, String(total));
      localStorage.setItem(TIMER_KEY, JSON.stringify({ running: false, paused: total }));
    }
    setEditingDuration(false);
  };

  const updateScore = (index: number, value: number) => {
    setTeams((prev) => prev.map((t, i) => (i === index ? { ...t, score: value } : t)));
    setEditingScore(null);
  };

  const updateName = (index: number, value: string) => {
    setTeams((prev) => prev.map((t, i) => (i === index ? { ...t, name: value || t.name } : t)));
    setEditingName(null);
  };

  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  const sortedTeams = [...teams].map((t, i) => ({ ...t, originalIndex: i })).sort((a, b) => b.score - a.score);
  const isUrgent = timeLeft < 300 && timeLeft > 0;
  const maxScore = Math.max(...teams.map((t) => t.score), 1);

  if (!mounted) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0 bg-blue-600/[0.03]" />
        <div className="relative max-w-6xl mx-auto px-6 py-10 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold uppercase tracking-widest mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Live
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-center">
            AI Vibe Hackathon
          </h1>
          <p className="text-lg md:text-xl text-black/40 font-medium">
            Crocos на стероидах!
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col gap-12">
        {/* Timer */}
        <section className="animate-slide-up text-center">
          <div className="inline-block">
            <div
              className={`text-[7rem] md:text-[10rem] font-mono font-black leading-none tracking-tighter transition-colors ${
                isUrgent ? "text-red-500 animate-pulse" : "text-black"
              }`}
            >
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-8">
            {!isRunning ? (
              <button
                onClick={startTimer}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-95"
              >
                Старт
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="px-8 py-3 bg-black/5 hover:bg-black/10 text-black rounded-full font-semibold transition-all active:scale-95"
              >
                Пауза
              </button>
            )}
            <button
              onClick={resetTimer}
              className="px-6 py-3 bg-black/[0.03] hover:bg-black/[0.06] text-black/50 rounded-full font-medium transition-all active:scale-95"
            >
              Сброс
            </button>
            {!isRunning && (
              <button
                onClick={() => {
                  const h = Math.floor(totalDuration / 3600);
                  const m = Math.floor((totalDuration % 3600) / 60);
                  setDurationInput(`${h}:${m.toString().padStart(2, "0")}`);
                  setEditingDuration(true);
                }}
                className="px-5 py-3 text-black/30 hover:text-black/60 text-sm font-medium transition-colors"
              >
                Настроить
              </button>
            )}
          </div>

          {editingDuration && (
            <div className="mt-6 flex items-center justify-center gap-2 animate-fade-in">
              <input
                type="text"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                placeholder="Ч:ММ"
                className="bg-black/[0.03] border border-black/10 rounded-lg px-4 py-2.5 text-black text-center w-32 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveDuration();
                  if (e.key === "Escape") setEditingDuration(false);
                }}
              />
              <button
                onClick={saveDuration}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                OK
              </button>
            </div>
          )}
        </section>

        {/* Progress */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex justify-between text-sm mb-3">
            <span className="font-semibold text-black/40 uppercase tracking-wide text-xs">Прогресс хакатона</span>
            <span className="font-bold text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-black/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {/* Scoreboard */}
        <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight">Таблица лидеров</h2>
            <span className="text-sm text-black/30 font-medium">нажми на команду для деталей</span>
          </div>

          <div className="space-y-3">
            {sortedTeams.map((team, rank) => {
              const barWidth = maxScore > 0 ? (team.score / maxScore) * 100 : 0;
              const isLeader = rank === 0 && team.score > 0;
              const isExpanded = expandedTeam === team.originalIndex;

              return (
                <div
                  key={team.originalIndex}
                  className={`group relative rounded-2xl border transition-all ${
                    isLeader
                      ? "bg-blue-50/50 border-blue-200 shadow-sm"
                      : "bg-white border-black/[0.06] hover:border-black/10"
                  } ${isExpanded ? "shadow-md" : "hover:shadow-md"}`}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-5 p-5">
                    {/* Rank */}
                    <div className="shrink-0 w-10 text-center">
                      {rank < 3 && team.score > 0 ? (
                        <span className="text-2xl">{MEDAL[rank]}</span>
                      ) : (
                        <span className="text-lg font-bold text-black/20">{rank + 1}</span>
                      )}
                    </div>

                    {/* Name + bar + members count */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        setExpandedTeam(isExpanded ? null : team.originalIndex);
                                              }}
                    >
                      {editingName === team.originalIndex ? (
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          onBlur={() => updateName(team.originalIndex, nameInput)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") updateName(team.originalIndex, nameInput);
                            if (e.key === "Escape") setEditingName(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-transparent border-b-2 border-blue-500 text-black text-lg font-semibold w-full focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingName(team.originalIndex);
                              setNameInput(team.name);
                            }}
                            className="text-lg font-semibold hover:text-blue-600 transition-colors truncate"
                          >
                            {team.name}
                          </span>
                          {team.members.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/[0.04] text-xs text-black/40 font-medium shrink-0">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                              </svg>
                              {team.members.length}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Score bar */}
                      <div className="mt-2 h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLeader ? "bg-blue-500" : "bg-black/10"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* Expand arrow */}
                    <button
                      onClick={() => {
                        setExpandedTeam(isExpanded ? null : team.originalIndex);
                                              }}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-black/30 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Score */}
                    <div className="shrink-0 text-right min-w-[80px]">
                      {editingScore === team.originalIndex ? (
                        <input
                          type="number"
                          value={scoreInput}
                          onChange={(e) => setScoreInput(e.target.value)}
                          onBlur={() => updateScore(team.originalIndex, Number(scoreInput) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") updateScore(team.originalIndex, Number(scoreInput) || 0);
                            if (e.key === "Escape") setEditingScore(null);
                          }}
                          className="bg-transparent border-b-2 border-blue-500 text-black text-3xl font-black w-20 text-right focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setEditingScore(team.originalIndex);
                            setScoreInput(String(team.score));
                          }}
                          className={`text-3xl font-black cursor-pointer transition-colors tabular-nums ${
                            isLeader ? "text-blue-600" : "text-black/70 hover:text-blue-600"
                          }`}
                        >
                          {team.score}
                        </span>
                      )}
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-black/25 mt-0.5">
                        баллов
                      </div>
                    </div>
                  </div>

                  {/* Expanded: Members */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 border-t border-black/5 mt-0 animate-fade-in">
                      <div className="pt-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-black/30 mb-3">
                          Участники
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {team.members.map((member, mi) => (
                            <span
                              key={mi}
                              className="inline-flex items-center px-3 py-1.5 rounded-full bg-black/[0.04] text-sm font-medium"
                            >
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-black/20 text-sm border-t border-black/5">
        AI Vibe Hackathon 2026 — Crocos
      </footer>
    </div>
  );
}
