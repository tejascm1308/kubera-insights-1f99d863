import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Send,
  Loader2,
  Trash2,
  Edit2,
  Check,
  X,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket, ChatMessage } from '@/hooks/useWebSocket';
import { chatApi } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { cn } from '@/lib/utils';

interface Chat {
  chat_id: string;
  title: string;
  created_at: string;
  last_activity_at: string;
  message_count: number;
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center px-4 py-3">
      <div className="h-2 w-2 rounded-full bg-muted-foreground/60 typing-dot" />
      <div className="h-2 w-2 rounded-full bg-muted-foreground/60 typing-dot" />
      <div className="h-2 w-2 rounded-full bg-muted-foreground/60 typing-dot" />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3 font-chat',
          isUser
            ? 'bg-kubera-user-bubble text-primary-foreground'
            : 'bg-kubera-bot-bubble text-primary-foreground'
        )}
      >
        {message.content || (message.isStreaming && <TypingIndicator />)}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sendMessage,
    isConnected,
    isStreaming,
    connect,
    disconnect,
  } = useWebSocket();

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load chats
  useEffect(() => {
    const loadChats = async () => {
      const { data } = await chatApi.getAll();
      if (data?.chats) {
        setChats(data.chats);
        if (data.chats.length > 0 && !selectedChat) {
          setSelectedChat(data.chats[0].chat_id);
        }
      }
      setIsLoadingChats(false);
    };

    if (isAuthenticated) {
      loadChats();
    }
  }, [isAuthenticated, selectedChat]);

  // Connect WebSocket
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }
    return () => disconnect();
  }, [isAuthenticated, connect, disconnect]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateChat = async () => {
    const { data } = await chatApi.create('New Chat');
    if (data?.chat) {
      setChats((prev) => [
        {
          chat_id: data.chat.chat_id,
          title: data.chat.title,
          created_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          message_count: 0,
        },
        ...prev,
      ]);
      setSelectedChat(data.chat.chat_id);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !selectedChat || isStreaming) return;
    sendMessage(selectedChat, inputValue.trim());
    setInputValue('');
  };

  const handleRenameChat = async (chatId: string) => {
    if (!editTitle.trim()) return;
    await chatApi.rename(chatId, editTitle);
    setChats((prev) =>
      prev.map((chat) =>
        chat.chat_id === chatId ? { ...chat, title: editTitle } : chat
      )
    );
    setEditingChatId(null);
    setEditTitle('');
  };

  const handleDeleteChat = async (chatId: string) => {
    await chatApi.delete(chatId);
    setChats((prev) => prev.filter((chat) => chat.chat_id !== chatId));
    if (selectedChat === chatId) {
      setSelectedChat(chats[0]?.chat_id || null);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <aside
          className={cn(
            'border-r border-border bg-card transition-all duration-300',
            sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
          )}
        >
          <div className="p-4 border-b border-border">
            <Button onClick={handleCreateChat} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-2 space-y-1">
              {isLoadingChats ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No chats yet. Start a new conversation!
                </div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat.chat_id}
                    className={cn(
                      'group flex items-center gap-2 rounded-md p-2 cursor-pointer transition-colors',
                      selectedChat === chat.chat_id
                        ? 'bg-accent'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => setSelectedChat(chat.chat_id)}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />

                    {editingChatId === chat.chat_id ? (
                      <div className="flex-1 flex items-center gap-1">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-7 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameChat(chat.chat_id);
                            if (e.key === 'Escape') setEditingChatId(null);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRenameChat(chat.chat_id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingChatId(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm truncate">
                          {chat.title}
                        </span>
                        <div className="hidden group-hover:flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChatId(chat.chat_id);
                              setEditTitle(chat.title);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChat(chat.chat_id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-14 border-b border-border flex items-center px-4 gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="font-medium">
              {chats.find((c) => c.chat_id === selectedChat)?.title || 'Select a chat'}
            </h2>
            <div className="ml-auto flex items-center gap-2">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  isConnected ? 'bg-kubera-success' : 'bg-destructive'
                )}
              />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {selectedChat ? (
                messages.length === 0 ? (
                  <div className="text-center py-20">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                    <p className="text-muted-foreground text-sm">
                      Ask about stocks, portfolio analysis, or market insights.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                )
              ) : (
                <div className="text-center py-20">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No chat selected</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Select an existing chat or create a new one.
                  </p>
                  <Button onClick={handleCreateChat} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Chat
                  </Button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          {selectedChat && (
            <div className="border-t border-border p-4">
              <div className="max-w-3xl mx-auto flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about stocks, analysis, or market insights..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isStreaming || !isConnected}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isStreaming || !isConnected}
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
