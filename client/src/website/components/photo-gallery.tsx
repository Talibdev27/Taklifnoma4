import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PhotoLoading } from '@/components/ui/loading';
import type { Photo } from '@shared/schema';

interface PhotoGalleryProps {
  weddingId: number;
  className?: string;
}

export function PhotoGallery({ weddingId, className = '' }: PhotoGalleryProps) {
  const { t } = useTranslation();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const { data: photos = [], isLoading } = useQuery<Photo[]>({
    queryKey: ['/api/photos/wedding', weddingId],
    queryFn: () => fetch(`/api/photos/wedding/${weddingId}`).then(res => res.json()),
  });

  const openModal = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closeModal = () => {
    setSelectedPhotoIndex(null);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === null) return;
    
    const memoryPhotos = photos.filter(photo => photo.photoType === 'memory');
    
    if (direction === 'prev') {
      setSelectedPhotoIndex(selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : memoryPhotos.length - 1);
    } else {
      setSelectedPhotoIndex(selectedPhotoIndex < memoryPhotos.length - 1 ? selectedPhotoIndex + 1 : 0);
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <PhotoLoading count={8} />
      </div>
    );
  }

  // Filter only memory photos for the gallery
  const memoryPhotos = photos.filter(photo => photo.photoType === 'memory');

  if (memoryPhotos.length === 0) {
    return (
      <div className={`${className}`}>
        {/* Beautiful empty state layout */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Left decorative element */}
            <div className="hidden md:block">
              <div className="w-full h-64 bg-gradient-to-br from-romantic-gold/10 to-sage-green/10 rounded-2xl shadow-lg flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-romantic-gold/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-romantic-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-charcoal opacity-60">{t('gallery.moments')}</p>
                </div>
              </div>
            </div>

            {/* Center content */}
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-romantic-gold/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-romantic-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-playfair font-semibold text-charcoal mb-3">
                {t('gallery.creatingBeautifulMemories')}
              </h3>
              <p className="text-charcoal opacity-70 max-w-sm mx-auto leading-relaxed">
                {t('gallery.everyMomentPrecious')}
              </p>
            </div>

            {/* Right decorative element */}
            <div className="hidden md:block">
              <div className="w-full h-64 bg-gradient-to-bl from-sage-green/10 to-romantic-gold/10 rounded-2xl shadow-lg flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-sage-green/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-sage-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <p className="text-sm text-charcoal opacity-60">{t('gallery.dreams')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dynamic layout based on photo count
  const getGalleryLayout = (photoCount: number) => {
    switch (photoCount) {
      case 1:
        return 'single';
      case 2:
        return 'duo';
      case 3:
        return 'trio';
      case 4:
        return 'quad';
      default:
        return 'masonry';
    }
  };

  const layout = getGalleryLayout(memoryPhotos.length);

  return (
    <>
      <div className={className}>
        {/* Single Photo Layout - Large centered display */}
        {layout === 'single' && (
          <div className="flex justify-center">
            <div
              className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 max-w-2xl"
              onClick={() => openModal(0)}
            >
              <img
                src={memoryPhotos[0].url}
                alt={memoryPhotos[0].caption || t('common.weddingPhoto')}
                className="w-full h-96 md:h-[500px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <div className="text-white bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {memoryPhotos[0].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4">
                  <p className="text-center font-medium">{memoryPhotos[0].caption}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Two Photos Layout - Side by side */}
        {layout === 'duo' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {memoryPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500"
                onClick={() => openModal(index)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || `Wedding photo ${index + 1}`}
                  className="w-full h-80 md:h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <div className="text-white bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3">
                    <p className="text-sm font-medium">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Three Photos Layout - Creative asymmetric */}
        {layout === 'trio' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-96 md:h-[500px]">
            <div
              className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 col-span-2 md:col-span-2"
              onClick={() => openModal(0)}
            >
              <img
                src={memoryPhotos[0].url}
                alt={memoryPhotos[0].caption || 'Wedding photo 1'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <div className="text-white bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {memoryPhotos[0].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3">
                  <p className="text-sm font-medium">{memoryPhotos[0].caption}</p>
                </div>
              )}
            </div>
            <div className="col-span-2 md:col-span-2 flex flex-col gap-4">
              {memoryPhotos.slice(1, 3).map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 flex-1"
                  onClick={() => openModal(index + 1)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Wedding photo ${index + 2}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="text-white bg-white/20 backdrop-blur-sm rounded-full p-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-2">
                      <p className="text-xs font-medium">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Four Photos Layout - Perfect grid */}
        {layout === 'quad' && (
          <div className="grid grid-cols-2 gap-4 h-96 md:h-[600px]">
            {memoryPhotos.slice(0, 4).map((photo, index) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500"
                onClick={() => openModal(index)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || `Wedding photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <div className="text-white bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3">
                    <p className="text-sm font-medium">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Masonry Layout for 5+ Photos */}
        {layout === 'masonry' && (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {memoryPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 break-inside-avoid mb-6"
                onClick={() => openModal(index)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || `Wedding photo ${index + 1}`}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ 
                    height: 'auto',
                    aspectRatio: 'auto'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <div className="text-white bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3">
                    <p className="text-sm font-medium">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      <Dialog open={selectedPhotoIndex !== null} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black">
          {selectedPhotoIndex !== null && (() => {
            const memoryPhotos = photos.filter(photo => photo.photoType === 'memory');
            const currentPhoto = memoryPhotos[selectedPhotoIndex];
            
            return (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 text-white hover:bg-white hover:bg-opacity-20"
                  onClick={closeModal}
                >
                  <X className="h-6 w-6" />
                </Button>

                <img
                  src={currentPhoto.url}
                  alt={currentPhoto.caption || `Wedding photo ${selectedPhotoIndex + 1}`}
                  className="w-full h-auto max-h-[90vh] object-contain"
                />

                {currentPhoto.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4">
                    <p className="text-center">{currentPhoto.caption}</p>
                  </div>
                )}

                {memoryPhotos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20"
                      onClick={() => navigatePhoto('prev')}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20"
                      onClick={() => navigatePhoto('next')}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                  {selectedPhotoIndex + 1} / {memoryPhotos.length}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
