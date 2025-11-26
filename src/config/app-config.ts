export interface EnvironmentVariables {
  env: string;
  appName: string;
  http: {
    port: number;
    host: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    synchronize: boolean;
    migrationsRun?: boolean;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  serpApi: {
    apiKey: string;
  };
  apify: {
    apiKey: string;
  };
  googleOAuth: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  googlePlaces: {
    apiKey: string;
  };
  tinify: {
    apiKey: string;
    enabled: boolean;
  };
  pinecone: {
    apiKey: string;
    environment: string;
    pineconeIndexGoogleReview: string;
    pineconeIndexRafaClaude: string;
  };
  indexingApi: {
    apiKey: string;
  };
  anthropic: {
    apiKey: string;
    model: string;
  };
  openai: {
    apiKey: string;
  };
  googleRoutesApi: {
    apiKey: string;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
  };
  frontendUrl: string;
}

export const appConfig = (): EnvironmentVariables => ({
  env: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'NestJS API Starter',

  http: {
    port: parseInt(process.env.PORT || '3000', 10) || 3000,
    host: process.env.APP_HOST || 'localhost',
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },

  database: {
    host: process.env.DB_HOST || '',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || '',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  googleOAuth: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
  },
  googlePlaces: {
    apiKey: process.env.GOOGLE_PLACES_API_KEY || '',
  },
  serpApi: {
    apiKey: process.env.SERP_API_KEY || '',
  },
  apify: {
    apiKey: process.env.APIFY_API_KEY || '',
  },
  tinify: {
    apiKey: process.env.TINYIFY_API_KEY || '',
    enabled: Boolean(process.env.TINYIFY_API_KEY),
  },
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    environment: process.env.PINECONE_ENVIRONMENT || '',
    pineconeIndexGoogleReview: process.env.PINECONE_INDEX_BINNTU_GOOGLE_REVIEW || '',
    pineconeIndexRafaClaude: process.env.PINECONE_INDEX_RAFA_CLAUDE || '',
  },
  indexingApi: {
    apiKey: process.env.INDEXING_API_KEY || '',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  googleRoutesApi: {
    apiKey: process.env.GOOGLE_ROUTES_API_KEY || '',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'Binntu <noreply@binntu.com>',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
});
