import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import axios from 'axios'
import {io} from 'socket.io-client'

const promptSuggestions = [
    { icon: "✦", label: "Help me brainstorm", prompt: "Help me brainstorm ideas for a creative project" },
    { icon: "⌘", label: "Write something", prompt: "Help me write a clear and engaging introduction" },
    { icon: "⌁", label: "Learn something new", prompt: "Explain a new topic in a simple way" },
    { icon: "↗", label: "Make a plan", prompt: "Help me make a practical plan for my week" }
];
const emptyMessages = [];

async function fetchChatMessages(chatId) {
    const { data } = await axios.get(`/api/chat/${chatId}/messages`, {
        withCredentials: true
    });


    return data.messages.map((message) => ({
        role: message.role === "model" ? "assistant" : message.role,
        content: message.content
    }));
}

/* function getAiReply(message) {
    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes("plan")) {
        return "Let's make this manageable. Start by choosing the most important outcome, break it into a few small steps, and give each step a realistic time slot. What would you like this plan to focus on?";
    }

    if (normalizedMessage.includes("write") || normalizedMessage.includes("writing")) {
        return "Absolutely. A strong first draft starts with the main point you want your reader to remember. Share the audience and tone you have in mind, and we can shape it together.";
    }

    if (normalizedMessage.includes("explain") || normalizedMessage.includes("learn")) {
        return "A useful way to learn a new topic is to start with the big idea, connect it to something familiar, and then explore one example. Which part would you like to understand first?";
    }

    if (normalizedMessage.includes("brainstorm") || normalizedMessage.includes("idea")) {
        return "Let's open up a few possibilities. Try combining something you enjoy with a problem people often run into, then sketch the smallest version you could test. What kind of project are you imagining?";
    }

    return "Thanks for sharing that. I can help you think it through, break it into smaller steps, or explore a few different approaches. What would be most useful to you?";
} */

function Icon({ name, size = 20 }) {
    const commonProps = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
    };

    if (name === "menu") {
        return <svg {...commonProps}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
    }
    if (name === "plus") {
        return <svg {...commonProps}><path d="M12 5v14M5 12h14" /></svg>;
    }
    if (name === "chat") {
        return <svg {...commonProps}><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.8-3.6A7.5 7.5 0 1 1 20 11.5Z" /></svg>;
    }
    if (name === "send") {
        return <svg {...commonProps}><path d="m21 3-7.2 18-3.5-7.3L3 10.2 21 3Z" /><path d="M10.3 13.7 21 3" /></svg>;
    }
    if (name === "sparkle") {
        return <svg {...commonProps}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></svg>;
    }
    if (name === "sun") {
        return <svg {...commonProps}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>;
    }
    if (name === "moon") {
        return <svg {...commonProps}><path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z" /></svg>;
    }
    if (name === "login") {
        return <svg {...commonProps}><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg>;
    }
    return null;
}

function Home() {
    const [theme, setTheme] = useState(() => {
        const savedTheme = window.localStorage.getItem("theme");
        if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    });
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [aiError, setAiError] = useState("");
    const [historyError, setHistoryError] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const activeChat = chats.find((chat) => chat.id === activeChatId);
    const messages = activeChat ? activeChat.messages : emptyMessages;
    const nextTheme = theme === "dark" ? "light" : "dark";

    const loadChatMessages = useCallback(async (chatId) => {
        setChats((previousChats) => previousChats.map((chat) => chat.id === chatId
            ? { ...chat, messagesLoading: true, messagesError: "" }
            : chat));

        try {
            const savedMessages = await fetchChatMessages(chatId);
            setChats((previousChats) => previousChats.map((chat) => chat.id === chatId
                ? { ...chat, messages: savedMessages, messagesLoaded: true, messagesLoading: false }
                : chat));
        } catch (error) {
            setChats((previousChats) => previousChats.map((chat) => chat.id === chatId
                ? {
                    ...chat,
                    messagesLoading: false,
                    messagesError: error.response?.data?.message || "Could not load this conversation. Try opening it again."
                }
                : chat));
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, sending]);

    useEffect(() => {
        let isCurrent = true;

        axios.get("/api/chat/", { withCredentials: true })
            .then(({ data }) => {
                if (!isCurrent) return;

                const savedChats = data.chats.map((chat) => ({
                    id: chat._id,
                    title: chat.title,
                    messages: [],
                    persisted: true,
                    messagesLoaded: false,
                    messagesLoading: false
                }));

                setChats((previousChats) => {
                    const localChats = previousChats.filter((chat) => !chat.persisted);
                    const localChatIds = new Set(localChats.map((chat) => chat.id));
                    return [
                        ...localChats,
                        ...savedChats.filter((chat) => !localChatIds.has(chat.id))
                    ];
                });

                if (savedChats.length > 0) {
                    setActiveChatId(savedChats[0].id);
                    loadChatMessages(savedChats[0].id);
                }
            })
            .catch((error) => {
                if (isCurrent) {
                    setHistoryError(error.response?.status === 401
                        ? "Log in to see your saved conversations."
                        : "Could not load your saved conversations.");
                }
            }
        
        )

        const tempSocket = io({
            withCredentials: true
        });

        tempSocket.on("ai-response", ({ chat, content }) => {
            if (!chat || !content) {
                setAiError("The AI returned an empty response.");
                setSending(false);
                return;
            }

            setChats((previousChats) => previousChats.map((item) => item.id === chat
                ? { ...item, messages: [...item.messages, { role: "assistant", content }] }
                : item));
            setAiError("");
            setSending(false);
        });
        tempSocket.on("ai-error", ({ message }) => {
            setAiError(message || "The AI could not respond. Please try again.");
            setSending(false);
        });
        tempSocket.on("connect_error", () => {
            setAiError("Could not connect to the AI service. Log in and try again.");
            setSending(false);
        });
        socketRef.current = tempSocket;

        return () => {
            isCurrent = false;
            tempSocket.disconnect();
            socketRef.current = null;
        };
    }, [loadChatMessages]);

    function startNewChat() {
        setActiveChatId(null);
        setInput("");
        setSaveError(null);
        setAiError("");
        setSidebarOpen(false);
    }

    function openChat(chatId) {
        setActiveChatId(chatId);
        setSaveError(null);
        setAiError("");
        setSidebarOpen(false);

        const chat = chats.find((item) => item.id === chatId);
        if (chat && !chat.messagesLoaded && !chat.messagesLoading) {
            loadChatMessages(chatId);
        }
    }

    function toggleTheme() {
        window.localStorage.setItem("theme", nextTheme);
        setTheme(nextTheme);
    }

    async function handleSendMessage(message = input) {
        const content = message.trim();
        if (!content || sending) return;

        const isNewChat = activeChatId === null;
        const activeSocket = socketRef.current;
        if (!activeSocket) {
            setAiError("Could not connect to the AI service. Please try again.");
            return;
        }

        setInput("");
        setSaveError(null);
        setAiError("");
        setSending(true);
        let chatId = activeChatId;

        try {
            if (isNewChat) {
                const { data } = await axios.post("/api/chat/", {
                    title: content
                }, {
                    withCredentials: true
                });
                const savedChat = data.chat;
                chatId = savedChat._id;

                setChats((previousChats) => [
                    {
                        id: chatId,
                        title: savedChat.title,
                        messages: [],
                        persisted: true,
                        messagesLoaded: true
                    },
                    ...previousChats.filter((chat) => chat.id !== chatId)
                ]);
            }

            setActiveChatId(chatId);
            setChats((previousChats) => {
                const existingChat = previousChats.find((chat) => chat.id === chatId);
                if (existingChat) {
                    return previousChats.map((chat) => chat.id === chatId
                        ? { ...chat, messages: [...chat.messages, { role: "user", content }] }
                        : chat);
                }

                return [{
                    id: chatId,
                    title: content.length > 36 ? `${content.slice(0, 36).trimEnd()}…` : content,
                    messages: [{ role: "user", content }],
                    persisted: true,
                    messagesLoaded: true
                }, ...previousChats];
            });

            activeSocket.emit("ai-message", { chat: chatId, content });
        } catch (error) {
            setSaveError(getSaveError(error));
            setSending(false);
        }
    }

    function getSaveError(error) {
        if (error.response?.status === 401) {
            return {
                message: "Log in to start a conversation.",
                needsLogin: true
            };
        }

        return {
            message: error.response?.data?.message || "This conversation could not be started. Please try again.",
            needsLogin: false
        };
    }

    function handleComposerKeyDown(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    }

    return (
        <div className="chat-app" data-theme={theme}>
            {sidebarOpen && (
                <button
                    className="chat-backdrop"
                    type="button"
                    aria-label="Close sidebar"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`chat-sidebar${sidebarOpen ? " is-open" : ""}`}>
                <div className="sidebar-top">
                    <a className="chat-brand" href="/" onClick={(event) => event.preventDefault()}>
                        <span className="chat-brand-mark"><Icon name="sparkle" size={20} /></span>
                        <span>Mini-Gpt</span>
                    </a>
                    <button
                        className="icon-button sidebar-close"
                        type="button"
                        aria-label="Close sidebar"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <Icon name="menu" />
                    </button>
                </div>

                <button className="new-chat-button" type="button" onClick={startNewChat}>
                    <Icon name="plus" size={19} />
                    <span>New chat</span>
                    <span className="new-chat-shortcut">⌘ K</span>
                </button>

                <div className="chat-history">
                    <p className="history-heading">Your conversations</p>
                    {chats.length === 0 ? (
                        <p className="history-empty">{historyError || "Your chats will show up here."}</p>
                    ) : (
                        <div className="history-list">
                            {chats.map((chat) => (
                                <button
                                    className={`history-item${chat.id === activeChatId ? " is-active" : ""}`}
                                    key={chat.id}
                                    type="button"
                                    onClick={() => openChat(chat.id)}
                                    title={chat.title}
                                >
                                    <Icon name="chat" size={17} />
                                    <span>{chat.title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="sidebar-footer">
                    <Link className="sidebar-login" to="/login" onClick={() => setSidebarOpen(false)}>
                        <Icon name="login" size={18} />
                        <span>Log in</span>
                    </Link>
                </div>
            </aside>

            <main className="chat-main">
                <header className="chat-header">
                    <div className="mobile-header">
                        <button
                            className="icon-button"
                            type="button"
                            aria-label="Open sidebar"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Icon name="menu" />
                        </button>
                        <a className="chat-brand mobile-brand" href="/" onClick={(event) => event.preventDefault()}>
                            <span className="chat-brand-mark"><Icon name="sparkle" size={18} /></span>
                            <span>Min-Gpt</span>
                        </a>
                    </div>
                    <div className="assistant-picker">
                        <span>Mini-Gpt v-1</span>
                        <span className="assistant-version">2.0</span>
                        <span className="picker-chevron">⌄</span>
                    </div>
                    <div className="header-tools">
                        <div className="header-note"><span className="status-dot" /> A calm space to think</div>
                        <button
                            className="theme-switch"
                            type="button"
                            onClick={toggleTheme}
                            aria-label={`Switch to ${nextTheme} theme`}
                            title={`Switch to ${nextTheme} theme`}
                        >
                            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
                        </button>
                    </div>
                </header>

                <section className={`conversation${messages.length ? " has-messages" : ""}`} aria-live="polite">
                    {activeChat?.messagesLoading ? (
                        <div className="welcome"><p className="welcome-kicker">Loading conversation…</p></div>
                    ) : activeChat?.messagesError ? (
                        <div className="welcome">
                            <p className="save-error" role="alert">{activeChat.messagesError}</p>
                            <button className="new-chat-button" type="button" onClick={() => loadChatMessages(activeChat.id)}>
                                Retry loading messages
                            </button>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="welcome">
                            <div className="welcome-icon"><Icon name="sparkle" size={26} /></div>
                            <p className="welcome-kicker">A fresh page</p>
                            <h1>What’s on your mind?</h1>
                            <p className="welcome-description">A thought, a question, a half-formed idea. Start anywhere — we’ll figure it out together.</p>
                            <div className="suggestion-grid">
                                {promptSuggestions.map((suggestion) => (
                                    <button
                                        className="suggestion-card"
                                        key={suggestion.label}
                                        type="button"
                                        onClick={() => handleSendMessage(suggestion.prompt)}
                                    >
                                        <span className="suggestion-icon">{suggestion.icon}</span>
                                        <span>{suggestion.label}</span>
                                        <span className="suggestion-arrow">↗</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="message-list">
                            {messages.map((message, index) => (
                                <article className={`message-row is-${message.role}`} key={`${message.role}-${index}`}>
                                    {message.role === "assistant" && (
                                        <div className="assistant-avatar"><Icon name="sparkle" size={17} /></div>
                                    )}
                                    <div className="message-content">
                                        <p className="message-author">{message.role === "user" ? "You" : "Muse"}</p>
                                        <p className="message-text">{message.content}</p>
                                    </div>
                                </article>
                            ))}
                            {sending && (
                                <article className="message-row is-assistant">
                                    <div className="assistant-avatar"><Icon name="sparkle" size={17} /></div>
                                    <div className="message-content">
                                        <p className="message-author">Mini-Gpt</p>
                                        <div className="typing-indicator" aria-label="Muse is thinking">
                                            <span /><span /><span />
                                        </div>
                                    </div>
                                </article>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </section>

                <div className="composer-area">
                    <div className="composer">
                        <textarea
                            aria-label="Message Muse"
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={handleComposerKeyDown}
                            placeholder="Share what’s on your mind..."
                            rows={1}
                            disabled={sending || activeChat?.messagesLoading}
                        />
                        <div className="composer-actions">
                            <span className="composer-hint">Shift + Enter for a new line</span>
                            <button
                                className="send-button"
                                type="button"
                                aria-label="Send message"
                                onClick={() => handleSendMessage()}
                                disabled={!input.trim() || sending || activeChat?.messagesLoading}
                            >
                                <Icon name="send" size={18} />
                            </button>
                        </div>
                    </div>
                    <p className="demo-note">Mini-Gpt’s replies are generated by an AI service.</p>
                    {saveError && (
                        <p className="save-error" role="alert">
                            {saveError.message}
                            {saveError.needsLogin && <> <Link to="/login" onClick={() => setSidebarOpen(false)}>Log in</Link></>}
                        </p>
                    )}
                    {aiError && <p className="save-error" role="alert">{aiError}</p>}
                </div>
            </main>
        </div>
    );
}

export default Home;
