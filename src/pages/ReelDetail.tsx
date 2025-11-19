import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Play, 
  Calendar,
  Loader2,
  CheckCircle2,
  RefreshCw,
  X,
  Download,
  Send,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const statusConfig = {
  queued: { label: "Queued", color: "bg-muted text-muted-foreground", icon: Clock },
  generating: { label: "Generating", color: "bg-warning/10 text-warning", icon: Loader2 },
  ready: { label: "Ready", color: "bg-success/10 text-success", icon: CheckCircle2 },
  scheduled: { label: "Scheduled", color: "bg-primary/10 text-primary", icon: Calendar },
  posting: { label: "Posting", color: "bg-secondary/10 text-secondary", icon: Loader2 },
  posted: { label: "Posted", color: "bg-success text-success-foreground", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-destructive/10 text-destructive", icon: X },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: X },
  created: { label: "Created", color: "bg-muted text-muted-foreground", icon: Clock },
};

export default function ReelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reel, isLoading } = useQuery({
    queryKey: ["reel", id],
    queryFn: () => api.getReel(parseInt(id!)),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === "generating" || data?.status === "posting" ? 2000 : false;
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => api.publishReel(parseInt(id!)),
    onSuccess: () => {
      toast({ title: "Publishing reel...", description: "Your reel is being posted to Instagram." });
      queryClient.invalidateQueries({ queryKey: ["reel", id] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => api.retryReel(parseInt(id!)),
    onSuccess: () => {
      toast({ title: "Retrying generation...", description: "Your reel will be regenerated." });
      queryClient.invalidateQueries({ queryKey: ["reel", id] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelReel(parseInt(id!)),
    onSuccess: () => {
      toast({ title: "Reel cancelled", description: "Generation has been cancelled." });
      queryClient.invalidateQueries({ queryKey: ["reel", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!reel) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Reel not found</p>
        <Button onClick={() => navigate("/")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const config = statusConfig[reel.status];
  const Icon = config.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Badge className={cn("text-sm px-3 py-1", config.color)}>
          <Icon className={cn("w-4 h-4 mr-2", reel.status === "generating" && "animate-spin")} />
          {config.label}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column - Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {reel.thumbnail_url ? (
                <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black">
                  <img 
                    src={reel.thumbnail_url} 
                    alt="Reel thumbnail" 
                    className="w-full h-full object-cover"
                  />
                  {reel.video_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Button size="lg" className="rounded-full w-16 h-16" variant="secondary">
                        <Play className="w-6 h-6" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[9/16] rounded-lg bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Generating...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {reel.status === "ready" && (
            <Card>
              <CardContent className="pt-6 space-y-2">
                <Button 
                  className="w-full gradient-primary" 
                  size="lg"
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post Now
                </Button>
                {reel.video_url && (
                  <Button variant="outline" className="w-full" size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Download Video
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {(reel.status === "failed" || reel.status === "cancelled") && (
            <Card>
              <CardContent className="pt-6">
                <Button 
                  className="w-full" 
                  size="lg"
                  variant="outline"
                  onClick={() => retryMutation.mutate()}
                  disabled={retryMutation.isPending}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Generation
                </Button>
              </CardContent>
            </Card>
          )}

          {(reel.status === "generating" || reel.status === "queued") && (
            <Card>
              <CardContent className="pt-6">
                <Button 
                  className="w-full" 
                  size="lg"
                  variant="outline"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Details */}
        <div className="space-y-4">
          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Prompt</div>
                <p className="font-medium">{reel.prompt}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Duration</div>
                  <p className="font-medium">{reel.duration_seconds}s</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Created</div>
                  <p className="font-medium">{new Date(reel.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {reel.scheduled_time && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Scheduled For</div>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(reel.scheduled_time).toLocaleString()}
                  </p>
                </div>
              )}

              {reel.caption && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Caption</div>
                  <p className="text-sm">{reel.caption}</p>
                </div>
              )}

              {reel.hashtags.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Hashtags</div>
                  <div className="flex flex-wrap gap-2">
                    {reel.hashtags.map((tag, i) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reel.logs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <p className="text-sm">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.ts).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
