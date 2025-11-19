import { useQuery } from "@tanstack/react-query";
import { api, type Reel } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Clock, 
  CheckCircle2, 
  Eye, 
  Play,
  Calendar,
  MoreVertical,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig = {
  queued: { label: "Queued", color: "bg-muted text-muted-foreground", icon: Clock },
  generating: { label: "Generating", color: "bg-warning/10 text-warning", icon: Loader2 },
  ready: { label: "Ready", color: "bg-success/10 text-success", icon: CheckCircle2 },
  scheduled: { label: "Scheduled", color: "bg-primary/10 text-primary", icon: Calendar },
  posting: { label: "Posting", color: "bg-secondary/10 text-secondary", icon: Loader2 },
  posted: { label: "Posted", color: "bg-success text-success-foreground", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-destructive/10 text-destructive", icon: Eye },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: Eye },
  created: { label: "Created", color: "bg-muted text-muted-foreground", icon: Clock },
};

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["reels"],
    queryFn: () => api.listReels()
  });

  const stats = {
    total: data?.total || 0,
    posted: data?.items.filter(r => r.status === "posted").length || 0,
    scheduled: data?.items.filter(r => r.status === "scheduled").length || 0,
    generating: data?.items.filter(r => r.status === "generating" || r.status === "queued").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your AI-generated Instagram Reels</p>
        </div>
        <Link to="/create">
          <Button size="lg" className="w-full sm:w-auto gradient-primary shadow-lg hover:shadow-xl transition-shadow">
            <Video className="w-5 h-5 mr-2" />
            Create New Reel
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="hover-lift border-success/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Posted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{stats.posted}</div>
          </CardContent>
        </Card>
        <Card className="hover-lift border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card className="hover-lift border-warning/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Generating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{stats.generating}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reels list */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reels</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : data?.items.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reels yet. Create your first one!</p>
              <Link to="/create">
                <Button className="mt-4">Create Reel</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.items.map((reel) => (
                <ReelCard key={reel.id} reel={reel} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReelCard({ reel }: { reel: Reel }) {
  const config = statusConfig[reel.status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors">
      {/* Thumbnail */}
      <div className="w-16 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {reel.thumbnail_url ? (
          <img 
            src={reel.thumbnail_url} 
            alt={reel.prompt} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm truncate">{reel.prompt}</h3>
          <Badge variant="secondary" className={cn("flex-shrink-0", config.color)}>
            <Icon className={cn("w-3 h-3 mr-1", reel.status === "generating" && "animate-spin")} />
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{reel.duration_seconds}s</span>
          <span>•</span>
          <span>{new Date(reel.created_at).toLocaleDateString()}</span>
          {reel.scheduled_time && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(reel.scheduled_time).toLocaleString()}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link to={`/reel/${reel.id}`}>
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Play className="w-4 h-4 mr-2" />
              Preview
            </DropdownMenuItem>
            {reel.status === "ready" && (
              <DropdownMenuItem>Post Now</DropdownMenuItem>
            )}
            {(reel.status === "failed" || reel.status === "cancelled") && (
              <DropdownMenuItem>Retry</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
