import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  CheckCircle, 
  AlertCircle,
  Camera
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PhotoUploadProps {
  weddingId: number;
  onSuccess?: () => void;
  isOwner?: boolean;
}

export function PhotoUpload({ weddingId, onSuccess, isOwner = false }: PhotoUploadProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  // Validate file type and size
  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return t('photoUpload.invalidType');
    }

    if (file.size > maxSize) {
      return t('photoUpload.fileTooLarge');
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        toast({
          title: t('photoUpload.validationError'),
          description: error,
          variant: "destructive",
        });
        return;
      }

      validFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    });

    setSelectedFiles(validFiles);
    setPreviewUrls(newPreviewUrls);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('weddingId', weddingId.toString());
        formData.append('caption', '');
        formData.append('isHero', 'false');

        // Simulate progress for each file
        setUploadProgress(((index + 1) / files.length) * 100);

        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        return response.json();
      });

      return Promise.all(uploadPromises);
    },
    onSuccess: () => {
      toast({
        title: t('photoUpload.success'),
        description: t('photoUpload.successDescription'),
      });
      
      // Reset form
      setSelectedFiles([]);
      setPreviewUrls([]);
      setUploadProgress(0);
      setIsOpen(false);
      
      // Invalidate photos query to refresh gallery
      queryClient.invalidateQueries({ queryKey: ['/api/photos/wedding', weddingId] });
      
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: t('photoUpload.error'),
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: t('photoUpload.noFiles'),
        description: t('photoUpload.selectFiles'),
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(selectedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        toast({
          title: t('photoUpload.validationError'),
          description: error,
          variant: "destructive",
        });
        return;
      }

      validFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  // Only show upload button to wedding owners
  if (!isOwner) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="wedding-button flex items-center gap-2">
          <Camera className="w-4 h-4" />
          {t('photoUpload.addPhotos')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gold" />
            {t('photoUpload.uploadPhotos')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-sage/30 rounded-lg p-6 text-center transition-colors hover:border-gold/50 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-sage mx-auto mb-2" />
            <p className="text-sm text-charcoal/70 mb-1">
              {t('photoUpload.dragAndDrop')}
            </p>
            <p className="text-xs text-charcoal/50">
              {t('photoUpload.supportedFormats')}
            </p>
          </div>

          {/* Hidden File Input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* File Previews */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {t('photoUpload.selectedPhotos')} ({selectedFiles.length})
              </Label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-cream/50 rounded-lg">
                    <img
                      src={previewUrls[index]}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-charcoal/60">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0 text-charcoal/60 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gold border-t-transparent"></div>
                <span className="text-sm text-charcoal/70">
                  {t('photoUpload.uploading')} {Math.round(uploadProgress)}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={uploadMutation.isPending}
              className="flex-1"
            >
              {t('photoUpload.cancel')}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploadMutation.isPending}
              className="wedding-button flex-1"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {t('photoUpload.uploading')}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t('photoUpload.upload')}
                </>
              )}
            </Button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-charcoal/60 text-center">
            {t('photoUpload.maxFileSize')} • {t('photoUpload.maxFiles')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}