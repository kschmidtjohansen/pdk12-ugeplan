
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useRealtimeConnectionStatus } from '@/hooks/useRealtimeConnectionStatus';

const ConnectionStatus: React.FC = () => {
  const { connectionStatus, activeSubscriptions, isConnected } = useRealtimeConnectionStatus();

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3" />;
      case 'connecting':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="h-3 w-3" />;
      default:
        return <WifiOff className="h-3 w-3" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'secondary';
      case 'disconnected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isConnected && activeSubscriptions === 0) {
    return null; // Don't show when everything is working normally
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant={getStatusColor() as any} className="flex items-center gap-1">
        {getStatusIcon()}
        <span className="capitalize">{connectionStatus}</span>
      </Badge>
      {activeSubscriptions > 0 && (
        <span className="text-muted-foreground">
          {activeSubscriptions} active
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;
