import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, ImagePlus } from 'lucide-react';
import { EmptyState } from '@/admin/components/saas/empty-state';
import type { Photo } from '@shared/schema';

export interface ToyxonaPhotosManagerProps {
  weddingId: number;
  /** All photos already loaded for this wedding (any type). The manager
   *  filters to just `toyxona` photos itself so the parent doesn't have to. */
  photos: Photo[];
  /** Translation lookup. Pass `t` from `useTranslation()`. */
  t: (key: string, fallback?: string) => string;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_MIME = 'image/jpeg,image/jpg,image/png,image/webp,image/avif';

/**
 * Manage the "To'yxona" (wedding-hall) photo gallery — `toyxona` photos.
 *
 * This is a deliberate sibling of MemoryPhotosManager rather than an edit to it:
 * the "Our Memories" gallery must stay exactly as it is, so this is a separate,
 * self-contained collection uploader for the venue-hall photos that the Imperial
 * template shows in its venue section.
 *
 * Network surface (uses existing endpoints — no backend changes):
 *   - POST /api/photos/upload (multipart, photoType=toyxona) for each new file
 *   - DELETE /api/photos/:id to remove
 *   - Invalidates `/api/photos/wedding/:id` after both operations
 */
export function ToyxonaPhotosManager({ weddingId, photos, t }: ToyxonaPhotosManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // `photoType`'s declared union doesn't list the extra template categories
  // (toyxona, flower_photo_*), so compare as a string.
  const toyxonaPhotos = photos.filter((p) => (p.photoType as string) === 'toyxona');

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('weddingId', weddingId.toString());
      formData.append('photoType', 'toyxona');
      formData.append('caption', '');

      const res = await fetch('/api/photos/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Upload failed (${res.status})`);
      }
      return res.json() as Promise<Photo>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/photos/wedding/${weddingId}`] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      return photoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/photos/wedding/${weddingId}`] });
      toast({
        title: t('manage.photoDeleted', 'Photo removed'),
        description: t('manage.toyxonaPhotoDeletedDescription', "It's gone from your venue gallery."),
      });
    },
    onError: () => {
      toast({
        title: t('manage.photoDeleteFailed', "Couldn't delete"),
        description: t('manage.photoDeleteFailedDescription', 'Try again — if it keeps failing, refresh the page.'),
        variant: 'destructive',
      });
    },
  });

  const handleFiles = async (rawList: FileList | File[]) => {
    const files = Array.from(rawList);

    for (const f of files) {
      if (!f.type.startsWith('image/')) {
        toast({
          title: t('manage.invalidFile', 'Not an image'),
          description: `${f.name} — ${t('manage.imageOnly', 'only image files are allowed')}`,
          variant: 'destructive',
        });
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        toast({
          title: t('manage.fileTooLarge', 'File too large'),
          description: `${f.name} — ${t('manage.maxSize', 'max 10 MB per photo')}`,
          variant: 'destructive',
        });
        return;
      }
    }

    setUploadingCount(files.length);
    let succeeded = 0;
    for (const f of files) {
      try {
        await uploadMutation.mutateAsync(f);
        succeeded++;
        setUploadingCount((c) => c - 1);
      } catch {
        setUploadingCount((c) => c - 1);
        toast({ title: t('manage.uploadFailed', 'Upload failed'), description: f.name, variant: 'destructive' });
      }
    }
    setUploadingCount(0);

    if (succeeded > 0) {
      toast({
        title: succeeded === 1
          ? t('manage.photoAdded', 'Photo added')
          : `${succeeded} ${t('manage.photosAdded', 'photos added')}`,
        description: t('manage.toyxonaPhotoAddedDescription', 'They now appear in your venue section.'),
      });
    }
  };

  const handleDelete = (photoId: number) => {
    if (!window.confirm(t('manage.confirmDelete', 'Remove this photo from your gallery?'))) return;
    setDeletingId(photoId);
    deleteMutation.mutate(photoId, { onSettled: () => setDeletingId(null) });
  };

  return (
    <div className="space-y-5">
      {/* ── Upload zone ─────────────────────────────────────── */}
      <label
        htmlFor="toyxona-upload"
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-slate-50/40 px-6 py-10 text-center cursor-pointer transition-colors ${
          uploadingCount > 0
            ? 'border-indigo-300 bg-indigo-50/30'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/20'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('border-indigo-400', 'bg-indigo-50/30');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50/30');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50/30');
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          id="toyxona-upload"
          type="file"
          accept={ACCEPTED_MIME}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {uploadingCount > 0 ? (
          <>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-900">
              {uploadingCount === 1
                ? t('manage.uploading', 'Uploading…')
                : `${uploadingCount} ${t('manage.uploadingMany', 'photos uploading…')}`}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {t('manage.uploadingHint', "Hang tight — we're keeping the order.")}
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-3">
              <ImagePlus className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">
              {t('manage.dragDropPhotos', 'Drag photos here, or click to browse')}
            </p>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
              {t('manage.toyxonaPhotosHint', 'These wedding-hall photos appear in the venue section of your wedding site. JPG, PNG, WebP up to 10 MB each.')}
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-4 bg-slate-900 hover:bg-slate-800 text-white"
              onClick={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {t('manage.choosePhotos', 'Choose photos')}
            </Button>
          </>
        )}
      </label>

      {/* ── Existing to'yxona photos ────────────────────────── */}
      {toyxonaPhotos.length > 0 ? (
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-900">{t('manage.gallery', 'Gallery')}</h4>
            <span className="text-xs text-slate-500">
              {toyxonaPhotos.length}{' '}
              {toyxonaPhotos.length === 1
                ? t('manage.photoSingular', 'photo')
                : t('manage.photoPlural', 'photos')}
            </span>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {toyxonaPhotos.map((photo) => {
              const isDeleting = deletingId === photo.id;
              return (
                <li
                  key={photo.id}
                  className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Venue photo'}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    disabled={isDeleting}
                    aria-label={t('manage.deletePhoto', 'Delete photo')}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 text-slate-700 hover:text-rose-600 hover:bg-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-100 disabled:cursor-wait"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <EmptyState
          compact
          icon={ImagePlus}
          title={t('manage.noToyxonaPhotos', 'No venue photos yet')}
          description={t('manage.noToyxonaPhotosHint', 'Add photos of the wedding hall — they appear in the venue section of your site.')}
        />
      )}
    </div>
  );
}
