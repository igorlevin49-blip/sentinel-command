import { AppLayout } from '@/components/layout/AppLayout';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin } from 'lucide-react';

interface Post {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  description: string | null;
  object_id: string;
  objects?: { name: string } | null;
}

const typeLabels: Record<string, string> = {
  static: 'Стационарный',
  checkpoint: 'КПП',
  mobile: 'Мобильный',
  kpp: 'КПП',
};

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select('id, name, type, is_active, description, object_id, objects(name)')
        .order('name', { ascending: true });
      console.debug('[Posts] query result:', { count: data?.length ?? 0, error });

      if (error) {
        console.error('[Posts] fetch error:', error);
        setError(
          error.code === '42501' || error.code === 'PGRST301'
            ? 'Нет доступа'
            : error.message
        );
      } else {
        console.debug('[Posts] loaded:', data?.length, 'records');
        setPosts((data as unknown as Post[]) ?? []);
      }
      setLoading(false);
    }
    fetchPosts();
  }, []);

  return (
    <AppLayout title="Посты">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <MapPin className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Посты не найдены</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div key={post.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{post.name}</h3>
                <Badge variant={post.is_active ? 'success' : 'secondary'}>
                  {post.is_active ? 'Активен' : 'Неактивен'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                {post.objects?.name ?? '—'}
              </div>
              <Badge variant="outline">{typeLabels[post.type] ?? post.type}</Badge>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
