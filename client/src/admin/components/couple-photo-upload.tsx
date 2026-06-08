import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  Heart
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CouplePhotoUploadProps {
  weddingId: number;
  currentPhotoUrl?: string;
  onSuccess?: () => void;
}

export function CouplePhotoUpload({ weddingId, currentPhotoUrl, onSuccess }: CouplePhotoUploadProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // Validate file type and size
  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return t('photos.invalidFileType');
    }

    if (file.size > maxSize) {
      return t('photos.fileTooLarge');
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast({
        title: t('photos.validationError'),
        description: error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('weddingId', weddingId.toString());
      formData.append('photoType', 'couple');
      formData.append('caption', 'Couple Photo');

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('photos.uploadFailedError'));
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('message.success'),
        description: t('photos.uploadSuccessDesc'),
      });
      
      // Reset form
      removeFile();
      setIsOpen(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/photos/wedding/${weddingId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/weddings`] });
      
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: t('photos.uploadFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: t('photos.noFileSelected'),
        description: t('photos.noFileSelectedDesc'),
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast({
        title: t('photos.validationError'),
        description: error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-4">
      {/* Current Photo Preview */}
      {currentPhotoUrl && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            {t('photos.currentCouplePhoto')}
          </h4>
          <div className="aspect-video bg-white rounded-lg overflow-hidden border">
            <img
              src={currentPhotoUrl}
              alt={t('photos.currentCouplePhotoAlt')}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full flex items-center gap-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600">
            <Heart className="h-4 w-4" />
            {currentPhotoUrl ? t('photos.updateCouplePhoto') : t('photos.uploadCouplePhoto')}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              {t('photos.uploadCouplePhoto')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-pink-400 transition-colors"
            >
              {previewUrl ? (
                <div className="space-y-3">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={previewUrl}
                      alt={t('photos.previewAlt')}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('photos.remove')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
                    <Camera className="h-8 w-8 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">{t('photos.uploadYourCouplePhoto')}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('photos.dragDropHint')}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {t('photos.fileTypeHint')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            {selectedFile && (
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {t('imageEdit.uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {t('imageEdit.uploadPhoto')}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={uploadMutation.isPending}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 