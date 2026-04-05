import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'driver' | 'admin';
  recipient_id?: string;
  recipient_type?: 'driver' | 'admin' | 'broadcast';
  message: string;
  message_type: 'text' | 'location' | 'emergency' | 'system';
  metadata?: {
    location?: { lat: number; lng: number };
    busNumber?: string;
    emergencyType?: 'accident' | 'breakdown' | 'medical' | 'other';
  };
  created_at: string;
  read_by: string[];
  is_emergency: boolean;
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'broadcast';
  participants: string[];
  last_message?: ChatMessage;
  unread_count: number;
  created_at: string;
}

class ChatService {
  private static instance: ChatService;
  private channel: RealtimeChannel | null = null;
  private currentUserId: string | null = null;
  private currentUserType: 'driver' | 'admin' | null = null;
  private messageSubscribers: ((message: ChatMessage) => void)[] = [];
  private roomSubscribers: ((rooms: ChatRoom[]) => void)[] = [];

  private constructor() {}

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // Initialize chat service for current user
  async initialize(userId: string, userType: 'driver' | 'admin'): Promise<void> {
    this.currentUserId = userId;
    this.currentUserType = userType;

    // Create or ensure chat_messages table exists
    await this.ensureChatTables();

    // Subscribe to real-time updates
    this.subscribeToMessages();
  }

  // Ensure chat tables exist (this would normally be done via migration)
  private async ensureChatTables(): Promise<void> {
    try {
      // This is a placeholder - in production, these tables would be created via Supabase migrations
      console.log('Chat tables would be created via migration');
    } catch (error) {
      console.error('Error ensuring chat tables:', error);
    }
  }

  // Subscribe to real-time message updates
  private subscribeToMessages(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }

    this.channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages' 
        },
        (payload) => {
          const message = payload.new as ChatMessage;
          this.notifyMessageSubscribers(message);
        }
      )
      .subscribe();
  }

  // Subscribe to new messages
  onNewMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageSubscribers.push(callback);
    return () => {
      this.messageSubscribers = this.messageSubscribers.filter(cb => cb !== callback);
    };
  }

  // Subscribe to room updates
  onRoomUpdate(callback: (rooms: ChatRoom[]) => void): () => void {
    this.roomSubscribers.push(callback);
    return () => {
      this.roomSubscribers = this.roomSubscribers.filter(cb => cb !== callback);
    };
  }

  // Notify message subscribers
  private notifyMessageSubscribers(message: ChatMessage): void {
    this.messageSubscribers.forEach(callback => callback(message));
  }

  // Send a text message
  async sendMessage(
    recipientId: string | null,
    recipientType: 'driver' | 'admin' | 'broadcast',
    message: string,
    isEmergency: boolean = false
  ): Promise<ChatMessage | null> {
    if (!this.currentUserId || !this.currentUserType) {
      throw new Error('Chat service not initialized');
    }

    try {
      // Get sender name
      const senderName = await this.getUserName(this.currentUserId, this.currentUserType);

      const messageData = {
        sender_id: this.currentUserId,
        sender_name: senderName,
        sender_type: this.currentUserType,
        recipient_id: recipientId,
        recipient_type: recipientType,
        message,
        message_type: 'text' as const,
        is_emergency: isEmergency,
        read_by: [this.currentUserId],
        created_at: new Date().toISOString()
      };

      // For now, we'll simulate the message insert since the table doesn't exist yet
      const mockMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        ...messageData
      };

      // In production, this would be:
      // const { data, error } = await supabase
      //   .from('chat_messages')
      //   .insert([messageData])
      //   .select()
      //   .single();

      // Simulate real-time notification
      setTimeout(() => {
        this.notifyMessageSubscribers(mockMessage);
      }, 100);

      return mockMessage;

    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Send location message
  async sendLocationMessage(
    recipientId: string | null,
    recipientType: 'driver' | 'admin' | 'broadcast',
    location: { lat: number; lng: number },
    busNumber?: string
  ): Promise<ChatMessage | null> {
    if (!this.currentUserId || !this.currentUserType) {
      throw new Error('Chat service not initialized');
    }

    try {
      const senderName = await this.getUserName(this.currentUserId, this.currentUserType);

      const messageData = {
        sender_id: this.currentUserId,
        sender_name: senderName,
        sender_type: this.currentUserType,
        recipient_id: recipientId,
        recipient_type: recipientType,
        message: 'Location shared',
        message_type: 'location' as const,
        metadata: { location, busNumber },
        is_emergency: false,
        read_by: [this.currentUserId],
        created_at: new Date().toISOString()
      };

      const mockMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        ...messageData
      };

      setTimeout(() => {
        this.notifyMessageSubscribers(mockMessage);
      }, 100);

      return mockMessage;

    } catch (error) {
      console.error('Error sending location message:', error);
      return null;
    }
  }

  // Send emergency message
  async sendEmergencyMessage(
    emergencyType: 'accident' | 'breakdown' | 'medical' | 'other',
    message: string,
    location?: { lat: number; lng: number }
  ): Promise<ChatMessage | null> {
    if (!this.currentUserId || !this.currentUserType) {
      throw new Error('Chat service not initialized');
    }

    try {
      const senderName = await this.getUserName(this.currentUserId, this.currentUserType);

      const messageData = {
        sender_id: this.currentUserId,
        sender_name: senderName,
        sender_type: this.currentUserType,
        recipient_id: null,
        recipient_type: 'broadcast' as const,
        message: `EMERGENCY: ${message}`,
        message_type: 'emergency' as const,
        metadata: { emergencyType, location },
        is_emergency: true,
        read_by: [this.currentUserId],
        created_at: new Date().toISOString()
      };

      const mockMessage: ChatMessage = {
        id: `emergency_${Date.now()}`,
        ...messageData
      };

      // Emergency messages are broadcast immediately
      setTimeout(() => {
        this.notifyMessageSubscribers(mockMessage);
      }, 50);

      return mockMessage;

    } catch (error) {
      console.error('Error sending emergency message:', error);
      return null;
    }
  }

  // Get user name for display
  private async getUserName(userId: string, userType: 'driver' | 'admin'): Promise<string> {
    try {
      if (userType === 'driver') {
        const { data, error } = await supabase
          .from('drivers')
          .select('name')
          .eq('profile_id', userId)
          .single();
        
        if (error) throw error;
        return data?.name || 'Unknown Driver';
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        return data?.username || 'Admin';
      }
    } catch (error) {
      console.error('Error getting user name:', error);
      return userType === 'driver' ? 'Unknown Driver' : 'Admin';
    }
  }

  // Get chat history
  async getChatHistory(
    recipientId?: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      // In production, this would query the database
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  // Mark messages as read
  async markAsRead(messageIds: string[]): Promise<void> {
    if (!this.currentUserId) return;

    try {
      // In production, this would update the read_by array
      console.log('Marking messages as read:', messageIds);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Get available chat recipients (for drivers: admins, for admins: all drivers)
  async getAvailableRecipients(): Promise<{ id: string; name: string; type: 'driver' | 'admin'; online: boolean }[]> {
    try {
      if (this.currentUserType === 'driver') {
        // Drivers can chat with admins
        const { data: admins, error } = await supabase
          .from('profiles')
          .select('id, username')
          .in('user_type', ['admin', 'guardian_admin']);

        if (error) throw error;

        return admins?.map(admin => ({
          id: admin.id,
          name: admin.username,
          type: 'admin' as const,
          online: true // For now, assume everyone is online
        })) || [];

      } else {
        // Admins can chat with all drivers
        const { data: drivers, error } = await supabase
          .from('drivers')
          .select('profile_id, name')
          .not('profile_id', 'is', null);

        if (error) throw error;

        return drivers?.map(driver => ({
          id: driver.profile_id,
          name: driver.name,
          type: 'driver' as const,
          online: true // For now, assume everyone is online
        })) || [];
      }
    } catch (error) {
      console.error('Error getting available recipients:', error);
      return [];
    }
  }

  // Disconnect from chat service
  disconnect(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    
    this.currentUserId = null;
    this.currentUserType = null;
    this.messageSubscribers = [];
    this.roomSubscribers = [];
  }

  // Get current user info
  getCurrentUser(): { id: string; type: 'driver' | 'admin' } | null {
    if (!this.currentUserId || !this.currentUserType) return null;
    
    return {
      id: this.currentUserId,
      type: this.currentUserType
    };
  }
}

export const chatService = ChatService.getInstance();
export type { ChatMessage, ChatRoom };