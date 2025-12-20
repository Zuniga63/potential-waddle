const IMAGE_REPOSITORY = 'banco-de-imagenes';

export const CLOUDINARY_FOLDERS = {
  REVIEW_GALLERY: 'review_gallery',
  EXPERIENCE_GALLERY: 'experience_gallery',
  RESTAURANT_GALLERY: 'restaurant_gallery',
  PLACE_GALLERY: 'place_gallery',
  LODGING_GALLERY: 'lodging_gallery',
  USER_PROFILE: 'user_profile',
  COMMERCE_GALLERY: 'commerce_gallery',
  GUIDE_GALLERY: 'guide_gallery',
  PUBLIC_EVENT_GALLERY: 'public_event_gallery',
  CATEGORY_IMAGES: 'category_images',
  IMAGE_REPOSITORY,
  PLACE_IMAGE_REPOSITORY: `${IMAGE_REPOSITORY}/lugares`,
  EXPERIENCE_IMAGE_REPOSITORY: `${IMAGE_REPOSITORY}/experiencias`,
  LODGING_IMAGE_REPOSITORY: `${IMAGE_REPOSITORY}/hospedajes`,
  RESTAURANT_IMAGE_REPOSITORY: `${IMAGE_REPOSITORY}/restaurantes`,
  COMMERCE_IMAGE_REPOSITORY: `${IMAGE_REPOSITORY}/comercios`,
  GUIDE_IMAGE_REPOSITORY: `${IMAGE_REPOSITORY}/guias`,
  PUBLIC_EVENT_IMAGE_REPOSITORY: `${IMAGE_REPOSITORY}/eventos-publicos`,
} as const;
