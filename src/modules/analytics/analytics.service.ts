import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Lodging } from 'src/modules/lodgings/entities/lodging.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { Experience } from 'src/modules/experiences/entities/experience.entity';
import { Transport } from 'src/modules/transport/entities/transport.entity';
import { Commerce } from 'src/modules/commerce/entities/commerce.entity';
import { Guide } from 'src/modules/guides/entities/guide.entity';
import { Category } from 'src/modules/core/entities/category.entity';
import { Facility } from 'src/modules/core/entities/facility.entity';
import { Menu } from 'src/modules/restaurants/entities/menu.entity';
import { AnalyticsPaginationDto } from './dto/analytics-pagination.dto';

function buildMeta(page: number, per_page: number, total: number) {
  return {
    page,
    per_page,
    total_pages: Math.ceil(total / per_page),
    total_records: total,
  };
}

function extractCoordinates(location: any): { latitude: number | null; longitude: number | null } {
  if (!location) return { latitude: null, longitude: null };
  if (location.coordinates) {
    return { latitude: location.coordinates[1], longitude: location.coordinates[0] };
  }
  return { latitude: null, longitude: null };
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Lodging) private readonly lodgingRepo: Repository<Lodging>,
    @InjectRepository(Restaurant) private readonly restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Experience) private readonly experienceRepo: Repository<Experience>,
    @InjectRepository(Transport) private readonly transportRepo: Repository<Transport>,
    @InjectRepository(Commerce) private readonly commerceRepo: Repository<Commerce>,
    @InjectRepository(Guide) private readonly guideRepo: Repository<Guide>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Facility) private readonly facilityRepo: Repository<Facility>,
    @InjectRepository(Menu) private readonly menuRepo: Repository<Menu>,
    private readonly dataSource: DataSource,
  ) {}

  // ==========================================================================
  // ENTITY ENDPOINTS
  // ==========================================================================

  async getLodgings(pagination: AnalyticsPaginationDto) {
    const { page, per_page } = pagination;
    const [items, total] = await this.lodgingRepo.findAndCount({
      relations: ['town', 'town.department', 'user', 'images', 'images.imageResource', 'lodgingRoomTypes'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * per_page,
      take: per_page,
    });

    const data = items.map((l) => {
      const { latitude, longitude } = extractCoordinates(l.location);
      const mainImage = l.images?.find((img) => img.order === 0);
      return {
        id: l.id,
        name: l.name,
        slug: l.slug,
        description: l.description,
        rating: l.rating,
        review_count: l.reviewCount,
        points: l.points,
        room_types: l.roomTypes,
        amenities: l.amenities,
        room_count: l.roomCount,
        lowest_price: l.lowestPrice,
        highest_price: l.highestPrice,
        address: l.address,
        email: l.email,
        website: l.website,
        facebook: l.facebook,
        instagram: l.instagram,
        phone_numbers: l.phoneNumbers,
        whatsapp_numbers: l.whatsappNumbers,
        opening_hours: l.openingHours,
        spoken_languages: l.spokenLanguages,
        capacity: l.capacity,
        latitude,
        longitude,
        google_maps_url: l.googleMapsUrl,
        google_maps_id: l.googleMapsId,
        google_maps_rating: l.googleMapsRating,
        google_maps_reviews_count: l.googleMapsReviewsCount,
        urban_center_distance: l.urbanCenterDistance,
        how_to_get_there: l.howToGetThere,
        arrival_reference: l.arrivalReference,
        payment_methods: l.paymentMethods,
        show_google_maps_reviews: l.showGoogleMapsReviews,
        show_binntu_reviews: l.showBinntuReviews,
        is_public: l.isPublic,
        state_db: l.stateDB,
        town_id: l.town?.id ?? null,
        town_name: l.town?.name ?? null,
        town_slug: l.town?.slug ?? null,
        department_name: l.town?.department?.name ?? null,
        user_id: l.user?.id ?? null,
        user_username: l.user?.username ?? null,
        user_email: l.user?.email ?? null,
        image_count: l.images?.length ?? 0,
        main_image_url: mainImage?.imageResource?.url ?? null,
        room_type_count: l.lodgingRoomTypes?.length ?? 0,
        created_at: l.createdAt,
        updated_at: l.updatedAt,
      };
    });

    return { data, meta: buildMeta(page, per_page, total) };
  }

  async getRestaurants(pagination: AnalyticsPaginationDto) {
    const { page, per_page } = pagination;
    const [items, total] = await this.restaurantRepo.findAndCount({
      relations: ['town', 'town.department', 'user', 'place', 'images', 'images.imageResource', 'menus'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * per_page,
      take: per_page,
    });

    const data = items.map((r) => {
      const { latitude, longitude } = extractCoordinates(r.location);
      const mainImage = r.images?.find((img) => img.order === 0);
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        rating: r.rating,
        review_count: r.reviewCount,
        points: r.points,
        spoken_languages: r.spokenLanguages,
        address: r.address,
        email: r.email,
        website: r.website,
        instagram: r.instagram,
        facebook: r.facebook,
        phone_numbers: r.phoneNumbers,
        whatsapp_numbers: r.whatsappNumbers,
        opening_hours: r.openingHours,
        lowest_price: r.lowestPrice,
        higher_price: r.higherPrice,
        town_zone: r.townZone,
        latitude,
        longitude,
        google_maps_url: r.googleMapsUrl,
        google_maps_id: r.googleMapsId,
        google_maps_rating: r.googleMapsRating,
        google_maps_reviews_count: r.googleMapsReviewsCount,
        urban_center_distance: r.urbanCenterDistance,
        how_to_get_there: r.howToGetThere,
        payment_methods: r.paymentMethods,
        show_google_maps_reviews: r.showGoogleMapsReviews,
        show_binntu_reviews: r.showBinntuReviews,
        is_public: r.isPublic,
        town_id: r.town?.id ?? null,
        town_name: r.town?.name ?? null,
        town_slug: r.town?.slug ?? null,
        department_name: r.town?.department?.name ?? null,
        place_id: r.place?.id ?? null,
        place_name: r.place?.name ?? null,
        user_id: r.user?.id ?? null,
        user_username: r.user?.username ?? null,
        user_email: r.user?.email ?? null,
        image_count: r.images?.length ?? 0,
        main_image_url: mainImage?.imageResource?.url ?? null,
        menu_count: r.menus?.length ?? 0,
        has_menu: (r.menus?.length ?? 0) > 0,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
      };
    });

    return { data, meta: buildMeta(page, per_page, total) };
  }

  async getExperiences(pagination: AnalyticsPaginationDto) {
    const { page, per_page } = pagination;
    const [items, total] = await this.experienceRepo.findAndCount({
      relations: ['town', 'town.department', 'guide', 'images', 'images.imageResource'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * per_page,
      take: per_page,
    });

    const data = items.map((e) => {
      const departure = extractCoordinates(e.departureLocation);
      const arrival = extractCoordinates(e.arrivalLocation);
      const mainImage = e.images?.find((img) => img.order === 0);
      return {
        id: e.id,
        title: e.title,
        slug: e.slug,
        description: e.description,
        difficulty_level: e.difficultyLevel,
        price: e.price,
        departure_description: e.departureDescription,
        arrival_description: e.arrivalDescription,
        departure_latitude: departure.latitude,
        departure_longitude: departure.longitude,
        arrival_latitude: arrival.latitude,
        arrival_longitude: arrival.longitude,
        travel_time: e.travelTime,
        total_distance: e.totalDistance,
        rating: e.rating,
        points: e.points,
        reviews_count: e.reviewsCount,
        min_age: e.minAge,
        max_age: e.maxAge,
        min_participants: e.minParticipants,
        max_participants: e.maxParticipants,
        recommendations: e.recommendations,
        how_to_dress: e.howToDress,
        restrictions: e.restrictions,
        payment_methods: e.paymentMethods,
        is_public: e.isPublic,
        show_binntu_reviews: e.showBinntuReviews,
        town_id: e.town?.id ?? null,
        town_name: e.town?.name ?? null,
        town_slug: e.town?.slug ?? null,
        department_name: e.town?.department?.name ?? null,
        guide_id: e.guide?.id ?? null,
        guide_name: e.guide ? `${e.guide.firstName} ${e.guide.lastName}` : null,
        guide_email: e.guide?.email ?? null,
        image_count: e.images?.length ?? 0,
        main_image_url: mainImage?.imageResource?.url ?? null,
        created_at: e.createdAt,
        updated_at: e.updatedAt,
      };
    });

    return { data, meta: buildMeta(page, per_page, total) };
  }

  async getTransport(pagination: AnalyticsPaginationDto) {
    const { page, per_page } = pagination;
    const [items, total] = await this.transportRepo.findAndCount({
      relations: ['town', 'town.department', 'user'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * per_page,
      take: per_page,
    });

    const data = items.map((t) => ({
      id: t.id,
      first_name: t.firstName,
      last_name: t.lastName,
      email: t.email,
      phone: t.phone,
      whatsapp: t.whatsapp,
      document_type: t.documentType,
      document: t.document,
      license_plate: t.licensePlate,
      rating: t.rating,
      review_count: t.reviewCount,
      points: t.points,
      start_time: t.startTime,
      end_time: t.endTime,
      is_available: t.isAvailable,
      is_public: t.isPublic,
      show_binntu_reviews: t.showBinntuReviews,
      payment_methods: t.paymentMethods,
      town_id: t.town?.id ?? null,
      town_name: t.town?.name ?? null,
      town_slug: t.town?.slug ?? null,
      department_name: t.town?.department?.name ?? null,
      user_id: t.user?.id ?? null,
      user_username: t.user?.username ?? null,
      user_email: t.user?.email ?? null,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    }));

    return { data, meta: buildMeta(page, per_page, total) };
  }

  async getCommerces(pagination: AnalyticsPaginationDto) {
    const { page, per_page } = pagination;
    const [items, total] = await this.commerceRepo.findAndCount({
      relations: ['town', 'town.department', 'user', 'images', 'images.imageResource', 'products'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * per_page,
      take: per_page,
    });

    const data = items.map((c) => {
      const { latitude, longitude } = extractCoordinates(c.location);
      const mainImage = c.images?.find((img) => img.order === 0);
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        rating: c.rating,
        review_count: c.reviewCount,
        points: c.points,
        address: c.address,
        email: c.email,
        website: c.website,
        facebook: c.facebook,
        instagram: c.instagram,
        phone_numbers: c.phoneNumbers,
        whatsapp_numbers: c.whatsappNumbers,
        opening_hours: c.openingHours,
        spoken_languages: c.spokenLanguages,
        payment_methods: c.paymentMethods,
        services: c.services,
        latitude,
        longitude,
        google_maps_url: c.googleMapsUrl,
        google_maps_id: c.googleMapsId,
        google_maps_rating: c.googleMapsRating,
        google_maps_reviews_count: c.googleMapsReviewsCount,
        urban_center_distance: c.urbanCenterDistance,
        how_to_get_there: c.howToGetThere,
        arrival_reference: c.arrivalReference,
        show_google_maps_reviews: c.showGoogleMapsReviews,
        show_binntu_reviews: c.showBinntuReviews,
        is_public: c.isPublic,
        state_db: c.stateDB,
        town_id: c.town?.id ?? null,
        town_name: c.town?.name ?? null,
        town_slug: c.town?.slug ?? null,
        department_name: c.town?.department?.name ?? null,
        user_id: c.user?.id ?? null,
        user_username: c.user?.username ?? null,
        user_email: c.user?.email ?? null,
        image_count: c.images?.length ?? 0,
        main_image_url: mainImage?.imageResource?.url ?? null,
        product_count: c.products?.length ?? 0,
        created_at: c.createdAt,
        updated_at: c.updatedAt,
      };
    });

    return { data, meta: buildMeta(page, per_page, total) };
  }

  async getGuides(pagination: AnalyticsPaginationDto) {
    const { page, per_page } = pagination;
    const [items, total] = await this.guideRepo.findAndCount({
      relations: ['user', 'images', 'images.imageResource', 'experiences', 'towns'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * per_page,
      take: per_page,
    });

    const data = items.map((g) => {
      const mainImage = g.images?.find((img) => img.order === 0);
      return {
        id: g.id,
        slug: g.slug,
        first_name: g.firstName,
        last_name: g.lastName,
        email: g.email,
        phone: g.phone,
        whatsapp: g.whatsapp,
        document_type: g.documentType,
        document: g.document,
        address: g.address,
        biography: g.biography,
        languages: g.languages,
        guide_type: g.guideType,
        facebook: g.facebook,
        instagram: g.instagram,
        youtube: g.youtube,
        tiktok: g.tiktok,
        rating: g.rating,
        review_count: g.reviewCount,
        points: g.points,
        is_available: g.isAvailable,
        is_public: g.isPublic,
        show_binntu_reviews: g.showBinntuReviews,
        user_id: g.user?.id ?? null,
        user_username: g.user?.username ?? null,
        user_email: g.user?.email ?? null,
        image_count: g.images?.length ?? 0,
        main_image_url: mainImage?.imageResource?.url ?? null,
        experience_count: g.experiences?.length ?? 0,
        town_count: g.towns?.length ?? 0,
        created_at: g.createdAt,
        updated_at: g.updatedAt,
      };
    });

    return { data, meta: buildMeta(page, per_page, total) };
  }

  // ==========================================================================
  // MASTER TABLE ENDPOINTS
  // ==========================================================================

  async getCategories(pagination: AnalyticsPaginationDto) {
    const { page, per_page } = pagination;
    const [items, total] = await this.categoryRepo.findAndCount({
      relations: ['imageResource'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * per_page,
      take: per_page,
    });

    const data = items.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? null,
      is_enabled: c.isEnabled,
      image_url: c.imageResource?.url ?? null,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    }));

    return { data, meta: buildMeta(page, per_page, total) };
  }

  async getFacilities(pagination: AnalyticsPaginationDto) {
    const { page, per_page } = pagination;
    const [items, total] = await this.facilityRepo.findAndCount({
      order: { createdAt: 'ASC' },
      skip: (page - 1) * per_page,
      take: per_page,
    });

    const data = items.map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      description: f.description ?? null,
      is_enabled: f.isEnabled,
      created_at: f.createdAt,
      updated_at: f.updatedAt,
    }));

    return { data, meta: buildMeta(page, per_page, total) };
  }

  // ==========================================================================
  // RELATION TABLE ENDPOINTS
  // ==========================================================================

  private async getPivotTable(table: string, columns: string[], pagination: AnalyticsPaginationDto) {
    const { page, per_page } = pagination;
    const offset = (page - 1) * per_page;
    const colList = columns.join(', ');
    const orderCol = columns[0];

    const [rows, countResult] = await Promise.all([
      this.dataSource.query(
        `SELECT ${colList} FROM ${table} ORDER BY ${orderCol} LIMIT $1 OFFSET $2`,
        [per_page, offset],
      ),
      this.dataSource.query(`SELECT COUNT(*)::int as count FROM ${table}`),
    ]);

    const total = countResult[0].count;
    return { data: rows, meta: buildMeta(page, per_page, total) };
  }

  async getLodgingCategories(pagination: AnalyticsPaginationDto) {
    return this.getPivotTable('lodging_category', ['lodging_id', 'category_id'], pagination);
  }

  async getLodgingFacilities(pagination: AnalyticsPaginationDto) {
    return this.getPivotTable('lodging_facility', ['lodging_id', 'facility_id'], pagination);
  }

  async getRestaurantCategories(pagination: AnalyticsPaginationDto) {
    return this.getPivotTable('restaurant_category', ['restaurant_id', 'category_id'], pagination);
  }

  async getRestaurantFacilities(pagination: AnalyticsPaginationDto) {
    return this.getPivotTable('restaurant_facility', ['restaurant_id', 'facility_id'], pagination);
  }

  async getExperienceCategories(pagination: AnalyticsPaginationDto) {
    return this.getPivotTable('experience_category', ['experience_id', 'category_id'], pagination);
  }

  async getExperienceFacilities(pagination: AnalyticsPaginationDto) {
    return this.getPivotTable('experience_facility', ['experience_id', 'facility_id'], pagination);
  }

  async getTransportCategories(pagination: AnalyticsPaginationDto) {
    return this.getPivotTable('transport_category', ['transport_id', 'category_id'], pagination);
  }

  async getCommerceCategories(pagination: AnalyticsPaginationDto) {
    return this.getPivotTable('commerce_category', ['commerce_id', 'category_id'], pagination);
  }

  async getCommerceFacilities(pagination: AnalyticsPaginationDto) {
    return this.getPivotTable('commerce_facility', ['commerce_id', 'facility_id'], pagination);
  }

  async getGuideCategories(pagination: AnalyticsPaginationDto) {
    return this.getPivotTable('guide_category', ['guide_id', 'category_id'], pagination);
  }

  async getGuideTowns(pagination: AnalyticsPaginationDto) {
    return this.getPivotTable('guide_town', ['guide_id', 'town_id'], pagination);
  }

  // ==========================================================================
  // MENU ENDPOINTS
  // ==========================================================================

  async getMenus(pagination: AnalyticsPaginationDto) {
    const { page, per_page } = pagination;
    const [items, total] = await this.menuRepo.findAndCount({
      relations: ['restaurant'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * per_page,
      take: per_page,
    });

    const data = items.map((m) => {
      let itemCount = 0;
      if (m.status === 'completed' && m.data?.categories) {
        for (const cat of m.data.categories) {
          itemCount += cat.items?.length ?? 0;
        }
      }
      return {
        id: m.id,
        restaurant_id: m.restaurant?.id ?? null,
        restaurant_name: m.restaurant?.name ?? null,
        file_url: m.fileUrl,
        file_name: m.fileName,
        mime_type: m.mimeType,
        status: m.status,
        item_count: itemCount,
        created_at: m.createdAt,
        updated_at: m.updatedAt,
      };
    });

    return { data, meta: buildMeta(page, per_page, total) };
  }

  async getMenuItems(pagination: AnalyticsPaginationDto) {
    const { page, per_page } = pagination;
    const offset = (page - 1) * per_page;

    const [rows, countResult] = await Promise.all([
      this.dataSource.query(
        `SELECT
          m.id as menu_id,
          m.restaurant_id,
          r.name as restaurant_name,
          cat->>'category_name' as category_name,
          item->>'name' as item_name,
          (item->>'price')::decimal as item_price
        FROM menu m
        JOIN restaurant r ON r.id = m.restaurant_id
        CROSS JOIN LATERAL jsonb_array_elements(m.data->'categories') AS cat
        CROSS JOIN LATERAL jsonb_array_elements(cat->'items') AS item
        WHERE m.status = 'completed' AND m.data IS NOT NULL
        ORDER BY m.restaurant_id, m.id
        LIMIT $1 OFFSET $2`,
        [per_page, offset],
      ),
      this.dataSource.query(
        `SELECT COUNT(*)::int as count
        FROM menu m
        CROSS JOIN LATERAL jsonb_array_elements(m.data->'categories') AS cat
        CROSS JOIN LATERAL jsonb_array_elements(cat->'items') AS item
        WHERE m.status = 'completed' AND m.data IS NOT NULL`,
      ),
    ]);

    const total = countResult[0]?.count ?? 0;
    return { data: rows, meta: buildMeta(page, per_page, total) };
  }
}
