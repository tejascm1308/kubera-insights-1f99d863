import { useState, useEffect, useCallback, useRef } from 'react';

const WS_BASE = 'ws://localhost:8000';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  timestamp: Date;
}

interface WebSocketMessage {
  type: string;
  content?: string;
  chunk_id?: number;
  delta?: string;
  status?: string;
  user_id?: string;
  timestamp?: string;
  current_usage?: {
    burst: number;
    per_chat: number;
    hourly: number;
    daily: number;
  };
  limits?: {
    burst: number;
    per_chat: number;
    hourly: number;
    daily: number;
  };
  arguments?: string;
  call_id?: string;
  name?: string;
}

interface UseWebSocketReturn {
  messages: ChatMessage[];
  sendMessage: (chatId: string, message: string) => void;
  isConnected: boolean;
  isStreaming: boolean;
  connect: () => void;
  disconnect: () => void;
  rateLimits: {
    current: { burst: number; per_chat: number; hourly: number; daily: number };
    limits: { burst: number; per_chat: number; hourly: number; daily: number };
  } | null;
}

export function useWebSocket(): UseWebSocketReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [rateLimits, setRateLimits] = useState<UseWebSocketReturn['rateLimits']>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const currentMessageRef = useRef<string>('');

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}/ws/chat?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connection':
            console.log('Connected to chat:', data.status);
            break;

          case 'rate_limit_info':
            if (data.current_usage && data.limits) {
              setRateLimits({
                current: data.current_usage,
                limits: data.limits,
              });
            }
            break;

          case 'message_received':
            console.log('Message acknowledged');
            break;

          case 'text_chunk':
            currentMessageRef.current += data.content || '';
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.role === 'assistant' && lastMessage.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, content: currentMessageRef.current },
                ];
              }
              return prev;
            });
            break;

          case 'tool_executing':
            console.log('Tool executing:', data.name);
            break;

          case 'tool_complete':
            console.log('Tool complete:', data.name);
            break;

          case 'message_complete':
            setIsStreaming(false);
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.role === 'assistant') {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, isStreaming: false },
                ];
              }
              return prev;
            });
            currentMessageRef.current = '';
            break;

          case 'rate_limit_exceeded':
            setIsStreaming(false);
            console.error('Rate limit exceeded');
            break;

          case 'error':
            setIsStreaming(false);
            console.error('Chat error:', data);
            break;

          case 'pong':
            console.log('Pong received');
            break;

          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((chatId: string, message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    // Add placeholder for assistant response
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);
    currentMessageRef.current = '';

    wsRef.current.send(
      JSON.stringify({
        type: 'message',
        chat_id: chatId,
        message: message,
      })
    );
  }, []);

  // Ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    messages,
    sendMessage,
    isConnected,
    isStreaming,
    connect,
    disconnect,
    rateLimits,
  };
}
