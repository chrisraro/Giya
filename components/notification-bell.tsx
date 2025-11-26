"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Check, X, Gift, Tag, Coins, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  metadata?: {
    business_id?: string;
    transaction_id?: string;
    points_earned?: number;
    amount_spent?: number;
    reward_id?: string;
    reward_name?: string;
    points_required?: number;
    deal_id?: string;
    deal_title?: string;
    discount_percentage?: number;
    discount_amount?: number;
  };
}

// Helper function to get icon for notification type
function getNotificationIcon(type: string) {
  switch (type) {
    case 'points_earned':
      return <Coins className="h-5 w-5 text-green-600" />;
    case 'new_reward':
      return <Gift className="h-5 w-5 text-purple-600" />;
    case 'new_deal':
      return <Tag className="h-5 w-5 text-orange-600" />;
    case 'punch_card_completion':
      return <CreditCard className="h-5 w-5 text-blue-600" />;
    default:
      return <Bell className="h-5 w-5 text-gray-600" />;
  }
}

// Helper function to get background color for notification type
function getNotificationBgColor(type: string, isRead: boolean) {
  if (isRead) return '';
  
  switch (type) {
    case 'points_earned':
      return 'bg-green-50 border-l-4 border-l-green-500';
    case 'new_reward':
      return 'bg-purple-50 border-l-4 border-l-purple-500';
    case 'new_deal':
      return 'bg-orange-50 border-l-4 border-l-orange-500';
    case 'punch_card_completion':
      return 'bg-blue-50 border-l-4 border-l-blue-500';
    default:
      return 'bg-muted/30';
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/notifications");
      
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      
      const result = await response.json();
      setNotifications(result.data);
      setUnreadCount(result.data.filter((n: Notification) => !n.is_read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notifications as read
  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notification_ids: notificationIds }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => prev - notificationIds.length);
      
      toast.success("Notifications marked as read");
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const unreadIds = notifications
      .filter(n => !n.is_read)
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  // Delete a notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notifications.find(n => n.id === id && !n.is_read)) {
        setUnreadCount(prev => prev - 1);
      }
      
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  // Load notifications when user is available
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Add real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

    // In a real implementation, you would set up a real-time subscription
    // For now, we'll just poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" onClick={fetchNotifications}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-medium">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              You're all caught up!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.is_read 
                      ? getNotificationBgColor(notification.type, false)
                      : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Notification Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 flex-shrink-0"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => markAsRead([notification.id])}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}