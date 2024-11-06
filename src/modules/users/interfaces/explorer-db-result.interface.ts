import { CloudinaryImage } from 'src/modules/cloudinary/interfaces';

export interface ExplorerDBResult {
  user_id: string;
  username: string;
  birth_date: string;
  profile_photo: CloudinaryImage;
  visited_places: string;
  total_points: string;
  total_distance: string;
}
