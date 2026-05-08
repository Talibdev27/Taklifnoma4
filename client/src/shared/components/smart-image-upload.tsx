import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Image as ImageIcon, 
  Crop, 
  Palette, 
  Sliders,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid,
  Sparkles,
  Download,
  X,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SmartImageUploadProps {
  weddingId: number;
  onSuccess?: () => void;
  isOwner?: boolean;
}

interface ImageFilter {
  id: string;
  name: string;
  filter: string;
  preview: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function SmartImageUpload({ weddingId, onSuccess, isOwner = false }: SmartImageUploadProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [currentTab, setCurrentTab] = useState('upload');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Image editing states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const [showGrid, setShowGrid] = useState(false);

  const imageFilters: ImageFilter[] = [
    { id: 'none', name: t('imageEdit.noFilter'), filter: 'none', preview: '' },
    { id: 'sepia', name: t('imageEdit.sepia'), filter: 'sepia(100%)', preview: 'sepia(100%)' },
    { id: 'grayscale', name: t('imageEdit.grayscale'), filter: 'grayscale(100%)', preview: 'grayscale(100%)' },
    { id: 'vintage', name: t('imageEdit.vintage'), filter: 'sepia(50%) contrast(1.2) brightness(1.1)', preview: 'sepia(50%) contrast(1.2) brightness(1.1)' },
    { id: 'warm', name: t('imageEdit.warm'), filter: 'hue-rotate(15deg) saturate(1.2)', preview: 'hue-rotate(15deg) saturate(1.2)' },
    { id: 'cool', name: t('imageEdit.cool'), filter: 'hue-rotate(180deg) saturate(1.1)', preview: 'hue-rotate(180deg) saturate(1.1)' },
    { id: 'dramatic', name: t('imageEdit.dramatic'), filter: 'contrast(1.5) brightness(0.9) saturate(1.3)', preview: 'contrast(1.5) brightness(0.9) saturate(1.3)' }
  ];

  const uploadMutation = useMutation({
    mutationFn: async (processedImageBlob: Blob) => {
      const formData = new FormData();
      formData.append('photo', processedImageBlob, selectedFile?.name || 'edited-image.jpg');
      formData.append('weddingId', weddingId.toString());
      formData.append('caption', '');
      formData.append('isHero', 'false');

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload image`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('imageEdit.uploadSuccess'),
        description: t('imageEdit.uploadSuccessDesc'),
      });
      
      resetEditor();
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/photos/wedding', weddingId] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: t('imageEdit.uploadError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetEditor = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setZoom(1);
    setSelectedFilter('none');
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
    setCurrentTab('upload');
    setUploadProgress(0);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: t('imageEdit.invalidType'),
        description: t('imageEdit.supportedFormats'),
        variant: "destructive",
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: t('imageEdit.fileTooLarge'),
        description: t('imageEdit.maxFileSize'),
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCurrentTab('edit');
  };

  const getFilterStyle = () => {
    const filter = imageFilters.find(f => f.id === selectedFilter)?.filter || 'none';
    return {
      filter: filter === 'none' ? 
        `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` :
        `${filter} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
      transform: `rotate(${rotation}deg) scale(${zoom})`,
      transition: 'all 0.3s ease'
    };
  };

  const applySmartCrop = () => {
    // AI-powered smart cropping suggestions based on common photo composition rules
    const suggestions = [
      { name: t('imageEdit.portraitCrop'), area: { x: 15, y: 10, width: 70, height: 85 } },
      { name: t('imageEdit.landscapeCrop'), area: { x: 5, y: 20, width: 90, height: 60 } },
      { name: t('imageEdit.squareCrop'), area: { x: 12.5, y: 12.5, width: 75, height: 75 } },
      { name: t('imageEdit.ruleOfThirds'), area: { x: 0, y: 0, width: 100, height: 67 } }
    ];
    
    // For demo, apply the first suggestion
    setCropArea(suggestions[0].area);
    toast({
      title: t('imageEdit.smartCropApplied'),
      description: t('imageEdit.smartCropDesc'),
    });
  };

  const processAndUpload = useCallback(async () => {
    if (!selectedFile || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size based on crop area
      const cropWidth = (img.width * cropArea.width) / 100;
      const cropHeight = (img.height * cropArea.height) / 100;
      
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      // Apply transformations
      ctx.save();
      
      // Move to center for rotation
      ctx.translate(cropWidth / 2, cropHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      
      // Apply filters via canvas
      ctx.filter = getFilterStyle().filter;
      
      // Draw the cropped and transformed image
      const sourceX = (img.width * cropArea.x) / 100;
      const sourceY = (img.height * cropArea.y) / 100;
      
      ctx.drawImage(
        img,
        sourceX, sourceY, cropWidth, cropHeight,
        -cropWidth / 2, -cropHeight / 2, cropWidth, cropHeight
      );
      
      ctx.restore();

      // Convert canvas to blob and upload
      canvas.toBlob((blob) => {
        if (blob) {
          setUploadProgress(0);
          // Simulate progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return prev;
              }
              return prev + 10;
            });
          }, 100);
          
          uploadMutation.mutate(blob);
          setUploadProgress(100);
        }
      }, 'image/jpeg', 0.9);
    };

    img.src = previewUrl;
  }, [selectedFile, previewUrl, cropArea, rotation, zoom, brightness, contrast, saturation, selectedFilter, uploadMutation, weddingId]);

  if (!isOwner) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="wedding-button flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {t('imageEdit.smartUpload')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gold" />
            {t('imageEdit.smartImageUpload')}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">{t('imageEdit.upload')}</TabsTrigger>
            <TabsTrigger value="edit" disabled={!selectedFile}>{t('imageEdit.edit')}</TabsTrigger>
            <TabsTrigger value="preview" disabled={!selectedFile}>{t('imageEdit.preview')}</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              className="border-2 border-dashed border-sage/30 rounded-lg p-8 text-center transition-colors hover:border-gold/50 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-sage mx-auto mb-4" />
              <p className="text-lg font-medium text-charcoal mb-2">
                {t('imageEdit.dragDropOrClick')}
              </p>
              <p className="text-sm text-charcoal/60">
                {t('imageEdit.supportedFormats')} • {t('imageEdit.maxSize')}
              </p>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            {previewUrl && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div className="space-y-4">
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={getFilterStyle()}
                      className="w-full h-full object-cover"
                    />
                    {showGrid && (
                      <div className="absolute inset-0 pointer-events-none">
                        <Grid className="w-full h-full text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applySmartCrop}
                      className="flex-1"
                    >
                      <Crop className="w-4 h-4 mr-2" />
                      {t('imageEdit.smartCrop')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGrid(!showGrid)}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-6">
                  {/* Filters */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      {t('imageEdit.filters')}
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {imageFilters.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setSelectedFilter(filter.id)}
                          className={`p-2 rounded-lg border text-xs transition-colors ${
                            selectedFilter === filter.id
                              ? 'border-gold bg-gold/10 text-gold'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {filter.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Adjustments */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">{t('imageEdit.adjustments')}</Label>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">{t('imageEdit.brightness')}</span>
                          <span className="text-sm text-gray-500">{brightness}%</span>
                        </div>
                        <Slider
                          value={[brightness]}
                          onValueChange={(value) => setBrightness(value[0])}
                          min={50}
                          max={150}
                          step={1}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">{t('imageEdit.contrast')}</span>
                          <span className="text-sm text-gray-500">{contrast}%</span>
                        </div>
                        <Slider
                          value={[contrast]}
                          onValueChange={(value) => setContrast(value[0])}
                          min={50}
                          max={150}
                          step={1}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">{t('imageEdit.saturation')}</span>
                          <span className="text-sm text-gray-500">{saturation}%</span>
                        </div>
                        <Slider
                          value={[saturation]}
                          onValueChange={(value) => setSaturation(value[0])}
                          min={0}
                          max={200}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Transform */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">{t('imageEdit.transform')}</Label>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRotation(rotation - 90)}
                      >
                        <RotateCw className="w-4 h-4 mr-2 scale-x-[-1]" />
                        {t('imageEdit.rotateLeft')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRotation(rotation + 90)}
                      >
                        <RotateCw className="w-4 h-4 mr-2" />
                        {t('imageEdit.rotateRight')}
                      </Button>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">{t('imageEdit.zoom')}</span>
                        <span className="text-sm text-gray-500">{(zoom * 100).toFixed(0)}%</span>
                      </div>
                      <Slider
                        value={[zoom]}
                        onValueChange={(value) => setZoom(value[0])}
                        min={0.5}
                        max={2}
                        step={0.1}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {previewUrl && (
              <div className="space-y-4">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden max-w-2xl mx-auto">
                  <img
                    src={previewUrl}
                    alt="Final preview"
                    style={getFilterStyle()}
                    className="w-full h-auto object-cover"
                  />
                </div>

                {uploadMutation.isPending && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gold border-t-transparent"></div>
                      <span className="text-sm text-charcoal/70">
                        {t('imageEdit.processing')} {uploadProgress}%
                      </span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentTab('edit')}
                    disabled={uploadMutation.isPending}
                  >
                    {t('imageEdit.backToEdit')}
                  </Button>
                  <Button
                    onClick={processAndUpload}
                    disabled={uploadMutation.isPending}
                    className="wedding-button"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        {t('imageEdit.uploading')}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {t('imageEdit.uploadPhoto')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}