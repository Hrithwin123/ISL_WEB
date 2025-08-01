import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Plus, Trash2, Calendar, Clock } from 'lucide-react';

export default function Conversations({ onSelectConversation, selectedConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data);
    } catch (error) {
      setError('Failed to load conversations');
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-purple-300">Loading conversations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-300">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <MessageCircle className="w-5 h-5 text-purple-300" />
            </div>
            <h3 className="text-lg font-semibold text-white">Conversations</h3>
          </div>
          <button
            onClick={() => onSelectConversation(null)}
            className="p-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-purple-300/70 mb-2">No conversations yet</div>
            <div className="text-sm text-purple-200/50">Start a new conversation to begin</div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation._id}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedConversation?._id === conversation._id
                    ? 'bg-purple-500/30 border border-purple-400/30'
                    : 'hover:bg-white/5'
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-white truncate">
                        {conversation.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-purple-200/70">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(conversation.createdAt)}</span>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>{formatTime(conversation.createdAt)}</span>
                    </div>
                    <div className="text-xs text-purple-200/50 mt-1">
                      {conversation.messages?.length || 0} messages
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation._id);
                    }}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 