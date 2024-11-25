const IMAGE_REPOSITORY = 'banco-de-imagenes';

export const CLOUDINARY_FOLDERS = {
  REVIEW_GALLERY: 'review_gallery',
  EXPERIENCE_GALLERY: 'experience_gallery',
  RESTAURANT_GALLERY: 'restaurant_gallery',
  PLACE_GALLERY: 'place_gallery',
  LODGING_GALLERY: 'lodging_gallery',
  USER_PROFILE: 'user_profile',
  IMAGE_REPOSITORY,
  PLACE_IMAGE_REPOSITORY: `${IMAGE_REPOSITORY}/lugares`,
  EXPERIENCE_IMAGE_REPOSITORY: `${IMAGE_REPOSITORY}/experiencias`,
  LODGING_IMAGE_REPOSITORY: `${IMAGE_REPOSITORY}/hospedajes`,
  RESTAURANT_IMAGE_REPOSITORY: `${IMAGE_REPOSITORY}/restaurantes`,
} as const;
