"use client";
import "98.css";
import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import LoadingScreen from "../components/LoadingScreen";
import { error } from "console";

const BananaScene = dynamic(() => import("../components/BananaScene"), {
  ssr: false,
});

interface Message {
  text: string;
  sender: string;
}

export default function Home() {
  // State-First Development. (A -> B -> C)
  // Step A: The State (Storage)
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi~~~ This is Y2k Banana ✨ 🍌 ~~~ What's your name...???",
      sender: "Y2k Banana 🍌 🍌 🍌",
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const [bgColor, setBgColor] = useState("#fef3c7");
  const [language, setLanguage] = useState("English");
  const colorThemes = [
    { name: "Banana", bg: "#ff90f2", chat: "#fef3c7" },
    { name: "Rosie", bg: "#FFB7C5", chat: "#FFF0F5" },
    { name: "Jennie", bg: "#6D0016", chat: "#9D1A2F" },
    { name: "Jisoo", bg: "#C8A2C8", chat: "#E6E6FA" },
    { name: "Lisa", bg: "#FFFACD", chat: "#FFFF00" },
  ];

  // Initialize with the first theme object
  const [currentTheme, setCurrentTheme] = useState(colorThemes[0]);

  const languageOptions = [
    "English",
    "Traditional Chinese",
    "Japanese",
    "Spanish",
    "Korean",
  ];
  const playlist = [
    { name: "Ditto", file: "/music/NewJeans_Ditto.mp3" },
    { name: "Attention", file: "/music/NewJeans_Attention.mp3" },
    { name: "Hype Boy", file: "/music/NewJeans_Hype_Boy.mp3" },
    { name: "OMG", file: "/music/NewJeans_OMG.mp3" },
    { name: "Super Shy", file: "/music/NewJeans_SuperShy.mp3" },
    { name: "Zero", file: "/music/NewJeans_Zero.mp3" },
  ];
  const [currentSong, setCurrentSong] = useState(playlist[0].file);

  useEffect(() => {
    const audio = document.getElementById("main-audio") as HTMLAudioElement;
    if (audio) {
      audio.load();
      audio.play().catch(() => {
        console.log(
          "Autoplay blocked. Music will start after your first click! ✨",
        );
      });
    }
  }, [currentSong]);

  // Step B: The Function (Action)

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const UserMsg: Message = { text: inputValue, sender: "User 🍠" };

    const updatedHistory = [...messages, UserMsg];

    setMessages(updatedHistory);
    setInputValue(""); // "After type the input, we need to clean the input box!"
    setIsTyping(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatHistory: updatedHistory,
          userLanguage: language,
        }),
      });

      const data = await response.json();

      const SysMsg = {
        text: data.reply,
        sender: "Y2k Banana 🍌🍌🍌",
      };

      if (data.reply) {
        setMessages((prev) => [...prev, SysMsg]);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setIsTyping(false);
    }

    // setTimeout(() => {
    //   // Delay (500ms) before is typing...shows up
    //   setIsTyping(true);

    //   // Delay (2000ms) before SysMsg...shows up
    //   setTimeout(() => {
    //     const SysMsg = {
    //       text: "I love you...🩷",
    //       sender: "Y2k Banana 🍌🍌🍌",
    //     };

    //     setMessages((prev) => [...prev, SysMsg]);
    //     setIsTyping(false); // Dots disappear, message appears
    //   }, 2000);
    // }, 500);
  };

  // Add Scroll effect
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]); // Runs every time a new message is added or isTyping == True

  // useEffect(SetupFunction, DependencyArray)
  const [time, setTime] = useState("");
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {isLoading && <LoadingScreen onFinished={() => setIsLoading(false)} />}
      <main
        className="min-h-screen w-full bg-[#ff90f2] relative overflow-hidden p-4 md:p-12"
        style={{ backgroundColor: currentTheme.bg }}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 2px), linear-gradient(90deg, #7cb5f2 1px, transparent 2px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="window w-full max-w-2xl mx-auto z-10 relative">
          <div className="title-bar">
            <div className="title-bar-text">BananaMessenger.exe</div>
          </div>
          <div className="status-bar">
            <p className="status-bar-field">Status: Online</p>
            <p className="status-bar-field">System Time: {time}</p>
            <p className="status-bar-field">CPU: 99%</p>
          </div>
          <div className="window-body">
            <div
              className="field-row mb-4"
              style={{ justifyContent: "center", gap: "10px" }}
            >
              <label>Color: </label>
              <select
                value={currentTheme.name}
                onChange={(e) => {
                  const selected = colorThemes.find(
                    (t) => t.name === e.target.value,
                  );
                  if (selected) setCurrentTheme(selected);
                }}
              >
                {colorThemes.map((theme) => (
                  <option key={theme.name} value={theme.name}>
                    {theme.name}
                  </option>
                ))}
              </select>

              <label>Language: </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languageOptions.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* PlayMusic */}
            <div
              className="field-row-stacked mt-4 p-2"
              style={{ border: "2px inset #ffffff", background: "#c0c0c0" }}
            >
              <label htmlFor="music-select">
                {" "}
                Play NewJeans 👖 ▶︎ •၊၊||၊|။||||။‌‌‌‌‌၊|•
              </label>

              <select
                id="music-select"
                value={currentSong}
                onChange={(e) => setCurrentSong(e.target.value)}
                style={{ width: "100%" }}
              >
                {playlist.map((track, index) => (
                  <option key={index} value={track.file}>
                    {track.name}
                  </option>
                ))}
              </select>

              {/* Hidden audio element that updates when currentSong changes */}
              <audio id="main-audio" src={currentSong} loop />

              <div
                style={{
                  margin: "0 auto",
                  justifyContent: "center",
                  alignItems: "center", // 👈 This is the "magic" line for vertical alignment
                  gap: "10px",
                }}
              >
                <button
                  style={{ gap: "4px" }}
                  onClick={() =>
                    (
                      document.getElementById("main-audio") as HTMLAudioElement
                    ).play()
                  }
                >
                  ▶ Play
                </button>
                <button
                  onClick={() =>
                    (
                      document.getElementById("main-audio") as HTMLAudioElement
                    ).pause()
                  }
                >
                  || Pause
                </button>
                <span style={{ fontSize: "10px", marginLeft: "10px" }}>
                  Vol:
                </span>
                <input
                  type="range"
                  style={{ width: "60px" }}
                  min="0"
                  max="1"
                  step="0.1"
                  onChange={(e) =>
                    ((
                      document.getElementById("main-audio") as HTMLAudioElement
                    ).volume = Number(e.target.value))
                  }
                />
              </div>
            </div>
            {/* 3D Viewport */}
            <div className="h-64 bg-black border-2 border-inset mb-4">
              <BananaScene />
            </div>
            {/* Chat History */}
            <div
              ref={scrollRef}
              className="h-64 overflow-y-auto p-4 bg-amber-200 mb-4 border-inset flex flex-col gap-3"
              style={{ backgroundColor: currentTheme.chat }}
            >
              {messages.map((msg, i) => {
                const isUser = msg.sender === "User 🍠";

                return (
                  <div
                    key={i}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-2 border-2 ${
                        isUser
                          ? "bg-[#000080] text-white border-blue-400"
                          : "bg-[#c0c0c0] text-black border-gray-100 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                      }`}
                      style={{
                        boxShadow: isUser
                          ? "none"
                          : "inset -1px -1px #808080, inset 1px 1px #ffffff",
                      }}
                    >
                      <div className="text-[10px] font-bold uppercase mb-1 opacity-70">
                        {msg.sender}
                      </div>
                      <div className="text-sm leading-tight">{msg.text}</div>
                    </div>
                  </div>
                );
              })}
              {/* System is Typing Animation */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#c0c0c0] p-2 border-2 border-gray-100 shadow-[2px_2px_0px_rgba(0,0,0,1)] text-xs font-mono">
                    <span className="opacity-70 uppercase font-bold">
                      Y2k Banana 🍌
                    </span>
                    <div className="flex gap-1 mt-1">
                      is typing<span className="animate-pulse">.</span>
                      <span className="animate-pulse [animation-delay:200ms]">
                        .
                      </span>
                      <span className="animate-pulse [animation-delay:400ms]">
                        .
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Input Area */}
            {/* Step C: The UI (Body)*/}
            <div className="field-row ">
              <input
                type="text"
                className="w-full min-h-10"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button className="h-10" onClick={handleSendMessage}>
                Send
              </button>
            </div>
          </div>
        </div>
      </main>{" "}
    </>
  );
}
