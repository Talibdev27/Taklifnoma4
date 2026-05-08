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
      return 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.';
    }

    if (file.size > maxSize) {
      return 'File too large. Maximum size is 5MB.';
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast({
        title: 'Validation Error',
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
        throw new Error(errorData.message || 'Failed to upload couple photo');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Couple photo uploaded successfully!',
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
        title: 'Upload Failed',
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a photo to upload.',
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
        title: 'Validation Error',
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
            Current Couple Photo
          </h4>
          <div className="aspect-video bg-white rounded-lg overflow-hidden border">
            <img 
              src={currentPhotoUrl} 
              alt="Current couple photo"
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
            {currentPhotoUrl ? 'Update Couple Photo' : 'Upload Couple Photo'}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Upload Couple Photo
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
                      alt="Preview"
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
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
                    <Camera className="h-8 w-8 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">Upload Your Couple Photo</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Drag & drop or click to select
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      JPEG, PNG, WebP • Max 5MB
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
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={uploadMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 